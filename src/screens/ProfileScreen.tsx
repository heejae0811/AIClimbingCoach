import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { Header } from "../components/Header";
import { ACCENT_COLOR } from "../constants/theme";
import { UserProfile } from "../types";

interface ProfileScreenProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const PLACEHOLDER_COLOR = "#A8B2C1";

export const ProfileScreen = ({
  profile,
  setProfile,
}: ProfileScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  const showMessage = (title: string, message: string) => {
    if (
      Platform.OS === "web" &&
      typeof globalThis.alert === "function"
    ) {
      globalThis.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  /**
   * 빈 문자열이면 null을 반환합니다.
   * 값이 입력된 경우에만 숫자 범위를 검사합니다.
   */
  const parseOptionalNumber = (
    value: string,
    fieldName: string,
    min: number,
    max: number,
    integerOnly = false
  ): number | null => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);

    if (!Number.isFinite(parsedValue)) {
      throw new Error(`${fieldName} must be a valid number.`);
    }

    if (integerOnly && !Number.isInteger(parsedValue)) {
      throw new Error(`${fieldName} must be a whole number.`);
    }

    if (parsedValue < min || parsedValue > max) {
      throw new Error(
        `${fieldName} must be between ${min} and ${max}.`
      );
    }

    return parsedValue;
  };

  const validateProfile = () => {
    return {
      age: parseOptionalNumber(
        profile.age,
        "Age",
        1,
        120,
        true
      ),

      height: parseOptionalNumber(
        profile.height,
        "Height",
        50,
        250
      ),

      weight: parseOptionalNumber(
        profile.weight,
        "Weight",
        20,
        300
      ),

      sessions: parseOptionalNumber(
        profile.sessions,
        "Weekly sessions",
        0,
        14,
        true
      ),
    };
  };

  /**
   * Supabase에서 현재 사용자의 프로필을 불러옵니다.
   */
  const loadProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You need to sign in first.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            age,
            height_cm,
            weight_kg,
            climbing_experience,
            sessions_per_week,
            current_grade,
            goal_grade
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // 아직 프로필 행이 없다면 빈 입력 상태를 유지합니다.
      if (!data) {
        return;
      }

      setProfile((previousProfile) => ({
        ...previousProfile,
        age: data.age?.toString() ?? "",
        height: data.height_cm?.toString() ?? "",
        weight: data.weight_kg?.toString() ?? "",
        experience: data.climbing_experience ?? "",
        sessions: data.sessions_per_week?.toString() ?? "",
        currentGrade: data.current_grade ?? "",
        goalGrade: data.goal_grade ?? "",
      }));
    } catch (error) {
      console.error("Failed to load profile:", error);

      showMessage(
        "Unable to load profile",
        error instanceof Error
          ? error.message
          : "Your profile information could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력된 값만 저장합니다.
   * 비어 있는 항목은 null로 저장됩니다.
   */
  const handleSave = async () => {
    try {
      setSaving(true);

      const validatedProfile = validateProfile();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You need to sign in first.");
      }

      /*
       * 기존 profiles 행에서 username을 확인합니다.
       * 행이 없다면 회원가입 metadata 또는 가상 이메일 앞부분을 사용합니다.
       */
      const {
        data: existingProfile,
        error: profileLookupError,
      } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileLookupError) {
        throw profileLookupError;
      }

      const username =
        existingProfile?.username ??
        user.user_metadata?.username ??
        user.email?.split("@")[0];

      if (!username) {
        throw new Error(
          "Your username could not be identified."
        );
      }

      const profileData = {
        user_id: user.id,
        username,

        age: validatedProfile.age,
        height_cm: validatedProfile.height,
        weight_kg: validatedProfile.weight,
        sessions_per_week: validatedProfile.sessions,

        climbing_experience:
          profile.experience.trim() || null,

        current_grade:
          profile.currentGrade.trim().toUpperCase() || null,

        goal_grade:
          profile.goalGrade.trim().toUpperCase() || null,

        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        });

      if (error) {
        throw error;
      }

      showMessage(
        "Profile saved",
        "Your profile has been saved successfully. The AI coach can use the information you provided for personalized coaching."
      );
    } catch (error) {
      console.error("Failed to save profile:", error);

      showMessage(
        "Unable to save profile",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Supabase 세션을 종료합니다.
   * App.tsx가 세션 변경을 감지하여 로그인 화면으로 이동합니다.
   */
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to sign out:", error);

      showMessage(
        "Unable to sign out",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while signing out."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="My Profile" />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={ACCENT_COLOR}
          />

          <Text style={styles.loadingText}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="My Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileSection}>
          <Text style={styles.inputLabel}>
            Personal Information
          </Text>

          <Text style={styles.optionalNotice}>
            All fields are optional. Enter only the information
            you would like the AI coach to use.
          </Text>

          <Text style={styles.subLabel}>
            Height (cm)
          </Text>

          <TextInput
            style={styles.profileInput}
            value={profile.height}
            onChangeText={(text) =>
              setProfile((previousProfile) => ({
                ...previousProfile,
                height: text,
              }))
            }
            keyboardType="decimal-pad"
            placeholder="Enter your height, e.g. 170"
            placeholderTextColor={PLACEHOLDER_COLOR}
            editable={!saving && !loggingOut}
          />

          <Text style={styles.subLabel}>
            Weight (kg)
          </Text>

          <TextInput
            style={styles.profileInput}
            value={profile.weight}
            onChangeText={(text) =>
              setProfile((previousProfile) => ({
                ...previousProfile,
                weight: text,
              }))
            }
            keyboardType="decimal-pad"
            placeholder="Enter your weight, e.g. 70"
            placeholderTextColor={PLACEHOLDER_COLOR}
            editable={!saving && !loggingOut}
          />

          <Text style={styles.subLabel}>Age</Text>

          <TextInput
            style={styles.profileInput}
            value={profile.age}
            onChangeText={(text) =>
              setProfile((previousProfile) => ({
                ...previousProfile,
                age: text,
              }))
            }
            keyboardType="number-pad"
            placeholder="Enter your age, e.g. 25"
            placeholderTextColor={PLACEHOLDER_COLOR}
            editable={!saving && !loggingOut}
          />

          <Text style={styles.sectionLabel}>
            Climbing Information
          </Text>

          <Text style={styles.subLabel}>
            Climbing Experience
          </Text>

          <TextInput
            style={styles.profileInput}
            value={profile.experience}
            onChangeText={(text) =>
              setProfile((previousProfile) => ({
                ...previousProfile,
                experience: text,
              }))
            }
            placeholder="Enter your experience, e.g. 1 year"
            placeholderTextColor={PLACEHOLDER_COLOR}
            editable={!saving && !loggingOut}
          />

          <Text style={styles.subLabel}>
            Sessions per Week
          </Text>

          <TextInput
            style={styles.profileInput}
            value={profile.sessions}
            onChangeText={(text) =>
              setProfile((previousProfile) => ({
                ...previousProfile,
                sessions: text,
              }))
            }
            keyboardType="number-pad"
            placeholder="Enter a number, e.g. 3"
            placeholderTextColor={PLACEHOLDER_COLOR}
            editable={!saving && !loggingOut}
          />

          <View style={styles.row}>
            <View style={styles.leftColumn}>
              <Text style={styles.subLabel}>
                Current Grade
              </Text>

              <TextInput
                style={styles.profileInput}
                value={profile.currentGrade}
                onChangeText={(text) =>
                  setProfile((previousProfile) => ({
                    ...previousProfile,
                    currentGrade: text,
                  }))
                }
                autoCapitalize="characters"
                placeholder="e.g. V1"
                placeholderTextColor={PLACEHOLDER_COLOR}
                editable={!saving && !loggingOut}
              />
            </View>

            <View style={styles.rightColumn}>
              <Text style={styles.subLabel}>
                Goal Grade
              </Text>

              <TextInput
                style={styles.profileInput}
                value={profile.goalGrade}
                onChangeText={(text) =>
                  setProfile((previousProfile) => ({
                    ...previousProfile,
                    goalGrade: text,
                  }))
                }
                autoCapitalize="characters"
                placeholder="e.g. V7"
                placeholderTextColor={PLACEHOLDER_COLOR}
                editable={!saving && !loggingOut}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving || loggingOut}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Profile
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              loggingOut && styles.disabledButton,
            ]}
            onPress={handleLogout}
            disabled={saving || loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text style={styles.logoutButtonText}>
                Sign Out
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingBottom: 40,
  },

  profileSection: {
    backgroundColor: "#FFFFFF",
  },

  inputLabel: {
    marginBottom: 6,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },

  optionalNotice: {
    marginBottom: 12,
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },

  sectionLabel: {
    marginTop: 24,
    marginBottom: 10,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },

  subLabel: {
    marginTop: 12,
    marginBottom: 6,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  profileInput: {
    padding: 12,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
  },

  leftColumn: {
    flex: 1,
    marginRight: 8,
  },

  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },

  saveButton: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    paddingVertical: 15,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  logoutButton: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
  },

  logoutButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
});