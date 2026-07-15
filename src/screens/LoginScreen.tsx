import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

const ACCENT_COLOR = "#2563EB";
const AUTH_EMAIL_DOMAIN = "auth.aiclimbingcoach.app";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

function validateUsername(username: string): boolean {
  return /^[a-z0-9_]{4,20}$/.test(normalizeUsername(username));
}

export const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    const normalizedUsername = normalizeUsername(username);

    if (!validateUsername(normalizedUsername)) {
      Alert.alert(
        "아이디 확인",
        "아이디는 영문 소문자, 숫자, 밑줄만 사용하여 4~20자로 입력해주세요."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert("비밀번호 확인", "비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    const email = usernameToEmail(normalizedUsername);

    setLoading(true);

    try {
      if (isSignUp) {
        await handleSignUp(normalizedUsername, email);
      } else {
        await handleSignIn(email);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "요청을 처리하는 중 오류가 발생했습니다.";

      Alert.alert(isSignUp ? "회원가입 실패" : "로그인 실패", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (
    normalizedUsername: string,
    email: string
  ) => {
    /*
     * profiles 테이블은 RLS로 자기 데이터만 조회할 수 있으므로,
     * 로그인하지 않은 상태에서 username 중복 여부를 직접 조회하면
     * 정확한 중복 확인이 불가능할 수 있습니다.
     *
     * 최종 중복 여부는 Supabase Auth와 profiles의 unique index가 검사합니다.
     */
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        throw new Error("이미 사용 중인 아이디입니다.");
      }

      throw error;
    }

    if (!data.user) {
      throw new Error("사용자 계정이 생성되지 않았습니다.");
    }

    /*
     * Supabase에서 Confirm email을 꺼두었다면
     * 회원가입 직후 session이 생성됩니다.
     */
    if (!data.session) {
      throw new Error(
        "회원가입은 되었지만 로그인 세션이 생성되지 않았습니다. Supabase의 Confirm email 설정을 확인해주세요."
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: data.user.id,
        username: normalizedUsername,
      });

    if (profileError) {
      if (profileError.code === "23505") {
        throw new Error("이미 사용 중인 아이디입니다.");
      }

      throw new Error(
        `프로필 생성에 실패했습니다: ${profileError.message}`
      );
    }

    Alert.alert("회원가입 완료", "계정이 생성되었습니다.");
  };

  const handleSignIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🧗</Text>

        <Text style={styles.title}>
          {isSignUp ? "AI Coach 회원가입" : "AI Coach 로그인"}
        </Text>

        <Text style={styles.description}>
          {isSignUp
            ? "새로운 아이디와 비밀번호를 입력해주세요."
            : "등록한 아이디와 비밀번호를 입력해주세요."}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="아이디"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleAuth}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "회원가입" : "로그인"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsSignUp((previous) => !previous);
            setPassword("");
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? "이미 계정이 있나요? 로그인"
              : "처음이신가요? 회원가입"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },

  logo: {
    marginBottom: 10,
    fontSize: 60,
    textAlign: "center",
  },

  title: {
    marginBottom: 8,
    color: "#1E293B",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    marginBottom: 30,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  input: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 16,
  },

  button: {
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 18,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  toggleText: {
    marginTop: 20,
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});