export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K" | "A" | "JOKER";

export type JokerRule =
  | { type: "skip" }
  | { type: "fixed"; reps: number }
  | { type: "failure" };

export type CardCount = 10 | 20 | 26 | 52;

export type WorkoutConfig = {
  suitExercises: Record<Suit, string>;
  cardCount: CardCount;
  jokerRule: JokerRule;
  includeJokers: boolean;
};

export type Card = {
  suit: Suit | "joker";
  rank: Rank;
  reps: number;
};

export type CardResult = Card & { completed: boolean };

export type SessionResult = {
  cards: CardResult[];
  elapsedSeconds: number;
  config: WorkoutConfig;
};
