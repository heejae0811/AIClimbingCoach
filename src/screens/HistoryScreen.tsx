import React from "react";
import { View, FlatList, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Header } from "../components/Header";
import { VideoBubble } from "../components/VideoBubble";
import { AnalysisRecord } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface HistoryScreenProps {
  history: AnalysisRecord[];
  selectedHistoryItem: AnalysisRecord | null;
  setSelectedHistoryItem: (item: AnalysisRecord | null) => void;
}

export const HistoryScreen = ({
  history,
  selectedHistoryItem,
  setSelectedHistoryItem,
}: HistoryScreenProps) => {
  const AnalysisDetailView = ({ item, onBack }: { item: AnalysisRecord; onBack: () => void }) => (
    <ScrollView style={styles.detailContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to History</Text>
      </TouchableOpacity>
      <View style={styles.resultCard}>
        <Text style={styles.resultDate}>{item.date} 분석 결과</Text>
        <Text style={styles.resultLevel}>{item.level}</Text>
        <Text style={styles.resultConfidence}>신뢰도: {Math.round(item.confidence * 100)}%</Text>

        {item.videoUri && <VideoBubble uri={item.videoUri} />}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>LIME 분석 (주요 요인)</Text>
        {item.lime.map((l, idx) => (
          <View key={idx} style={styles.limeRow}>
            <Text style={styles.limeText}>{l.feature_condition}</Text>
            <View
              style={[
                styles.limeBar,
                {
                  width: Math.abs(l.importance * 100) * 2,
                  backgroundColor: l.importance > 0 ? "#10B981" : "#EF4444",
                },
              ]}
            />
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>AI 코칭 피드백</Text>
        <Text style={styles.feedbackText}>{item.feedback}</Text>
      </View>
    </ScrollView>
  );

  if (selectedHistoryItem) {
    return (
      <AnalysisDetailView
        item={selectedHistoryItem}
        onBack={() => setSelectedHistoryItem(null)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Analysis History" />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>AI Progress Summary</Text>
            <Text style={styles.summaryText}>
              {history.length > 0
                ? `지금까지 ${history.length}개의 영상을 분석했습니다. 최근 실력은 ${history[0].level} 수준으로 평가됩니다.`
                : "아직 분석 데이터가 없습니다. 영상을 업로드해 보세요!"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.historyCard} onPress={() => setSelectedHistoryItem(item)}>
            <View>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyLevel}>{item.level}</Text>
              <Text style={styles.historyPreview} numberOfLines={1}>
                {item.feedback}
              </Text>
            </View>
            <Text style={styles.historyArrow}>→</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  detailContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: ACCENT_COLOR, fontWeight: "600" },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  resultDate: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 5 },
  resultLevel: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    marginVertical: 10,
  },
  resultConfidence: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 12 },
  feedbackText: { fontSize: 16, lineHeight: 24, color: "#334155" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  limeRow: { marginBottom: 10 },
  limeText: { fontSize: 14, color: "#475569", marginBottom: 4 },
  limeBar: { height: 8, borderRadius: 4 },
  summaryCard: { backgroundColor: "#EFF6FF", padding: 20, borderRadius: 20, marginBottom: 20 },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: ACCENT_COLOR, marginBottom: 8 },
  summaryText: { fontSize: 14, color: "#1E3A8A", lineHeight: 20 },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  historyDate: { fontSize: 12, color: "#94A3B8" },
  historyLevel: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  historyPreview: { fontSize: 13, color: "#64748B", width: 200 },
  historyArrow: { fontSize: 20, color: "#CBD5E1" },
});
