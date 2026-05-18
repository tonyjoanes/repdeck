import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import type { CardCount, JokerRule, Suit, WorkoutConfig } from "@/types/workout";
import { CARD_COUNT_OPTIONS, DEFAULT_CONFIG, SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const JOKER_RULE_OPTIONS: { label: string; rule: JokerRule }[] = [
  { label: "Skip", rule: { type: "skip" } },
  { label: "Fixed reps", rule: { type: "fixed", reps: 20 } },
  { label: "To failure", rule: { type: "failure" } },
];

export default function SetupScreen() {
  console.log("SetupScreen rendering");
  const [exercises, setExercises] = useState<Record<Suit, string>>(
    DEFAULT_CONFIG.suitExercises
  );
  const [cardCount, setCardCount] = useState<CardCount>(DEFAULT_CONFIG.cardCount);
  const [includeJokers, setIncludeJokers] = useState(false);
  const [jokerRuleIndex, setJokerRuleIndex] = useState(0);
  const [fixedReps, setFixedReps] = useState("20");

  const jokerRule = (): JokerRule => {
    const selected = JOKER_RULE_OPTIONS[jokerRuleIndex];
    if (selected.rule.type === "fixed") {
      return { type: "fixed", reps: Math.max(1, parseInt(fixedReps, 10) || 20) };
    }
    return selected.rule;
  };

  const canStart = SUITS.every((s) => exercises[s].trim().length > 0);

  function startWorkout() {
    const config: WorkoutConfig = {
      suitExercises: {
        hearts: exercises.hearts.trim(),
        diamonds: exercises.diamonds.trim(),
        clubs: exercises.clubs.trim(),
        spades: exercises.spades.trim(),
      },
      cardCount,
      includeJokers,
      jokerRule: jokerRule(),
    };
    router.push({ pathname: "/session", params: { config: JSON.stringify(config) } });
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>RepDeck</Text>
        <Text style={styles.tagline}>Shuffle. Flip. Suffer. Track.</Text>

        {/* Suit exercises */}
        <Text style={styles.sectionLabel}>EXERCISES</Text>
        {SUITS.map((suit) => (
          <View key={suit} style={styles.suitRow}>
            <Text style={[styles.suitSymbol, { color: SUIT_COLORS[suit] }]}>
              {SUIT_SYMBOLS[suit]}
            </Text>
            <TextInput
              style={styles.input}
              value={exercises[suit]}
              onChangeText={(v) => setExercises((prev) => ({ ...prev, [suit]: v }))}
              placeholder="Exercise name"
              placeholderTextColor="#555"
              returnKeyType="done"
            />
          </View>
        ))}

        {/* Card count */}
        <Text style={styles.sectionLabel}>DECK SIZE</Text>
        <View style={styles.segmentRow}>
          {CARD_COUNT_OPTIONS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[styles.segmentBtn, cardCount === count && styles.segmentBtnActive]}
              onPress={() => setCardCount(count)}
            >
              <Text style={[styles.segmentText, cardCount === count && styles.segmentTextActive]}>
                {count === 26 ? "Half" : count === 52 ? "Full" : count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Jokers */}
        <View style={styles.jokerRow}>
          <Text style={styles.sectionLabel}>INCLUDE JOKERS</Text>
          <Switch
            value={includeJokers}
            onValueChange={setIncludeJokers}
            thumbColor={includeJokers ? "#e63946" : "#555"}
            trackColor={{ false: "#333", true: "#7a1520" }}
          />
        </View>

        {includeJokers && (
          <>
            <Text style={styles.sectionLabel}>JOKER RULE</Text>
            <View style={styles.segmentRow}>
              {JOKER_RULE_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.segmentBtn, jokerRuleIndex === i && styles.segmentBtnActive]}
                  onPress={() => setJokerRuleIndex(i)}
                >
                  <Text style={[styles.segmentText, jokerRuleIndex === i && styles.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {JOKER_RULE_OPTIONS[jokerRuleIndex].rule.type === "fixed" && (
              <View style={styles.suitRow}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={[styles.input, styles.inputNarrow]}
                  value={fixedReps}
                  onChangeText={setFixedReps}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={3}
                />
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={startWorkout}
          disabled={!canStart}
        >
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  tagline: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 32, letterSpacing: 2 },
  sectionLabel: { fontSize: 11, color: "#666", letterSpacing: 2, marginBottom: 10, marginTop: 24 },
  suitRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  suitSymbol: { fontSize: 28, width: 40 },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  inputNarrow: { flex: 0, width: 80 },
  label: { color: "#aaa", fontSize: 15, width: 40 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentBtnActive: { backgroundColor: "#e63946", borderColor: "#e63946" },
  segmentText: { color: "#777", fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  jokerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  startBtn: {
    marginTop: 40,
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  startBtnDisabled: { backgroundColor: "#3a1a1d", opacity: 0.6 },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
});
