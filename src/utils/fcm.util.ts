import admin from "firebase-admin";
import { env } from "./env";
import path from "path";

const serviceAccountPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
}

export interface FCMResult {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}

export const sendMulticastNotification = async (tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<FCMResult> => {
  const uniqueTokens = [...new Set(tokens.filter((t) => t))];

  const result: FCMResult = { successCount: 0, failureCount: 0, failedTokens: [] };

  if (uniqueTokens.length === 0) return result;

  const message: admin.messaging.MulticastMessage = {
    notification: { title, body },
    data: data || {},
    tokens: uniqueTokens,
    android: {
      priority: "high",
      notification: {
        channelId: "default",
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    result.successCount = response.successCount;
    result.failureCount = response.failureCount;

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;

          if (error?.code === "messaging/registration-token-not-registered" || error?.code === "messaging/invalid-argument") {
            result.failedTokens.push(uniqueTokens[idx]);
          }
        }
      });
    }

    return result;
  } catch (error) {
    console.error("Gagal mengirim notifikasi FCM:", error);
    return result;
  }
};
