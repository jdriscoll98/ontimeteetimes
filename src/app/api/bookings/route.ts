import { cancelBooking, getBookings } from "@/lib/golf";
import { AxiosError } from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const bookings = await getBookings({
      email: body.get("email") as string,
    });
    return Response.json({ bookings });
  } catch (e) {
    console.log((e as AxiosError).message);
    return new Response(JSON.stringify({ success: false }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.formData();
    const email = body.get("email") as string;
    const id = body.get("id") as string;
    if (!email || !id) return Response.json({ success: false });
    const res = await cancelBooking({ email, id });
    return Response.json(res);
  } catch (e) {
    console.log((e as AxiosError));
    return Response.json({ success: false })
  }
}
