import { sendEmailThroughWorker } from "../utils/worker.helper"; // adjust path
import { SMTP_USER, SMTP_PASS } from "../configs/config";

type EmailActivity = "COMPLETED" | "CANCELLED" | "REGISTER";

export async function sendEmail(
  user: string,
  pass: string,
  to: string,
  eventTitle?: string,
  eventDate?: string,
  eventLocation?: string,
  eventTime?: string,
  eventId?: string,
  activity?: EmailActivity,
) {
  let template = "";
  let subject = "";

  if (activity === "COMPLETED") {
    template = "scheduled.template.hbs";
    subject = `Event confirmed: ${eventTitle}`;
  } 
  else if (activity === "CANCELLED") {
    template = "failed.template.hbs";
    subject = `Event cancelled: ${eventTitle}`;
  } 
  else if (activity === "REGISTER") {
    template = "welcome.template.hbs";
    subject = "Welcome to Cordy";
  } 
  else {
    console.error("Unknown email activity:", activity);
    return;
  }

  await sendEmailThroughWorker({
    to,
    template,
    subject,
    user,
    pass,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    eventId,
  });
}
