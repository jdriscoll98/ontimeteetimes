// Import the functions you need from the SDKs you need
import { Schedule } from "@/types";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
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
