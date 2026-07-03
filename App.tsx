import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, View, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Components
import { BottomTabs } from "./src/components/BottomTabs";

// Screens
import { HomeScreen } from "./src/screens/HomeScreen";
import { AnalyzeScreen } from "./src/screens/AnalyzeScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

// Types
import { Tab, Message, AnalysisRecord, UserProfile } from "./src/types";

// Constants
const ANALYZE_URL = "http://172.24.135.200:8000/analyze";
const CHAT_URL = "http://172.24.135.200:8000/chat";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    height: "175",
    weight: "70",
    age: "25",
    experience: "1 year",
    sessions: "3",
    currentGrade: "V4",
    goalGrade: "V6",
  });

  // Home / Chat State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "안녕하세요! 클라이밍에 대해 궁금한 점을 물어보세요. 영상을 분석하고 싶다면 '분석' 탭을 이용해 주세요.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Analyze State
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [analyzeInput, setAnalyzeInput] = useState("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);

  // History State
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AnalysisRecord | null>(null);

  const loadingSteps = [
    "Uploading video...",
    "Detecting pose with MediaPipe...",
    "Extracting movement features...",
    "Running machine learning model...",
    "Interpreting with LIME...",
    "Generating Gemini feedback...",
  ];

  useEffect(() => {
    let interval: any;
    if (analyzeLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [analyzeLoading]);

  // --- Handlers ---

  const sendChatMessage = async (text?: string) => {
    const inputToUse = text || chatInput;
    if (!inputToUse.trim() || chatLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: inputToUse };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputToUse,
          height: profile.height,
          weight: profile.weight,
          history: history.slice(0, 5),
          profile: {
            age: profile.age,
            experience: profile.experience,
            sessions: profile.sessions,
            currentGrade: profile.currentGrade,
            goalGrade: profile.goalGrade,
          },
        }),
      });
      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data.success ? data.answer : "답변을 가져오지 못했습니다.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: "err", role: "ai", text: "서버 연결에 실패했습니다." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const runAnalysis = async () => {
    if (!videoUri || analyzeLoading) return;

    setAnalyzeLoading(true);
    setCurrentAnalysis(null);

    const formData = new FormData();
    formData.append("file", {
      uri: videoUri,
      name: "climb_video.mp4",
      type: "video/mp4",
    } as any);
    formData.append("height", profile.height);
    formData.append("weight", profile.weight);
    formData.append("question", analyzeInput);

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        const newRecord: AnalysisRecord = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          level: result.level,
          prediction: result.prediction,
          confidence: result.confidence,
          lime: result.lime || [],
          feedback: result.feedback,
          videoUri: videoUri,
        };
        setCurrentAnalysis(newRecord);
        setHistory((prev) => [newRecord, ...prev]);
        setVideoUri(null);
        setAnalyzeInput("");
      } else {
        Alert.alert("분석 실패", result.error || "알 수 없는 오류");
      }
    } catch (error) {
      Alert.alert("오류", "서버 통신 오류가 발생했습니다.");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {activeTab === "home" && (
          <HomeScreen
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
            chatLoading={chatLoading}
          />
        )}
        {activeTab === "analyze" && (
          <AnalyzeScreen
            analyzeLoading={analyzeLoading}
            currentAnalysis={currentAnalysis}
            videoUri={videoUri}
            analyzeInput={analyzeInput}
            setAnalyzeInput={setAnalyzeInput}
            pickVideo={pickVideo}
            runAnalysis={runAnalysis}
            setCurrentAnalysis={setCurrentAnalysis}
            loadingStep={loadingStep}
            loadingSteps={loadingSteps}
          />
        )}
        {activeTab === "history" && (
          <HistoryScreen
            history={history}
            selectedHistoryItem={selectedHistoryItem}
            setSelectedHistoryItem={setSelectedHistoryItem}
          />
        )}
        {activeTab === "profile" && (
          <ProfileScreen profile={profile} setProfile={setProfile} />
        )}
      </View>
      <BottomTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabPress={() => setSelectedHistoryItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
