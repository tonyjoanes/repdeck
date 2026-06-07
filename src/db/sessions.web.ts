import type { SessionResult, Suit, WorkoutConfig } from "@/types/workout";

const STORAGE_KEY = "repdeck.workoutSessions";

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

type WebStoredSession = StoredSession & {
  cards: SessionResult["cards"];
};

function readSessions(): WebStoredSession[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as WebStoredSession[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: WebStoredSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function saveSession(result: SessionResult): string {
  const now = new Date();
  const id = now.getTime().toString();
  const finishedAt = now.toISOString();
  const startedAt = new Date(now.getTime() - result.elapsedSeconds * 1000).toISOString();
  const totalReps = result.cards
    .filter((c) => c.completed && c.reps > 0)
    .reduce((sum, c) => sum + c.reps, 0);

  const session: WebStoredSession = {
    id,
    started_at: startedAt,
    finished_at: finishedAt,
    total_reps: totalReps,
    elapsed_seconds: result.elapsedSeconds,
    card_count: result.config.cardCount,
    config: result.config,
    cards: result.cards,
  };

  writeSessions([session, ...readSessions()]);
  return id;
}

export function getRecentSessions(limit = 30): StoredSession[] {
  return readSessions()
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, limit)
    .map(({ cards: _cards, ...session }) => session);
}

export function getExerciseStats(since: Date): ExerciseStat[] {
  const totals = new Map<string, { total_reps: number; sessionIds: Set<string> }>();
  const sinceTime = since.getTime();

  for (const session of readSessions()) {
    if (new Date(session.started_at).getTime() < sinceTime) continue;

    for (const card of session.cards) {
      if (!card.completed || card.reps <= 0 || card.suit === "joker") continue;

      const exercise = session.config.suitExercises[card.suit as Suit];
      const stat = totals.get(exercise) ?? { total_reps: 0, sessionIds: new Set<string>() };
      stat.total_reps += card.reps;
      stat.sessionIds.add(session.id);
      totals.set(exercise, stat);
    }
  }

  return Array.from(totals.entries())
    .map(([exercise, stat]) => ({
      exercise,
      total_reps: stat.total_reps,
      session_count: stat.sessionIds.size,
    }))
    .sort((a, b) => b.total_reps - a.total_reps);
}
