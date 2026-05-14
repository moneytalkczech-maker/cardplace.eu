import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validateBody, addToCollectionSchema, updateCollectionItemSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as collectionController from "../controllers/collectionController";

const router = Router();

router.get("/:userId", asyncHandler(collectionController.getUserCollection));
router.get("/:userId/value", asyncHandler(collectionController.getCollectionValue));
router.post("/", authenticate, validateBody(addToCollectionSchema), asyncHandler(collectionController.addItem));
router.patch("/:id", authenticate, validateBody(updateCollectionItemSchema), asyncHandler(collectionController.updateItem));
router.delete("/:id", authenticate, asyncHandler(collectionController.removeItem));

export default router;
