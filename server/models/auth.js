import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  forgotPasswordRequestedAt: { type: Date, default: null },
});
export default mongoose.model("user", userschema);
