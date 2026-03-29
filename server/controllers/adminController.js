const { adminService } = require("../services/adminService");

async function journeys(req, res) {
  const data = await adminService.listJourneys(req.query);
  res.status(200).json({ data });
}

async function users(req, res) {
  const data = await adminService.listUsers();
  res.status(200).json({ data });
}

async function swaps(req, res) {
  const data = await adminService.listSwaps(req.query);
  res.status(200).json({ data });
}

async function analytics(req, res) {
  const data = await adminService.getAnalytics();
  res.status(200).json({ data });
}

async function seats(req, res) {
  const data = await adminService.listSeats(req.query);
  res.status(200).json({ data });
}

async function lockSeat(req, res) {
  const data = await adminService.lockSeat(req.user, req.params.id);
  res.status(200).json({ data });
}

async function unlockSeat(req, res) {
  const data = await adminService.unlockSeat(req.user, req.params.id);
  res.status(200).json({ data });
}

module.exports = {
  analytics,
  journeys,
  lockSeat,
  seats,
  swaps,
  unlockSeat,
  users
};
