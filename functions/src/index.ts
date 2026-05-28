import * as dayjs from "dayjs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { error, log } from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { bookTeeTimeWithAuth, getAllTeeTimes, getAuthToken } from "./golf";
import { getAuth } from "./firebase";
import { EagleSlot, FRONT_NINE_ID, BACK_NINE_ID, ymd } from "./eagle";
import { Schedule } from "./types";

initializeApp();
export const db = getFirestore();

export const scheduleTasks = onSchedule("*/5 * * * *", async () => {
  const snapshot = await db.collection("schedule").get();

  const promises = snapshot.docs.map(async (doc) => {
    const data = doc.data() as Schedule;
    const now = new Date();
    const target = new Date(data.date);

    if (now.getTime() > target.getTime()) {
      log(`Deleting schedule for ${target.toISOString()} since it was in the past`);
      await doc.ref.delete();
      return;
    }

    const creds = await getAuth({ email: data.email });
    if (!creds) {
      log(`No auth for ${data.email}; skipping`);
      return;
    }

    const { session } = await getAuthToken(creds);
    const slots = await getAllTeeTimes({ date: ymd(target), session });
    log(`Found ${slots.length} slots for ${target.toISOString()}`);
    if (slots.length === 0) return;

    const candidates = slots.filter(
      (s) =>
        s.nineId === FRONT_NINE_ID &&
        s.turnNineId === BACK_NINE_ID &&
        s.time >= data.after &&
        s.time <= data.before &&
        s.playerSlotIds.length >= data.players
    );

    for (const slot of candidates) {
      const ok = await bookTeeTimeWithAuth(slot, session, slots, data.players);
      if (ok) {
        log(`Booked ${slot.time} on ${slot.date} for ${data.email}`);
        await doc.ref.delete();
        return;
      }
      log(`Time ${slot.time} not booked`);
    }
  });
  await Promise.all(promises);
});

// TODO: move hardcoded creds to /auth/{email}; TODO: re-add matthew.feldhammer@gmail.com as second account
const bookEarliest = async () => {
  try {
    const auth = await getAuthToken({
      email: "jackdriscoll777@gmail.com",
      password: "Golf123",
    });

    const date = dayjs(new Date()).add(10, "days").toDate();
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend) return;

    const dateStr = ymd(date);
    let slots: EagleSlot[] = [];
    while (!slots.length) {
      slots = await getAllTeeTimes({ date: dateStr, session: auth.session });
    }

    const front = slots.filter(
      (s) => s.nineId === FRONT_NINE_ID && s.turnNineId === BACK_NINE_ID
    );
    const groups = front.slice(0, 2);

    const results = await Promise.allSettled(
      groups.map((s) => bookTeeTimeWithAuth(s, auth.session, slots, s.playerSlotIds.length))
    );

    results.forEach((result, i) => {
      const slot = groups[i];
      if (result.status === "fulfilled" && result.value) {
        log(`Booked tee time ${slot.time} on ${slot.date}`);
      } else if (result.status === "rejected") {
        log(`Failed to book ${slot.time}: ${result.reason}`);
      } else {
        log(`Failed to book ${slot.time}`);
      }
    });
  } catch (e) {
    error("Failed to book earliest tee time", e);
  }
};

export const scheduleBookEarliest = onSchedule(
  {
    schedule: "59 3 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 540,
  },
  bookEarliest
);
