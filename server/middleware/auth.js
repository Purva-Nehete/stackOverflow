import jwt from "jsonwebtoken";
import user from "../models/auth.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decodedata = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedata?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const existingUser = await user.findById(decodedata.id);

    if (!existingUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.userid = decodedata.id;
    next();
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

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decodedata = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedata?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const existingUser = await user.findById(decodedata.id);

    if (!existingUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.userid = decodedata.id;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;