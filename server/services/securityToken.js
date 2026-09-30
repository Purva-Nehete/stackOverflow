import { createHash, randomBytes } from "node:crypto";
import { loginSecurityRules } from "../config/loginSecurity.js";

export const createSecurityToken = (byteLength = loginSecurityRules.session.tokenBytes) => {
  const token = randomBytes(byteLength).toString("base64url");
  return {
    token,
    tokenHash: hashSecurityToken(token),
  };
};

export const hashSecurityToken = (token) => {
  return createHash("sha256").update(token, "utf8").digest("hex");
};
