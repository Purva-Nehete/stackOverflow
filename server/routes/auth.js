import express from "express";
import {
  ForgotPassword,
  getCurrentUserLanguage,
  getallusers,
  Login,
  verifyLogin,
  requestLanguageChangeOtp,
  Signup,
  updatePreferredLanguage,
  updateprofile,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/login/verify", verifyLogin);
router.post("/forgot-password", ForgotPassword);
router.get("/language", auth, getCurrentUserLanguage);
router.post("/language/request-otp", auth, requestLanguageChangeOtp);
router.patch("/language", auth, updatePreferredLanguage);
router.get("/getalluser", getallusers);
router.patch("/update/:id", auth, updateprofile);
export default router;
