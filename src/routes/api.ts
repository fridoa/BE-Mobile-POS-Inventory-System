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

const router = express.Router();
router.post("/auth/login", authMiddleware.validateLogin, authController.loginController);
router.post("/auth/refresh-token", authController.refreshTokenController);
router.get("/auth/profile", authMiddleware.authorization, authController.getProfileController);
router.put("/auth/change-password", authMiddleware.authorization, authMiddleware.validateChangePassword, authController.changePasswordController);

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

export default router;
