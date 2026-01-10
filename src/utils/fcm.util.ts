import admin from "firebase-admin";
import { env } from "./env";
import path from "path";
import UserModel from "../models/user.model";

const serviceAccountPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

export const sendMulticastNotification = async (tokens: string[], title: string, body: string, data?: Record<string, string>) => {
  const uniqueTokens = [...new Set(tokens.filter((t) => t))];

  if (uniqueTokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    notification: {
      title: title,
      body: body,
    },
    data: data || {},
    tokens: uniqueTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error?.code === "messaging/registration-token-not-registered" || error?.code === "messaging/invalid-argument") {
            failedTokens.push(uniqueTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        console.log("Token FCM yang tidak valid atau sudah tidak terdaftar:", failedTokens);
        await UserModel.updateMany({ fcmToken: { $in: failedTokens } }, { $unset: { fcmToken: 1 } });
      }
    }
    console.log(`FCM Sent: ${response.successCount} success, ${response.failureCount} failed.`);
    return response;
  } catch (error) {
    console.error("Gagal mengirim notifikasi FCM:", error);
  }
};
