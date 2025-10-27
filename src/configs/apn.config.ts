// @ts-nocheck

import { APN_KEY_ID, APN_DEVELOPER_TEAM_ID, APPLE_CLIENT_ID, APN_KEY_SHARED } from "./config";
import { Apn } from "easy-apn";

if (!APN_KEY_ID || !APN_DEVELOPER_TEAM_ID || !APPLE_CLIENT_ID || !APN_KEY_SHARED) {
  throw new Error("Missing APNs environment variables");
}

export const apnClient = new Apn({
  key: APN_KEY_SHARED.replace(/\\n/g, "\n"), // handle escaped newlines
  keyId: APN_KEY_ID,
  teamId: APN_DEVELOPER_TEAM_ID,
  defaultTopic: APPLE_CLIENT_ID,
  production: true,
});
