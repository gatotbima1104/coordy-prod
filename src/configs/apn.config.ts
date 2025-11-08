import { ApnsClient } from "apns2";
import { APN_KEY_ID, APN_TEAM_ID, APN_PRIVATE_KEY, APN_BUNDLE_ID, APN_HOST } from "./config";

let cachedClient: ApnsClient | null = null;

export function getApnClient(): ApnsClient {
  if (cachedClient) return cachedClient;
    
  cachedClient = new ApnsClient({
    team: APN_TEAM_ID,
    keyId: APN_KEY_ID,
    signingKey: APN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    defaultTopic: APN_BUNDLE_ID,
    keepAlive: true,
    requestTimeout: 0,
    host: APN_HOST
  }); 

  return cachedClient;
}
