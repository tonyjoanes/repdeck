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
  { label: "Fixed", rule: { type: "fixed", reps: 20 } },
  { label: "Failure", rule: { type: "failure" } },
];

export default function SetupScreen() {
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
        <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>WORKOUT DECK</Text>
            <Text style={styles.title}>RepDeck</Text>
            <Text style={styles.tagline}>Build the deck. Flip the next set.</Text>
          </View>

          <View style={styles.deckPreview}>
            <View style={[styles.previewCard, styles.previewCardBack]} />
            <View style={[styles.previewCard, styles.previewCardMiddle]} />
            <View style={styles.previewCard}>
              <Text style={styles.previewRank}>A</Text>
              <Text style={[styles.previewSuit, { color: SUIT_COLORS.hearts }]}>
                {SUIT_SYMBOLS.hearts}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickNumber}>{cardCount}</Text>
            <Text style={styles.quickLabel}>cards</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickNumber}>{includeJokers ? "+2" : "0"}</Text>
            <Text style={styles.quickLabel}>jokers</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickNumber}>4</Text>
            <Text style={styles.quickLabel}>moves</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionLabel}>Exercises</Text>
            <Text style={styles.sectionHint}>one move per suit</Text>
          </View>

          {SUITS.map((suit) => (
            <View key={suit} style={styles.suitRow}>
              <View style={[styles.suitBadge, { borderColor: SUIT_COLORS[suit] }]}>
                <Text style={[styles.suitSymbol, { color: SUIT_COLORS[suit] }]}>
                  {SUIT_SYMBOLS[suit]}
                </Text>
              </View>
              <TextInput
                style={styles.input}
                value={exercises[suit]}
                onChangeText={(v) => setExercises((prev) => ({ ...prev, [suit]: v }))}
                placeholder="Exercise name"
                placeholderTextColor="#666"
                returnKeyType="done"
              />
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionLabel}>Deck size</Text>
            <Text style={styles.sectionHint}>choose the burn</Text>
          </View>
          <View style={styles.segmentRow}>
            {CARD_COUNT_OPTIONS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.segmentBtn, cardCount === count && styles.segmentBtnActive]}
                onPress={() => setCardCount(count)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, cardCount === count && styles.segmentTextActive]}>
                  {count === 26 ? "Half" : count === 52 ? "Full" : count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.jokerRow}>
            <View>
              <Text style={styles.sectionLabel}>Jokers</Text>
              <Text style={styles.sectionHint}>wild cards for extra spice</Text>
            </View>
            <Switch
              value={includeJokers}
              onValueChange={setIncludeJokers}
              thumbColor={includeJokers ? "#f8f7f3" : "#5b5b62"}
              trackColor={{ false: "#26262b", true: "#ff4d6d" }}
            />
          </View>

          {includeJokers && (
            <>
              <View style={[styles.segmentRow, styles.jokerRules]}>
                {JOKER_RULE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.segmentBtn, jokerRuleIndex === i && styles.segmentBtnActive]}
                    onPress={() => setJokerRuleIndex(i)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, jokerRuleIndex === i && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {JOKER_RULE_OPTIONS[jokerRuleIndex].rule.type === "fixed" && (
                <View style={styles.fixedRepsRow}>
                  <Text style={styles.fixedRepsLabel}>Reps</Text>
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
        </View>

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={startWorkout}
          disabled={!canStart}
          activeOpacity={0.86}
        >
          <Text style={styles.startBtnText}>Start Workout</Text>
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
    minHeight: 176,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginBottom: 20,
  },
  heroCopy: { flex: 1, paddingRight: 12 },
  kicker: {
    color: "#ffb703",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: { fontSize: 44, fontWeight: "900", color: "#f8f7f3", letterSpacing: 0 },
  tagline: { maxWidth: 210, fontSize: 15, color: "#a3a1a8", marginTop: 8, lineHeight: 21 },
  deckPreview: { width: 104, height: 144, marginRight: 4, flexShrink: 0 },
  previewCard: {
    position: "absolute",
    right: 0,
    top: 12,
    width: 84,
    height: 116,
    borderRadius: 14,
    backgroundColor: "#f8f7f3",
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  previewCardMiddle: {
    right: 16,
    top: 18,
    backgroundColor: "#24242a",
    borderWidth: 1,
    borderColor: "#383840",
    transform: [{ rotate: "-8deg" }],
  },
  previewCardBack: {
    right: 32,
    top: 26,
    backgroundColor: "#1a1a1f",
    borderWidth: 1,
    borderColor: "#2d2d34",
    transform: [{ rotate: "-16deg" }],
  },
  previewRank: { color: "#16161a", fontSize: 26, fontWeight: "900" },
  previewSuit: { alignSelf: "flex-end", fontSize: 36, lineHeight: 42 },
  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  quickStat: {
    flex: 1,
    backgroundColor: "#19191e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2d2d34",
    paddingVertical: 14,
    alignItems: "center",
  },
  quickNumber: { color: "#f8f7f3", fontSize: 22, fontWeight: "900" },
  quickLabel: { color: "#77747d", fontSize: 11, fontWeight: "700", marginTop: 3, textTransform: "uppercase" },
  panel: {
    backgroundColor: "#19191e",
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#2d2d34",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#f8f7f3",
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionHint: { color: "#77747d", fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  suitRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  suitBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#111115",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  suitSymbol: { fontSize: 24, lineHeight: 30 },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: "#111115",
    color: "#f8f7f3",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#303039",
  },
  inputNarrow: { flex: 0, width: 90, textAlign: "center", fontWeight: "900" },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#111115",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#303039",
  },
  segmentBtnActive: { backgroundColor: "#ff4d6d", borderColor: "#ff4d6d" },
  segmentText: { color: "#89868f", fontSize: 14, fontWeight: "800" },
  segmentTextActive: { color: "#fff" },
  jokerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  jokerRules: { marginTop: 16 },
  fixedRepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 12 },
  fixedRepsLabel: { color: "#a3a1a8", fontSize: 14, fontWeight: "800", marginRight: 10 },
  startBtn: {
    marginTop: 18,
    backgroundColor: "#ff4d6d",
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: "center",
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  startBtnDisabled: { backgroundColor: "#3a252b", opacity: 0.7, shadowOpacity: 0 },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
});
