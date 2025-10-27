import { apnClient } from "../configs/apn.config";
import { Notification, Errors } from "apns2";

apnClient.on(Errors.error, (err) => {
  console.error("❌ APNs client error:", err.reason, err.notification?.deviceToken);
});

apnClient.on(Errors.badDeviceToken, (err) => {
  console.warn("⚠️ Invalid device token:", err.notification.deviceToken);
});

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  sound: string = "default"
) {
  try {
    const notification = new Notification(deviceToken, {
      alert: { title, body },
      sound,
    });

    await apnClient.send(notification);
  } catch (error) {
    console.error("❌ Failed to send APNs:", error);
  }
}
