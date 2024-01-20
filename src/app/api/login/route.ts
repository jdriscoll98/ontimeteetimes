import { setAuth } from "@/lib/firebase";
import { getAuthToken } from "@/lib/golf";
import { AxiosError } from "axios";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    await getAuthToken({ email, password });
    await setAuth({ email, password })
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
