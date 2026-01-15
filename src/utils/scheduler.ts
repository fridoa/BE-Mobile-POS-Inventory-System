import cron from "node-cron";
import NotificationModel from "../models/notification.model";
import ProductModel from "../models/product.model";
import { notificationService } from "../services/notification.service";
import { ROLES } from "./constants";

export const initScheduledJobs = () => {
  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("[CRON] Mulai pembersihan notifikasi lama...");
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await NotificationModel.deleteMany({
          createdAt: { $lt: thirtyDaysAgo },
        });

        console.log(`[CRON] Terhapus ${result.deletedCount} notifikasi usang.`);
      } catch (error) {
        console.error("[CRON] Gagal membersihkan notifikasi:", error);
      }
    },
    { timezone: "Asia/Jakarta" }
  );

  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("[CRON] Checking expiring products...");
      try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringProducts = await ProductModel.find({
          expiryDate: {
            $gte: new Date(),
            $lte: sevenDaysFromNow,
          },
          isActive: true,
        }).select("name expiryDate");

        if (expiringProducts.length === 0) return;

        if (expiringProducts.length <= 5) {
          for (const prod of expiringProducts) {
            if (prod.expiryDate) {
              const dateStr = new Date(prod.expiryDate).toLocaleDateString("id-ID");

              await notificationService.send({
                title: "⏰ Produk Hampir Expired!",
                message: `${prod.name} akan expired pada tgl ${dateStr}. Segera diskon atau habiskan!`,
                type: "WARNING",
                targetRole: ROLES.ADMIN,
                data: { productId: prod._id.toString(), type: "PRODUCT_DETAIL" },
              });
            }
          }
        } else {
          await notificationService.send({
            title: "⚠️ Alert Inventory Mingguan",
            message: `Ada ${expiringProducts.length} produk yang akan expired dalam 7 hari kedepan. Cek laporan sekarang!`,
            type: "WARNING",
            targetRole: ROLES.ADMIN,
            data: { type: "EXPIRY_REPORT_SCREEN" },
          });
        }
      } catch (error) {
        console.error("[CRON] Expiry check failed:", error);
      }
    },
    { timezone: "Asia/Jakarta" }
  );
};
