import { NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import { SUMOPOD_API_KEY, SUMOPOD_API_URL } from "../config";

export class AiController {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: SUMOPOD_API_KEY,
      baseURL: SUMOPOD_API_URL,
    });

    this.recommendIntersectionTimes =
      this.recommendIntersectionTimes.bind(this);
    // this.updatedSchedule = this.updatedSchedule.bind(this);
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
}
