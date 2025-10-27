import { apnClient } from "../configs/apn.config";

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string
) {
  try {
    const payload = {
      aps: {
        alert: { title, body },
        sound: "default",
      },
    };

    // send() is supported in node-apn-http2
    const result = await apnClient.send(deviceToken, payload);
    console.log("✅ APNs push result:", result);
  } catch (err) {
    console.error("❌ Failed to send APNs:", err);
  }
}
