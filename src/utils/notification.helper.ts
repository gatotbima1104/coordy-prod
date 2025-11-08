import { apnClient } from "../configs/apn.config";
import { Notification, Errors, PushType } from "apns2";

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

// Send silent notification for background updates
export async function sendSilentNotification( deviceToken: string ) {
  try {
    const notification = new Notification(deviceToken, {
      aps: {
        "content-available": 1,
      },
      priority: 5,
      type: PushType.background
    });

    await apnClient.send(notification);
    console.log("✅ Sent silent APNs to", deviceToken);
  } catch (error) {
    console.error("❌ Failed to send silent APNs:", error);
  }
}