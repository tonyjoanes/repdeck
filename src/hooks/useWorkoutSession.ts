import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardResult, WorkoutConfig } from "@/types/workout";
import { buildDeck } from "@/utils/deck";

type SessionState = {
  cards: CardResult[];
  currentIndex: number;
  elapsedSeconds: number;
  isComplete: boolean;
};

type UseWorkoutSessionReturn = {
  currentCard: Card | null;
  cards: CardResult[];
  currentIndex: number;
  progress: number;
  elapsedSeconds: number;
  isComplete: boolean;
  advance: () => void;
};

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

      const updatedCards = prev.cards.map((c, i) =>
        i === prev.currentIndex ? { ...c, completed: true } : c
      );
      const nextIndex = prev.currentIndex + 1;
      const isComplete = nextIndex >= prev.cards.length;

      return { ...prev, cards: updatedCards, currentIndex: nextIndex, isComplete };
    });
  }, []);

  const currentCard = state.isComplete ? null : state.cards[state.currentIndex] ?? null;
  const total = state.cards.length;
  const progress = total > 0 ? state.currentIndex / total : 0;

  return {
    currentCard,
    cards: state.cards,
    currentIndex: state.currentIndex,
    progress,
    elapsedSeconds: state.elapsedSeconds,
    isComplete: state.isComplete,
    advance,
  };
}
