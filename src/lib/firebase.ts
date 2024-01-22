// Import the functions you need from the SDKs you need
import { Schedule } from "@/types";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "ontimeteetimes.firebaseapp.com",
  projectId: "ontimeteetimes",
  storageBucket: "ontimeteetimes.appspot.com",
  messagingSenderId: "427219332889",
  appId: "1:427219332889:web:0587573cc508ef95c61f88",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function setAuth({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const docRef = doc(db, "auth", email);
  await setDoc(docRef, { email, password });
}

export async function getAuth({ email }: { email: string }) {
  const docRef = doc(db, "auth", email);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as { email: string; password: string };
  } else {
    return null;
  }
}

export async function setSchedule({
  email,
  date,
  players,
  after,
  before,
}: Schedule) {
  const colRef = collection(db, "schedule");
  await addDoc(colRef, { email, date, players, after, before });
}

export async function getSchedules({ email }: { email: string }) {
  const colRef = collection(db, "schedule");
  const q = query(colRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Schedule);
}

export async function deleteSchedule({ schedule }: { schedule: Schedule }) {
  const colRef = collection(db, "schedule");
  const q = query(
    colRef,
    where("email", "==", schedule.email),
    where("date", "==", schedule.date),
    where("players", "==", schedule.players),
    where("after", "==", schedule.after),
    where("before", "==", schedule.before)
  );
  const querySnapshot = await getDocs(q);
  const promises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.allSettled(promises);
}