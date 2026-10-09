import user from "../models/auth.js";
import { reputationRules } from "../config/reputationRules.js";

const privilegeThresholds = {
  unrestrictedCommenting: reputationRules.privileges.unrestrictedCommenting,
  editCommunityPosts: reputationRules.privileges.editCommunityPosts,
  voteToCloseQuestions: reputationRules.privileges.voteToCloseQuestions,
  reportInappropriateContent: reputationRules.privileges.reportInappropriateContent,
};

const requireReputationPrivilege = (privilege) => async (req, res, next) => {
  const threshold = privilegeThresholds[privilege];
  if (!threshold) {
    return res.status(500).json({ message: "Invalid reputation privilege." });
  }

  try {
    const existingUser = await user.findById(req.userid).select("reputationBalance");
    if (!existingUser) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    const reputation = Number.isFinite(existingUser.reputationBalance)
      ? existingUser.reputationBalance
      : reputationRules.balance.minimum;
    if (reputation < threshold) {
      return res.status(403).json({
        message: "Insufficient reputation for this action.",
        privilege,
        requiredReputation: threshold,
        reputation,
      });
    }

    req.reputation = reputation;
    return next();
  } catch (error) {
    console.error("requireReputationPrivilege error:", error);
    return res.status(500).json({ message: "Unable to verify reputation access." });
  }
};

export { privilegeThresholds };
export default requireReputationPrivilege;
