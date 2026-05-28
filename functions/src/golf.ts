import { getAuth } from "./firebase";
import {
  login,
  searchSlots,
  bookEighteen,
  cancelReservation,
  pairBackNine,
  EagleLoginResult,
  EagleSession,
  EagleSlot,
  EagleReservation,
} from "./eagle";

export async function getAuthToken({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<EagleLoginResult> {
  return login({ email, password });
}

export async function getAllTeeTimes({
  date,
  session,
}: {
  date: string;
  session: EagleSession;
}): Promise<EagleSlot[]> {
  return searchSlots(session, date);
}

export async function bookTime({
  time,
  email,
  players,
}: {
  time: EagleSlot;
  email: string;
  players: number;
}): Promise<{ success: boolean; e?: Error }> {
  const creds = await getAuth({ email });
  if (!creds) return { success: false, e: new Error(`no auth for ${email}`) };
  const { session } = await login(creds);
  const slots = await searchSlots(session, time.date);
  const back = pairBackNine(slots, time);
  if (!back) return { success: false, e: new Error("no back-9 pair") };
  const res = await bookEighteen(session, time, back, players);
  if (res.success) return { success: true };
  return { success: false, e: new Error(res.error) };
}

export async function bookTeeTimeWithAuth(
  front: EagleSlot,
  session: EagleSession,
  allSlots: EagleSlot[],
  players: number
): Promise<boolean> {
  const back = pairBackNine(allSlots, front);
  if (!back) return false;
  const res = await bookEighteen(session, front, back, players);
  return res.success;
}

export async function getBookings({
  email,
}: {
  email: string;
}): Promise<EagleReservation[] | null> {
  const creds = await getAuth({ email });
  if (!creds) return null;
  const { reservations } = await login(creds);
  return reservations;
}

export async function cancelBooking({
  email,
  appointmentDetailId,
  appointmentSlotDetailId,
}: {
  email: string;
  appointmentDetailId: number;
  appointmentSlotDetailId: number;
}): Promise<{ success: boolean }> {
  const creds = await getAuth({ email });
  if (!creds) return { success: false };
  const { session, reservations } = await login(creds);
  const target = reservations.find(
    (r) =>
      r.appointmentDetailId === appointmentDetailId &&
      r.appointmentSlotDetailId === appointmentSlotDetailId
  );
  if (!target) return { success: false };
  const ok = await cancelReservation(session, target);
  return { success: ok };
}
