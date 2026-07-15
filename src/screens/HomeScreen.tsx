import React from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

import { Header } from "../components/Header";
import { Message } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface HomeScreenProps {
  messages: Message[];
  chatInput: string;
  setChatInput: (text: string) => void;
  sendChatMessage: (text?: string) => void;
  chatLoading: boolean;
}

export const HomeScreen = ({
  messages,
  chatInput,
  setChatInput,
  sendChatMessage,
  chatLoading,
}: HomeScreenProps) => {
  const handleSend = () => {
    if (!chatInput.trim() || chatLoading) {
      return;
    }

    sendChatMessage();
  };

  return (
    <View style={styles.screen}>
      <Header title="AI Coach" />

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Start a conversation
            </Text>

            <Text style={styles.emptyText}>
              Ask your AI coach about climbing technique,
              training, recovery, or your recent analysis.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.role === "user";

          return (
            <View
              style={[
                styles.messageBubble,
                isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isUser
                    ? styles.userMessageText
                    : styles.aiMessageText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      {chatLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ACCENT_COLOR} />
          <Text style={styles.loadingText}>
            AI Coach is thinking...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={55}
      >
        <View style={styles.chatInputBar}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask your coach a question..."
            placeholderTextColor="#94A3B8"
            multiline
            editable={!chatLoading}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            accessibilityLabel="Chat message input"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!chatInput.trim() || chatLoading) &&
                styles.disabledButton,
            ]}
            onPress={handleSend}
            disabled={!chatInput.trim() || chatLoading}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  messageList: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 8,
  },

  messageBubble: {
    maxWidth: "85%",
    marginBottom: 10,
    padding: 14,
    borderRadius: 20,
  },

  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: ACCENT_COLOR,
    borderBottomRightRadius: 4,
  },

  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  aiMessageText: {
    color: "#1E293B",
  },

  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  loadingText: {
    marginLeft: 8,
    color: "#64748B",
    fontSize: 13,
  },

  chatInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  chatInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    fontSize: 16,
  },

  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 22,
  },

  disabledButton: {
    opacity: 0.45,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  emptyTitle: {
    marginBottom: 8,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});