import NotificationModel from "../models/notification.model";
import UserModel from "../models/user.model";
import { sendMulticastNotification } from "../utils/fcm.util";

interface SendNotifParams {
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  data?: Record<string, string> | any;
  targetRole?: string | string[];
  userId?: string[];
}

export const notificationService = {
  async send(params: SendNotifParams) {
    try {
      let query: any = { isActive: true };

      if (params.userId && params.userId.length > 0) {
        query._id = { $in: params.userId };
      } else if (params.targetRole) {
        const roles = Array.isArray(params.targetRole) ? params.targetRole : [params.targetRole];
        query.role = { $in: roles };
      } else {
        query.role = "admin";
      }

      const users = await UserModel.find(query).select("_id fcmToken");
      if (users.length === 0) return;

      const dbNotifications = users.map((u) => ({
        userId: u._id,
        title: params.title,
        message: params.message,
        type: params.type,
        data: params.data,
        isRead: false,
      }));

      await NotificationModel.insertMany(dbNotifications);

      const fcmTokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t && t.length > 10);

      if (fcmTokens.length > 0) {
        const fcmResult = await sendMulticastNotification(fcmTokens, params.title, params.message, params.data);

        if (fcmResult.failedTokens.length > 0) {
          await UserModel.updateMany({ fcmToken: { $in: fcmResult.failedTokens } }, { $unset: { fcmToken: 1 } });
        }
      }
    } catch (error) {
      console.error("[NotificationService] Error:", error);
    }
  },
};
