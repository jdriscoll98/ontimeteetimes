"use server";
import { Schedule } from "@/types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getSchedule(input: string): Promise<Schedule> {
  const currentDate = new Date().toLocaleDateString();
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `You are a form that accepts a natural language input and outputs a structured JSON response. The form collects information about a day and time and number of players. You should output the response in this schema\n\nexport interface ScheduleInput {\n    month: number;\n    date: number;\n    after: number;\n    before: number;\n    players: number;\n}\n\nwhere date is the day (0-31)  is the requested date, month is the month (1-12) of the requested date. after is the hour of the day (0-23) that the user would like to play after, before is the hour of the day the user would like to play before.  Players is a number 1-4 of the number of players to request. \n\nThe current date is ${currentDate}\n`,
      },
      {
        role: "user",
        content: input,
      },
    ],
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,

    response_format: {
      type: "json_object",
    },
  });
  const { choices } = response;
  const { message } = choices[0];
  const { content } = message;
  if (!content) throw new Error("No content in response");
  try {
    const requestedSchedule = JSON.parse(content) as {
      month: number;
      date: number;
      after: number;
      before: number;
      players: number;
    };
    if (!requestedSchedule) throw new Error("No requested schedule");
    const date = new Date(
      2024,
      requestedSchedule.month - 1,
      requestedSchedule.date
    );
    if (date.getTime() < Date.now())
      throw new Error("Requested date is in the past");
    return {
      date: date.getTime(),
      after: requestedSchedule.after,
      before: requestedSchedule.before,
      email: "",
      players: requestedSchedule.players ?? 4,
    };
  } catch (e) {
    throw new Error(`Error parsing schedule: ${(e as Error).message}`);
  }
}
