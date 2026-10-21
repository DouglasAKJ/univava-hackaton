import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "univava.db");

declare global {
  // eslint-disable-next-line no-var
  var __sqlite_db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (process.env.NODE_ENV === "production") {
    return new Database(dbPath);
  }

  if (!global.__sqlite_db) {
    global.__sqlite_db = new Database(dbPath);
    global.__sqlite_db.pragma("journal_mode = WAL");
  }
  return global.__sqlite_db;
}

export const db = getDb();
