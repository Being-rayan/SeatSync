const express = require("express");
const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { ROLES } = require("../utils/constants");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMIN));
router.get("/journeys", asyncHandler(adminController.journeys));
router.get("/users", asyncHandler(adminController.users));
router.get("/swaps", asyncHandler(adminController.swaps));
router.get("/analytics", asyncHandler(adminController.analytics));
router.get("/seats", asyncHandler(adminController.seats));
router.patch("/seats/:id/lock", asyncHandler(adminController.lockSeat));
router.patch("/seats/:id/unlock", asyncHandler(adminController.unlockSeat));

module.exports = router;
