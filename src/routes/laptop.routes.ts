import { Router } from "express";
import { LaptopController } from "../controllers/laptop.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

const router = Router();
const laptopController = new LaptopController();

// Public routes
router.get("/", laptopController.getAll.bind(laptopController));
router.get(
  "/seller/my-listings",
  authorizedMiddleware,
  laptopController.getMyListings.bind(laptopController),
);
router.get(
  "/seller/:sellerId",
  laptopController.getSellerListings.bind(laptopController),
);
router.get("/:id", laptopController.getById.bind(laptopController));

// Protected routes
router.post(
  "/",
  authorizedMiddleware,
  uploads.array("images", 6),
  laptopController.create.bind(laptopController),
);
router.get(
  "/seller/my-listings",
  authorizedMiddleware,
  laptopController.getMyListings.bind(laptopController),
);
router.patch(
  "/:id",
  authorizedMiddleware,
  uploads.array("images", 6),
  laptopController.update.bind(laptopController),
);
router.delete(
  "/:id",
  authorizedMiddleware,
  laptopController.delete.bind(laptopController),
);

export default router;
