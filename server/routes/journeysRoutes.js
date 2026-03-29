const express = require("express");
const journeyController = require("../controllers/journeyController");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/:journeyId/seats", authenticate, asyncHandler(journeyController.seatMap));

module.exports = router;
