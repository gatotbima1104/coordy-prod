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

    const result = await apnClient.send(deviceToken, payload);
    console.log("✅ APNs sent:", result);
  } catch (err) {
    console.error("❌ Failed to send APNs:", err);
  }
}
