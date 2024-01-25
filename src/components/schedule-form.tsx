/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/WBPFWqgxziP
 */
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setSchedule } from "@/lib/firebase";
import { formatTimestamp } from "@/lib/utils";
import { Schedule } from "@/types";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export function ScheduleForm() {
  const [form, setForm] = useState({
    date: new Date().getTime(),
    players: 4,
    after: 7,
    before: 17,
  });

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
    <div className="mx-auto  space-y-6 p-4 bg-brand text-white">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Schedule a Tee Time</h1>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="gap-2 flex flex-col">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="w-[300px] justify-start text-left font-normal"
                  id="date"
                >
                  <CalendarIcon className="mr-1 h-4 w-4 -translate-x-1" />
                  {formatTimestamp(form.date) || "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  numberOfMonths={1}
                  onDayClick={(e) => {
                    setForm({ ...form, date: e.getTime() });
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="players">Number of Players</Label>
            <Select
              onValueChange={(e) => {
                setForm({ ...form, players: +e });
              }}
              defaultValue={form.players.toString()}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="# of players" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Players</SelectLabel>
                  <SelectItem value="1">1 player</SelectItem>
                  <SelectItem value="2">2 players</SelectItem>
                  <SelectItem value="3">3 players</SelectItem>
                  <SelectItem value="4">4 players</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-time">
            After
            <Input
              className="mt-2"
              id="start-time"
              type="time"
              onChange={(e) => {
                const [hour] = e.target.value.split(":");
                setForm({ ...form, after: +hour });
              }}
              defaultValue={
                // form.after is the hour value, set the default value to the hour value
                `${form.after.toString().padStart(2, "0")}:00`
              }
            />
          </Label>
          <div />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">
            Before
            <Input
              className="mt-2"
              id="end-time"
              type="time"
              onChange={(e) => {
                const [hour] = e.target.value.split(":");
                setForm({ ...form, before: +hour });
              }}
              defaultValue={
                // form.before is the hour value, set the default value to the hour value
                `${form.before.toString().padStart(2, "0")}:00`
              }
            />
          </Label>
          <div />
        </div>
        <Button
          className="w-full"
          onClick={() =>
            onSubmit({
              ...form,
              email: window.localStorage.getItem("email") ?? "",
            })
          }
        >
          Schedule Tee Time
        </Button>
      </div>
    </div>
  );
}
