import { setSchedule } from "@/lib/firebase";
import { useState } from "react";
import NeoButton from "./ui/neo-button";
import NeoInput from "./ui/neo-input";

function toHHMM(value: string): string {
  return value.replace(":", "");
}

export function ScheduleForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [after, setAfter] = useState("06:00");
  const [before, setBefore] = useState("20:00");
  const [players, setPlayers] = useState("4");

  const onSubmit = async () => {
    setError(null);
    if (!date) {
      setError("Pick a date");
      return;
    }
    const playerCount = parseInt(players, 10);
    if (!playerCount || playerCount < 1 || playerCount > 4) {
      setError("Players must be 1-4");
      return;
    }
    const target = new Date(date + "T12:00:00").getTime();
    if (target < Date.now()) {
      setError("Date is in the past");
      return;
    }
    try {
      setLoading(true);
      await setSchedule({
        date: target,
        after: toHHMM(after),
        before: toHHMM(before),
        players: playerCount,
        email: localStorage.getItem("email") ?? "",
      });
      window.location.href = "/schedules";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">When would you like to play?</h1>
      </div>
      {error && <div className="text-red-500">{error}</div>}

      <label className="block space-y-1">
        <span className="font-semibold">Date</span>
        <NeoInput
          type="date"
          value={date}
          setValue={setDate}
          placeholder="Date"
          className="w-full"
        />
      </label>

      <div className="flex gap-4">
        <label className="block space-y-1 flex-1">
          <span className="font-semibold">After</span>
          <NeoInput
            type="time"
            value={after}
            setValue={setAfter}
            placeholder="After"
            className="w-full"
          />
        </label>
        <label className="block space-y-1 flex-1">
          <span className="font-semibold">Before</span>
          <NeoInput
            type="time"
            value={before}
            setValue={setBefore}
            placeholder="Before"
            className="w-full"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="font-semibold">Players</span>
        <NeoInput
          type="number"
          min={1}
          max={4}
          value={players}
          setValue={setPlayers}
          placeholder="Players"
          className="w-full"
        />
      </label>

      <NeoButton loading={loading} className="mx-auto" onClick={onSubmit}>
        Schedule
      </NeoButton>
    </div>
  );
}
