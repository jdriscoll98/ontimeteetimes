import { db } from ".";
export async function getAuth({ email }: { email: string }) {
  // get the auth token from the db
  const snapshot = await db.collection("auth").doc(email).get();
  // check if the doc exists
  if (!snapshot.exists) return null;
  // return the data
  return snapshot.data() as { email: string; password: string };
}
