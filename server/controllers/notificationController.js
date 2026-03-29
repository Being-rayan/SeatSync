const { notificationService } = require("../services/notificationService");

async function list(req, res) {
  const data = await notificationService.list(req.user.id);
  res.status(200).json({ data });
}

async function markRead(req, res) {
  const data = await notificationService.markRead(req.user.id, req.params.id);
  res.status(200).json({ data });
}

module.exports = {
  list,
  markRead
};
