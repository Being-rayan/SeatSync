const express = require("express");
const swapController = require("../controllers/swapController");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);
router.post("/", asyncHandler(swapController.createSwap));
router.get("/incoming", asyncHandler(swapController.incoming));
router.get("/outgoing", asyncHandler(swapController.outgoing));
router.get("/:id", asyncHandler(swapController.getById));
router.patch("/:id/accept", asyncHandler(swapController.accept));
router.patch("/:id/reject", asyncHandler(swapController.reject));
router.patch("/:id/cancel", asyncHandler(swapController.cancel));
router.patch("/:id/final-confirm", asyncHandler(swapController.finalConfirm));

module.exports = router;
