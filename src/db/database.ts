import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync("repdeck.db");
    _db.execSync(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        total_reps INTEGER NOT NULL,
        elapsed_seconds INTEGER NOT NULL,
        card_count INTEGER NOT NULL,
        config TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS card_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        suit TEXT NOT NULL,
        rank TEXT NOT NULL,
        exercise TEXT NOT NULL,
        reps INTEGER NOT NULL,
        completed INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workout_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }
  return _db;
}

export { getDb };
