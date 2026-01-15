import mongoose from "mongoose";

export interface INotification {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  isRead: boolean;
  data?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["INFO", "WARNING", "SUCCESS", "ERROR"],
      default: "INFO",
    },
    isRead: {
      type: Boolean,
      default: false,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

NotificationSchema.index({ userId: 1, isRead: 1 });

const NotificationModel = mongoose.model<INotification>("Notification", NotificationSchema);

export default NotificationModel;
