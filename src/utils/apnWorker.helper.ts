import axios from "axios";
import { APN_WORKER_URL, WORKER_SECRET } from "../configs/config";

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
