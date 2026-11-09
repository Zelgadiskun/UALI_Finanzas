import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export interface Account {
  id: string;
  name: string;
  created_at: string;
}

export interface BrandPillar {
  id: string;
  account_id: string;
  title: string;
  description: string | null;
  tone: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  account_id: string;
  brand_pillar_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  account_id: string;
  idea_id: string | null;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  account_id: string;
  draft_id: string;
  order_index: number;
  headline: string | null;
  body: string | null;
  visual_notes: string | null;
  created_at: string;
  updated_at: string;
}

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "app.sqlite");
}

export function initDatabase(dbPath?: string): Database.Database {
  const filePath = dbPath ?? getDatabasePath();
  const db = new Database(filePath);

  // Enforce foreign key constraints
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  // Create tables with account_id foreign keys and proper schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brand_pillars (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tone TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      brand_pillar_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'backlog',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (brand_pillar_id) REFERENCES brand_pillars(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      idea_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      draft_id TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      headline TEXT,
      body TEXT,
      visual_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (draft_id) REFERENCES drafts(id) ON DELETE CASCADE
    );

    -- Indexes for tenant isolation and query performance
    CREATE INDEX IF NOT EXISTS idx_brand_pillars_account_id ON brand_pillars(account_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_account_id ON ideas(account_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_brand_pillar_id ON ideas(brand_pillar_id);
    CREATE INDEX IF NOT EXISTS idx_drafts_account_id ON drafts(account_id);
    CREATE INDEX IF NOT EXISTS idx_drafts_idea_id ON drafts(idea_id);
    CREATE INDEX IF NOT EXISTS idx_slides_account_id ON slides(account_id);
    CREATE INDEX IF NOT EXISTS idx_slides_draft_id ON slides(draft_id);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Ensure default demo account exists if requested
export function ensureAccountExists(accountId: string, accountName = "Default Account"): Account {
  const db = getDatabase();
  const selectStmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  let account = selectStmt.get(accountId) as Account | undefined;

  if (!account) {
    const insertStmt = db.prepare("INSERT INTO accounts (id, name) VALUES (?, ?)");
    insertStmt.run(accountId, accountName);
    account = selectStmt.get(accountId) as Account;
  }

  return account;
}

export default getDatabase;
