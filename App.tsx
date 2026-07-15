import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";

import {
  uploadVideoNative,
  uploadVideoWeb,
} from "./src/services/videoUpload";

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
    "The API server URL is missing. Check EXPO_PUBLIC_API_URL."
  );
}

const ANALYZE_URL = `${BASE_URL}/analyze`;
const CHAT_URL = `${BASE_URL}/chat`;

const VIDEO_BUCKET = "climbing-videos";

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
          console.error(
            "Failed to retrieve the current session:",
            error.message
          );
        }

        if (isMounted) {
          setSession(currentSession);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error(
          "Failed to initialize the session:",
          error
        );

        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
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

function MainApp({ session }: MainAppProps) {
  // Navigation
  const [activeTab, setActiveTab] =
    useState<Tab>("home");

  // User profile
  const [profile, setProfile] =
    useState<UserProfile>({
      height: "",
      weight: "",
      age: "",
      experience: "",
      sessions: "",
      currentGrade: "",
      goalGrade: "",
    });

  // Chat
  const [chatInput, setChatInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-message",
      role: "ai",
      text: "Hello! Ask me anything about climbing. To analyze a video, open the Analyze tab.",
    },
  ]);

  const [chatLoading, setChatLoading] = useState(false);

  // Video analysis
  const [videoUri, setVideoUri] =
    useState<string | null>(null);

  /*
   * Browser File object.
   * Used only on web.
   */
  const [videoFile, setVideoFile] =
    useState<any>(null);

  const [videoFileName, setVideoFileName] =
    useState<string | null>(null);

  const [videoMimeType, setVideoMimeType] =
    useState<string | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [analyzeInput, setAnalyzeInput] =
    useState("");

  const [analyzeLoading, setAnalyzeLoading] =
    useState(false);

  const [loadingStep, setLoadingStep] =
    useState(0);

  const [
    currentAnalysis,
    setCurrentAnalysis,
  ] = useState<AnalysisRecord | null>(null);

  // History
  const [history, setHistory] =
    useState<AnalysisRecord[]>([]);

  const [
    selectedHistoryItem,
    setSelectedHistoryItem,
  ] = useState<AnalysisRecord | null>(null);

  const loadingSteps = useMemo(
    () => [
      uploadProgress > 0 && uploadProgress < 100
        ? `Uploading video... ${uploadProgress}%`
        : "Uploading video...",
      "Downloading the video for processing...",
      "Detecting pose with MediaPipe...",
      "Extracting movement features...",
      "Running the machine learning model...",
      "Interpreting the result with LIME...",
      "Generating personalized AI feedback...",
    ],
    [uploadProgress]
  );

  useEffect(() => {
    void loadAnalysisHistory();
  }, []);

  useEffect(() => {
    if (!analyzeLoading) {
      return;
    }

    /*
     * The first step is controlled by upload progress.
     * After upload, the remaining steps advance as status messages.
     */
    const interval = setInterval(() => {
      setLoadingStep((previousStep) => {
        if (previousStep === 0 && uploadProgress < 100) {
          return 0;
        }

        return previousStep <
          loadingSteps.length - 1
          ? previousStep + 1
          : previousStep;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [
    analyzeLoading,
    uploadProgress,
    loadingSteps.length,
  ]);

  const showError = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const getErrorMessage = (
    result: any,
    status: number
  ): string => {
    if (Array.isArray(result?.detail)) {
      return result.detail
        .map((item: any) => {
          const location = Array.isArray(item?.loc)
            ? item.loc.join(" → ")
            : "";

          const message =
            item?.msg ??
            "The submitted value is invalid.";

          return location
            ? `${location}: ${message}`
            : message;
        })
        .join("\n");
    }

    if (typeof result?.detail === "string") {
      return result.detail;
    }

    if (typeof result?.error === "string") {
      return result.error;
    }

    return `The server returned an error (${status}).`;
  };

  /**
   * Loads saved analysis records from Supabase.
   */
  const loadAnalysisHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("analysis_records")
        .select(
          `
            id,
            level,
            prediction,
            confidence,
            lime,
            feedback,
            video_path,
            created_at
          `
        )
        .eq("user_id", session.user.id)
        .eq("status", "completed")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const records = await Promise.all(
        (data ?? []).map(async (row) => {
          let signedVideoUrl: string | undefined;

          if (row.video_path) {
            const {
              data: signedUrlData,
              error: signedUrlError,
            } = await supabase.storage
              .from(VIDEO_BUCKET)
              .createSignedUrl(
                row.video_path,
                60 * 60
              );

            if (!signedUrlError) {
              signedVideoUrl =
                signedUrlData.signedUrl;
            }
          }

          const record: AnalysisRecord = {
            id: row.id,
            date: new Date(
              row.created_at
            ).toLocaleDateString("en-US"),
            level: row.level ?? "Unknown",
            prediction: row.prediction,
            confidence:
              typeof row.confidence === "number"
                ? row.confidence
                : Number(row.confidence ?? 0),
            lime: Array.isArray(row.lime)
              ? row.lime
              : [],
            feedback: row.feedback ?? "",
            videoUri: signedVideoUrl,
          };

          return record;
        })
      );

      setHistory(records);
    } catch (error) {
      console.error(
        "Failed to load analysis history:",
        error
      );
    }
  };

  const sendChatMessage = async (
    text?: string
  ) => {
    const inputToUse = text ?? chatInput;
    const trimmedInput = inputToUse.trim();

    if (!trimmedInput || chatLoading) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedInput,
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
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: trimmedInput,
          history: history.slice(0, 5),
          profile: {
            height: profile.height,
            weight: profile.weight,
            age: profile.age,
            experience: profile.experience,
            sessions: profile.sessions,
            currentGrade:
              profile.currentGrade,
            goalGrade: profile.goalGrade,
          },
        }),
      });

      const rawResponse =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(rawResponse);
      } catch {
        console.error(
          "The chat API returned a non-JSON response:",
          rawResponse
        );

        throw new Error(
          `The server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            response.status
          )
        );
      }

      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "ai",
        text:
          data.success && data.answer
            ? data.answer
            : "The AI coach did not return an answer.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        aiMessage,
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: `chat-error-${Date.now()}`,
        role: "ai",
        text:
          error instanceof Error
            ? error.message
            : "Unable to connect to the server.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Selects a video and stores the information
   * needed by web and native upload functions.
   */
  const pickVideo = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["videos"],
          quality: 0.8,
        });

      if (
        result.canceled ||
        result.assets.length === 0
      ) {
        return;
      }

      const asset = result.assets[0];

      setVideoUri(asset.uri);

      setVideoFileName(
        asset.fileName ??
          `climb_video_${Date.now()}.mp4`
      );

      setVideoMimeType(
        asset.mimeType ?? "video/mp4"
      );

      if (Platform.OS === "web") {
        setVideoFile(asset.file ?? null);
      } else {
        setVideoFile(null);
      }
    } catch (error) {
      console.error(
        "Video selection error:",
        error
      );

      showError(
        "Video selection failed",
        "Unable to select the video. Please try again."
      );
    }
  };

  /**
   * Uploads the selected video to Supabase Storage,
   * sends only video_path to FastAPI,
   * and saves the completed result in analysis_records.
   */
  const runAnalysis = async () => {
    if (!videoUri || analyzeLoading) {
      return;
    }

    let uploadedVideoPath: string | null = null;
    let recordSaved = false;

    setAnalyzeLoading(true);
    setCurrentAnalysis(null);
    setUploadProgress(0);
    setLoadingStep(0);

    try {
      /*
       * 1. Upload the video directly to Supabase Storage.
       */
      if (Platform.OS === "web") {
        if (!videoFile) {
          throw new Error(
            "The selected browser file is unavailable. Please select the video again."
          );
        }

        uploadedVideoPath =
          await uploadVideoWeb({
            file: videoFile,
            onProgress: setUploadProgress,
          });
      } else {
        uploadedVideoPath =
          await uploadVideoNative({
            uri: videoUri,
            fileName: videoFileName,
            mimeType: videoMimeType,
            onProgress: setUploadProgress,
          });
      }

      setUploadProgress(100);
      setLoadingStep(1);

      /*
       * 2. Send JSON to FastAPI.
       * The video file itself is no longer sent to Cloud Run.
       */
      const response = await fetch(
        ANALYZE_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            video_path:
              uploadedVideoPath,
            height:
              profile.height.trim() ||
              null,
            weight:
              profile.weight.trim() ||
              null,
            question:
              analyzeInput.trim() ||
              null,
          }),
        }
      );

      const rawResponse =
        await response.text();

      let result: any;

      try {
        result = JSON.parse(rawResponse);
      } catch {
        console.error(
          "The analysis API returned a non-JSON response:",
          rawResponse
        );

        throw new Error(
          `The server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        console.error(
          "Analyze API error response:",
          result
        );

        throw new Error(
          getErrorMessage(
            result,
            response.status
          )
        );
      }

      if (!result.success) {
        throw new Error(
          result.error ||
            "The video analysis failed."
        );
      }

      /*
       * 3. Save the completed result in Supabase Database.
       */
      const {
        data: savedRecord,
        error: saveError,
      } = await supabase
        .from("analysis_records")
        .insert({
          user_id: session.user.id,
          level: result.level,
          prediction: result.prediction,
          confidence: result.confidence,
          lime: result.lime ?? [],
          feedback:
            result.feedback ?? null,
          video_path:
            uploadedVideoPath,
          question:
            analyzeInput.trim() ||
            null,
          status: "completed",
          error_message: null,
        })
        .select(
          `
            id,
            created_at
          `
        )
        .single();

      if (saveError) {
        throw new Error(
          `The analysis was completed, but the result could not be saved: ${saveError.message}`
        );
      }

      recordSaved = true;

      /*
       * 4. Create a temporary signed URL for video playback.
       */
      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from(VIDEO_BUCKET)
        .createSignedUrl(
          uploadedVideoPath,
          60 * 60
        );

      if (signedUrlError) {
        console.warn(
          "Unable to create video signed URL:",
          signedUrlError.message
        );
      }

      const newRecord: AnalysisRecord = {
        id: savedRecord.id,
        date: new Date(
          savedRecord.created_at
        ).toLocaleDateString("en-US"),
        level: result.level,
        prediction: result.prediction,
        confidence: result.confidence,
        lime: result.lime ?? [],
        feedback:
          result.feedback ?? "",
        videoUri:
          signedUrlData?.signedUrl ??
          videoUri,
      };

      setCurrentAnalysis(newRecord);

      setHistory((previousHistory) => [
        newRecord,
        ...previousHistory,
      ]);

      setVideoUri(null);
      setVideoFile(null);
      setVideoFileName(null);
      setVideoMimeType(null);
      setAnalyzeInput("");
      setUploadProgress(0);
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      /*
       * Delete an orphaned Storage file when analysis
       * or database saving failed.
       */
      if (
        uploadedVideoPath &&
        !recordSaved
      ) {
        const { error: removeError } =
          await supabase.storage
            .from(VIDEO_BUCKET)
            .remove([
              uploadedVideoPath,
            ]);

        if (removeError) {
          console.warn(
            "Unable to remove failed upload:",
            removeError.message
          );
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during the analysis.";

      showError(
        "Analysis failed",
        message
      );
    } finally {
      setAnalyzeLoading(false);
      setUploadProgress(0);
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
            sendChatMessage={
              sendChatMessage
            }
            chatLoading={chatLoading}
          />
        )}

        {activeTab === "analyze" && (
          <AnalyzeScreen
            analyzeLoading={
              analyzeLoading
            }
            currentAnalysis={
              currentAnalysis
            }
            videoUri={videoUri}
            analyzeInput={analyzeInput}
            setAnalyzeInput={
              setAnalyzeInput
            }
            pickVideo={pickVideo}
            runAnalysis={runAnalysis}
            setCurrentAnalysis={
              setCurrentAnalysis
            }
            loadingStep={loadingStep}
            loadingSteps={
              loadingSteps
            }
          />
        )}

        {activeTab === "history" && (
          <HistoryScreen
            history={history}
            selectedHistoryItem={
              selectedHistoryItem
            }
            setSelectedHistoryItem={
              setSelectedHistoryItem
            }
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
        onTabPress={() =>
          setSelectedHistoryItem(null)
        }
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