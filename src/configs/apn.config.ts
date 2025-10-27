// @ts-nocheck
import { ApnClient } from "node-apn-http2";
import { APN_KEY_ID, APN_TEAM_ID, APN_PRIVATE_KEY, APN_BUNDLE_ID } from "./config";

if (!APN_KEY_ID || !APN_TEAM_ID || !APN_PRIVATE_KEY || !APN_BUNDLE_ID) {
  console.error("🚨 Missing APNs environment variables:", {
    APN_KEY_ID,
    APN_TEAM_ID,
    APN_PRIVATE_KEY: APN_PRIVATE_KEY ? "✅ set" : "❌ missing",
    APN_BUNDLE_ID,
  });
  throw new Error("Missing APNs environment variables");
}

export const apnClient = new ApnClient({
  key: APN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  keyId: APN_KEY_ID,
  teamId: APN_TEAM_ID,
  defaultTopic: APN_BUNDLE_ID,
  production: true, // true = api.push.apple.com, false = sandbox
});
