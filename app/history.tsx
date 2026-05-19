import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { Suit } from "@/types/workout";
import { SUIT_COLORS, SUIT_SYMBOLS } from "@/constants/defaults";
import { getRecentSessions, type StoredSession } from "@/db/sessions";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today · ${timeStr}`;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr} · ${timeStr}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function SessionRow({ session }: { session: StoredSession }) {
  function useThisConfig() {
    router.replace({
      pathname: "/",
      params: { config: JSON.stringify(session.config) },
    });
  }

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowDate}>{formatDate(session.started_at)}</Text>
        <Text style={styles.rowCards}>{session.card_count} cards</Text>
      </View>

      <View style={styles.exerciseRow}>
        {SUITS.map((suit) => (
          <Text key={suit} style={styles.exerciseChip}>
            <Text style={{ color: SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</Text>
            {" "}{session.config.suitExercises[suit]}
          </Text>
        ))}
      </View>

      <View style={styles.rowFooter}>
        <View style={styles.statGroup}>
          <Text style={styles.statNumber}>{session.total_reps}</Text>
          <Text style={styles.statLabel}>reps</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statNumber}>{formatTime(session.elapsed_seconds)}</Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <TouchableOpacity style={styles.useBtn} onPress={useThisConfig}>
          <Text style={styles.useBtnText}>Use Config</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      setSessions(getRecentSessions());
    }, [])
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No workouts yet.</Text>
          <Text style={styles.emptySubtext}>Complete a session to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionRow session={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  backBtn: { paddingRight: 16, paddingVertical: 4 },
  backText: { color: "#e63946", fontSize: 18 },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowDate: { color: "#aaa", fontSize: 13 },
  rowCards: { color: "#555", fontSize: 12 },
  exerciseRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exerciseChip: { color: "#777", fontSize: 12 },
  rowFooter: { flexDirection: "row", alignItems: "center", gap: 20 },
  statGroup: { alignItems: "center" },
  statNumber: { color: "#fff", fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  statLabel: { color: "#555", fontSize: 10, letterSpacing: 1 },
  useBtn: {
    marginLeft: "auto",
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  useBtnText: { color: "#e63946", fontSize: 13, fontWeight: "700" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyText: { color: "#555", fontSize: 18, fontWeight: "700" },
  emptySubtext: { color: "#333", fontSize: 14 },
});
