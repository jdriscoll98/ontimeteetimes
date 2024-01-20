import { getAuth } from "@/lib/firebase";
import { getAllTeeTimes, getAuthToken } from "@/lib/golf";

export async function POST(req: Request) {
    const { email, date } = await req.json();
    const auth = await getAuth({ email })
    if (!auth) return Response.json({});
    const {data: { "booking_class_ids": booking_class_ids }}= await getAuthToken(auth);
    const times = await getAllTeeTimes({
        date,
        booking_class_id: booking_class_ids[0],
    })
    return Response.json({ times })
}