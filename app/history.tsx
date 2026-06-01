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
import {
  getRecentSessions,
  getExerciseStats,
  type StoredSession,
  type ExerciseStat,
} from "@/db/sessions";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

type Period = "week" | "month" | "all";
const PERIODS: { label: string; value: Period }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

function periodStart(p: Period): Date {
  const now = new Date();
  if (p === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (p === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return new Date(0);
}

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
        <TouchableOpacity
          style={styles.useBtn}
          onPress={() =>
            router.replace({
              pathname: "/",
              params: { config: JSON.stringify(session.config) },
            })
          }
        >
          <Text style={styles.useBtnText}>Use Config</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatsView() {
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<ExerciseStat[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStats(getExerciseStats(periodStart(period)));
    }, [period])
  );

  // Reload when period changes
  const handlePeriod = (p: Period) => {
    setPeriod(p);
    setStats(getExerciseStats(periodStart(p)));
  };

  const maxReps = stats[0]?.total_reps ?? 1;

  return (
    <View style={styles.statsContainer}>
      {/* Period picker */}
      <View style={styles.segmentRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.segmentBtn, period === p.value && styles.segmentBtnActive]}
            onPress={() => handlePeriod(p.value)}
          >
            <Text style={[styles.segmentText, period === p.value && styles.segmentTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No data for this period.</Text>
        </View>
      ) : (
        <FlatList
          data={stats}
          keyExtractor={(item) => item.exercise}
          contentContainerStyle={styles.statsList}
          renderItem={({ item }) => (
            <View style={styles.statRow}>
              <View style={styles.statRowTop}>
                <Text style={styles.statExercise}>{item.exercise}</Text>
                <Text style={styles.statReps}>{item.total_reps.toLocaleString()} reps</Text>
              </View>
              {/* Volume bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(item.total_reps / maxReps) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.statSessions}>
                {item.session_count} {item.session_count === 1 ? "session" : "sessions"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [view, setView] = useState<"sessions" | "stats">("sessions");

  useFocusEffect(
    useCallback(() => {
      setSessions(getRecentSessions());
    }, [])
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      {/* View toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "sessions" && styles.toggleBtnActive]}
          onPress={() => setView("sessions")}
        >
          <Text style={[styles.toggleText, view === "sessions" && styles.toggleTextActive]}>
            Sessions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "stats" && styles.toggleBtnActive]}
          onPress={() => setView("stats")}
        >
          <Text style={[styles.toggleText, view === "stats" && styles.toggleTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {view === "sessions" ? (
        sessions.length === 0 ? (
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
        )
      ) : (
        <StatsView />
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
  viewToggle: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  toggleBtnActive: { backgroundColor: "#e63946" },
  toggleText: { color: "#666", fontSize: 14, fontWeight: "700" },
  toggleTextActive: { color: "#fff" },
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
  statsContainer: { flex: 1 },
  segmentRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentBtnActive: { backgroundColor: "#2a2a2a", borderColor: "#444" },
  segmentText: { color: "#555", fontSize: 13, fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  statsList: { padding: 16, gap: 14 },
  statRow: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 8,
  },
  statRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  statExercise: { color: "#fff", fontSize: 17, fontWeight: "700" },
  statReps: { color: "#e63946", fontSize: 20, fontWeight: "900" },
  barTrack: { height: 4, backgroundColor: "#2a2a2a", borderRadius: 2, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: "#e63946", borderRadius: 2 },
  statSessions: { color: "#555", fontSize: 12 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyText: { color: "#555", fontSize: 18, fontWeight: "700" },
  emptySubtext: { color: "#333", fontSize: 14 },
});
