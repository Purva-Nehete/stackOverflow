import user from "../models/auth.js";

const requireActiveUser = async (req, res, next) => {
  try {
    const existingUser = await user.findById(req.userid).select("suspendedUntil");
    if (!existingUser) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (existingUser.suspendedUntil && existingUser.suspendedUntil > new Date()) {
      return res.status(403).json({
        message: "Your account is suspended and cannot perform this action.",
        suspendedUntil: existingUser.suspendedUntil,
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify account status." });
  }
};

export default requireActiveUser;