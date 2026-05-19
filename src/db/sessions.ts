import type { SessionResult, Suit, WorkoutConfig } from "@/types/workout";
import { getDb } from "./database";

export type StoredSession = {
  id: string;
  started_at: string;
  finished_at: string;
  total_reps: number;
  elapsed_seconds: number;
  card_count: number;
  config: WorkoutConfig;
};

type RawSession = Omit<StoredSession, "config"> & { config: string };

export function saveSession(result: SessionResult): string {
  const db = getDb();
  const now = new Date();
  const finishedAt = now.toISOString();
  const startedAt = new Date(now.getTime() - result.elapsedSeconds * 1000).toISOString();
  const id = now.getTime().toString();
  const totalReps = result.cards
    .filter((c) => c.completed && c.reps > 0)
    .reduce((sum, c) => sum + c.reps, 0);

  db.runSync(
    "INSERT INTO workout_sessions (id, started_at, finished_at, total_reps, elapsed_seconds, card_count, config) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, startedAt, finishedAt, totalReps, result.elapsedSeconds, result.config.cardCount, JSON.stringify(result.config)]
  );

  for (let i = 0; i < result.cards.length; i++) {
    const card = result.cards[i];
    const exercise = card.suit === "joker" ? "Joker" : result.config.suitExercises[card.suit as Suit];
    db.runSync(
      "INSERT INTO card_results (session_id, position, suit, rank, exercise, reps, completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, i, card.suit, card.rank, exercise, card.reps, card.completed ? 1 : 0]
    );
  }

  return id;
}

export function getRecentSessions(limit = 30): StoredSession[] {
  const db = getDb();
  const rows = db.getAllSync<RawSession>(
    "SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT ?",
    [limit]
  );
  return rows.map((row) => ({ ...row, config: JSON.parse(row.config) as WorkoutConfig }));
}
