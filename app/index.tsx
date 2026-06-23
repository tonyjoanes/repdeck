import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { CardCount, JokerRule, Suit, WorkoutConfig } from "@/types/workout";
import { CARD_COUNT_OPTIONS, DEFAULT_CONFIG, SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";
import { getTemplates, saveTemplate, deleteTemplate, type StoredTemplate } from "@/db/templates";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const JOKER_RULE_OPTIONS: { label: string; rule: JokerRule }[] = [
  { label: "Skip", rule: { type: "skip" } },
  { label: "Fixed reps", rule: { type: "fixed", reps: 20 } },
  { label: "To failure", rule: { type: "failure" } },
];

export default function SetupScreen() {
  const { config: configParam } = useLocalSearchParams<{ config?: string }>();

  const [exercises, setExercises] = useState<Record<Suit, string>>(DEFAULT_CONFIG.suitExercises);
  const [suitCardCount, setSuitCardCount] = useState<Record<Suit, number>>(DEFAULT_CONFIG.suitCardCount);
  const [cardCount, setCardCount] = useState<CardCount>(DEFAULT_CONFIG.cardCount);
  const [includeJokers, setIncludeJokers] = useState(false);
  const [jokerRuleIndex, setJokerRuleIndex] = useState(0);
  const [fixedReps, setFixedReps] = useState("20");

  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const templateNameRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      setTemplates(getTemplates());
    }, [])
  );

  // Pre-fill when navigated back from History "Use Config"
  useEffect(() => {
    if (!configParam) return;
    try {
      applyConfig(JSON.parse(configParam) as WorkoutConfig);
    } catch {
      // ignore malformed param
    }
  }, [configParam]);

  function applyConfig(c: WorkoutConfig) {
    setExercises(c.suitExercises);
    setSuitCardCount(c.suitCardCount ?? DEFAULT_CONFIG.suitCardCount);
    setCardCount(c.cardCount);
    setIncludeJokers(c.includeJokers);
    if (c.jokerRule.type === "fixed") {
      setJokerRuleIndex(1);
      setFixedReps(String(c.jokerRule.reps));
    } else if (c.jokerRule.type === "failure") {
      setJokerRuleIndex(2);
    } else {
      setJokerRuleIndex(0);
    }
  }

  function currentConfig(): WorkoutConfig {
    const selected = JOKER_RULE_OPTIONS[jokerRuleIndex];
    const jokerRule: JokerRule =
      selected.rule.type === "fixed"
        ? { type: "fixed", reps: Math.max(1, parseInt(fixedReps, 10) || 20) }
        : selected.rule;
    return {
      suitExercises: {
        hearts: exercises.hearts.trim(),
        diamonds: exercises.diamonds.trim(),
        clubs: exercises.clubs.trim(),
        spades: exercises.spades.trim(),
      },
      suitCardCount,
      cardCount,
      includeJokers,
      jokerRule,
    };
  }

  const canStart = SUITS.every((s) => exercises[s].trim().length > 0);

  function startWorkout() {
    router.push({ pathname: "/session", params: { config: JSON.stringify(currentConfig()) } });
  }

  function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) return;
    saveTemplate(name, currentConfig());
    setTemplates(getTemplates());
    setSaveModalVisible(false);
    setTemplateName("");
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id);
    setTemplates(getTemplates());
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>RepDeck</Text>
          <TouchableOpacity onPress={() => router.push("/history")} style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.tagline}>Shuffle. Flip. Suffer. Track.</Text>

        {/* Saved templates */}
        {templates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SAVED TEMPLATES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateRow}
            >
              {templates.map((t) => (
                <View key={t.id} style={styles.templateChip}>
                  <TouchableOpacity onPress={() => applyConfig(t.config)} style={styles.templateChipLabel}>
                    <Text style={styles.templateName}>{t.name}</Text>
                    <Text style={styles.templateMeta}>
                      {t.config.cardCount === 26 ? "Half" : t.config.cardCount === 52 ? "Full" : t.config.cardCount} cards
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(t.id)}
                    style={styles.templateDelete}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.templateDeleteText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Exercises */}
        <Text style={styles.sectionLabel}>EXERCISES</Text>
        {SUITS.map((suit) => {
          const n = suitCardCount[suit] ?? 1;
          const isMulti = n > 1;
          return (
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
              <TouchableOpacity
                style={[styles.multiBtn, isMulti && styles.multiBtnActive]}
                onPress={() => setSuitCardCount((prev) => ({ ...prev, [suit]: (n % 3) + 1 }))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.multiBtnText, isMulti && styles.multiBtnTextActive]}>
                  ×{n}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Deck size */}
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

        {/* Actions */}
        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={startWorkout}
          disabled={!canStart}
        >
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveTemplateBtn}
          onPress={() => {
            setTemplateName("");
            setSaveModalVisible(true);
          }}
        >
          <Text style={styles.saveTemplateBtnText}>+ Save as Template</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save template modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
        onShow={() => setTimeout(() => templateNameRef.current?.focus(), 50)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Save Template</Text>
            <TextInput
              ref={templateNameRef}
              style={styles.modalInput}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g. Monday KB, Quick 10, Full Deck"
              placeholderTextColor="#555"
              returnKeyType="done"
              onSubmitEditing={handleSaveTemplate}
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !templateName.trim() && styles.modalSaveDisabled]}
                onPress={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { padding: 24, paddingBottom: 48 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  historyBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  historyBtnText: { color: "#e63946", fontSize: 15, fontWeight: "700" },
  tagline: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 32, letterSpacing: 2 },
  sectionLabel: { fontSize: 11, color: "#666", letterSpacing: 2, marginBottom: 10, marginTop: 24 },

  // Templates
  templateRow: { gap: 10, paddingBottom: 4 },
  templateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  templateChipLabel: { paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  templateName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  templateMeta: { color: "#555", fontSize: 11 },
  templateDelete: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#2a2a2a",
  },
  templateDeleteText: { color: "#555", fontSize: 18, lineHeight: 20 },

  // Exercises
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
  multiBtn: {
    marginLeft: 8,
    width: 40,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  multiBtnActive: { borderColor: "#e63946", backgroundColor: "#2a0a0d" },
  multiBtnText: { color: "#555", fontSize: 13, fontWeight: "700" },
  multiBtnTextActive: { color: "#e63946" },
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

  // Actions
  startBtn: {
    marginTop: 40,
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  startBtnDisabled: { backgroundColor: "#3a1a1d", opacity: 0.6 },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  saveTemplateBtn: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  saveTemplateBtnText: { color: "#555", fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 16,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  modalInput: {
    backgroundColor: "#0f0f0f",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  modalCancelText: { color: "#aaa", fontSize: 15, fontWeight: "600" },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#e63946",
    alignItems: "center",
  },
  modalSaveDisabled: { opacity: 0.4 },
  modalSaveText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
