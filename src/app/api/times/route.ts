import { getAuth } from "@/lib/firebase";
import { getAllTeeTimes, getAuthToken } from "@/lib/golf";

export async function POST(req: Request) {
  const { email, date } = await req.json();
  const auth = await getAuth({ email });
  if (!auth) return Response.json({ times: [] });
  const { session } = await getAuthToken(auth);
  const times = await getAllTeeTimes({ date, session });
  return Response.json({ times });
}
