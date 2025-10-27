import { apnClient } from "../configs/apn.config";
import { Notification, Errors } from "apns2";

// listen for generic errors
apnClient.on(Errors.error, (err) => {
  console.error("❌ APNs client error:", err.reason, err.notification?.deviceToken);
});

// optional: handle invalid tokens
apnClient.on(Errors.badDeviceToken, (err) => {
  console.warn("⚠️ Invalid device token:", err.notification.deviceToken);
});

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string
) {
  try {
    const notification = new Notification(deviceToken, {
      alert: { title, body },
      sound: "default",
    });

    const result = await apnClient.send(notification);
    console.log("✅ APNs push result:", result);
  } catch (error) {
    console.error("❌ Failed to send APNs:", error);
  }
}
