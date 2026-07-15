import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "../components/Header";
import { VideoBubble } from "../components/VideoBubble";
import { ACCENT_COLOR } from "../constants/theme";
import { AnalysisRecord } from "../types";

interface HistoryScreenProps {
  history: AnalysisRecord[];
  selectedHistoryItem: AnalysisRecord | null;
  setSelectedHistoryItem: (item: AnalysisRecord | null) => void;
}

interface AnalysisDetailViewProps {
  item: AnalysisRecord;
  onBack: () => void;
}

export const HistoryScreen = ({
  history,
  selectedHistoryItem,
  setSelectedHistoryItem,
}: HistoryScreenProps) => {
  const AnalysisDetailView = ({
    item,
    onBack,
  }: AnalysisDetailViewProps) => {
    const confidence =
      typeof item.confidence === "number"
        ? Math.round(item.confidence * 100)
        : null;

    return (
      <View style={styles.screen}>
        <Header title="Analysis Details" />

        <ScrollView
          contentContainerStyle={styles.detailContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to analysis history"
          >
            <Text style={styles.backButtonText}>
              ← Back to History
            </Text>
          </TouchableOpacity>

          <View style={styles.resultCard}>
            <Text style={styles.resultDate}>
              Analysis • {item.date}
            </Text>

            <Text style={styles.resultLabel}>
              Performance Level
            </Text>

            <Text style={styles.resultLevel}>
              {item.level}
            </Text>

            {confidence !== null && (
              <Text style={styles.resultConfidence}>
                Confidence: {confidence}%
              </Text>
            )}

            {item.videoUri ? (
              <View style={styles.videoContainer}>
                <VideoBubble uri={item.videoUri} />
              </View>
            ) : null}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>
              LIME Explanation
            </Text>

            {item.lime && item.lime.length > 0 ? (
              item.lime.map((limeItem, index) => {
                const barWidth = Math.min(
                  Math.abs(limeItem.importance) * 200,
                  200
                );

                const isPositive =
                  limeItem.importance > 0;

                return (
                  <View
                    key={`${limeItem.feature_condition}-${index}`}
                    style={styles.limeRow}
                  >
                    <View style={styles.limeHeader}>
                      <Text
                        style={styles.limeText}
                        numberOfLines={2}
                      >
                        {limeItem.feature_condition}
                      </Text>

                      <Text
                        style={[
                          styles.limeValue,
                          isPositive
                            ? styles.positiveValue
                            : styles.negativeValue,
                        ]}
                      >
                        {limeItem.importance > 0 ? "+" : ""}
                        {limeItem.importance.toFixed(3)}
                      </Text>
                    </View>

                    <View style={styles.limeTrack}>
                      <View
                        style={[
                          styles.limeBar,
                          {
                            width: barWidth,
                            backgroundColor: isPositive
                              ? "#10B981"
                              : "#EF4444",
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptySectionText}>
                No LIME explanation is available for this analysis.
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>
              AI Coaching Feedback
            </Text>

            <Text style={styles.feedbackText}>
              {item.feedback?.trim()
                ? item.feedback
                : "No coaching feedback is available for this analysis."}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (selectedHistoryItem) {
    return (
      <AnalysisDetailView
        item={selectedHistoryItem}
        onBack={() => setSelectedHistoryItem(null)}
      />
    );
  }

  const latestLevel =
    history.length > 0 ? history[0].level : null;

  return (
    <View style={styles.screen}>
      <Header title="Analysis History" />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 &&
            styles.emptyListContent,
        ]}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              AI Progress Summary
            </Text>

            <Text style={styles.summaryText}>
              {history.length > 0
                ? `You have analyzed ${history.length} climbing ${
                    history.length === 1 ? "video" : "videos"
                  }. Your most recent performance was classified as ${latestLevel}.`
                : "No analysis history yet. Upload a climbing video to get started."}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎥</Text>

            <Text style={styles.emptyTitle}>
              No Analysis Yet
            </Text>

            <Text style={styles.emptyText}>
              Upload a climbing video to receive an AI-powered
              performance analysis and personalized coaching feedback.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const confidence =
            typeof item.confidence === "number"
              ? Math.round(item.confidence * 100)
              : null;

          return (
            <TouchableOpacity
              style={styles.historyCard}
              onPress={() =>
                setSelectedHistoryItem(item)
              }
              accessibilityRole="button"
              accessibilityLabel={`Open analysis from ${item.date}`}
            >
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>
                  {item.date}
                </Text>

                <Text style={styles.historyLevel}>
                  {item.level}
                </Text>

                {confidence !== null && (
                  <Text style={styles.historyConfidence}>
                    Confidence: {confidence}%
                  </Text>
                )}

                <Text
                  style={styles.historyPreview}
                  numberOfLines={2}
                >
                  {item.feedback?.trim()
                    ? item.feedback
                    : "No coaching feedback available."}
                </Text>
              </View>

              <Text style={styles.historyArrow}>→</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  detailContent: {
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  backButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },

  resultCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 24,
  },

  resultDate: {
    marginBottom: 12,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  resultLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
  },

  resultLevel: {
    marginVertical: 10,
    color: "#1E293B",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },

  resultConfidence: {
    marginBottom: 20,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  videoContainer: {
    marginTop: 4,
  },

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: "#F1F5F9",
  },

  sectionTitle: {
    marginBottom: 12,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },

  feedbackText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
  },

  limeRow: {
    marginBottom: 14,
  },

  limeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  limeText: {
    flex: 1,
    marginRight: 12,
    color: "#475569",
    fontSize: 14,
    lineHeight: 19,
  },

  limeValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  positiveValue: {
    color: "#059669",
  },

  negativeValue: {
    color: "#DC2626",
  },

  limeTrack: {
    width: "100%",
    height: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },

  limeBar: {
    height: "100%",
    borderRadius: 4,
  },

  emptySectionText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },

  summaryCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
  },

  summaryTitle: {
    marginBottom: 8,
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: "800",
  },

  summaryText: {
    color: "#1E3A8A",
    fontSize: 14,
    lineHeight: 20,
  },

  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
  },

  historyContent: {
    flex: 1,
    marginRight: 12,
  },

  historyDate: {
    color: "#94A3B8",
    fontSize: 12,
  },

  historyLevel: {
    marginTop: 3,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },

  historyConfidence: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
  },

  historyPreview: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },

  historyArrow: {
    color: "#CBD5E1",
    fontSize: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 60,
  },

  emptyIcon: {
    marginBottom: 14,
    fontSize: 44,
  },

  emptyTitle: {
    marginBottom: 8,
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});