import cron from "node-cron";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import { ROLES } from "../utils/constants";
import { sendMulticastNotification } from "../utils/fcm.util";

// Berjalan setiap hari jam 08:00 pagi
cron.schedule("0 8 * * *", async () => {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Cari produk yang expired dalam 7 hari kedepan
    const expiringProducts = await ProductModel.find({
      expiryDate: {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      },
      isActive: true,
    }).select("name expiryDate");

    if (expiringProducts.length === 0) return;

    const users = await UserModel.find({
      role: ROLES.ADMIN,
      fcmToken: { $exists: true, $ne: null },
    }).select("fcmToken");

    const targetTokens = users.map((u) => u.fcmToken as string);
    if (targetTokens.length === 0) return;

    if (expiringProducts.length <= 5) {
      for (const prod of expiringProducts) {
        if (prod.expiryDate) {
          const dateString = new Date(prod.expiryDate).toLocaleDateString("id-ID");

          await sendMulticastNotification(targetTokens, "⏰ Produk Hampir Expired!", `${prod.name} expired tgl ${dateString}.`, { productId: prod._id.toString() });
        }
      }
    } else {
      await sendMulticastNotification(targetTokens, "⚠️ Alert Inventory", `Ada ${expiringProducts.length} produk yang akan expired minggu ini. Cek aplikasi sekarang!`);
    }
  } catch (error) {
    console.error("[Job Error] Expiry job failed:", error);
  }
});
