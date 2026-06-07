import { Component, type ReactNode } from "react";
import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={{ flex: 1, backgroundColor: "#0f0f0f", padding: 24, justifyContent: "center" }}>
          <Text style={{ color: "#e63946", fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
            Startup Error
          </Text>
          <ScrollView>
            <Text style={{ color: "#fff", fontSize: 13, fontFamily: "monospace" }}>
              {err.message}{"\n\n"}{err.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0f0f0f" },
            animation: "fade",
          }}
        />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
