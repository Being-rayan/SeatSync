const { journeyService } = require("../services/journeyService");

async function verifyJourney(req, res) {
  const data = await journeyService.verifyJourney(req.user, req.body);
  res.status(200).json({ data });
}

async function currentJourney(req, res) {
  const data = await journeyService.getCurrentJourney(req.user.id);
  res.status(200).json({ data });
}

async function seatMap(req, res) {
  const data = await journeyService.getSeatMap(req.user, req.params.journeyId);
  res.status(200).json({ data });
}

module.exports = {
  currentJourney,
  seatMap,
  verifyJourney
};
