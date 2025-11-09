// utils/notification.helper.ts
import { Notification, PushType } from "apns2";
import { createApnClient } from "../configs/apn.config";

async function safeSend(notification: Notification, retries = 1) {
  const client = createApnClient();

  try {
    await client.send(notification);
  } catch (err: any) {
    if (
      retries > 0 &&
      (err.code === "UND_ERR_SOCKET" || err.message?.includes("socket"))
    ) {
      console.warn("🔁 Retrying APNs after socket close...");
      await safeSend(notification, retries - 1);
    } else {
      throw err;
    }
  } finally {
    try {
      client.close();
    } catch (_) {}
  }
}

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  sound = "default"
) {
  const notification = new Notification(deviceToken, {
    aps: { alert: { title, body }, sound },
  });

  try {
    await safeSend(notification);
    console.log("✅ Sent visible APNs to", deviceToken);
  } catch (error) {
    console.error("❌ Failed to send APNs:", error);
  }
}

export async function sendSilentNotification(deviceToken: string) {
  const notification = new Notification(deviceToken, {
    aps: { "content-available": 1 },
    type: PushType.background,
  });

  try {
    await safeSend(notification);
    console.log("✅ Sent silent APNs to", deviceToken);
  } catch (error) {
    console.error("❌ Failed to send silent APNs:", error);
  }
}