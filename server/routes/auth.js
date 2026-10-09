import express from "express";
import {
  ForgotPassword,
  getCurrentUserLanguage,
  getallusers,
  Login,
  listSessions,
  listTrustedDevices,
  logout,
  revokeSession,
  revokeTrustedDevice,
  verifyLogin,
  requestLanguageChangeOtp,
  Signup,
  updatePreferredLanguage,
  updateprofile,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
import {
  getDailyTransferAllowance,
  getReputationSummary,
  listReputationActivity,
  listReputationTransfers,
  transferReputation,
} from "../controller/reputation.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/login/verify", verifyLogin);
router.post("/logout", auth, logout);
router.get("/sessions", auth, listSessions);
router.delete("/sessions/:id", auth, revokeSession);
router.get("/trusted-devices", auth, listTrustedDevices);
router.delete("/trusted-devices/:id", auth, revokeTrustedDevice);
router.post("/forgot-password", ForgotPassword);
router.get("/language", auth, getCurrentUserLanguage);
router.post("/language/request-otp", auth, requestLanguageChangeOtp);
router.patch("/language", auth, updatePreferredLanguage);
router.get("/getalluser", getallusers);
router.patch("/update/:id", auth, updateprofile);
router.get("/reputation", auth, getReputationSummary);
router.get("/reputation/activity", auth, listReputationActivity);
router.get("/reputation/transfers", auth, listReputationTransfers);
router.get("/reputation/transfers/allowance", auth, getDailyTransferAllowance);
router.post("/reputation/transfers", auth, transferReputation);
export default router;
