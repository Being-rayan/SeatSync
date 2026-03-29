const bcrypt = require("bcrypt");
const {
  auditRepository,
  journeyRepository,
  userRepository
} = require("../runtime/repositories");
const ApiError = require("../utils/apiError");
const { ROLES } = require("../utils/constants");
const { serializeJourneyContext, serializeUser } = require("../utils/serializers");
const { signToken } = require("../utils/token");
const { assertEmail, assertPassword, assertRequiredString } = require("../utils/validators");

function createAuthService(dependencies = {}) {
  const users = dependencies.userRepository || userRepository;
  const journeys = dependencies.journeyRepository || journeyRepository;
  const auditLogs = dependencies.auditRepository || auditRepository;

  async function register(payload) {
    const name = assertRequiredString(payload.name, "Name", { minLength: 2, maxLength: 120 });
    const email = assertEmail(payload.email);
    const password = assertPassword(payload.password);
    const existingUser = await users.findByEmail(email);

    if (existingUser) {
      throw new ApiError(409, "An account already exists with that email.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.createUser({
      name,
      email,
      passwordHash,
      role: ROLES.PASSENGER
    });

    await auditLogs.logAction({
      actorUserId: user.id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      details: { role: user.role }
    });

    return {
      token: signToken({ id: user.id, email: user.email, role: user.role }),
      user: serializeUser(user)
    };
  }

  async function login(payload) {
    const email = assertEmail(payload.email);
    const password = assertPassword(payload.password);
    const existingUser = await users.findByEmail(email);

    if (!existingUser) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, existingUser.password_hash);

    if (!isValid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    return {
      token: signToken({
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role
      }),
      user: serializeUser(existingUser)
    };
  }

  async function me(userId) {
    const user = await users.findById(userId);

    if (!user) {
      throw new ApiError(404, "User account was not found.");
    }

    const currentJourney = await journeys.getLatestVerifiedJourneyByUser(userId);

    return {
      user: serializeUser(user),
      currentJourney: serializeJourneyContext(currentJourney)
    };
  }

  return {
    login,
    me,
    register
  };
}

const authService = createAuthService();

module.exports = {
  authService,
  createAuthService
};
