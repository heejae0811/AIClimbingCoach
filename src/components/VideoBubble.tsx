import React from "react";
import { StyleSheet } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

export function VideoBubble({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
  });
  return <VideoView style={styles.mediaVideo} player={player} />;
}

const styles = StyleSheet.create({
  mediaVideo: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    backgroundColor: "black",
  },
});
