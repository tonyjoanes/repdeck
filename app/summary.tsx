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
        <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>SESSION SAVED</Text>
            <Text style={styles.title}>Workout{"\n"}Complete</Text>
          </View>
          <View style={styles.medal}>
            <Text style={styles.medalText}>✓</Text>
          </View>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{totalReps}</Text>
            <Text style={styles.heroLabel}>total reps</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroNumber}>{formatTime(result.elapsedSeconds)}</Text>
            <Text style={styles.heroLabel}>time</Text>
          </View>
        </View>

        {hardest && hardest.suit !== "joker" && (
          <View style={styles.callout}>
            <View style={[styles.calloutSuit, { borderColor: SUIT_COLORS[hardest.suit] }]}>
              <Text style={[styles.calloutSymbol, { color: SUIT_COLORS[hardest.suit] }]}>
                {SUIT_SYMBOLS[hardest.suit]}
              </Text>
            </View>
            <View style={styles.calloutInfo}>
              <Text style={styles.calloutLabel}>Hardest card</Text>
              <Text style={styles.calloutTitle}>
                {hardest.rank} · {result.config.suitExercises[hardest.suit]}
              </Text>
            </View>
            <Text style={styles.calloutReps}>{hardest.reps}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Exercise breakdown</Text>
        <View style={styles.breakdownCard}>
          {SUITS.map((suit, index) => (
            <View
              key={suit}
              style={[styles.breakdownRow, index === SUITS.length - 1 && styles.breakdownRowLast]}
            >
              <View style={[styles.breakdownBadge, { borderColor: SUIT_COLORS[suit] }]}>
                <Text style={[styles.breakdownSymbol, { color: SUIT_COLORS[suit] }]}>
                  {SUIT_SYMBOLS[suit]}
                </Text>
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownExercise}>{perSuit[suit].exercise}</Text>
                <Text style={styles.breakdownMeta}>{suit}</Text>
              </View>
              <Text style={styles.breakdownReps}>{perSuit[suit].reps}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.replace("/")}
          activeOpacity={0.86}
        >
          <Text style={styles.newBtnText}>New Workout</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#101012" },
  scroll: { padding: 20, paddingBottom: 42 },
  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 22,
  },
  heroCopy: { flex: 1, paddingRight: 14 },
  kicker: {
    color: "#ffb703",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#f8f7f3",
    lineHeight: 46,
  },
  medal: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    flexShrink: 0,
  },
  medalText: { color: "#fff", fontSize: 34, fontWeight: "900" },
  heroRow: {
    flexDirection: "row",
    backgroundColor: "#f8f7f3",
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroNumber: { fontSize: 38, fontWeight: "900", color: "#151519", fontVariant: ["tabular-nums"] },
  heroLabel: { fontSize: 12, color: "#6f6a70", fontWeight: "900", marginTop: 4, textTransform: "uppercase" },
  heroDivider: { width: 1, backgroundColor: "#dedbd2", marginHorizontal: 14 },
  callout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#19191e",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2d2d34",
    marginBottom: 8,
  },
  calloutSuit: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111115",
    marginRight: 12,
  },
  calloutSymbol: { fontSize: 28, lineHeight: 34 },
  calloutInfo: { flex: 1 },
  calloutLabel: { color: "#77747d", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  calloutTitle: { color: "#f8f7f3", fontSize: 16, fontWeight: "900", marginTop: 3, flexShrink: 1 },
  calloutReps: { color: "#ff4d6d", fontSize: 28, fontWeight: "900", marginLeft: 10 },
  sectionLabel: {
    fontSize: 13,
    color: "#f8f7f3",
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: "#19191e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2d2d34",
    overflow: "hidden",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#292930",
  },
  breakdownRowLast: { borderBottomWidth: 0 },
  breakdownBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111115",
    marginRight: 12,
  },
  breakdownSymbol: { fontSize: 23, lineHeight: 29 },
  breakdownInfo: { flex: 1, minWidth: 0 },
  breakdownExercise: { color: "#f8f7f3", fontSize: 16, fontWeight: "800" },
  breakdownMeta: { color: "#77747d", fontSize: 12, fontWeight: "800", marginTop: 2, textTransform: "capitalize" },
  breakdownReps: { color: "#f8f7f3", fontSize: 22, fontWeight: "900" },
  newBtn: {
    marginTop: 20,
    backgroundColor: "#ff4d6d",
    borderRadius: 20,
    paddingVertical: 19,
    alignItems: "center",
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  newBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
});
