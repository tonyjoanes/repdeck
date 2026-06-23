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

export type ExerciseStat = {
  exercise: string;
  total_reps: number;
  session_count: number;
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

  // Walk the deck by hand so secondary cards are attributed to the primary exercise
  let i = 0;
  while (i < result.cards.length) {
    const primary = result.cards[i];
    const primaryExercise = primary.suit === "joker" ? "Joker" : result.config.suitExercises[primary.suit as Suit];
    const n = primary.suit === "joker" ? 1 : Math.max(1, result.config.suitCardCount[primary.suit as Suit] ?? 1);

    for (let j = 0; j < n && i + j < result.cards.length; j++) {
      const card = result.cards[i + j];
      db.runSync(
        "INSERT INTO card_results (session_id, position, suit, rank, exercise, reps, completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, i + j, card.suit, card.rank, primaryExercise, card.reps, card.completed ? 1 : 0]
      );
    }
    i += n;
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

export function getExerciseStats(since: Date): ExerciseStat[] {
  const db = getDb();
  return db.getAllSync<ExerciseStat>(
    `SELECT cr.exercise, SUM(cr.reps) AS total_reps, COUNT(DISTINCT cr.session_id) AS session_count
     FROM card_results cr
     JOIN workout_sessions ws ON cr.session_id = ws.id
     WHERE ws.started_at >= ? AND cr.completed = 1 AND cr.reps > 0 AND cr.suit != 'joker'
     GROUP BY cr.exercise
     ORDER BY total_reps DESC`,
    [since.toISOString()]
  );
}
