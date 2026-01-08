import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import authController from "../controllers/auth.controller";

const router = express.Router();
router.post("/auth/login", authMiddleware.validateLogin, authController.loginController);
router.post("/auth/refresh-token", authController.refreshTokenController);
router.get("/auth/profile", authMiddleware.authorization, authController.getProfileController);
router.put("/auth/change-password", authMiddleware.authorization, authMiddleware.validateChangePassword, authController.changePasswordController);

export default router;
