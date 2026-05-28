import { cancelBooking, getBookings } from "@/lib/golf";

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const bookings = await getBookings({ email: body.get("email") as string });
    return Response.json({ bookings });
  } catch (e) {
    console.log((e as Error).message);
    return Response.json({ success: false });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.formData();
    const email = body.get("email") as string;
    const appointmentDetailId = parseInt(body.get("appointmentDetailId") as string, 10);
    const appointmentSlotDetailId = parseInt(body.get("appointmentSlotDetailId") as string, 10);
    if (!email || !appointmentDetailId || !appointmentSlotDetailId) {
      return Response.json({ success: false });
    }
    const res = await cancelBooking({ email, appointmentDetailId, appointmentSlotDetailId });
    return Response.json(res);
  } catch (e) {
    console.log((e as Error).message);
    return Response.json({ success: false });
  }
}
