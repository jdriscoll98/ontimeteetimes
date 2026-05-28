import { bookTime } from "@/lib/golf";
import { EagleSlot } from "@/lib/eagle";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get("email") as string;
  if (!email) return Response.json({ success: false });
  const raw = formData.get("time") as string;
  if (!raw) return Response.json({ success: false });
  const playersRaw = formData.get("players") as string | null;
  const players = playersRaw ? parseInt(playersRaw, 10) : 1;
  const time = JSON.parse(raw) as EagleSlot;
  const res = await bookTime({ time, email, players });
  return Response.json({ success: res.success });
}
