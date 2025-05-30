/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/WBPFWqgxziP
 */
import { setSchedule } from "@/lib/firebase";
import { Schedule } from "@/types";
import { useState } from "react";
import NeoButton from "./ui/neo-button";
import Textarea from "./ui/textarea";
import { getSchedule } from "@/lib/openai";

export function ScheduleForm() {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [previewSchedule, setPreviewSchedule] = useState<Schedule | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      setLoading("getSchedule");
      const schedule = await getSchedule(value);
      setPreviewSchedule(schedule);
    } catch (e) {
      alert((e as Error).message);
      return;
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="mx-auto  space-y-6 p-4 ">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">When would you like to play?</h1>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <Textarea
        value={value}
        setValue={setValue}
        placeholder={"Example:\nsaturday or sunday, after 10am and before 2pm"}
      />
      {previewSchedule && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Is this correct?</h2>
          <div>
            <div>Date: {new Date(previewSchedule.date).toDateString()}</div>
            {!!previewSchedule.after && (
              <div>After: {previewSchedule.after}:00</div>
            )}
            {previewSchedule.before !== 23 && (
              <div>Before: {previewSchedule.before}:00</div>
            )}
            {previewSchedule.players && (
              <div>Players : {previewSchedule.players}</div>
            )}
          </div>
        </div>
      )}
      {previewSchedule ? (
        <div className="flex gap-4">
          <NeoButton
            className="mx-auto bg-danger"
            onClick={() => {
              setError(null);
              setPreviewSchedule(null);
            }}
          >
            No
          </NeoButton>
          <NeoButton
            loading={loading === "setSchedule"}
            className="mx-auto bg-success"
            onClick={async () => {
              setError(null);
              try {
                setLoading("setSchedule");
                await setSchedule({
                  ...previewSchedule,
                  email: localStorage.getItem("email") ?? "",
                });
                window.location.href = "/schedules";
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setLoading("");
              }
            }}
          >
            Yes
          </NeoButton>
        </div>
      ) : (
        <NeoButton
          loading={loading === "getSchedule"}
          className="mx-auto"
          onClick={() => onSubmit()}
        >
          Submit
        </NeoButton>
      )}
    </div>
  );
}
