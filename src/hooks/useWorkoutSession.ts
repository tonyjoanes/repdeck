import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardResult, Suit, WorkoutConfig } from "@/types/workout";
import { buildDeck } from "@/utils/deck";

type SessionState = {
  cards: CardResult[];
  currentIndex: number;
  elapsedSeconds: number;
  isComplete: boolean;
};

export type Hand = {
  primaryCard: CardResult;
  secondaryCards: CardResult[];
  totalReps: number;
};

type UseWorkoutSessionReturn = {
  currentHand: Hand | null;
  currentCard: Card | null; // kept for backwards compat — same as currentHand.primaryCard
  cards: CardResult[];
  currentIndex: number;
  progress: number;
  elapsedSeconds: number;
  isComplete: boolean;
  advance: () => void;
};

function handSize(card: CardResult, config: WorkoutConfig): number {
  if (card.suit === "joker") return 1;
  return Math.max(1, config.suitCardCount[card.suit as Suit] ?? 1);
}

function buildHand(cards: CardResult[], index: number, config: WorkoutConfig): Hand | null {
  if (index >= cards.length) return null;
  const primary = cards[index];
  const n = handSize(primary, config);
  const secondary: CardResult[] = [];
  for (let i = 1; i < n && index + i < cards.length; i++) {
    secondary.push(cards[index + i]);
  }
  const primaryReps = primary.reps === -1 ? 0 : primary.reps;
  const secondaryReps = secondary.reduce((sum, c) => sum + (c.reps === -1 ? 0 : c.reps), 0);
  return {
    primaryCard: primary,
    secondaryCards: secondary,
    totalReps: primary.reps === -1 ? -1 : primaryReps + secondaryReps,
  };
}

export function useWorkoutSession(config: WorkoutConfig): UseWorkoutSessionReturn {
  const [state, setState] = useState<SessionState>(() => {
    const deck = buildDeck(config);
    return {
      cards: deck.map((card) => ({ ...card, completed: false })),
      currentIndex: 0,
      elapsedSeconds: 0,
      isComplete: false,
    };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setState((prev) =>
        prev.isComplete ? prev : { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }
      );
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const advance = useCallback(() => {
    setState((prev) => {
      if (prev.isComplete) return prev;

      const primary = prev.cards[prev.currentIndex];
      const n = Math.min(handSize(primary, config), prev.cards.length - prev.currentIndex);

      const updatedCards = prev.cards.map((c, i) =>
        i >= prev.currentIndex && i < prev.currentIndex + n ? { ...c, completed: true } : c
      );
      const nextIndex = prev.currentIndex + n;
      const isComplete = nextIndex >= prev.cards.length;

      return { ...prev, cards: updatedCards, currentIndex: nextIndex, isComplete };
    });
  }, [config]);

  const currentHand = buildHand(state.cards, state.currentIndex, config);
  const total = state.cards.length;
  const progress = total > 0 ? state.currentIndex / total : 0;

  return {
    currentHand,
    currentCard: currentHand?.primaryCard ?? null,
    cards: state.cards,
    currentIndex: state.currentIndex,
    progress,
    elapsedSeconds: state.elapsedSeconds,
    isComplete: state.isComplete,
    advance,
  };
}
