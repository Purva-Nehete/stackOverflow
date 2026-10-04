import user from "../models/auth.js";

const requireAdmin = async (req, res, next) => {
  try {
    const existingUser = await user.findById(req.userid).select("role");
    if (!existingUser || existingUser.role !== "admin") {
      return res.status(403).json({ message: "Administrator access required." });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify administrator access." });
  }
};

export default requireAdmin;
