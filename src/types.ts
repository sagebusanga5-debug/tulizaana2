export type Language = 'en' | 'fr' | 'ar' | 'pt' | 'sw';

/** Resultat minimal et public de la recherche globale serveur. */
export type SearchResultType = 'organizations' | 'communities' | 'campaigns' | 'posts' | 'stories' | 'comments' | 'users';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  resourceId: string;
  title: string;
  description: string | null;
  image: string | null;
  context?: { id: string; name: string; slug?: string | null };
  tags?: string[];
}

export interface SearchResultPage {
  items: SearchResult[];
  total: number;
}

export interface SearchResponse {
  query: string;
  types: SearchResultType[];
  page: number;
  limit: number;
  results: Partial<Record<SearchResultType, SearchResultPage>>;
}

export type UserRole = 'member' | 'partner_admin' | 'superadmin' | 'admin' | 'peer_helper' | 'professional' | 'moderator';

export type MemberStatus = 'new_member' | 'active_participant' | 'contributor' | 'ambassador' | 'mentor' | 'member';

export type ContributionVisibility = 'campaign_members' | 'community_members' | 'private';
export type CampaignExpectedOutput = 'photo' | 'video' | 'audio' | 'text' | 'interaction' | 'any';

export type InterfaceMode = 'user' | 'partner' | 'superadmin';

export interface UserProfile {
  id: string;
  name: string;
  pseudonym?: string;
  avatar: string;
  email?: string;
  phone?: string;
  country: string;
  language: Language;
  bio: string; // Obligatoire: courte bio de 2 lignes sur son expérience
  status: MemberStatus;
  joinedCommunities: string[]; // IDs of communities user belongs to
  followingUserIds: string[];
  savedPostIds?: string[]; // IDs of posts saved/bookmarked by user
  role: UserRole;
  organizationId?: string; // If partner
  isAnonymous?: boolean;
  points: number;
  completedCampaignsCount: number;
  featuredTestimonialIds: string[];
  badges: Badge[];
  createdAt: string;
  isSuspended?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'courage' | 'solidarity' | 'constancy' | 'mentor';
}

export interface LegalDocument {
  id: string;
  name: string;
  documentType: 'agrement_ministeriel' | 'statuts_notaries' | 'f92_rccm' | 'attestation_siege' | 'autre';
  documentTypeLabel: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'verified' | 'pending_review';
  fileUrl?: string;
}

export interface OrganizationTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'available' | 'busy';
  bio?: string;
  email?: string;
  specialty?: string;
}

export interface Organization {
  id: string;
  slug?: string;
  name: string;
  acronym?: string;
  country: string;
  city?: string;
  type: 'ong' | 'association' | 'institution' | 'fondation' | 'hopital';
  domain: string;
  description: string;
  responsibleName: string;
  contactEmail: string;
  contactPhone: string;
  logo: string;
  coverImage?: string;
  vision?: string;
  mission?: string;
  values?: string[];
  interventionDomains?: string[];
  legalDocuments?: LegalDocument[];
  teamMembers?: OrganizationTeamMember[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  isVerified?: boolean;
  subscriptionPlan: 'basic' | 'starter' | 'growth' | 'enterprise';
  quotaCommunities: { used: number; max: number };
  quotaMembers: { used: number; max: number };
  quotaCampaignsPerMonth: { used: number; max: number };
  createdAt: string;
  invitationCode?: string;
  validatedAt?: string;
  validatedBy?: string;
  validationEmailSentAt?: string;
}

export interface Community {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  description: string;
  rules: string[];
  image: string;
  coverImage: string;
  category: 'chronic_disease' | 'infectious' | 'trauma_gbv' | 'mental_health' | 'disability' | 'caregivers';
  membersCount: number;
  postsCount: number;
  activeCampaignsCount: number;
  status: 'draft' | 'pending_review' | 'approved' | 'active' | 'suspended';
  isPrivate: boolean; // Toujours true (cercle fermé)
  createdAt: string;
}

export interface StoryTestimonial {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorStatus: MemberStatus;
  communityId: string;
  communityName: string;
  type: 'video' | 'photo' | 'audio' | 'text';
  mediaUrl?: string;
  audioDuration?: string;
  caption: string;
  timestamp: string;
  isViewed?: boolean;
  hasRingGlow?: boolean;
  reactions: {
    support: number;
    understand: number;
    courage: number;
    bravo: number;
  };
  userReaction?: string;
  isFeaturedOnProfile?: boolean;
}

export interface PostReaction {
  support: number;     // ❤️ Soutien
  understand: number;  // 🤝 Je comprends
  courage: number;     // 🌱 Courage
  bravo: number;       // 👏 Bravo
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorStatus: MemberStatus;
  isAnonymous?: boolean;
  content: string;
  timestamp: string;
  reactions: PostReaction;
  userReaction?: keyof PostReaction;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorStatus: MemberStatus;
  isAnonymous: boolean;
  communityId: string;
  communityName: string;
  type: 'question' | 'discussion' | 'announcement' | 'campaign_share' | 'testimony';
  title?: string;
  content: string;
  media: PostMedia[];
  tags: string[];
  timestamp: string;
  reactions: PostReaction;
  userReaction?: keyof PostReaction;
  commentsCount: number;
  comments: PostComment[];
  isPinned?: boolean;
  isReported?: boolean;
}

export type CampaignActivityType =
  | 'share'          // ① PARTAGER: "Raconte-nous..." (texte/audio/vidéo/photo)
  | 'respond'        // ② RÉPONDRE: "Quelle est ton expérience concernant... ?"
  | 'show'           // ③ MONTRER: "Montre-nous quelque chose..." (photo/vidéo)
  | 'listen_watch'   // ④ ÉCOUTER/REGARDER: "Écoute cette histoire puis dis-nous..."
  | 'encourage'      // ⑤ ENCOURAGER: "Laisse un message d'encouragement à un pair"
  | 'question'       // ⑥ QUESTIONNER: "Pose une question à la communauté"
  | 'act'            // ⑦ AGIR: "Fais cette petite action puis raconte"
  | 'co_create'      // ⑧ CRÉER ENSEMBLE: "Construisons l'histoire collective"
  // Legacy aliases for backward compatibility
  | 'answer_question'
  | 'write_reflection'
  | 'record_audio'
  | 'share_photo'
  | 'encourage_peer'
  | 'watch_content'
  | 'challenge';

export interface CampaignContributionComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface CampaignContribution {
  id: string;
  campaignId: string;
  campaignTitle: string;
  activityId: string;
  dayNumber: number;
  activityTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorStatus: MemberStatus;
  isAnonymous?: boolean;
  mediaType: 'text' | 'audio' | 'video' | 'photo' | 'interaction';
  mediaUrl?: string;
  audioDuration?: string;
  caption?: string;
  content: string;
  visibility: 'campaign_members' | 'community_members' | 'private';
  createdAt: string;
  reactions: {
    support: number;
    understand: number;
    courage: number;
    bravo: number;
  };
  userReaction?: string;
  commentsCount: number;
  comments: CampaignContributionComment[];
}

export interface CampaignActivity {
  id: string;
  campaignId: string;
  dayNumber: number;
  phase?: 'discover' | 'participate' | 'celebrate';
  title: string;
  description: string;
  activityType: CampaignActivityType;
  expectedOutput?: 'photo' | 'video' | 'audio' | 'text' | 'interaction' | 'any';
  mediaUrl?: string;
  estimatedMinutes: number;
  points?: number;
  promptText?: string;
  isCompleted?: boolean;
  completedAt?: string;
  userContribution?: CampaignContribution;
  contributionsCount?: number;
}

export interface CampaignCollectiveStory {
  title: string;
  summary: string;
  featuredQuotes: Array<{
    quote: string;
    author: string;
    authorAvatar?: string;
    dayNumber: number;
  }>;
  keyLearnings: string[];
  totalContributions: number;
  exportReady?: boolean;
}

export interface Campaign {
  id: string;
  organizationId: string;
  organizationName: string;
  communityId: string;
  communityName: string;
  title: string;
  slug: string;
  description: string;
  objective: string; // 🎯 Objectif de la mission
  targetAudience?: string; // 👥 Public
  expectedOutcome?: string; // 🏆 Résultat attendu
  image: string;
  durationDays: number; // ⏳ Durée (7, 14, 21, 30 jours)
  currentDay?: number;
  currentPhase?: 'discover' | 'participate' | 'celebrate';
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  participantsCount: number;
  activeParticipantsCount?: number;
  completionRate: number; // 0-100%
  status: 'draft' | 'active' | 'completed' | 'upcoming';
  activities: CampaignActivity[];
  contributions?: CampaignContribution[];
  contributionsCount?: number;
  mediaCounts?: {
    videos: number;
    audios: number;
    photos: number;
    texts: number;
    interactions: number;
  };
  collectiveStory?: CampaignCollectiveStory;
  rewards: {
    points?: number;
    badgeTitle: string;
    badgeIcon: string;
    badgeDescription?: string;
  };
  rules: string[];
  isUserParticipating?: boolean;
  userProgressPercent?: number;
  userCompletedActivitiesCount?: number;
  userContributionsCount?: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  type: 'text' | 'audio' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: string;
  timestamp: string;
  isRead: boolean;
}

export interface MessageThread {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    status: MemberStatus;
    sharedCommunityName: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isBlocked?: boolean;
  messages: DirectMessage[];
}

export interface InvitationCode {
  id: string;
  code: string;
  link: string;
  organizationId: string;
  organizationName: string;
  communityId: string;
  communityName: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdBy: string;
}

export interface ModerationReport {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'story' | 'message';
  contentSnippet: string;
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  reporterId: string;
  reporterName: string;
  reason: 'harassment' | 'hate_speech' | 'inappropriate_medical_advice' | 'privacy_breach' | 'spam' | 'other';
  reportedAt: string;
  status: 'pending' | 'reviewed_hidden' | 'reviewed_deleted' | 'reviewed_restored' | 'warned' | 'suspended';
  actionTakenBy?: string;
  actionTakenAt?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'warning' | 'denied';
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'reaction' | 'comment' | 'message' | 'campaign_activity' | 'badge_earned' | 'announcement' | 'status_upgrade';
  title: string;
  message: string;
  linkTab?: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
}

export interface SubscriptionPlan {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  priceMonthly: number;
  maxCommunities: number;
  maxMembersPerCommunity: number;
  maxCampaignsPerMonth: number;
  features: string[];
}

export type PartnerTab =
  | 'profile'
  | 'dashboard'
  | 'communities'
  | 'campaigns'
  | 'members'
  | 'moderation'
  | 'analytics'
  | 'reports'
  | 'subscription';

export interface PartnerMetrics {
  totalMembers: number;
  monthlyGrowthPercent: number;
  activeCampaignsCount: number;
  campaignCompletionRate: number;
  totalSupportReactions: number;
  pendingReportsCount: number;
  resolvedReportsCount: number;
}

export interface MemberInvitationRequest {
  id: string;
  candidateName: string;
  candidateAvatar?: string;
  contactEmail?: string;
  contactPhone?: string;
  communityId: string;
  communityName: string;
  organizationId: string;
  situation: string;
  motivation: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  assignedCode?: string;
  isFirstRequestOnTulizaana?: boolean;
  existingCommunitiesJoined?: string[];
  dispatchedVia?: 'whatsapp' | 'tulizaana_chat';
  dispatchedAt?: string;
}

// Chantier 8.7 — Backend Reports & Anonymisation

export type ReportLevel = 'basic' | 'intermediate' | 'advanced';

export interface ReportSummary {
  activeCommunities: number;
  activeMembers: number | { suppressed: true };
  newMembers: number | { suppressed: true };
  posts: number | { suppressed: true };
  stories: number | { suppressed: true };
  comments: number | { suppressed: true };
  reactions: number | { suppressed: true };
  campaigns: number;
}

export interface ReportEvolution {
  newMembers: number | { suppressed: true };
  posts: number | { suppressed: true };
}

export interface ReportCampaigns {
  total: number;
  contributions: number | { suppressed: true };
  completedActivities: number | { suppressed: true };
}

export interface ReportEngagement {
  comments: number | { suppressed: true };
  reactions: number | { suppressed: true };
}

export interface ReportData {
  schemaVersion: number;
  period: { start: string; end: string };
  level: ReportLevel;
  summary: ReportSummary;
  engagement: ReportEngagement;
  campaigns: ReportCampaigns;
  evolution?: ReportEvolution;
}

export interface ReportInsight {
  type: string;
  title: string;
  description: string;
  metric: string;
  direction: 'up' | 'down';
}

export interface ReportRecommendation {
  type: string;
  description: string;
}

export interface PartnerReport {
  id: string;
  organizationId: string;
  communityId: string | null;
  periodStart: string;
  periodEnd: string;
  level: ReportLevel;
  status: 'generated' | 'failed';
  data: ReportData;
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
  generatedBy: string;
  generatedAt: string;
}

export interface PartnerReportsListResponse {
  reports: PartnerReport[];
  total: number;
  page: number;
  limit: number;
}

