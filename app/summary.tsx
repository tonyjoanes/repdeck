import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";
import type { CardResult, SessionResult, Suit } from "@/types/workout";
import { SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";
import { getLastResult } from "@/store/sessionStore";
import { saveSession } from "@/db/sessions";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function computeStats(result: SessionResult) {
  const completed = result.cards.filter((c) => c.completed && c.reps > 0);
  const totalReps = completed.reduce((sum, c) => sum + c.reps, 0);

  const perSuit: Record<Suit, { exercise: string; reps: number }> = {
    hearts: { exercise: result.config.suitExercises.hearts, reps: 0 },
    diamonds: { exercise: result.config.suitExercises.diamonds, reps: 0 },
    clubs: { exercise: result.config.suitExercises.clubs, reps: 0 },
    spades: { exercise: result.config.suitExercises.spades, reps: 0 },
  };

  for (const card of completed) {
    if (card.suit !== "joker") {
      perSuit[card.suit].reps += card.reps;
    }
  }

  const hardest = completed.reduce<CardResult | null>((best, c) => {
    if (!best || c.reps > best.reps) return c;
    return best;
  }, null);

  return { totalReps, perSuit, hardest };
}

export default function SummaryScreen() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const r = getLastResult();
    if (!r) {
      router.replace("/");
      return;
    }
    setResult(r);
    if (!savedRef.current) {
      savedRef.current = true;
      saveSession(r);
    }
  }, []);

  if (!result) return null;

  const { totalReps, perSuit, hardest } = computeStats(result);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Workout{"\n"}Complete</Text>

        {/* Hero stats */}
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{totalReps}</Text>
            <Text style={styles.heroLabel}>TOTAL REPS</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{formatTime(result.elapsedSeconds)}</Text>
            <Text style={styles.heroLabel}>TIME</Text>
          </View>
        </View>

        {/* Per-exercise breakdown */}
        <Text style={styles.sectionLabel}>EXERCISE BREAKDOWN</Text>
        <View style={styles.breakdownCard}>
          {SUITS.map((suit) => (
            <View key={suit} style={styles.breakdownRow}>
              <Text style={[styles.breakdownSymbol, { color: SUIT_COLORS[suit] }]}>
                {SUIT_SYMBOLS[suit]}
              </Text>
              <Text style={styles.breakdownExercise}>{perSuit[suit].exercise}</Text>
              <Text style={styles.breakdownReps}>{perSuit[suit].reps}</Text>
            </View>
          ))}
        </View>

        {/* Hardest card */}
        {hardest && hardest.suit !== "joker" && (
          <>
            <Text style={styles.sectionLabel}>HARDEST CARD</Text>
            <View style={styles.hardestCard}>
              <Text style={[styles.hardestSymbol, { color: SUIT_COLORS[hardest.suit] }]}>
                {SUIT_SYMBOLS[hardest.suit]}
              </Text>
              <View style={styles.hardestInfo}>
                <Text style={styles.hardestRank}>{hardest.rank}</Text>
                <Text style={styles.hardestExercise}>
                  {result.config.suitExercises[hardest.suit]}
                </Text>
              </View>
              <Text style={styles.hardestReps}>{hardest.reps} reps</Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.replace("/")}
          activeOpacity={0.8}
        >
          <Text style={styles.newBtnText}>New Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 46,
    marginBottom: 32,
  },
  heroRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroNumber: { fontSize: 40, fontWeight: "900", color: "#fff", fontVariant: ["tabular-nums"] },
  heroLabel: { fontSize: 10, color: "#555", letterSpacing: 2, marginTop: 4 },
  heroDivider: { width: 1, backgroundColor: "#2a2a2a", marginHorizontal: 16 },
  sectionLabel: { fontSize: 11, color: "#666", letterSpacing: 2, marginTop: 28, marginBottom: 10 },
  breakdownCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  breakdownSymbol: { fontSize: 22, width: 32 },
  breakdownExercise: { flex: 1, color: "#ccc", fontSize: 16 },
  breakdownReps: { color: "#fff", fontSize: 18, fontWeight: "800" },
  hardestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e63946",
  },
  hardestSymbol: { fontSize: 32, marginRight: 16 },
  hardestInfo: { flex: 1 },
  hardestRank: { color: "#fff", fontSize: 24, fontWeight: "900" },
  hardestExercise: { color: "#888", fontSize: 13, marginTop: 2 },
  hardestReps: { color: "#e63946", fontSize: 18, fontWeight: "800" },
  newBtn: {
    marginTop: 40,
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  newBtnText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
});
