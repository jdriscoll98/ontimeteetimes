import * as dayjs from "dayjs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { error, log } from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  bookTeeTimeWithAuth,
  bookTime,
  getAllTeeTimes,
  getAuthToken,
} from "./golf";
import { Schedule } from "./types";
initializeApp();
export const db = getFirestore();

const BEACH_PASS_ID = 10425;
const REGULAR_ID = 10426;
// every 5 minutes
export const scheduleTasks = onSchedule("*/5 * * * *", async () => {
  // fetch all docs from the 'schedule' collection
  const snapshot = await db.collection("schedule").get();

  // loop through each doc
  const promises = snapshot.docs.map(async (doc) => {
    // get the data from the doc
    const data = doc.data() as Schedule;
    // get current date
    const now = new Date();
    const date = new Date(data.date);
    // todo optimize this by fetching all tee times for all schedule dates before this loop and using a map to get the tee times for each date
    const teeTimes = await getAllTeeTimes({
      booking_class_id: REGULAR_ID,
      date: date.toLocaleDateString("en-us", {
        // mm-dd-yyyy
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    });
    log(`Found ${teeTimes.length} tee times for ${date.toISOString()}`);
    if (teeTimes.length === 0) return null;

    // check if the before date is after the current date
    if (now.getTime() > date.getTime()) {
      // delete the doc
      log(
        `Deleting schedule for ${date.toISOString()} since it was in the past`
      );
      await doc.ref.delete();
      return;
    }
    // check if any of the tee times fall within the after and before times and have enough spots
    const times = teeTimes.filter((teeTime: any) => {
      const date = new Date(teeTime.time);
      const hours = date.getHours();
      return (
        hours > data.after &&
        hours < data.before &&
        teeTime.available_spots >= data.players
      );
    });
    // loop through each time
    for (const time of times) {
      // book the time
      const res = await bookTime({ time, email: data.email });
      // check if the time was booked
      if (res?.success) {
        // delete the doc
        log(`Deleting schedule for ${date.toISOString()} since it was booked`);
        await doc.ref.delete();
        break;
      } else {
        // log that the time was not booked
        log(`Time ${time.time} was not booked: ${(res?.e as Error).message}`);
      }
    }
    return;
  });
  await Promise.all(promises);
});

const bookEarliest = async () => {
  try {
    const data = await getAuthToken({
      email: "wsilva0921@gmail.com",
      password: "Golf123",
    });
    // const data = await getAuthToken({
    //   email: "Jackdriscoll777@gmail.com",
    //   password: "Golf123",
    // });

    let date: dayjs.Dayjs | string = dayjs(new Date())
      .add(1, "day")
      .add(3, "week");

    let teeTimes = [];
    while (!teeTimes.length) {
      teeTimes = await getAllTeeTimes({
        booking_class_id: BEACH_PASS_ID,
        date: date.toDate().toLocaleDateString("en-us", {
          // mm-dd-yyyy
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        auth: { jwt: data.data.jwt, cookie: data.headers["set-cookie"] },
      });
      log(
        `Waiting for tee times to be available, current time is ${dayjs().format(
          "HH:mm"
        )}`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    log(`Available tee times for ${date.format("MM/DD/YYYY")}`, teeTimes);
    const firstTeeTimes = teeTimes.slice(0, 2);
    // try to book the first 5 tee times
    const promises = firstTeeTimes.map((time: any) => {
      return bookTeeTimeWithAuth(
        {
          ...time,
          players: time.available_spots,
          holes: "18",
        },
        data.data.jwt,
        data.headers["set-cookie"]
      );
    }) as Promise<Boolean>[];
    const res = await Promise.allSettled(promises);
    // log results
    res.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        console.log(
          "Successfully booked tee time for",
          firstTeeTimes[index].time
        );
      } else if (result.status === "rejected") {
        console.log(
          "Failed to book tee time for",
          firstTeeTimes[index].time,
          result.reason
        );
      } else {
        console.log("Failed to book tee time for", firstTeeTimes[index].time);
      }
    });
  } catch (e) {
    error("Failed to book earliest tee time", e);
  }
};

export const scheduleBookEarliest = onSchedule(
  {
    // schedule: "59 18 * * 4-6", // thurs-saturday
    schedule: "59 18 * * 4-6",
    timeZone: "America/New_York",
    timeoutSeconds: 540,
  },
  bookEarliest
);
