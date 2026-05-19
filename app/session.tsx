import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import type { WorkoutConfig } from "@/types/workout";
import { SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";
import { getExerciseForCard } from "@/utils/deck";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { setLastResult } from "@/store/sessionStore";

function parseConfig(raw: string): WorkoutConfig {
  const parsed = JSON.parse(raw) as WorkoutConfig;
  return parsed;
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
      setLastResult({
        cards: session.cards,
        elapsedSeconds: session.elapsedSeconds,
        config,
      });
      router.replace("/summary");
    }
  }, [session.isComplete]);

  const card = session.currentCard;
  const suitColor = card && card.suit !== "joker" ? SUIT_COLORS[card.suit] : "#f8f7f3";
  const suitSymbol = card && card.suit !== "joker" ? SUIT_SYMBOLS[card.suit] : "★";
  const exercise = card ? getExerciseForCard(card, config) : "";
  const cardsLeft = Math.max(session.cards.length - session.currentIndex, 0);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.sessionFrame}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>IN PROGRESS</Text>
          <Text style={styles.timer}>{formatTime(session.elapsedSeconds)}</Text>
        </View>
        <View style={styles.remainingBadge}>
          <Text style={styles.remainingNumber}>{cardsLeft}</Text>
          <Text style={styles.remainingLabel}>left</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${session.progress * 100}%` }]} />
      </View>

      <Text style={styles.counter}>
        Card {Math.min(session.currentIndex + 1, session.cards.length)} of {session.cards.length}
      </Text>

      <View style={styles.cardArea}>
        {card && (
          <Animated.View key={session.currentIndex} entering={ZoomIn.duration(180)} style={styles.cardShadow}>
            <Animated.View entering={FadeIn.duration(180)} style={styles.card}>
              <View style={styles.cardCorner}>
                <Text style={[styles.cornerRank, { color: suitColor }]}>{card.rank}</Text>
                <Text style={[styles.cornerSuit, { color: suitColor }]}>{suitSymbol}</Text>
              </View>

              <Text style={[styles.suitSymbol, { color: suitColor }]}>{suitSymbol}</Text>
              <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
              <Text style={styles.exercise}>{exercise}</Text>

              <View style={styles.repPanel}>
                {card.reps === -1 ? (
                  <Text style={styles.repFailure}>TO FAILURE</Text>
                ) : card.reps === 0 ? (
                  <Text style={styles.repSkip}>SKIP</Text>
                ) : (
                  <>
                    <Text style={styles.reps}>{card.reps}</Text>
                    <Text style={styles.repLabel}>reps</Text>
                  </>
                )}
              </View>

              <View style={[styles.cardCorner, styles.cardCornerBottom]}>
                <Text style={[styles.cornerRank, { color: suitColor }]}>{card.rank}</Text>
                <Text style={[styles.cornerSuit, { color: suitColor }]}>{suitSymbol}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={session.advance} activeOpacity={0.86}>
        <Text style={styles.doneBtnText}>Done ✓</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#101012", alignItems: "center" },
  sessionFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    paddingHorizontal: 20,
    alignSelf: "center",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#ffb703",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  timer: {
    color: "#f8f7f3",
    fontSize: 34,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  remainingBadge: {
    minWidth: 70,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#19191e",
    borderWidth: 1,
    borderColor: "#2d2d34",
    alignItems: "center",
    justifyContent: "center",
  },
  remainingNumber: { color: "#f8f7f3", fontSize: 22, fontWeight: "900" },
  remainingLabel: { color: "#77747d", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  progressTrack: {
    width: "100%",
    height: 9,
    borderRadius: 999,
    backgroundColor: "#24242a",
    overflow: "hidden",
  },
  progressFill: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#ff4d6d",
  },
  counter: {
    color: "#77747d",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 14,
  },
  cardArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  cardShadow: {
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  card: {
    minHeight: 400,
    backgroundColor: "#f8f7f3",
    borderRadius: 26,
    width: "100%",
    paddingVertical: 40,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  cardCorner: {
    position: "absolute",
    left: 20,
    top: 18,
    alignItems: "center",
  },
  cardCornerBottom: {
    left: undefined,
    top: undefined,
    right: 20,
    bottom: 18,
    transform: [{ rotate: "180deg" }],
  },
  cornerRank: { fontSize: 20, fontWeight: "900", lineHeight: 23 },
  cornerSuit: { fontSize: 22, lineHeight: 24 },
  suitSymbol: {
    fontSize: 58,
    lineHeight: 66,
  },
  rank: {
    fontSize: 88,
    fontWeight: "900",
    lineHeight: 96,
  },
  exercise: {
    color: "#19191e",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  repPanel: {
    minWidth: 146,
    minHeight: 104,
    borderRadius: 22,
    backgroundColor: "#151519",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
  reps: {
    color: "#f8f7f3",
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 68,
  },
  repLabel: {
    color: "#8d8994",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  repFailure: {
    color: "#ff4d6d",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  repSkip: {
    color: "#8d8994",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#ff4d6d",
    borderRadius: 20,
    paddingVertical: 19,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
