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
const ERROR_COLOR = "#EF4444";
const AUTH_EMAIL_DOMAIN = "auth.aiclimbingcoach.app";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{4,20}$/.test(normalizeUsername(username));
}

function getEnglishAuthErrorMessage(
  error: unknown,
  isSignUp: boolean
): string {
  const rawMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  if (
    rawMessage.includes("invalid login credentials") ||
    rawMessage.includes("invalid credentials")
  ) {
    return "The username or password is incorrect.";
  }

  if (
    rawMessage.includes("already registered") ||
    rawMessage.includes("user already exists") ||
    rawMessage.includes("duplicate key") ||
    rawMessage.includes("23505")
  ) {
    return "This username is already in use.";
  }

  if (rawMessage.includes("password should be at least")) {
    return "The password must be at least 8 characters long.";
  }

  if (
    rawMessage.includes("email rate limit exceeded") ||
    rawMessage.includes("rate limit")
  ) {
    return "Too many attempts. Please try again later.";
  }

  if (
    rawMessage.includes("network request failed") ||
    rawMessage.includes("failed to fetch")
  ) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (
    rawMessage.includes("jwt expired") ||
    rawMessage.includes("session expired")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  if (rawMessage.includes("row-level security")) {
    return "You do not have permission to save this information.";
  }

  return isSignUp
    ? "Unable to create your account. Please try again."
    : "Unable to sign in. Please try again.";
}

export const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async () => {
    setErrorMsg("");

    const normalizedUsername = normalizeUsername(username);

    if (!isValidUsername(normalizedUsername)) {
      setErrorMsg(
        "Username must be 4–20 characters and may contain lowercase letters, numbers, and underscores only."
      );
      return;
    }

    if (password.length < 8) {
      setErrorMsg("The password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const email = usernameToEmail(normalizedUsername);

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
          throw error;
        }

        if (!data.user) {
          throw new Error("User account was not created.");
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            username: normalizedUsername,
          });

        if (profileError) {
          throw profileError;
        }

        Alert.alert(
          "Sign-up complete",
          "Your account has been created successfully."
        );
      } else {
        const email = usernameToEmail(normalizedUsername);

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      const message = getEnglishAuthErrorMessage(error, isSignUp);

      setErrorMsg(message);

      Alert.alert(
        isSignUp ? "Sign-up failed" : "Sign-in failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>
          {isSignUp ? "🧗" : "🧗‍♂️"}
        </Text>

        <Text style={styles.title}>
          {isSignUp ? "Create an account" : "Climbing AI Coach Sign In"}
        </Text>

        <Text style={styles.description}>
          {isSignUp
            ? "Enter a username and password to create your account."
            : "Enter your username and password to continue."}
        </Text>

        <TextInput
          style={[
            styles.input,
            errorMsg.toLowerCase().includes("username") &&
              styles.errorInput,
          ]}
          placeholder="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setErrorMsg("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={[
            styles.input,
            (
              errorMsg.toLowerCase().includes("password") ||
              errorMsg.toLowerCase().includes("credentials")
            ) && styles.errorInput,
          ]}
          placeholder="Password (at least 8 characters)"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorMsg("");
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleAuth}
        />

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : null}

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
              {isSignUp ? "Create account" : "Sign in"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsSignUp((previous) => !previous);
            setErrorMsg("");
            setPassword("");
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
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

  errorInput: {
    borderColor: ERROR_COLOR,
    backgroundColor: "#FEF2F2",
  },

  errorText: {
    marginBottom: 15,
    color: ERROR_COLOR,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  button: {
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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