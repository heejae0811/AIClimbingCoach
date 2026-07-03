import React from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Header } from "../components/Header";
import { VideoBubble } from "../components/VideoBubble";
import { AnalysisRecord } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface AnalyzeScreenProps {
  analyzeLoading: boolean;
  currentAnalysis: AnalysisRecord | null;
  videoUri: string | null;
  analyzeInput: string;
  setAnalyzeInput: (t: string) => void;
  pickVideo: () => void;
  runAnalysis: () => void;
  setCurrentAnalysis: (a: AnalysisRecord | null) => void;
  loadingStep: number;
  loadingSteps: string[];
}

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
  return (
    <View style={styles.screen}>
      <Header title="Analyze Video" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {!analyzeLoading && !currentAnalysis && (
          <View style={styles.analyzePrompt}>
            <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
              {videoUri ? (
                <VideoBubble uri={videoUri} />
              ) : (
                <>
                  <Text style={{ fontSize: 40 }}>🎥</Text>
                  <Text style={styles.pickerText}>클라이밍 영상 선택</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.analyzeInput}
              value={analyzeInput}
              onChangeText={setAnalyzeInput}
              placeholder="분석 시 고려할 특이사항 (선택)"
              multiline
            />

            <TouchableOpacity
              style={[styles.actionBtn, { opacity: videoUri ? 1 : 0.5 }]}
              onPress={runAnalysis}
              disabled={!videoUri}
            >
              <Text style={styles.actionBtnText}>분석 시작하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {analyzeLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT_COLOR} />
            <Text style={styles.loadingStepText}>{loadingSteps[loadingStep]}</Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {currentAnalysis && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>분석 완료!</Text>
            <Text style={styles.resultLevel}>{currentAnalysis.level}</Text>
            <Text style={styles.resultConfidence}>
              신뢰도: {Math.round(currentAnalysis.confidence * 100)}%
            </Text>
            <View style={styles.divider} />
            <Text style={styles.feedbackText}>{currentAnalysis.feedback}</Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setCurrentAnalysis(null)}
            >
              <Text style={styles.secondaryBtnText}>새로 분석하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  analyzePrompt: { alignItems: "center" },
  videoPicker: {
    width: "100%",
    height: 250,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  pickerText: { marginTop: 10, color: "#64748B", fontWeight: "600" },
  analyzeInput: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 15,
    marginTop: 20,
    fontSize: 16,
    minHeight: 80,
  },
  actionBtn: {
    width: "100%",
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  actionBtnText: { color: "white", fontSize: 18, fontWeight: "700" },
  loadingContainer: { alignItems: "center", paddingVertical: 50 },
  loadingStepText: { marginTop: 20, fontSize: 16, color: "#475569", fontWeight: "600" },
  progressBg: {
    width: "80%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginTop: 15,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: ACCENT_COLOR },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  resultTitle: { fontSize: 20, fontWeight: "800", color: ACCENT_COLOR, textAlign: "center" },
  resultLevel: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    marginVertical: 10,
  },
  resultConfidence: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 20 },
  feedbackText: { fontSize: 16, lineHeight: 24, color: "#334155" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  secondaryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#64748B", fontWeight: "600" },
});
