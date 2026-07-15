import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";

// Components
import { BottomTabs } from "./src/components/BottomTabs";

// Screens
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AnalyzeScreen } from "./src/screens/AnalyzeScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

// Types
import {
  Tab,
  Message,
  AnalysisRecord,
  UserProfile,
} from "./src/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    "API 서버 주소가 없습니다. .env의 EXPO_PUBLIC_API_URL을 확인하세요."
  );
}

const ANALYZE_URL = `${BASE_URL}/analyze`;
const CHAT_URL = `${BASE_URL}/chat`;

/**
 * 최상위 App
 *
 * 역할:
 * 1. Supabase 로그인 세션 확인
 * 2. 로그인 전에는 LoginScreen 표시
 * 3. 로그인 후에는 MainApp 표시
 */
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("세션 확인 오류:", error.message);
        }

        if (isMounted) {
          setSession(currentSession);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("세션 초기화 오류:", error);

        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <MainApp session={session} />;
}

interface MainAppProps {
  session: Session;
}

/**
 * 로그인 후 표시되는 기존 앱
 */
function MainApp({ session }: MainAppProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    height: "170",
    weight: "70",
    age: "25",
    experience: "1년",
    sessions: "3",
    currentGrade: "V1",
    goalGrade: "V7",
  });

  // Home / Chat
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-message",
      role: "ai",
      text: "안녕하세요! 클라이밍에 대해 궁금한 점을 물어보세요. 영상을 분석하고 싶다면 '분석' 탭을 이용해 주세요.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Analyze
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [analyzeInput, setAnalyzeInput] = useState("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<AnalysisRecord | null>(null);

  // History
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<AnalysisRecord | null>(null);

  const loadingSteps = [
    "Uploading video...",
    "Detecting pose with MediaPipe...",
    "Extracting movement features...",
    "Running machine learning model...",
    "Interpreting with LIME...",
    "Generating Gemini feedback...",
  ];

  useEffect(() => {
    if (!analyzeLoading) {
      return;
    }

    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((previousStep) =>
        previousStep < loadingSteps.length - 1
          ? previousStep + 1
          : previousStep
      );
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [analyzeLoading]);

  const sendChatMessage = async (text?: string) => {
    const inputToUse = text ?? chatInput;

    if (!inputToUse.trim() || chatLoading) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: inputToUse.trim(),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: inputToUse.trim(),
          history: history.slice(0, 5),
          profile: {
            height: profile.height,
            weight: profile.weight,
            age: profile.age,
            experience: profile.experience,
            sessions: profile.sessions,
            currentGrade: profile.currentGrade,
            goalGrade: profile.goalGrade,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "채팅 요청에 실패했습니다."
        );
      }

      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "ai",
        text:
          data.success && data.answer
            ? data.answer
            : "답변을 가져오지 못했습니다.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        aiMessage,
      ]);
    } catch (error) {
      console.error("채팅 오류:", error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "ai",
        text:
          error instanceof Error
            ? error.message
            : "서버 연결에 실패했습니다.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const pickVideo = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.8,
        });

      if (!result.canceled && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("영상 선택 오류:", error);
      Alert.alert("오류", "영상을 선택하지 못했습니다.");
    }
  };

  const runAnalysis = async () => {
    if (!videoUri || analyzeLoading) {
      return;
    }

    setAnalyzeLoading(true);
    setCurrentAnalysis(null);

    const formData = new FormData();

    formData.append(
      "file",
      {
        uri: videoUri,
        name: "climb_video.mp4",
        type: "video/mp4",
      } as any
    );

    formData.append("height", profile.height);
    formData.append("weight", profile.weight);
    formData.append("question", analyzeInput);

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            result?.error ||
            "영상 분석 요청에 실패했습니다."
        );
      }

      if (!result.success) {
        Alert.alert(
          "분석 실패",
          result.error || "알 수 없는 오류가 발생했습니다."
        );
        return;
      }

      const newRecord: AnalysisRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("ko-KR"),
        level: result.level,
        prediction: result.prediction,
        confidence: result.confidence,
        lime: result.lime || [],
        feedback: result.feedback,
        videoUri,
      };

      setCurrentAnalysis(newRecord);

      setHistory((previousHistory) => [
        newRecord,
        ...previousHistory,
      ]);

      setVideoUri(null);
      setAnalyzeInput("");
    } catch (error) {
      console.error("분석 오류:", error);

      Alert.alert(
        "오류",
        error instanceof Error
          ? error.message
          : "서버 통신 오류가 발생했습니다."
      );
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
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
          <ProfileScreen
            profile={profile}
            setProfile={setProfile}
          />
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

  content: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});