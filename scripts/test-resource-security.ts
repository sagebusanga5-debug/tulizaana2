/**
 * Tests de securite du chantier 5 : Resource-Level Authorization.
 *
 * Couvre les scenarios A-O du cahier des charges :
 * A. Community IDOR
 * B. Post IDOR
 * C. Post modification
 * D. Post suppression
 * E. Organization cross-access
 * F. Community cross-organization
 * G. Campaign cross-organization
 * H. Message thread IDOR
 * I. Message sender spoofing
 * J. Report IDOR
 * K. Report modification
 * L. Privilege downgrade
 * M. Forged IDs
 * N. Anonymous access
 * O. Legitimate access
 *
 * Lancement : npm run test:resource-security
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import jwt from "jsonwebtoken";

interface TestResult {
  scenario: string;
  expected: string;
  status: "pass" | "fail";
  detail: string;
}

const results: TestResult[] = [];
let currentScenario = "";

function record(expected: string, condition: boolean, detail: string): void {
  results.push({ scenario: currentScenario, expected, status: condition ? "pass" : "fail", detail });
}

const TEST_SECRET = "secret-de-test-uniquement-0123456789abcdefghijklmnop";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_SECRET;
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/tulizaana_test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

// ---------------------------------------------------------------------------
// Double de base en memoire
// ---------------------------------------------------------------------------

interface FakeUser {
  id: string;
  email: string | null;
  name: string | null;
  pseudonym: string | null;
  avatar: string | null;
  role: string;
  isSuspended: boolean;
}

interface FakeCommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: Date;
}

interface FakePost {
  id: string;
  communityId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string | null;
  type: string;
  title: string | null;
  isAnonymous: boolean;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  tags: string[];
  reactionsSupport: number;
  reactionsUnderstand: number;
  reactionsCourage: number;
  reactionsBravo: number;
  isPinned: boolean;
  createdAt: Date;
}

interface FakeComment {
  id: string;
  postId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

interface FakeMessageThread {
  id: string;
  canonicalParticipantKey: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

interface FakeMessage {
  id: string;
  threadId: string;
  senderId: string | null;
  receiverId: string | null;
  content: string;
  type: string;
  mediaUrl: string | null;
  audioDuration: number | null;
  isRead: boolean;
  createdAt: Date;
}

interface FakeModerationReport {
  id: string;
  communityId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  severity: string;
  reportedById: string | null;
  actionTakenBy: string | null;
  actionNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

interface FakeOrganization {
  id: string;
  name: string;
  acronym: string | null;
  logo: string | null;
  coverImage: string | null;
  type: string;
  country: string;
  city: string;
  address: string | null;
  domain: string;
  mission: string;
  description: string;
  responsibleName: string;
  responsibleTitle: string | null;
  contactEmail: string;
  contactPhone: string;
  status: string;
  subscriptionPlan: string;
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsMax: number;
  validatedAt: Date | null;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  paymentStatus: string | null;
  createdAt: Date;
}

interface FakeCommunity {
  id: string;
  name: string;
  slug: string;
  description: string;
  mission: string;
  rules: string[];
  icon: string;
  coverImage: string | null;
  isPrivate: boolean;
  category: string;
  organizationId: string;
  status: string;
  createdAt: Date;
}

interface FakeCampaign {
  id: string;
  organizationId: string;
  communityId: string;
  title: string;
  description: string;
  category: string;
  durationDays: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  targetActivitiesCount: number;
  completedActivitiesCount: number;
  rewardBadge: string | null;
  activities: any[];
  createdAt: Date;
}

let fakeUsers: FakeUser[] = [];
let fakeOrganizations: FakeOrganization[] = [];
let fakeOrganizationAdmins: any[] = [];
let fakeCommunities: FakeCommunity[] = [];
let fakeCommunityMembers: FakeCommunityMember[] = [];
let fakePosts: FakePost[] = [];
let fakeComments: FakeComment[] = [];
let fakeCampaigns: FakeCampaign[] = [];
let fakeMessageThreads: FakeMessageThread[] = [];
let fakeMessages: FakeMessage[] = [];
let fakeModerationReports: FakeModerationReport[] = [];
let fakeAuditLogs: any[] = [];

const PAST = new Date(Date.now() - 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

function makeOrganization(overrides: Partial<FakeOrganization> = {}): FakeOrganization {
  return {
    id: "org-alpha",
    name: "Organisation Alpha",
    acronym: "ALPHA",
    logo: null,
    coverImage: null,
    type: "ong",
    country: "RDC",
    city: "Kinshasa",
    address: "Adresse confidentielle Alpha",
    domain: "Sante communautaire",
    mission: "Mission Alpha",
    description: "Description Alpha",
    responsibleName: "Responsable Alpha",
    responsibleTitle: "Directrice",
    contactEmail: "private@alpha.org",
    contactPhone: "+243 99 000 0001",
    status: "approved",
    subscriptionPlan: "starter",
    quotaCommunitiesMax: 5,
    quotaMembersMax: 500,
    quotaCampaignsMax: 2,
    validatedAt: PAST,
    subscriptionStartedAt: PAST,
    subscriptionExpiresAt: FUTURE,
    paymentStatus: "validated",
    createdAt: PAST,
    ...overrides,
  };
}

function resetFakeDatabase(): void {
  fakeUsers = [
    { id: "user-superadmin", email: "root@admin.test", name: "Super Admin", pseudonym: null, avatar: null, role: "superadmin", isSuspended: false },
    { id: "user-alpha", email: "ref@alpha.org", name: "Ref Alpha", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
    { id: "user-beta", email: "ref@beta.org", name: "Ref Beta", pseudonym: null, avatar: null, role: "partner_admin", isSuspended: false },
    { id: "user-member", email: "member@test.org", name: "Membre Test", pseudonym: "Membre", avatar: null, role: "member", isSuspended: false },
    { id: "user-suspended", email: "suspended@test.org", name: "Suspendu", pseudonym: null, avatar: null, role: "member", isSuspended: true },
    { id: "user-anon", email: null, name: "Anonyme", pseudonym: null, avatar: null, role: "member", isSuspended: false },
  ];

  fakeOrganizations = [
    makeOrganization(),
    makeOrganization({
      id: "org-beta",
      name: "Organisation Beta",
      acronym: "BETA",
      contactEmail: "private@beta.org",
    }),
  ];

  fakeOrganizationAdmins = [
    { id: "oa-1", organizationId: "org-alpha", userId: "user-alpha", role: "owner", createdAt: PAST },
    { id: "oa-2", organizationId: "org-beta", userId: "user-beta", role: "owner", createdAt: PAST },
  ];

  fakeCommunities = [
    {
      id: "comm-alpha-1",
      name: "Cercle Alpha 1",
      slug: "cercle-alpha-1",
      description: "Description Alpha",
      mission: "Mission Alpha",
      rules: ["Confidentialite"],
      icon: "heart",
      coverImage: null,
      isPrivate: true,
      category: "sante_mentale",
      organizationId: "org-alpha",
      status: "active",
      createdAt: PAST,
    },
    {
      id: "comm-beta-1",
      name: "Cercle Beta 1",
      slug: "cercle-beta-1",
      description: "Description Beta",
      mission: "Mission Beta",
      rules: ["Confidentialite"],
      icon: "heart",
      coverImage: null,
      isPrivate: true,
      category: "sante_mentale",
      organizationId: "org-beta",
      status: "active",
      createdAt: PAST,
    },
  ];

  fakeCommunityMembers = [
    { id: "cm-1", communityId: "comm-alpha-1", userId: "user-alpha", role: "moderator", status: "active", joinedAt: PAST },
    { id: "cm-2", communityId: "comm-beta-1", userId: "user-beta", role: "moderator", status: "active", joinedAt: PAST },
    { id: "cm-3", communityId: "comm-alpha-1", userId: "user-member", role: "member", status: "active", joinedAt: PAST },
  ];

  fakePosts = [
    {
      id: "post-alpha-1",
      communityId: "comm-alpha-1",
      authorId: "user-member",
      authorName: "Membre Test",
      authorAvatar: null,
      type: "discussion",
      title: "Post Alpha",
      isAnonymous: false,
      content: "Contenu du post Alpha",
      mediaUrl: null,
      mediaType: "image",
      tags: [],
      reactionsSupport: 0,
      reactionsUnderstand: 0,
      reactionsCourage: 0,
      reactionsBravo: 0,
      isPinned: false,
      createdAt: PAST,
    },
  ];

  fakeComments = [
    {
      id: "comment-alpha-1",
      postId: "post-alpha-1",
      authorId: "user-member",
      authorName: "Membre Test",
      authorAvatar: null,
      content: "Commentaire Alpha",
      isAnonymous: false,
      createdAt: PAST,
    },
  ];

  fakeCampaigns = [
    {
      id: "camp-alpha-1",
      organizationId: "org-alpha",
      communityId: "comm-alpha-1",
      title: "Campagne Alpha",
      description: "Description",
      category: "sante_mentale",
      durationDays: 14,
      startDate: PAST,
      endDate: null,
      status: "active",
      targetActivitiesCount: 5,
      completedActivitiesCount: 0,
      rewardBadge: null,
      activities: [],
      createdAt: PAST,
    },
  ];

  fakeMessageThreads = [
    {
      id: "thread-alpha-beta",
      canonicalParticipantKey: "user-alpha:user-member",
      participantOneId: "user-alpha",
      participantTwoId: "user-member",
      lastMessage: "Bonjour",
      lastMessageAt: PAST,
      createdAt: PAST,
    },
  ];

  fakeMessages = [
    {
      id: "msg-1",
      threadId: "thread-alpha-beta",
      senderId: "user-alpha",
      receiverId: "user-member",
      content: "Bonjour",
      type: "text",
      mediaUrl: null,
      audioDuration: null,
      isRead: true,
      createdAt: PAST,
    },
  ];

  fakeModerationReports = [
    {
      id: "report-1",
      communityId: "comm-alpha-1",
      targetType: "post",
      targetId: "post-alpha-1",
      reason: "Contenu inapproprie",
      details: "Details",
      status: "pending",
      severity: "medium",
      reportedById: "user-member",
      actionTakenBy: null,
      actionNotes: null,
      resolvedAt: null,
      createdAt: PAST,
    },
  ];

  fakeAuditLogs = [];
}

// ---------------------------------------------------------------------------
// Double Prisma minimal
// ---------------------------------------------------------------------------

function matches(row: any, where: any): boolean {
  if (!where) return true;
  for (const [key, expected] of Object.entries(where as Record<string, unknown>)) {
    if (expected === undefined) continue;
    const actual = row[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      const filter = expected as Record<string, unknown>;
      if ("gte" in filter || "lt" in filter) {
        const d = actual instanceof Date ? actual : new Date(actual);
        const gte = filter.gte as Date | undefined;
        const lt = filter.lt as Date | undefined;
        if (gte && d < new Date(gte)) return false;
        if (lt && d >= new Date(lt)) return false;
        continue;
      }
      if ("contains" in filter) {
        const hay = String(actual ?? "").toLowerCase();
        if (!hay.includes(String(filter.contains).toLowerCase())) return false;
        continue;
      }
      if ("in" in filter) {
        const list = filter.in as unknown[];
        if (!Array.isArray(list) || !list.includes(actual)) return false;
        continue;
      }
      if ("equals" in filter) {
        if (actual !== filter.equals) return false;
        continue;
      }
    }
    if (actual instanceof Date && expected instanceof Date) {
      if (actual.getTime() !== expected.getTime()) return false;
      continue;
    }
    if (actual !== expected) return false;
  }
  return true;
}

function applySelect(row: any, select: any, include: any = undefined): any {
  if (!select && !include) return { ...row };

  const out: any = {};

  if (select) {
    for (const [key, wanted] of Object.entries(select as Record<string, any>)) {
      if (!wanted) continue;
      if (key === "_count") continue;
      if (key === "organization" || key === "community") {
        const rel = row[key];
        out[key] = rel ? applySelect(rel, wanted) : undefined;
        continue;
      }
      out[key] = row[key];
    }
  } else {
    Object.assign(out, row);
  }

  if (include) {
    for (const [key, wantedRaw] of Object.entries(include as Record<string, any>)) {
      if (!wantedRaw) continue;
      const wanted = wantedRaw as Record<string, any>;

      if (key === "_count") {
        const counts: Record<string, number> = {};
        const ownerId = row.organizationId ?? row.id;
        for (const relKey of Object.keys(wanted.select ?? {})) {
          const source =
            relKey === "organization"
              ? fakeOrganizations
              : relKey === "campaigns"
                ? fakeCampaigns
                : relKey === "communities"
                  ? fakeCommunities
                  : relKey === "posts"
                    ? fakePosts
                    : relKey === "members"
                      ? fakeCommunityMembers
                      : [];
          counts[relKey] = source.filter(
            (r: any) => r.organizationId === ownerId || r.communityId === ownerId || r.id === ownerId
          ).length;
        }
        out._count = counts;
        continue;
      }

      if (key === "organization") {
        const org = fakeOrganizations.find((o) => o.id === row.organizationId);
        out.organization = org ? applySelect(org, wanted.select) : undefined;
        continue;
      }

      if (key === "community") {
        const community = fakeCommunities.find((c) => c.id === row.communityId);
        out.community = community ? applySelect(community, wanted.select) : undefined;
        continue;
      }

      if (key === "members") {
        out.members = fakeCommunityMembers
          .filter((m) => m.communityId === row.id)
          .map((m) => ({
            role: m.role,
            user: fakeUsers.find((u) => u.id === m.userId) ?? null,
          }));
        continue;
      }

      if (key === "campaigns") {
        out.campaigns = fakeCampaigns
          .filter((c) => c.organizationId === row.organizationId)
          .map((c) => applySelect(c, wanted.select));
        continue;
      }

      if (key === "posts") {
        out.posts = fakePosts
          .filter((p) => p.communityId === row.id)
          .map((p) => applySelect(p, wanted.select));
        continue;
      }

      if (key === "comments") {
        out.comments = fakeComments
          .filter((c) => c.postId === row.id)
          .map((c) => applySelect(c, wanted.select));
        continue;
      }

      if (key === "author") {
        const author = fakeUsers.find((u) => u.id === row.authorId);
        out.author = author ? applySelect(author, wanted.select) : undefined;
        continue;
      }

      if (key === "reporter") {
        const reporter = fakeUsers.find((u) => u.id === row.reportedById);
        out.reporter = reporter ? applySelect(reporter, wanted.select) : undefined;
        continue;
      }
    }
  }

  return out;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

const fakeDatabase: any = {
  user: {
    findUnique: async ({ where }: any) => {
      const found = fakeUsers.find((u) => u.id === where.id);
      return found ? { ...found } : null;
    },
    findMany: async ({ where }: any = {}) => {
      let rows = fakeUsers;
      if (where?.AND) {
        for (const clause of where.AND) {
          rows = rows.filter((r) => matches(r, clause));
        }
      } else if (where) {
        rows = rows.filter((r) => matches(r, where));
      }
      return rows.map((u) => ({ ...u }));
    },
    update: async ({ where, data }: any) => {
      const index = fakeUsers.findIndex((u) => u.id === where.id);
      if (index < 0) throw new Error("utilisateur introuvable");
      fakeUsers[index] = { ...fakeUsers[index], ...data };
      return { ...fakeUsers[index] };
    },
  },
  organization: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeOrganizations.find((o) => o.id === where.id);
      if (!found) return null;
      return applySelect(found, select, include);
    },
    findFirst: async ({ where, select, include }: any) => {
      const found = fakeOrganizations.find((o) => matches(o, where));
      return found ? applySelect(found, select, include) : null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeOrganizations.filter((o) => matches(o, where)).map((o) => applySelect(o, select, include)),
    count: async ({ where }: any = {}) => fakeOrganizations.filter((o) => matches(o, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("org"), createdAt: new Date(), ...data };
      fakeOrganizations.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeOrganizations.findIndex((o) => o.id === where.id);
      if (index < 0) throw new Error("organisation introuvable");
      const current = fakeOrganizations[index];
      const updated = { ...current };
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (value && typeof value === "object" && "set" in value) {
          updated[key] = value.set;
        } else {
          updated[key] = value;
        }
      }
      fakeOrganizations[index] = updated;
      return { ...updated };
    },
    delete: async ({ where }: any) => {
      const index = fakeOrganizations.findIndex((o) => o.id === where.id);
      if (index < 0) throw new Error("organisation introuvable");
      const deleted = fakeOrganizations[index];
      fakeOrganizations.splice(index, 1);
      return deleted;
    },
  },
  organizationAdmin: {
    findMany: async ({ where, select, orderBy }: any) => {
      let rows = fakeOrganizationAdmins.filter((o) => matches(o, where));
      if (orderBy?.createdAt === "asc") {
        rows = [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return rows.map((row) => {
        if (!select) return { ...row };
        const out: any = {};
        for (const [key, wanted] of Object.entries(select)) {
          if (!wanted) continue;
          if (key === "organization") {
            const org = fakeOrganizations.find((o) => o.id === row.organizationId);
            out.organization = org ? applySelect(org, wanted) : undefined;
            continue;
          }
          out[key] = row[key];
        }
        return out;
      });
    },
    findUnique: async ({ where }: any) => {
      const { organizationId, userId } = where.organizationId_userId;
      const found = fakeOrganizationAdmins.find(
        (o) => o.organizationId === organizationId && o.userId === userId
      );
      return found ? { ...found } : null;
    },
    create: async ({ data }: any) => {
      const created = { id: nextId("oa"), ...data };
      fakeOrganizationAdmins.push(created);
      return { ...created };
    },
    delete: async ({ where }: any) => {
      const index = fakeOrganizationAdmins.findIndex(
        (o) => o.organizationId === where.organizationId && o.userId === where.userId
      );
      if (index < 0) throw new Error("lien organisation-admin introuvable");
      const deleted = fakeOrganizationAdmins[index];
      fakeOrganizationAdmins.splice(index, 1);
      return deleted;
    },
  },
  community: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeCommunities.find((c) => c.id === where.id);
      return found ? applySelect(found, select, include) : null;
    },
    findFirst: async ({ where, select, include }: any) => {
      const list = where.OR ?? [where];
      for (const clause of list) {
        const found = fakeCommunities.find((c) => matches(c, clause));
        if (found) return applySelect(found, select, include);
      }
      return null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeCommunities.filter((c) => matches(c, where)).map((c) => applySelect(c, select, include)),
    count: async ({ where }: any = {}) => fakeCommunities.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("comm"), createdAt: new Date(), ...data };
      fakeCommunities.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeCommunities.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("communaute introuvable");
      fakeCommunities[index] = { ...fakeCommunities[index], ...data };
      return { ...fakeCommunities[index] };
    },
    delete: async ({ where }: any) => {
      const index = fakeCommunities.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("communaute introuvable");
      const deleted = fakeCommunities[index];
      fakeCommunities.splice(index, 1);
      return deleted;
    },
  },
  communityMember: {
    findUnique: async ({ where }: any) => {
      const { communityId, userId } = where.communityId_userId;
      const found = fakeCommunityMembers.find(
        (m) => m.communityId === communityId && m.userId === userId
      );
      return found ? { ...found } : null;
    },
    findMany: async ({ where, select }: any = {}) => {
      let rows = fakeCommunityMembers;
      if (where?.userId) rows = rows.filter((m) => m.userId === where.userId);
      if (where?.communityId) rows = rows.filter((m) => m.communityId === where.communityId);
      if (where?.status) rows = rows.filter((m) => m.status === where.status);
      if (where?.community?.status) {
        rows = rows.filter((m) => fakeCommunities.some((c) => c.id === m.communityId && c.status === where.community.status));
      }
      if (select?.communityId) {
        return rows.map((m) => ({ communityId: m.communityId, ...(select.community ? { community: { isPrivate: fakeCommunities.find(c => c.id === m.communityId)?.isPrivate } } : {}) }));
      }
      return rows.map((m) => ({ ...m }));
    },
    count: async ({ where }: any = {}) => {
      if (!where?.community?.organizationId && !where?.communityId) return fakeCommunityMembers.length;
      const orgId = where?.community?.organizationId;
      if (orgId) {
        return fakeCommunityMembers.filter((m) =>
          fakeCommunities.some((c) => c.id === m.communityId && c.organizationId === orgId)
        ).length;
      }
      return fakeCommunityMembers.filter((m) => m.communityId === where.communityId).length;
    },
    create: async ({ data }: any) => {
      const created = { id: nextId("cm"), ...data };
      fakeCommunityMembers.push(created);
      return { ...created };
    },
    delete: async ({ where }: any) => {
      const index = fakeCommunityMembers.findIndex(
        (m) => m.communityId === where.communityId && m.userId === where.userId
      );
      if (index < 0) throw new Error("membre introuvable");
      fakeCommunityMembers.splice(index, 1);
      return { id: where.communityId_userId?.communityId };
    },
    update: async ({ where, data }: any) => {
      const index = fakeCommunityMembers.findIndex(
        (m) => m.communityId === where.communityId && m.userId === where.userId
      );
      if (index < 0) throw new Error("membre introuvable");
      fakeCommunityMembers[index] = { ...fakeCommunityMembers[index], ...data };
      return { ...fakeCommunityMembers[index] };
    },
  },
  post: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakePosts.find((p) => p.id === where.id);
      return found ? applySelect(found, select, include) : null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakePosts.filter((p) => matches(p, where)).map((p) => applySelect(p, select, include)),
    count: async ({ where }: any = {}) => fakePosts.filter((p) => matches(p, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("post"), createdAt: new Date(), ...data };
      fakePosts.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakePosts.findIndex((p) => p.id === where.id);
      if (index < 0) throw new Error("publication introuvable");
      fakePosts[index] = { ...fakePosts[index], ...data };
      return { ...fakePosts[index] };
    },
    delete: async ({ where }: any) => {
      const index = fakePosts.findIndex((p) => p.id === where.id);
      if (index < 0) throw new Error("publication introuvable");
      fakePosts.splice(index, 1);
      return { id: where.id };
    },
  },
  comment: {
    findUnique: async ({ where }: any) => {
      const found = fakeComments.find((c) => c.id === where.id);
      return found ? { ...found } : null;
    },
    findMany: async ({ where }: any) => fakeComments.filter((c) => matches(c, where)).map((c) => ({ ...c })),
    count: async ({ where }: any = {}) => fakeComments.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("comment"), createdAt: new Date(), ...data };
      fakeComments.push(created);
      return { ...created };
    },
    delete: async ({ where }: any) => {
      const index = fakeComments.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("commentaire introuvable");
      fakeComments.splice(index, 1);
      return { id: where.id };
    },
  },
  campaign: {
    findUnique: async ({ where, select, include }: any) => {
      const found = fakeCampaigns.find((c) => c.id === where.id);
      return found ? applySelect(found, select, include) : null;
    },
    findFirst: async ({ where, select, include }: any) => {
      const found = fakeCampaigns.find((c) => matches(c, where));
      return found ? applySelect(found, select, include) : null;
    },
    findMany: async ({ where, select, include }: any) =>
      fakeCampaigns.filter((c) => matches(c, where)).map((c) => applySelect(c, select, include)),
    count: async ({ where }: any = {}) => fakeCampaigns.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("camp"), createdAt: new Date(), ...data };
      fakeCampaigns.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeCampaigns.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("campagne introuvable");
      fakeCampaigns[index] = { ...fakeCampaigns[index], ...data };
      return { ...fakeCampaigns[index] };
    },
    delete: async ({ where }: any) => {
      const index = fakeCampaigns.findIndex((c) => c.id === where.id);
      if (index < 0) throw new Error("campagne introuvable");
      fakeCampaigns.splice(index, 1);
      return { id: where.id };
    },
  },
  campaignContribution: {
    findMany: async ({ where }: any) =>
      fakeCampaigns.filter((c) => matches(c, where)).map((c) => ({ ...c })),
    count: async ({ where }: any = {}) => fakeCampaigns.filter((c) => matches(c, where)).length,
    create: async ({ data }: any) => {
      const created = { id: nextId("cc"), ...data };
      return { ...created };
    },
  },
  messageThread: {
    findUnique: async ({ where }: any) => {
      const found = fakeMessageThreads.find((t) => t.id === where.id);
      return found ? { ...found } : null;
    },
    findMany: async ({ where }: any) => {
      let rows = fakeMessageThreads;
      if (where?.OR) {
        rows = rows.filter((t) => matches(t, where));
      }
      return rows.map((t) => ({ ...t }));
    },
    upsert: async ({ where, create, update }: any) => {
      const existing = fakeMessageThreads.find((t) => t.canonicalParticipantKey === where.canonicalParticipantKey);
      if (existing) {
        const index = fakeMessageThreads.indexOf(existing);
        fakeMessageThreads[index] = { ...existing, ...update };
        return { ...fakeMessageThreads[index] };
      }
      const created = { id: nextId("thread"), ...create };
      fakeMessageThreads.push(created);
      return { ...created };
    },
  },
  message: {
    findMany: async ({ where }: any) =>
      fakeMessages.filter((m) => matches(m, where)).map((m) => ({ ...m })),
    create: async ({ data }: any) => {
      const created = { id: nextId("msg"), ...data };
      fakeMessages.push(created);
      return { ...created };
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (let i = 0; i < fakeMessages.length; i++) {
        if (matches(fakeMessages[i], where)) {
          fakeMessages[i] = { ...fakeMessages[i], ...data };
          count++;
        }
      }
      return { count };
    },
  },
  moderationReport: {
    findUnique: async ({ where }: any) => {
      const found = fakeModerationReports.find((r) => r.id === where.id);
      return found ? { ...found } : null;
    },
    findMany: async ({ where }: any) =>
      fakeModerationReports.filter((r) => matches(r, where)).map((r) => ({ ...r })),
    create: async ({ data }: any) => {
      const created = { id: nextId("report"), ...data };
      fakeModerationReports.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeModerationReports.findIndex((r) => r.id === where.id);
      if (index < 0) throw new Error("rapport introuvable");
      fakeModerationReports[index] = { ...fakeModerationReports[index], ...data };
      return { ...fakeModerationReports[index] };
    },
  },
  invitation: {
    findUnique: async ({ where }: any) => {
      const found = fakeInvitations.find((inv) => inv.id === where.id || inv.code === where.code);
      return found ? { ...found } : null;
    },
    findFirst: async ({ where }: any) => {
      for (const clause of (where.OR ?? [where])) {
        const found = fakeInvitations.find((inv) => matches(inv, clause));
        if (found) return { ...found };
      }
      return null;
    },
    create: async ({ data }: any) => {
      const created = { id: nextId("inv"), ...data };
      fakeInvitations.push(created);
      return { ...created };
    },
    update: async ({ where, data }: any) => {
      const index = fakeInvitations.findIndex((inv) => inv.id === where.id);
      if (index < 0) throw new Error("invitation introuvable");
      fakeInvitations[index] = { ...fakeInvitations[index], ...data };
      return { ...fakeInvitations[index] };
    },
  },
  auditLog: {
    count: async () => fakeAuditLogs.length,
    findMany: async () => [...fakeAuditLogs],
    create: async ({ data }: any) => {
      fakeAuditLogs.push(data);
      return data;
    },
  },
  $transaction: async (arg: any) => {
    if (typeof arg === "function") {
      return arg(fakeDatabase);
    }
    return Promise.all(arg);
  },
};

let fakeInvitations: any[] = [];

(globalThis as any).__prismaClient = fakeDatabase;

const { __setSecretForTest } = await import("../server/middleware/auth.js");
__setSecretForTest(TEST_SECRET);

const { default: organizationRoutes } = await import("../server/routes/organization.routes.js");
const { default: communityRoutes } = await import("../server/routes/community.routes.js");
const { default: campaignRoutes } = await import("../server/routes/campaign.routes.js");
const { default: postRoutes } = await import("../server/routes/post.routes.js");
const { default: messageRoutes } = await import("../server/routes/message.routes.js");
const { default: moderationRoutes } = await import("../server/routes/moderation.routes.js");

// ---------------------------------------------------------------------------
// A. NIVEAU HTTP
// ---------------------------------------------------------------------------

console.log("\n=== CHANTIER 5 : tests de securite Resource-Level Authorization ===\n");
console.log("--- Niveau A : HTTP, routes, controleurs et middleware de production ---\n");

const app = express();
app.use(express.json());
app.use("/api/organizations", organizationRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/moderation", moderationRoutes);

const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", () => resolve()));
const port = (server.address() as any).port;

interface HttpResult {
  status: number;
  payload: any;
}

function httpCall(
  method: string,
  routePath: string,
  options: { body?: unknown; token?: string } = {}
): Promise<HttpResult> {
  return new Promise<HttpResult>((resolve, reject) => {
    const body = options.body === undefined ? null : JSON.stringify(options.body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: routePath,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(body ? { "Content-Length": String(Buffer.byteLength(body)) } : {}),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, payload: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, payload: raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function tokenFor(userId: string, claimedRole?: string): string {
  const user = fakeUsers.find((u) => u.id === userId)!;
  return jwt.sign(
    { id: user.id, email: user.email, role: claimedRole ?? user.role, name: user.name },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

/** Cree une communaute en envoyant le nom attendu. */
async function createCommunity(token: string, name: string, extra: Record<string, unknown> = {}) {
  return httpCall("POST", "/api/communities", { token, body: { name, ...extra } });
}

async function createCampaign(token: string, body: Record<string, unknown>) {
  return httpCall("POST", "/api/campaigns", { token, body });
}

async function createPost(token: string, body: Record<string, unknown>) {
  return httpCall("POST", "/api/posts", { token, body });
}

function fresh(): void {
  resetFakeDatabase();
}

// ---------------------------------------------------------------------------
// A — Community IDOR
// ---------------------------------------------------------------------------
currentScenario = "A. User B accede a la communaute privee de User A";
fresh();
{
  const res = await httpCall("GET", "/api/communities/comm-alpha-1", {
    token: tokenFor("user-beta"),
  });
  record(
    "acces refuse (404)",
    res.status === 404,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// B — Post IDOR
// ---------------------------------------------------------------------------
currentScenario = "B. User B tente de lire le post de User A";
fresh();
{
  const res = await httpCall("GET", "/api/posts/post-alpha-1", {
    token: tokenFor("user-beta"),
  });
  record(
    "acces refuse (404)",
    res.status === 404,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// C — Post modification
// ---------------------------------------------------------------------------
currentScenario = "C. User B tente de modifier le post de User A";
fresh();
{
  const res = await httpCall("POST", "/api/posts/post-alpha-1/react", {
    token: tokenFor("user-beta"),
    body: { type: "support" },
  });
  record(
    "reaction refusee (404)",
    res.status === 404,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// D — Post suppression (commentaire)
// ---------------------------------------------------------------------------
currentScenario = "D. User B tente de commenter le post de User A";
fresh();
{
  const res = await httpCall("POST", "/api/posts/post-alpha-1/comments", {
    token: tokenFor("user-beta"),
    body: { content: "Commentaire malveillant" },
  });
  record(
    "commentaire refuse (403 FORBIDDEN_RESOURCE)",
    res.status === 403 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// E — Organization cross-access
// ---------------------------------------------------------------------------
currentScenario = "E. Partner A utilise l'ID de Organization B";
fresh();
{
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle cross-org", {
    organizationId: "org-beta",
  });
  record(
    "creation refusee (404 FORBIDDEN_RESOURCE)",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// F — Community cross-organization
// ---------------------------------------------------------------------------
currentScenario = "F. Partner A tente d'utiliser la communaute de Organization B";
fresh();
{
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-beta-1",
    title: "Campagne cross-org",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "creation refusee (404 FORBIDDEN_RESOURCE)",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// G — Campaign cross-organization
// ---------------------------------------------------------------------------
currentScenario = "G. Campaign cross-organization (deja couvert par F)";
fresh();
{
  const res = await createCampaign(tokenFor("user-beta"), {
    communityId: "comm-alpha-1",
    title: "Campagne cross-org beta",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "creation refusee (404 FORBIDDEN_RESOURCE)",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// H — Message thread IDOR
// ---------------------------------------------------------------------------
currentScenario = "H. User C connait l'ID du thread entre A et B";
fresh();
{
  const res = await httpCall("GET", "/api/messages/threads/thread-alpha-beta", {
    token: tokenFor("user-beta"),
  });
  record(
    "acces refuse (403)",
    res.status === 403,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// I — Message sender spoofing
// ---------------------------------------------------------------------------
currentScenario = "I. User B tente d'envoyer un message avec senderId de User A";
fresh();
{
  const res = await httpCall("POST", "/api/messages", {
    token: tokenFor("user-beta"),
    body: { receiverId: "user-alpha", content: "Usurpation", senderId: "user-alpha" },
  });
  record(
    "message cree avec le vrai sender (User B)",
    res.status === 201 && res.payload?.data?.senderId === "user-beta" && res.payload?.data?.receiverId === "user-alpha",
    `recu ${res.status}, sender=${res.payload?.data?.senderId}, receiver=${res.payload?.data?.receiverId}`
  );
}

// ---------------------------------------------------------------------------
// J — Report IDOR
// ---------------------------------------------------------------------------
currentScenario = "J. User B tente d'acceder au rapport de User A";
fresh();
{
  const res = await httpCall("GET", "/api/moderation/reports/report-1", {
    token: tokenFor("user-beta"),
  });
  record(
    "acces refuse (404 ou 403 selon la route)",
    res.status === 404 || res.status === 403,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// K — Report modification
// ---------------------------------------------------------------------------
currentScenario = "K. User B tente de modifier le rapport de User A";
fresh();
{
  const res = await httpCall("PUT", "/api/moderation/reports/report-1", {
    token: tokenFor("user-beta"),
    body: { status: "resolved" },
  });
  record(
    "modification refusee (404 ou 403)",
    res.status === 404 || res.status === 403,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// L — Privilege downgrade
// ---------------------------------------------------------------------------
currentScenario = "L. Utilisateur dont le role est modifie cote DB ne conserve pas l'acces";
fresh();
{
  // user-alpha est partner_admin, on le demote en member dans le fake DB
  const target = fakeUsers.find((u) => u.id === "user-alpha")!;
  target.role = "member";
  target.isSuspended = false;

  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne downgrade",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "creation refusee (403)",
    res.status === 403,
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// M — Forged IDs
// ---------------------------------------------------------------------------
currentScenario = "M1. body.communityId falsifie";
fresh();
{
  const res = await createPost(tokenFor("user-member"), {
    communityId: "comm-beta-1",
    content: "Post cross-org",
    title: "Titre",
    type: "discussion",
  });
  record(
    "creation refusee (403 FORBIDDEN_RESOURCE)",
    res.status === 403 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

currentScenario = "M2. query.communityId falsifie sur listPosts";
fresh();
{
  const res = await httpCall("GET", "/api/posts?communityId=comm-beta-1", {
    token: tokenFor("user-member"),
  });
  record(
    "acces refuse (404 FORBIDDEN_RESOURCE)",
    res.status === 404 && res.payload?.code === "FORBIDDEN_RESOURCE",
    `recu ${res.status} / ${res.payload?.code}`
  );
}

// ---------------------------------------------------------------------------
// N — Anonymous access
// ---------------------------------------------------------------------------
currentScenario = "N1. POST /api/communities sans authentification";
fresh();
{
  const res = await httpCall("POST", "/api/communities", {
    body: { name: "Cercle anon" },
  });
  record(
    "acces refuse (401)",
    res.status === 401,
    `recu ${res.status}`
  );
}

currentScenario = "N2. POST /api/posts sans authentification";
fresh();
{
  const res = await httpCall("POST", "/api/posts", {
    body: { communityId: "comm-alpha-1", content: "Post anon" },
  });
  record(
    "acces refuse (401)",
    res.status === 401,
    `recu ${res.status}`
  );
}

currentScenario = "N3. POST /api/messages sans authentification";
fresh();
{
  const res = await httpCall("POST", "/api/messages", {
    body: { receiverId: "user-alpha", content: "Msg anon" },
  });
  record(
    "acces refuse (401)",
    res.status === 401,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// O — Legitimate access
// ---------------------------------------------------------------------------
currentScenario = "O1. User A cree une communaute dans son org";
fresh();
{
  const res = await createCommunity(tokenFor("user-alpha"), "Cercle legitime");
  record(
    "creation autorisee (201)",
    res.status === 201 && res.payload?.data?.organizationId === "org-alpha",
    `recu ${res.status}, org = ${res.payload?.data?.organizationId}`
  );
}

currentScenario = "O2. User A cree une campagne dans sa communaute";
fresh();
{
  const res = await createCampaign(tokenFor("user-alpha"), {
    communityId: "comm-alpha-1",
    title: "Campagne legitime",
    description: "d",
    category: "sante_mentale",
  });
  record(
    "creation autorisee (201)",
    res.status === 201 && res.payload?.data?.organizationId === "org-alpha",
    `recu ${res.status}, org = ${res.payload?.data?.organizationId}`
  );
}

currentScenario = "O3. User A envoie un message a User B";
fresh();
{
  const res = await httpCall("POST", "/api/messages", {
    token: tokenFor("user-alpha"),
    body: { receiverId: "user-member", content: "Message legitime" },
  });
  record(
    "message cree (201)",
    res.status === 201 && res.payload?.data?.senderId === "user-alpha" && res.payload?.data?.receiverId === "user-member",
    `recu ${res.status}, sender=${res.payload?.data?.senderId}, receiver=${res.payload?.data?.receiverId}`
  );
}

currentScenario = "O4. User A signale un contenu";
fresh();
{
  const res = await httpCall("POST", "/api/moderation/reports", {
    token: tokenFor("user-member"),
    body: { targetType: "post", targetId: "post-alpha-1", reason: "Inapproprie" },
  });
  record(
    "signale cree (201)",
    res.status === 201,
    `recu ${res.status}`
  );
}

// ---------------------------------------------------------------------------
// Résumé
// ---------------------------------------------------------------------------

console.log("\n=== RESULTATS ===\n");
let passed = 0;
let failed = 0;
for (const r of results) {
  const marker = r.status === "pass" ? "PASS" : "FAIL";
  console.log(`[${marker}] ${r.scenario} — ${r.expected} :: ${r.detail}`);
  if (r.status === "pass") passed++;
  else failed++;
}
console.log(`\nTotal: ${results.length} scenarios, ${passed} passes, ${failed} fails\n`);

process.exit(failed > 0 ? 1 : 0);
