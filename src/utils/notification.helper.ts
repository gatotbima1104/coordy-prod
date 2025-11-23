// import { Notification, PushType } from "apns2";
// import { createApnClient } from "../configs/apn.config";
import { prisma } from "../configs/config";
import { Event, Participant } from "@prisma/client";
import { sendToApnWorker } from "./worker.helper";

type TNotifyUserTypes = "RESPONSE" | "REMINDER" | "UPDATE" | "CANCELLED";
interface IPayloadNotifyUser {
  event: Event;
  participant?: Participant;
  isFirstSubmit?: boolean;
  type: TNotifyUserTypes;
}


export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  sound = "default"
) {
  try {
    await sendToApnWorker({
      type: "alert",
      tokens: [deviceToken],
      payload: { title, body, sound }
    });

    console.log("✅ Sent visible APNs to", deviceToken);
  } catch (error) {
    console.error("❌ Failed to send visible APNs:", error);
  }
}

export async function sendSilentNotification(deviceToken: string) {
  try {
    await sendToApnWorker({
      type: "silent",
      tokens: [deviceToken],
      payload: {}
    });

    console.log("✅ Sent silent APNs to", deviceToken);
  } catch (error) {
    console.error("❌ Failed to send silent APNs:", error);
  }
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
          sendPushNotification(device.token, `Event automatically cancelled`, `${payload.event.title} has been automatically cancelled`).catch(console.error)
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
    } else if (payload.type == "REMINDER") {
      if (owner?.devices?.length) {
        for (const device of owner.devices) {
          sendPushNotification(device.token, `${payload.event.title} - Is Ready!`, `Your events awaits your response. Choose a time to saved`).catch(console.error)
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Event Is Ready",
          message: `${payload.event.title} awaits your response. Choose a time to saved`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "REMINDER",
        },
      })
    }
    
    
  } catch (error) {
    console.error("❌ notifyUser error:", error);
  }
}