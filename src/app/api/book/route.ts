import { bookTime } from "@/lib/golf";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get("email") as string;
  if (!email) return Response.json({ success: false });
  const raw = formData.get("time") as string;
  if (!raw) return Response.json({ success: false });
  const time = JSON.parse(raw);
  const res = await bookTime({ time, email });
  return Response.json(res);
}
