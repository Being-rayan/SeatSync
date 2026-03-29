const { swapService } = require("../services/swapService");

async function createSwap(req, res) {
  const data = await swapService.createSwapRequest(req.user, req.body);
  res.status(201).json({ data });
}

async function incoming(req, res) {
  const data = await swapService.listIncoming(req.user, req.query.journeyId);
  res.status(200).json({ data });
}

async function outgoing(req, res) {
  const data = await swapService.listOutgoing(req.user, req.query.journeyId);
  res.status(200).json({ data });
}

async function getById(req, res) {
  const data = await swapService.getById(req.user, req.params.id);
  res.status(200).json({ data });
}

async function accept(req, res) {
  const data = await swapService.accept(req.user, req.params.id);
  res.status(200).json({ data });
}

async function reject(req, res) {
  const data = await swapService.reject(req.user, req.params.id);
  res.status(200).json({ data });
}

async function cancel(req, res) {
  const data = await swapService.cancel(req.user, req.params.id);
  res.status(200).json({ data });
}

async function finalConfirm(req, res) {
  const data = await swapService.finalConfirm(req.user, req.params.id);
  res.status(200).json({ data });
}

module.exports = {
  accept,
  cancel,
  createSwap,
  finalConfirm,
  getById,
  incoming,
  outgoing,
  reject
};
