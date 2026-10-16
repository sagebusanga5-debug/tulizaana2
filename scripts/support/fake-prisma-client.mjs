/**
 * Faux PrismaClient, reserve aux tests du seed (chantier 3.1).
 *
 * Ce module n'est jamais charge par l'application. Un hook de resolution Node le
 * substitue a `@prisma/client` dans le seul processus de test, ce qui permet
 * d'executer le vrai `prisma/seed.ts` sans base de donnees et sans seuil de
 * modification du code de production.
 *
 * Il enregistre chaque ecriture et les expose a la fin du processus, via la
 * variable `TLZ_FAKE_PRISMA_DUMP` (chemin d'un fichier JSON temporaire).
 */

const state = {
  calls: [],
  records: {},
};

let idCounter = 0;

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function rowsOf(model) {
  if (!state.records[model]) state.records[model] = [];
  return state.records[model];
}

function findRecord(model, where) {
  if (!where || typeof where !== "object") return null;
  const entries = Object.entries(where);
  if (entries.length === 0) return null;
  return (
    rowsOf(model).find((row) =>
      entries.every(([key, value]) => typeof value !== "object" && row[key] === value)
    ) ?? null
  );
}

/** Copie JSON-sûre : le seed passe des Dates, que l'on veut comparer en JSON. */
function snapshot(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

class ModelDelegate {
  constructor(model) {
    this.model = model;
  }

  async upsert(args) {
    state.calls.push({
      op: "upsert",
      model: this.model,
      args: snapshot(args),
    });

    const existing = findRecord(this.model, args?.where);
    if (existing) {
      Object.assign(existing, args.update ?? {});
      return existing;
    }

    const created = { id: nextId(this.model), ...(args.create ?? {}) };
    rowsOf(this.model).push(created);
    return created;
  }

  async create(args) {
    state.calls.push({
      op: "create",
      model: this.model,
      args: snapshot(args),
    });

    const created = { id: nextId(this.model), ...(args.data ?? args.create ?? {}) };
    rowsOf(this.model).push(created);
    return created;
  }

  async createMany(args) {
    const data = args?.data ?? [];
    state.calls.push({ op: "createMany", model: this.model, args: snapshot(args) });
    for (const item of data) {
      rowsOf(this.model).push({ id: nextId(this.model), ...item });
    }
    return { count: data.length };
  }

  async deleteMany(args) {
    state.calls.push({ op: "deleteMany", model: this.model, args: snapshot(args) });
    return { count: 0 };
  }

  async findMany(args) {
    state.calls.push({ op: "findMany", model: this.model, args: snapshot(args) });
    return rowsOf(this.model).filter((row) => {
      const where = args?.where;
      if (!where) return true;
      return Object.entries(where).every(
        ([key, value]) => typeof value !== "object" || row[key] === value
      );
    });
  }

  async count() {
    return rowsOf(this.model).length;
  }
}

const MODELS = [
  "user",
  "organization",
  "organizationAdmin",
  "community",
  "communityMember",
  "invitation",
  "campaign",
  "campaignContribution",
  "post",
  "postMedia",
  "comment",
  "moderationReport",
  "auditLog",
];

export class PrismaClient {
  constructor() {
    for (const model of MODELS) {
      this[model] = new ModelDelegate(model);
    }
  }

  async $transaction(operations) {
    return Promise.all(operations);
  }

  async $disconnect() {
    const dumpPath = process.env.TLZ_FAKE_PRISMA_DUMP;
    if (!dumpPath) return;
    const { writeFileSync } = await import("node:fs");
    writeFileSync(dumpPath, JSON.stringify(state, null, 2), "utf8");
  }
}

export default { PrismaClient };