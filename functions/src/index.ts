import * as dayjs from "dayjs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { log } from "firebase-functions/logger";
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
      booking_class_id: 10426,
      date: date.toLocaleDateString("en-us", {
        // mm-dd-yyyy
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    });
    log(`Found ${teeTimes.length} tee times for ${date.toISOString()}`);
    if (teeTimes.lnegth === 0) return null;

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
  const data = await getAuthToken({
    email: "Wsilva123@gmail.com",
    password: "Golf123",
  });
  //   only run this on thursday, friday and saturday
  // const day = new Date().getDay();
  // if (![4, 5, 6].includes(day)) {
  //   console.log("Not running on day", day);
  //   return;
  // }
  let date: dayjs.Dayjs | string = dayjs(new Date())
    .add(3, "week")
    .add(1, "day");

  date = date.format("MM-DD-YYYY");

  // while not 7pm est wait
  let teeTimes = [];
  while (!teeTimes.length) {
    teeTimes = await getAllTeeTimes({
      booking_class_id: 10426,
      date,
    });
    console.log("Waiting for tee times");
    // if current time is 7:01pm est, break
    if (dayjs().format("HH") === "19" && dayjs().format("mm") === "01") {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const teeTeeRequest = {
    teesheet_id: "2912",
    teesheet_holes: "18",
    course_id: "19905",
    course_name: "Jacksonville Beach Golf Club",
    schedule_name: "Jacksonville Beach Golf",
    schedule_id: "2912",
    holes: 18,
    booking_class_id: 10246,
    players: 4,
  };
  const firstFiveTeeTimes = teeTimes
    .slice(0, 2)
    .map((teeTime: any) => teeTime.time);
  // try to book the first 5 tee times
  const promises = firstFiveTeeTimes.map((time: any) => {
    return bookTeeTimeWithAuth(
      {
        ...teeTeeRequest,
        time,
      },
      data.data.jwt
    );
  });
  const res = await Promise.allSettled(promises);
  // log results
  res.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log("Successfully booked tee time for", firstFiveTeeTimes[index]);
    } else {
      console.log(
        "Failed to book tee time for",
        firstFiveTeeTimes[index],
        result.reason
      );
    }
  });
};

export const scheduleBookEarliest = onSchedule(
  {
    // schedule: "59 18 * * 4-6", // thurs-saturday
    schedule: "59 18 * * *",
    timeZone: "America/New_York",
  },
  bookEarliest
);
