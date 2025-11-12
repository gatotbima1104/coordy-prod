import { Notification, PushType } from "apns2";
import { createApnClient } from "../configs/apn.config";
import { prisma } from "../configs/config";
import { Event, Participant } from "@prisma/client";

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

export type TNotifyUserTypes = "RESPONSE" | "REMINDER" | "UPDATE" | "CANCELLED";
export interface IPayloadNotifyUser {
  event: Event;
  participant?: Participant;
  isFirstSubmit?: boolean;
  type: TNotifyUserTypes;
}

export async function notifyUser(payload: IPayloadNotifyUser) {
  try {

    // find owner device
    const owner = await prisma.user.findUnique({
      where: { id: payload.event.userId },
      include: { devices: true },
    });

    if (!owner) return console.warn("⚠️ No event owner found for notification");

    if (payload.type == "RESPONSE") {
      const statusNotif = payload.isFirstSubmit ? "has submitted their availability." : "has updated their availability.";
      if (owner?.devices?.length) {
        for (const device of owner.devices) {
          sendPushNotification(device.token, "Participant responded", `${payload.participant?.name} ${statusNotif}`).catch(console.error);
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Participant responded",
          message: `${payload.participant?.name} ${statusNotif} to ${payload.event.title}.`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "RESPONSE",
        },
      })
    } else if (payload.type == "CANCELLED") {
      if (owner?.devices?.length) {
        for (const device of owner.devices) {
          sendPushNotification(device.token, `Event automatically cancelled`, `${payload.event.title} has been automatically cancelled due to pending participants`).catch(console.error)
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Event automatically cancelled",
          message: `${payload.event.title} has been automatically cancelled due to pending participants`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "UPDATE",
        },
      })
    }
    
    
  } catch (error) {
    console.error("❌ notifyUser error:", error);
  }
}