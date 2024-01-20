import { setSchedule } from "@/lib/firebase";
import { Schedule } from "@/types";
import { AxiosError } from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json() as Schedule;
    await setSchedule(body);
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log((e as AxiosError).message);
    return new Response(JSON.stringify({ success: false }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
