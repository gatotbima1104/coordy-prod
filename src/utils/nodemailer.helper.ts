import * as nodemailer from "nodemailer";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";
import { SMTP_USER } from "../configs/config";

type EmailActivity = "COMPLETED" | "CANCELLED";

export async function sendEmail(
  user: string,
  pass: string,
  to: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  eventTime: string,
  activity?: EmailActivity,
) {
  if (activity == "COMPLETED") {
    await emailSetup({
        template: "scheduled.template.hbs",
        user,
        pass, 
        to, 
        eventTitle,
        eventDate, 
        eventTime, 
        eventLocation,
        subject: `Event confirmed: ${eventTitle}`
    })
  } else if (activity == "CANCELLED") {
    await emailSetup({
        template: "failed.template.hbs",
        user,
        pass, 
        to, 
        eventTitle,
        eventDate, 
        eventTime, 
        eventLocation,
        subject: `Event cancelled: ${eventTitle}`
    })
  }
}

export type TEmailConfiguration = {
  template: string;
  user: string;
  pass: string;
  to: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  subject: string
};

async function emailSetup(payload: TEmailConfiguration) {
  try {
    const template = fs.readFileSync(
      path.join(process.cwd(), `src/templates/${payload.template}`),
      "utf8"
    );
    const compiledTemplate = handlebars.compile(template);

    const html = compiledTemplate({
      username: payload.to,
      eventTitle: payload.eventTitle,
      eventDate: payload.eventDate,
      eventTime: payload.eventTime,
      eventLocation: payload.eventLocation,
      expiry: 1,
      appName: "Cordy",
      supportEmail: SMTP_USER,
    });

    const mailOptions = {
      from: SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      html,
    };

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      auth: {
        user: payload.user,
        pass: payload.pass,
      },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        throw new Error("Error sending mail");
      } else {
        console.log(`Email sent: ${info.response}`);
        throw new Error("Check your email for Verify your account");
      }
    });
  } catch (error) {
    console.log(error);
  }
}
