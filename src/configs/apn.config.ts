// @ts-nocheck
import fs from "fs";
import path from "path";
import { ApnsClient } from "apns2";
import { APN_KEY_ID, APN_TEAM_ID, APN_PRIVATE_KEY, APN_BUNDLE_ID } from "./config";

// ensure all env vars exist
if (!APN_KEY_ID || !APN_TEAM_ID || !APN_PRIVATE_KEY || !APN_BUNDLE_ID) {
  console.error("🚨 Missing APNs environment variables:", {
    APN_KEY_ID,
    APN_TEAM_ID,
    APN_PRIVATE_KEY: APN_PRIVATE_KEY ? "✅ set" : "❌ missing",
    APN_BUNDLE_ID,
  });
  throw new Error("Missing APNs environment variables");
}

// create temp key file if needed (Vercel-safe)
const keyPath = path.join("/tmp", "AuthKey.p8");
if (!fs.existsSync(keyPath)) {
  fs.writeFileSync(keyPath, APN_PRIVATE_KEY.replace(/\\n/g, "\n"));
}

export const apnClient = new ApnsClient({
  team: APN_TEAM_ID,
  keyId: APN_KEY_ID,
  signingKey: fs.readFileSync(keyPath),
  defaultTopic: APN_BUNDLE_ID,
  keepAlive: true,        // optional but recommended
  requestTimeout: 0,      // optional, 0 = no timeout
  // host: "api.sandbox.push.apple.com" // uncomment for dev testing
});
