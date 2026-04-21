import { Router } from "express";
import { uploads } from "../middlewares/upload.middleware";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.patch("/users/:id", authorizedMiddleware, authController.updateProfile);
router.get("/whoami", authorizedMiddleware, authController.getProfile);

router.put(
  "/update-profile",
  authorizedMiddleware,
  uploads.single("image"), // "image" - field name from frontend/client
  authController.updateProfile,
);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
