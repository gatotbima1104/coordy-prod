// import { Notification, PushType } from "apns2";
// import { createApnClient } from "../configs/apn.config";
import { prisma } from "../configs/config";
import { Event, Participant } from "@prisma/client";
import { sendToApnWorker } from "./worker.helper";
import { formatSimpleDate } from "./time.helper";

type TNotifyUserTypes = "RESPONSE" | "REMINDER" | "UPDATE" | "CANCELLED" | "NONMATCHING";
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
          sendPushNotification(device.token, `${payload.participant?.name} Just Responded!`, `New availability shared for your event`).catch(console.error);
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Participant responded",
          message: `${payload.participant?.name} have shared their availability for your ${payload.event.title}.`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "RESPONSE",
        },
      })
    } else if (payload.type == "CANCELLED") {
      if (owner?.devices?.length) {
        for (const device of owner.devices) {
          sendPushNotification(device.token, `${payload.event.title} has been Cancelled!`, `Event has been overdue and automatically cancelled`).catch(console.error)
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Event cancelled",
          message: `${payload.event.title} failed to schedule, Invitation is overdue at ${formatSimpleDate(payload.event.expiredAt)}`,
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
          message: `${payload.event.title} is ready for your confirmation.`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "REMINDER",
        },
      })
    } else if (payload.type == "NONMATCHING") {
      if (owner?.devices?.length) {
        for (const device of owner.devices) {
          sendPushNotification(device.token, `No Matching Time!`, `Hey, we can't find the best time for ${payload.event.title}. Try schedule for another day`).catch(console.error)
          sendSilentNotification(device.token).catch(console.error);
        }
      }

      await prisma.notification.create({
        data: {
          title: "Event cancelled",
          message: `Sadly there are no matching time for ${payload.event.title} across all participant`,
          status: "UNREAD",
          user: { connect: { id: owner!.id } },
          event: { connect: { id: payload.event.id } },
          type: "DELETE",
        },
      })
    }
    
    
  } catch (error) {
    console.error("❌ notifyUser error:", error);
  }
}