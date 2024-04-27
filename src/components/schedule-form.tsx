/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/WBPFWqgxziP
 */
import { setSchedule } from "@/lib/firebase";
import { Schedule } from "@/types";
import { SetStateAction, useState } from "react";
import NeoButton from "./ui/neo-button";
import Textarea from "./ui/textarea";

export function ScheduleForm() {
  const [value, setValue] = useState("");

  const onSubmit = async (form: Schedule) => {
    try {
      await setSchedule(form);
      alert("Schedule successful");
    } catch (e) {
      alert("Schedule failed");
      return;
    }
  };
  return (
    <div className="mx-auto  space-y-6 p-4 ">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">When would you like to play?</h1>
      </div>
      <Textarea
        value={value}
        setValue={setValue}
        placeholder={"Example:\nsaturday or sunday, after 10am and before 2pm"}
      />
      <NeoButton className='mx-auto' onClick={() => {}}>Submit</NeoButton>
    </div>
  );
}
