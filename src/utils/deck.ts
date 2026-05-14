import type { Card, JokerRule, Rank, Suit, WorkoutConfig } from "@/types/workout";
import { RANK_VALUES } from "@/constants/defaults";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function jokerReps(rule: JokerRule): number {
  if (rule.type === "fixed") return rule.reps;
  if (rule.type === "failure") return -1; // sentinel: "to failure"
  return 0; // skip
}

export function buildDeck(config: WorkoutConfig): Card[] {
  const cards: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank, reps: RANK_VALUES[rank] });
    }
  }

  if (config.includeJokers) {
    const reps = jokerReps(config.jokerRule);
    cards.push({ suit: "joker", rank: "JOKER", reps });
    cards.push({ suit: "joker", rank: "JOKER", reps });
  }

  shuffle(cards);

  return cards.slice(0, config.cardCount);
}

export function getExerciseForCard(card: Card, config: WorkoutConfig): string {
  if (card.suit === "joker") return "Joker";
  return config.suitExercises[card.suit];
}
