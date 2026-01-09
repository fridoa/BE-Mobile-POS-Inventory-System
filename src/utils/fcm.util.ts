import admin from "firebase-admin";
import { env } from "./env";
import path from "path";

const serviceAccountPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

export const sendNotification = async (token: string, title: string, body: string) => {
  if (!token) return;

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notifikasi berhasil dikirim:", response);
    return response;
  } catch (error) {
    console.error("Gagal mengirim notifikasi FCM:", error);
  }
};
