import React from "react";
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Header } from "../components/Header";
import { UserProfile } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface ProfileScreenProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

export const ProfileScreen = ({ profile, setProfile }: ProfileScreenProps) => {
  const handleSave = () => {
    Alert.alert("저장 완료", "신체 정보가 업데이트되었습니다. AI 코치가 이 정보를 바탕으로 코칭을 제공합니다.");
  };

  return (
    <View style={styles.screen}>
      <Header title="My Profile" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.profileSection}>
          <Text style={styles.inputLabel}>기본 정보</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.subLabel}>키 (cm)</Text>
              <TextInput
                style={styles.profileInput}
                value={profile.height}
                onChangeText={(t) => setProfile({ ...profile, height: t })}
                keyboardType="numeric"
                placeholder="170"
              />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.subLabel}>몸무게 (kg)</Text>
              <TextInput
                style={styles.profileInput}
                value={profile.weight}
                onChangeText={(t) => setProfile({ ...profile, weight: t })}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>나이</Text>
              <TextInput
                style={styles.profileInput}
                value={profile.age}
                onChangeText={(t) => setProfile({ ...profile, age: t })}
                keyboardType="numeric"
                placeholder="25"
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 24 }]}>클라이밍 정보</Text>
          <Text style={styles.subLabel}>경력</Text>
          <TextInput
            style={styles.profileInput}
            value={profile.experience}
            onChangeText={(t) => setProfile({ ...profile, experience: t })}
            placeholder="1년"
          />

          <Text style={styles.subLabel}>주당 세션 횟수</Text>
          <TextInput
            style={styles.profileInput}
            value={profile.sessions}
            onChangeText={(t) => setProfile({ ...profile, sessions: t })}
            keyboardType="numeric"
            placeholder="3"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <Text style={styles.subLabel}>현재 그레이드</Text>
              <TextInput
                style={styles.profileInput}
                value={profile.currentGrade}
                onChangeText={(t) => setProfile({ ...profile, currentGrade: t })}
                placeholder="V1"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>목표 그레이드</Text>
              <TextInput
                style={styles.profileInput}
                value={profile.goalGrade}
                onChangeText={(t) => setProfile({ ...profile, goalGrade: t })}
                placeholder="V7"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>프로필 저장하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },
  profileSection: { backgroundColor: "white" },
  inputLabel: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  subLabel: { fontSize: 13, color: "#64748B", marginBottom: 5, marginTop: 10 },
  profileInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: "row" },
  saveBtn: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  infoBox: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoBoxText: { fontSize: 13, color: "#64748B", lineHeight: 18, textAlign: "center" },
});
