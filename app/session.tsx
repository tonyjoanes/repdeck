import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { WorkoutConfig } from "@/types/workout";
import { SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";
import { getExerciseForCard } from "@/utils/deck";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { setLastResult } from "@/store/sessionStore";

function parseConfig(raw: string): WorkoutConfig {
  return JSON.parse(raw) as WorkoutConfig;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SessionScreen() {
  const { config: configParam } = useLocalSearchParams<{ config: string }>();
  const config = parseConfig(configParam ?? "{}");
  const session = useWorkoutSession(config);

  useEffect(() => {
    if (session.isComplete) {
      setLastResult({ cards: session.cards, elapsedSeconds: session.elapsedSeconds, config });
      router.replace("/summary");
    }
  }, [session.isComplete]);

  const hand = session.currentHand;
  const card = hand?.primaryCard ?? null;
  const suitColor = card && card.suit !== "joker" ? SUIT_COLORS[card.suit] : "#f1f1f1";
  const suitSymbol = card && card.suit !== "joker" ? SUIT_SYMBOLS[card.suit] : "🃏";
  const exercise = card ? getExerciseForCard(card, config) : "";
  const totalReps = hand?.totalReps ?? 0;
  const isMultiCard = (hand?.secondaryCards.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${session.progress * 100}%` }]} />
      </View>

      <Text style={styles.counter}>
        {session.currentIndex} / {session.cards.length}
      </Text>

      <View style={styles.cardArea}>
        {card && (
          <View key={session.currentIndex} style={styles.card}>
            <Text style={[styles.suitSymbol, { color: suitColor }]}>{suitSymbol}</Text>
            <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
            <Text style={styles.exercise}>{exercise}</Text>

            {totalReps === -1 ? (
              <Text style={styles.repFailure}>TO FAILURE</Text>
            ) : totalReps === 0 ? (
              <Text style={styles.repSkip}>SKIP</Text>
            ) : (
              <Text style={styles.reps}>{totalReps}</Text>
            )}
            {totalReps > 0 && <Text style={styles.repLabel}>reps</Text>}

            {/* Secondary cards breakdown */}
            {isMultiCard && totalReps > 0 && (
              <View style={styles.breakdown}>
                <Text style={[styles.breakdownChip, { color: suitColor }]}>
                  {suitSymbol}{card.rank} {card.reps}
                </Text>
                {hand!.secondaryCards.map((sc, i) => {
                  const scColor = sc.suit !== "joker" ? SUIT_COLORS[sc.suit] : "#aaa";
                  const scSymbol = sc.suit !== "joker" ? SUIT_SYMBOLS[sc.suit] : "🃏";
                  return (
                    <Text key={i} style={[styles.breakdownChip, { color: scColor }]}>
                      + {scSymbol}{sc.rank} {sc.reps === -1 ? "?" : sc.reps}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={styles.timer}>{formatTime(session.elapsedSeconds)}</Text>

      <TouchableOpacity style={styles.doneBtn} onPress={session.advance} activeOpacity={0.8}>
        <Text style={styles.doneBtnText}>DONE ✓</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f", alignItems: "center" },
  progressTrack: { width: "100%", height: 4, backgroundColor: "#1e1e1e" },
  progressFill: { height: 4, backgroundColor: "#e63946" },
  counter: { color: "#555", fontSize: 13, letterSpacing: 2, marginTop: 16 },
  cardArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    width: "100%",
    paddingVertical: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 4,
  },
  suitSymbol: { fontSize: 56, lineHeight: 64 },
  rank: { fontSize: 80, fontWeight: "900", lineHeight: 90 },
  exercise: { color: "#aaa", fontSize: 18, marginTop: 8, letterSpacing: 1 },
  reps: { color: "#fff", fontSize: 72, fontWeight: "900", marginTop: 8, lineHeight: 80 },
  repLabel: { color: "#555", fontSize: 14, letterSpacing: 2 },
  repFailure: { color: "#e63946", fontSize: 28, fontWeight: "900", marginTop: 8, letterSpacing: 3 },
  repSkip: { color: "#555", fontSize: 28, fontWeight: "700", marginTop: 8, letterSpacing: 3 },
  breakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  breakdownChip: { fontSize: 15, fontWeight: "700" },
  timer: { color: "#444", fontSize: 18, fontVariant: ["tabular-nums"], marginBottom: 16 },
  doneBtn: {
    width: "88%",
    backgroundColor: "#e63946",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 32,
  },
  doneBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 3 },
});
