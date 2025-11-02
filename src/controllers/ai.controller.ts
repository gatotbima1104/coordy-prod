import { NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import { SUMOPOD_API_KEY, SUMOPOD_API_URL } from "../configs/config";

export class AiController {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: SUMOPOD_API_KEY,
      baseURL: SUMOPOD_API_URL,
    });

    this.recommendIntersectionTimes =
      this.recommendIntersectionTimes.bind(this);
    this.getResponseContext =
      this.getResponseContext.bind(this);
  }

  async recommendIntersectionTimes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { activities = [], event = {}, matchedTimes = [] } = req.body || {};

      // Validation
      if (!Array.isArray(matchedTimes) || matchedTimes.length === 0) {
        return res.status(400).json({
          message: "matchedTimes is required and must be a non-empty array.",
        });
      }

      const response = await this.client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `
                You are a scheduling intelligence assistant.
                Given a list of activities, an event object, and available matched times,
                your task is to recommend the best possible time(s) for the event.

                Always respond with strictly valid JSON in this exact format:

                ["2025-10-26T09:00:00Z", "2025-10-26T18:00:00Z"]

                - The value must be a JSON array of ISO8601 timestamps (strings).
                - Do not include explanations, reasoning, keys, or additional text.
                - If no suitable times exist, return an empty array [].
          `,
          },
          {
            role: "user",
            content: `
                Event details:
                ${JSON.stringify(event, null, 2)}

                User activities (may influence when people are busy or free):
                ${JSON.stringify(activities, null, 2)}

                Matched available times (intersection of stakeholders' and arranger's schedules):
                ${JSON.stringify(matchedTimes, null, 2)}

                Use reasoning such as:
                - Avoid times that conflict with busy or rest periods.
                - Prefer times aligned with work-related or focus activities.
                - Choose one or more optimal times if possible.
          `,
          },
        ],
        temperature: 0.4,
      });

      // Parse model response safely
      let parsed: string[] = [];
      try {
        const content = response.choices[0]?.message?.content?.trim() || "[]";
        parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) parsed = [];
      } catch {
        parsed = [];
      }

      return res.status(200).json({
        message: "success",
        data: parsed,
      });
    } catch (error) {
      next(error);
    }
  }

  async getResponseContext(req: Request, res: Response, next: NextFunction) {
    try {
        const { context } = req.body || {};

        if (!context || typeof context !== "string") {
          return res.status(400).json({
            message: "context is required and must be a string.",
          });
        }

        const response = await this.client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `
                You are a multilingual natural-language interpreter specialized in scheduling.
                Your task is to extract structured scheduling information from free-form text,
                even when expressed informally, partially, or in mixed languages (e.g., Indonesian + English).

                Always return strictly valid JSON in this exact format:
                {
                  "intent": "confirm_availability" | "reject" | "reschedule" | "ask_clarification",
                  "event": "User Interview",
                  "datetimes": ["2025-10-30T09:00:00.000Z", "2025-10-30T12:00:00.000Z"],
                  "confidence": 0.9,
                  "rawText": "<original input>"
                }

                ### Parsing Rules:
                - Understand flexible date references such as:
                  "tanggal 18", "tgl 18", "besok", "lusa", "hari Senin", "next Monday", etc.
                  Normalize all dates to ISO format (YYYY-MM-DD) using today's date as reference (UTC+7 if unclear).
                  Current year is 2025.
                - Understand flexible time references such as:
                  "jam 8", "08.00", "8 pagi", "20.30", "malam", "sore", "pagi", etc.
                  Convert to 24-hour HH:MM format.
                - If multiple times are mentioned ("jam 4 dan 7", "8 or 9"), include all possible ISO datetimes in the array.
                - Combine each date+time into full ISO 8601 strings ("YYYY-MM-DDTHH:MM:00.000Z").
                  If no time is found but a date exists, assume "00:00".
                  If no date is found, set datetimes to [].
                - intent should reflect user's purpose:
                  confirm_availability → agrees or confirms
                  reject → cannot or declines
                  reschedule → proposes new time
                  ask_clarification → asks question or unclear
                - confidence is a float (0.0–1.0).
                - Never include explanations or text outside JSON.
              `,
            },
            {
              role: "user",
              content: `Extract the scheduling meaning from: "${context}"`,
            },
          ],
          temperature: 0.2,
        });

        // Parse GPT output safely
        let parsed;
        try {
          parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

          // Normalize datetimes array
          if (!Array.isArray(parsed.datetimes)) {
            parsed.datetimes = parsed.datetimes ? [parsed.datetimes] : [];
          }
        } catch {
          parsed = {
            intent: "unknown",
            datetimes: [],
            confidence: 0.0,
            rawText: context,
          };
        }

        return res.status(200).json({
          message: "success",
          data: parsed,
      });
    } catch (error) {
      next(error);
    }
  }
}
