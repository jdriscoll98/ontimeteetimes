import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { log } from "firebase-functions/logger";
import { bookTime, getAllTeeTimes } from "./golf";
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
      booking_class_id: 10245,
      date: date.toLocaleDateString("en-us", {
        // mm-dd-yyyy
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    });
    log(`Found ${teeTimes.length} tee times for ${date.toISOString()}`);

    // check if the before date is after the current date
    if (now.getDate() > date.getDate()) {
      // delete the doc
      await doc.ref.delete();
      return;
    }
    // check if any of the tee times fall within the after and before times
    const times = teeTimes.filter((teeTime: any) => {
      const date = new Date(teeTime.time);
      const hours = date.getHours();
      return hours > data.after && hours < data.before;
    });
    // loop through each time
    for (const time of times) {
      // book the time
      const res = await bookTime({ time, email: data.email });
      // check if the time was booked
      if (res?.success) {
        await db.collection("schedule").doc(doc.id).delete();
        break;
      }
    }
  });
  await Promise.all(promises);
});
