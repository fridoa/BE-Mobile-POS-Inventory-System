import { Response } from "express";
import { IAuthRequest } from "../utils/interfaces";
import NotificationModel from "../models/notification.model";
import { success, error, pagination } from "../utils/response";

export default {
  async findAll(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find All Notifications'
        #swagger.tags = ['Notification']
    */
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const userId = req.user?._id;

      const query = { userId };

      const [count, notifications] = await Promise.all([
        NotificationModel.countDocuments(query),
        NotificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

      pagination(
        res,
        "Data notifikasi berhasil diambil",
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        notifications
      );
    } catch (err) {
      error(res, err, "Gagal mengambil notifikasi");
    }
  },

  async countUnread(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Count Unread Notifications'
        #swagger.tags = ['Notification']
    */
    try {
      const userId = req.user?._id;
      const count = await NotificationModel.countDocuments({ userId, isRead: false });

      success(res, { count }, "Jumlah unread berhasil diambil");
    } catch (err) {
      error(res, err, "Gagal menghitung unread");
    }
  },

  async markAsRead(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Mark Notification as Read'
        #swagger.tags = ['Notification']
    */
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const notif = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });

      if (!notif) return error(res, null, "Notifikasi tidak ditemukan", 404);

      success(res, notif, "Notifikasi ditandai sudah dibaca");
    } catch (err) {
      error(res, err, "Gagal update status");
    }
  },

  async markAllRead(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Mark All Notifications as Read'
        #swagger.tags = ['Notification']
    */
    try {
      const userId = req.user?._id;
      await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });

      success(res, null, "Semua notifikasi telah ditandai sudah dibaca");
    } catch (err) {
      error(res, err, "Gagal update semua status");
    }
  },
};
