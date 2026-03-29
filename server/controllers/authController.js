const { authService } = require("../services/authService");

async function register(req, res) {
  const data = await authService.register(req.body);
  res.status(201).json({ data });
}

async function login(req, res) {
  const data = await authService.login(req.body);
  res.status(200).json({ data });
}

async function me(req, res) {
  const data = await authService.me(req.user.id);
  res.status(200).json({ data });
}

module.exports = {
  login,
  me,
  register
};
