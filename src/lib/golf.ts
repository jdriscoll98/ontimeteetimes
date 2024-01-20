import axios from "axios";
import { getAuth } from "./firebase";

const LOGIN_URL =
  "https://foreupsoftware.com/index.php/api/booking/users/login";
const RESERVATION_URL =
  "https://foreupsoftware.com/index.php/api/booking/users/reservations";
const TIMES_URL = (date: string, booking_class_id: number) =>
  `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${date}&holes=18&players=1&booking_class=${booking_class_id}&schedule_id=2912&schedule_ids%5B%5D=2912&specials_only=0&api_key=no_limits`;

export async function getAuthToken({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{
  data: { jwt: string; reservations: any[]; booking_class_ids: number[] };
  headers: { "set-cookie"?: string[] | undefined };
}> {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);
  formData.append("booking_class_id", "");
  formData.append("api_key", "no_limits");
  formData.append("course_id", "19905");
  const res = await axios.post(LOGIN_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res;
}

export async function getBookings({ email }: { email: string }) {
  const auth = await getAuth({ email });
  if (!auth) return null;
  const {
    data: { reservations },
  } = await getAuthToken(auth);
  return [...reservations];
}

export async function cancelBooking({
  email,
  id,
}: {
  email: string;
  id: string;
}) {
  // delete request to the reservation url with the id
  const auth = await getAuth({ email });
  if (!auth) return null;
  const {
    data: { jwt },
    headers: { "set-cookie": cookie },
  } = await getAuthToken(auth);
  const res = await axios.delete(`${RESERVATION_URL}/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      "Api-Key": "no_limits",
      Cookie: cookie?.join("; "),
    },
  });
  return res.data;
}

export async function getAllTeeTimes({
  booking_class_id,
  date,
}: {
  booking_class_id: number;
  date: string;
}) {
  const url = `${TIMES_URL(date, booking_class_id)}`;
  const res = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function bookTime({
  time,
  email,
}: {
  time: any;
  email: string;
}) {
  const auth = await getAuth({ email });
  if (!auth) return null;
  const {
    data: { jwt },
    headers: { "set-cookie": cookie },
  } = await getAuthToken(auth);
  try {
    await axios.post(RESERVATION_URL, {
      ...time,
      players: time.available_spots,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "no_limits",
        "X-Authorization": `Bearer ${jwt}`,
        Cookie: cookie?.join("; "),
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
