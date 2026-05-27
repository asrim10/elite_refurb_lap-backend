import { Router } from "express";
import { WishlistController } from "../controllers/wishlist.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const wishlistController = new WishlistController();

// Public routes
router.get(
  "/public",
  wishlistController.getAllPublicWishlists.bind(wishlistController),
);
router.get(
  "/public/:userId",
  wishlistController.getPublicWishlist.bind(wishlistController),
);

// Protected routes
router.post(
  "/",
  authorizedMiddleware,
  wishlistController.create.bind(wishlistController),
);

router.get(
  "/my-wishlist",
  authorizedMiddleware,
  wishlistController.getMyWishlist.bind(wishlistController),
);

router.post(
  "/add-laptop",
  authorizedMiddleware,
  wishlistController.addLaptop.bind(wishlistController),
);

router.post(
  "/remove-laptop",
  authorizedMiddleware,
  wishlistController.removeLaptop.bind(wishlistController),
);

router.post(
  "/clear",
  authorizedMiddleware,
  wishlistController.clear.bind(wishlistController),
);

router.patch(
  "/",
  authorizedMiddleware,
  wishlistController.update.bind(wishlistController),
);

router.delete(
  "/",
  authorizedMiddleware,
  wishlistController.delete.bind(wishlistController),
);

router.get(
  "/check/:laptopId",
  authorizedMiddleware,
  wishlistController.checkLaptopInWishlist.bind(wishlistController),
);

export default router;
