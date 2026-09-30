import jwt from "jsonwebtoken";
import user from "../models/auth.js";
import { authenticateSession } from "../services/loginSecurity.js";

const authenticateRequest = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Authentication required" };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return { error: "Authentication token missing" };
  }

  const decodedata = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedata?.id) {
    return { error: "Invalid token payload" };
  }

  const existingUser = await user.findById(decodedata.id);
  if (!existingUser) {
    return { error: "User no longer exists" };
  }

  const session = await authenticateSession({ userId: decodedata.id, token });
  if (!session) {
    return { error: "Session expired or revoked" };
  }

  return { userId: decodedata.id, session };
};

const auth = async (req, res, next) => {
  try {
    const result = await authenticateRequest(req);
    if (result.error) {
      return res.status(401).json({ message: result.error });
    }

    req.userid = result.userId;
    req.sessionId = result.session._id;
    req.session = result.session;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const result = await authenticateRequest(req);
    if (result.error) {
      return res.status(401).json({ message: result.error });
    }

    req.userid = result.userId;
    req.sessionId = result.session._id;
    req.session = result.session;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;