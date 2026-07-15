import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "../components/Header";
import { VideoBubble } from "../components/VideoBubble";
import { ACCENT_COLOR } from "../constants/theme";
import { AnalysisRecord } from "../types";

interface AnalyzeScreenProps {
  analyzeLoading: boolean;
  currentAnalysis: AnalysisRecord | null;
  videoUri: string | null;
  analyzeInput: string;
  setAnalyzeInput: (text: string) => void;
  pickVideo: () => void;
  runAnalysis: () => void;
  setCurrentAnalysis: (analysis: AnalysisRecord | null) => void;
  loadingStep: number;
  loadingSteps: string[];
}

const PLACEHOLDER_COLOR = "#94A3B8";

export const AnalyzeScreen = ({
  analyzeLoading,
  currentAnalysis,
  videoUri,
  analyzeInput,
  setAnalyzeInput,
  pickVideo,
  runAnalysis,
  setCurrentAnalysis,
  loadingStep,
  loadingSteps,
}: AnalyzeScreenProps) => {
  const confidence =
    currentAnalysis &&
    typeof currentAnalysis.confidence === "number"
      ? Math.round(currentAnalysis.confidence * 100)
      : null;

  const currentLoadingMessage =
    loadingSteps[loadingStep] ?? "Analyzing your video...";

  return (
    <View style={styles.screen}>
      <Header title="Analyze Video" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!analyzeLoading && !currentAnalysis && (
          <View style={styles.analyzePrompt}>
            <Text style={styles.introTitle}>
              Upload a Climbing Video
            </Text>

            <Text style={styles.introText}>
              Select a climbing video to receive an AI-powered
              performance analysis and personalized coaching feedback.
            </Text>

            <TouchableOpacity
              style={styles.videoPicker}
              onPress={pickVideo}
              accessibilityRole="button"
              accessibilityLabel="Select a climbing video"
            >
              {videoUri ? (
                <VideoBubble uri={videoUri} />
              ) : (
                <>
                  <Text style={styles.videoIcon}>🎥</Text>

                  <Text style={styles.pickerTitle}>
                    Select a Climbing Video
                  </Text>

                  <Text style={styles.pickerHint}>
                    Tap here to choose a video from your device.
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>
              Optional Question
            </Text>

            <TextInput
              style={styles.analyzeInput}
              value={analyzeInput}
              onChangeText={setAnalyzeInput}
              placeholder="Add a question for the AI coach, e.g. How can I improve my footwork?"
              placeholderTextColor={PLACEHOLDER_COLOR}
              multiline
              textAlignVertical="top"
              editable={!analyzeLoading}
              accessibilityLabel="Optional coaching question"
            />

            <TouchableOpacity
              style={[
                styles.actionButton,
                !videoUri && styles.disabledButton,
              ]}
              onPress={runAnalysis}
              disabled={!videoUri}
              accessibilityRole="button"
              accessibilityLabel="Start video analysis"
            >
              <Text style={styles.actionButtonText}>
                Start Analysis
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {analyzeLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={ACCENT_COLOR}
            />

            <Text style={styles.loadingTitle}>
              Analyzing Your Video
            </Text>

            <Text style={styles.loadingStepText}>
              {currentLoadingMessage}
            </Text>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((loadingStep + 1) /
                        Math.max(loadingSteps.length, 1)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.loadingHint}>
              This may take a few moments. Please keep the app open.
            </Text>
          </View>
        )}

        {currentAnalysis && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              Analysis Complete
            </Text>

            <Text style={styles.resultLabel}>
              Performance Level
            </Text>

            <Text style={styles.resultLevel}>
              {currentAnalysis.level}
            </Text>

            {confidence !== null && (
              <Text style={styles.resultConfidence}>
                Confidence: {confidence}%
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.feedbackTitle}>
              AI Coaching Feedback
            </Text>

            <Text style={styles.feedbackText}>
              {currentAnalysis.feedback?.trim()
                ? currentAnalysis.feedback
                : "No coaching feedback is available for this analysis."}
            </Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentAnalysis(null)}
              accessibilityRole="button"
              accessibilityLabel="Analyze another video"
            >
              <Text style={styles.secondaryButtonText}>
                Analyze Another Video
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  analyzePrompt: {
    width: "100%",
  },

  introTitle: {
    marginBottom: 8,
    color: "#1E293B",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  introText: {
    marginBottom: 22,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  videoPicker: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 24,
  },

  videoIcon: {
    fontSize: 42,
  },

  pickerTitle: {
    marginTop: 12,
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
  },

  pickerHint: {
    marginTop: 6,
    paddingHorizontal: 24,
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  inputLabel: {
    marginTop: 22,
    marginBottom: 8,
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },

  analyzeInput: {
    width: "100%",
    minHeight: 100,
    padding: 15,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    fontSize: 16,
    lineHeight: 22,
  },

  actionButton: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 16,
  },

  disabledButton: {
    opacity: 0.45,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },

  loadingTitle: {
    marginTop: 20,
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "800",
  },

  loadingStepText: {
    marginTop: 10,
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  progressBackground: {
    width: "80%",
    height: 6,
    marginTop: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },

  progressFill: {
    height: "100%",
    backgroundColor: ACCENT_COLOR,
  },

  loadingHint: {
    marginTop: 14,
    paddingHorizontal: 24,
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  resultCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 24,
  },

  resultTitle: {
    color: ACCENT_COLOR,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  resultLabel: {
    marginTop: 20,
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

  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: "#F1F5F9",
  },

  feedbackTitle: {
    marginBottom: 10,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },

  feedbackText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
  },

  secondaryButton: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
  },

  secondaryButtonText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
});