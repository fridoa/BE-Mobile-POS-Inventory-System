import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import authController from "../controllers/auth.controller";
import aclMiddleware from "../middlewares/acl.middleware";
import { ROLES } from "../utils/constants";
import validatorMiddleware from "../middlewares/validator.middleware";
import { userSchema, userUpdateSchema } from "../validators/user.validate";
import userController from "../controllers/user.controller";
import { categorySchema } from "../validators/category.validate";
import categoryController from "../controllers/category.controller";
import { productSchema, productUpdateSchema } from "../validators/product.validate";
import productController from "../controllers/product.controller";
import mediaMiddleware from "../middlewares/media.middleware";
import mediaController from "../controllers/media.controller";
import { transactionSchema } from "../validators/transaction.validate";
import transactionController from "../controllers/transaction.controller";
import reportController from "../controllers/report.controller";
import notificationController from "../controllers/notification.controller";
import { forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from "../validators/auth.validate";

const router = express.Router();
router.post("/auth/login", authMiddleware.validateLogin, authController.loginController);
router.post("/auth/logout", authMiddleware.authorization, authController.logoutController);
router.post("/auth/refresh-token", authController.refreshTokenController);
router.get("/auth/profile", authMiddleware.authorization, authController.getProfileController);
router.patch("/auth/update-profile", authMiddleware.authorization, validatorMiddleware.validate(updateProfileSchema), authController.updateProfileController);
router.put("/auth/change-password", authMiddleware.authorization, authMiddleware.validateChangePassword, authController.changePasswordController);
router.patch("/auth/update-fcm-token", authMiddleware.authorization, userController.updateFCMToken);
router.post("/auth/forgot-password", validatorMiddleware.validate(forgotPasswordSchema), authController.forgotPasswordController);
router.post("/auth/reset-password", validatorMiddleware.validate(resetPasswordSchema), authController.resetPasswordController);
router.get("/auth/reset-redirect", authController.resetRedirect);

router.post("/user", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(userSchema)], userController.create);
router.get("/user", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), userController.findAll);
router.get("/user/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), userController.findOne);
router.put("/user/:id", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(userUpdateSchema)], userController.update);
router.delete("/user/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), userController.remove);

router.post("/category", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(categorySchema)], categoryController.create);
router.get("/category", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), categoryController.findAll);
router.get("/category/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), categoryController.findOne);
router.put("/category/:id", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(categorySchema)], categoryController.update);
router.delete("/category/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), categoryController.remove);

router.post("/product", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(productSchema)], productController.create);
router.get("/product", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), productController.findAll);
router.get("/product/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), productController.findOne);
router.get("/product/sku/:sku", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), productController.findBySKU);
router.put("/product/:id", [authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), validatorMiddleware.validate(productUpdateSchema)], productController.update);
router.delete("/product/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), productController.remove);

router.post("/media/upload-single", mediaMiddleware.single("file"), mediaController.single);
router.post("/media/upload-multiple", mediaMiddleware.multiple("files", 5), mediaController.multiple);
router.delete("/media/remove", mediaController.remove);

router.post("/transaction", [authMiddleware.authorization, aclMiddleware([ROLES.KASIR]), validatorMiddleware.validate(transactionSchema)], transactionController.create);
router.get("/transaction", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), transactionController.findAll);
router.get("/transaction/:id", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), transactionController.findOne);

router.get("/report/sales-summary", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN, ROLES.KASIR]), reportController.getSalesSummary);
router.get("/report/top-products", authMiddleware.authorization, aclMiddleware([ROLES.ADMIN]), reportController.getTopSellingProducts);

router.get("/notification", authMiddleware.authorization, notificationController.findAll);
router.get("/notification/unread-count", authMiddleware.authorization, notificationController.countUnread);
router.patch("/notification/:id/mark-as-read", authMiddleware.authorization, notificationController.markAsRead);
router.patch("/notification/mark-all-read", authMiddleware.authorization, notificationController.markAllRead);

export default router;
