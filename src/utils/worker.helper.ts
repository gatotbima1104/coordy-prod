import axios from "axios";
import { APN_WORKER_URL, WORKER_SECRET } from "../configs/config";

export interface SendEmailWorkerParams {
  to: string;
  template: string;
  subject?: string;
  user?: string;
  pass?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventId?: string;
}

export async function sendEmailThroughWorker({ 
  to,
  template,
  subject,
  user,
  pass,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventId
}: SendEmailWorkerParams) {
  const url = `${process.env.WORKER_URL}/send-email`;

  try {
    await axios.post(
      url,
      {
        to,
        template,
        subject,
        user,
        pass,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        eventId
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WORKER_SECRET}`,
        },
      }
    );

    console.log("📧 Email request sent to worker");
  } catch (err) {
    console.error("❌ Worker email error:", err);
  }
}

export async function sendToApnWorker(body: any) {
  try {
    const res = await axios.post(
      `${APN_WORKER_URL}/send-apn`,
      body,
      {
        headers: {
          Authorization: `Bearer ${WORKER_SECRET}`,
          "Content-Type": "application/json"
        },
        timeout: 15000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ APN Worker request failed:", error?.response?.data || error);
    throw error;
  }
}