const ApiError = require("../utils/apiError");

function requireRole(role) {
  return function roleGuard(req, _res, next) {
    if (!req.user || req.user.role !== role) {
      return next(new ApiError(403, "You do not have access to this resource."));
    }

    return next();
  };
}

module.exports = requireRole;
