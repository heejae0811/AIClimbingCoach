import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import * as tus from "tus-js-client";

import { supabase } from "../../lib/supabase";

const VIDEO_BUCKET = "climbing-videos";

interface UploadNativeVideoOptions {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  onProgress?: (percentage: number) => void;
}

interface UploadWebVideoOptions {
  file: File;
  onProgress?: (percentage: number) => void;
}

export async function uploadVideoWeb({
  file,
  onProgress,
}: UploadWebVideoOptions): Promise<string> {
  if (Platform.OS !== "web") {
    throw new Error(
      "uploadVideoWeb can only be used on the web."
    );
  }

  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("You need to sign in first.");
  }

  const safeFileName = sanitizeFileName(file.name);

  const storagePath =
    `${session.user.id}/${Date.now()}-${safeFileName}`;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint:
        `${supabaseUrl}/storage/v1/upload/resumable`,

      headers: {
        authorization:
          `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
        "x-upsert": "false",
      },

      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,

      metadata: {
        bucketName: VIDEO_BUCKET,
        objectName: storagePath,
        contentType: file.type || "video/mp4",
        cacheControl: "3600",
      },

      onProgress(bytesUploaded, bytesTotal) {
        if (bytesTotal > 0) {
          onProgress?.(
            Math.round(
              (bytesUploaded / bytesTotal) * 100
            )
          );
        }
      },

      onError(error) {
        reject(error);
      },

      onSuccess() {
        resolve();
      },
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(
            previousUploads[0]
          );
        }

        upload.start();
      })
      .catch(reject);
  });

  return storagePath;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtension(
  fileName?: string | null,
  mimeType?: string | null
): string {
  const existingExtension = fileName
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (
    existingExtension &&
    ["mp4", "mov", "m4v", "webm", "avi"].includes(
      existingExtension
    )
  ) {
    return existingExtension;
  }

  if (mimeType?.includes("quicktime")) {
    return "mov";
  }

  if (mimeType?.includes("webm")) {
    return "webm";
  }

  if (mimeType?.includes("x-m4v")) {
    return "m4v";
  }

  if (mimeType?.includes("x-msvideo")) {
    return "avi";
  }

  return "mp4";
}

export async function uploadVideoNative({
  uri,
  fileName,
  mimeType,
  onProgress,
}: UploadNativeVideoOptions): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error(
      "uploadVideoNative cannot be used on the web."
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("You need to sign in first.");
  }

  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new Error("The selected video file could not be found.");
  }

  const maximumFileSize = 50 * 1024 * 1024;

  if (
    typeof fileInfo.size === "number" &&
    fileInfo.size > maximumFileSize
  ) {
    throw new Error(
      "The selected video is larger than the 50 MB upload limit."
    );
  }

  onProgress?.(10);

  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  onProgress?.(45);

  const arrayBuffer = decode(base64Data);

  const extension = getExtension(fileName, mimeType);

  const safeFileName = sanitizeFileName(
    fileName || `climb_video.${extension}`
  );

  const storagePath =
    `${session.user.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: mimeType || `video/${extension}`,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  onProgress?.(100);

  return storagePath;
}