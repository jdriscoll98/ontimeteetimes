"use client";

import { deleteSchedule, getSchedules } from "@/lib/firebase";
import React, { useEffect } from "react";
import { Schedule } from "@/types";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { bookTime } from "@/lib/golf";
import { formatTimestamp } from "@/lib/utils";
const Page = () => {
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;
    const fetchSchedules = async () => {
      const schedules = await getSchedules({ email });
      setSchedules(schedules);
    };
    fetchSchedules();
  }, []);
  return (
    <main className="flex flex-col items-center p-4 bg-black text-white h-full">
      <h1 className="text-2xl font-bold mb-4">All Schedules</h1>

      <div className="w-full mt-6 overflow-scroll max-h-full">
        <div className="border rounded-lg w-full">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="w-[100px]">Book</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!schedules.length &&
                  schedules.map((schedule: any) => (
                    <TableRow key={schedule.date}>
                      <TableCell className="font-medium">{formatTimestamp(schedule.date)}</TableCell>
                      <TableCell>{schedule.after}</TableCell>
                      <TableCell>{schedule.before}</TableCell>
                      <TableCell>{schedule.players}</TableCell>
                      <TableCell>
                        <button onClick={() => deleteSchedule(schedule)}>X</button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!schedules.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No schedules found
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

export default Page;
