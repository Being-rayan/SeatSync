const ApiError = require("../utils/apiError");
const { verifyToken } = require("../utils/token");

function authenticate(req, _res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required."));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return next(new ApiError(401, "Authentication token is invalid or expired."));
  }
}

module.exports = authenticate;
