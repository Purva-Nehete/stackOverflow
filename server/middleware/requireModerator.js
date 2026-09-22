import user from "../models/auth.js";

const requireModerator = async (req, res, next) => {
  try {
    const existingUser = await user.findById(req.userid).select("role");
    if (!existingUser || !["moderator", "admin"].includes(existingUser.role)) {
      return res.status(403).json({ message: "Moderator access required." });
    }

    req.moderatorRole = existingUser.role;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify moderator access." });
  }
};

export default requireModerator;
