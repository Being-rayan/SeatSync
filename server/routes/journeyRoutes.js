const express = require("express");
const journeyController = require("../controllers/journeyController");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/verify", authenticate, asyncHandler(journeyController.verifyJourney));
router.get("/current", authenticate, asyncHandler(journeyController.currentJourney));

module.exports = router;
