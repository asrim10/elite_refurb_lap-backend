import { Router } from "express";
import { RatingController } from "../controllers/rating.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const ratingController = new RatingController();

// Public routes
router.get(
  "/seller/:sellerId",
  ratingController.getSellerRatings.bind(ratingController),
);
router.get("/", ratingController.getAll.bind(ratingController));
router.get("/:id", ratingController.getById.bind(ratingController));

// Protected routes
router.post(
  "/",
  authorizedMiddleware,
  ratingController.create.bind(ratingController),
);
router.patch(
  "/:id",
  authorizedMiddleware,
  ratingController.update.bind(ratingController),
);
router.delete(
  "/:id",
  authorizedMiddleware,
  ratingController.delete.bind(ratingController),
);

export default router;
