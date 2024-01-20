"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { CalendarDaysIcon } from "lucide-react";
import React, { useEffect } from "react";

const All = () => {
  const [times, setTimes] = React.useState([]);
  const [date, setDate] = React.useState(new Date());
  useEffect(() => {
    if (!window.localStorage.getItem("email")) return;
    // mm-dd-yyyy
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    fetch("/api/times", {
      method: "POST",
      body: JSON.stringify({
        email: window.localStorage.getItem("email"),
        date: formattedDate,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTimes(data.times);
      });
  }, [date]);

  async function bookTime(time: any) {
    const formData = new FormData();
    const email = window.localStorage.getItem("email");
    if (!email) return;
    formData.append("email", email);
    formData.append("time", JSON.stringify(time));
    const res = await fetch("/api/book", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      alert("Booking succeeded");
      // remove the time from the list
      setTimes(times.filter((t: any) => t.time !== time.time));
    } else {
      alert("Booking failed");
    }
  }
  return (
    <main className="flex flex-col items-center p-4 bg-black text-white h-full">
      <h1 className="text-2xl font-bold mb-4">All Tee Times</h1>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="w-[240px] justify-start text-left font-normal"
            variant="outline"
          >
            <CalendarDaysIcon className="mr-1 h-4 w-4 -translate-x-1" />
            {date.toDateString() || "Select a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            initialFocus
            mode="single"
            onDayClick={(day) => setDate(day)}
          />
        </PopoverContent>
      </Popover>
      <div className="w-full mt-6 overflow-scroll max-h-full">
        <div className="border rounded-lg w-full">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="w-[100px]">Book</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!times.length &&
                  times.map((time: any) => (
                    <TableRow key={time.time}>
                      <TableCell className="font-medium">{time.time}</TableCell>
                      <TableCell>{time.available_spots}</TableCell>
                      <TableCell>{time.green_fee}</TableCell>
                      <TableCell>
                        <button onClick={() => bookTime(time)}>Book</button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!times.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No times found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default All;