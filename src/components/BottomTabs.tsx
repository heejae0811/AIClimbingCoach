import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { Tab } from "../types";
import { ACCENT_COLOR } from "../constants/theme";

interface BottomTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onTabPress?: () => void;
}

export const BottomTabs = ({ activeTab, setActiveTab, onTabPress }: BottomTabsProps) => {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: "Coach", icon: "💬" },
    { id: "analyze", label: "Analyze", icon: "🧗" },
    { id: "history", label: "History", icon: "📊" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => {
            setActiveTab(tab.id);
            if (onTabPress) onTabPress();
          }}
        >
          <Text style={{ fontSize: 20, opacity: activeTab === tab.id ? 1 : 0.4 }}>
            {tab.icon}
          </Text>
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? ACCENT_COLOR : "#94A3B8" },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
