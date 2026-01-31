import cron from "node-cron";
import ProductModel from "../models/product.model";
import { notificationService } from "../services/notification.service";
import { ROLES } from "./constants";

export const initScheduledJobs = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);

        const expiringProducts = await ProductModel.find({
          expiryDate: {
            $gte: todayStart,
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
                title: "⏰ Produk Hampir Kadaluwarsa!",
                message: `${prod.name} akan kadaluwarsa pada ${dateStr}. Segera beri diskon atau habiskan stok!`,
                type: "WARNING",
                targetRole: ROLES.ADMIN,
                data: { productId: prod._id.toString(), type: "PRODUCT_DETAIL" },
              });
            }
          }
        } else {
          await notificationService.send({
            title: "⚠️ Peringatan Inventaris Mingguan",
            message: `Ada ${expiringProducts.length} produk yang kadaluwarsa dalam 7 hari ke depan. Cek laporan sekarang!`,
            type: "WARNING",
            targetRole: ROLES.ADMIN,
            data: { type: "EXPIRY_REPORT_SCREEN" },
          });
        }
      } catch (error) {
        console.error("[CRON] Gagal menjalankan pengecekan kadaluwarsa:", error);
      }
    },
    { timezone: "Asia/Jakarta" },
  );
};
