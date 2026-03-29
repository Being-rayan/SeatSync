const express = require("express");
const notificationController = require("../controllers/notificationController");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);
router.get("/", asyncHandler(notificationController.list));
router.patch("/:id/read", asyncHandler(notificationController.markRead));

module.exports = router;
