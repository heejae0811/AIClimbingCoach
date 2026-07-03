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
  ScrollView,
  StyleSheet,
} from "react-native";
import { Header } from "../components/Header";
import { Message } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface HomeScreenProps {
  messages: Message[];
  chatInput: string;
  setChatInput: (t: string) => void;
  sendChatMessage: (t?: string) => void;
  chatLoading: boolean;
}

export const HomeScreen = ({
  messages,
  chatInput,
  setChatInput,
  sendChatMessage,
  chatLoading,
}: HomeScreenProps) => {


  return (
    <View style={styles.screen}>
      <Header title="AI Coach" />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 0 }}
        renderItem={({ item }) => (
          <View style={[styles.msgBubble, item.role === "user" ? styles.userMsg : styles.aiMsg]}>
            <Text style={[styles.msgText, { color: item.role === "user" ? "white" : "#1E293B" }]}>
              {item.text}
            </Text>
          </View>
        )}
      />
      {chatLoading && <ActivityIndicator style={{ marginBottom: 10 }} color={ACCENT_COLOR} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={55}
      >
        <View style={styles.chatInputBar}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="코치에게 질문하기..."
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendChatMessage()}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  msgBubble: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "85%",
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: ACCENT_COLOR,
    borderBottomRightRadius: 4,
  },
  aiMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 16, lineHeight: 22 },
  chatInputBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "flex-end",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendBtnText: { color: "white", fontSize: 18 },
  chipContainer: { paddingVertical: 10, paddingHorizontal: 5 },
  chip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  chipText: { color: ACCENT_COLOR, fontSize: 13, fontWeight: "600" },
});
