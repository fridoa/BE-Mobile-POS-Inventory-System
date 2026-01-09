import cron from "node-cron";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import { sendNotification } from "../utils/fcm.util";

// Berjalan setiap hari jam 08:00 pagi
cron.schedule("0 8 * * *", async () => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Cari produk yang expired dalam 7 hari kedepan
  const expiringProducts = await ProductModel.find({
    expiryDate: {
      $gte: new Date(),
      $lte: sevenDaysFromNow,
    },
  });

  if (expiringProducts.length > 0) {
    const adminUser = await UserModel.findOne({ role: "ADMIN" });
    if (adminUser && adminUser?.fcmToken) {
        const token = adminUser.fcmToken;
      expiringProducts.forEach(async (prod) => {
        await sendNotification(token, "⏰ Produk Hampir Expired!", `${prod.name} akan expired dalam 7 hari. Berikan diskon segera!`);
      });
    }
  }
});
