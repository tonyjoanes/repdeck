import type { Suit, Rank, WorkoutConfig, CardCount } from "@/types/workout";

export const DEFAULT_EXERCISES: Record<Suit, string> = {
  hearts: "Push-ups",
  diamonds: "Squats",
  clubs: "Sit-ups",
  spades: "Burpees",
};

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  "7": 7, "8": 8, "9": 9, "10": 10,
  J: 11, Q: 12, K: 13, A: 14,
  JOKER: 0,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: "#e63946",
  diamonds: "#e63946",
  clubs: "#f1f1f1",
  spades: "#f1f1f1",
};

export const CARD_COUNT_OPTIONS: CardCount[] = [10, 20, 26, 52];

export const DEFAULT_CONFIG: WorkoutConfig = {
  suitExercises: { ...DEFAULT_EXERCISES },
  cardCount: 52,
  jokerRule: { type: "skip" },
  includeJokers: false,
};
