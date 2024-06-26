import { UnauthenticatedError } from "../errors/customErrors.js";
import { verifyJWT } from "../utils/tokenUtils.js";

export const authenticateUser = async (req, res, next) => {
  const { tokenAdmin } = req.cookies;
  if (!tokenAdmin) {
    throw new UnauthenticatedError("authentication invalid");
  }

  try {
    const { userId, role } = verifyJWT(tokenAdmin);
    const testUser = userId === "testUserId";
    req.user = { userId, role, testUser };
    next();
  } catch (error) {
    throw new UnauthenticatedError("authentication invalid");
  }
};

export const checkForTestUser = (req, res, next) => {
  if (req?.user?.testUser) {
    throw new BadRequestError("Demo User. Read Only!");
  }
  next();
};

export const authenticateAccount = async (req, res, next) => {
  const { tokenAccount } = req.cookies;

  if (!tokenAccount) {
    throw new UnauthenticatedError("authentication invalid");
  }

  try {
    const { userId } = verifyJWT(tokenAccount);
    req.user = { userId };
    next();
  } catch (error) {
    throw new UnauthenticatedError("authentication invalid");
  }
};

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};
