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
import { Button } from "@/components/ui/button";
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
    <main className="flex flex-col items-center p-4 bg-brand text-white h-full">
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
                  <TableHead className="w-[100px]">Cancel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!schedules.length &&
                  schedules.map((schedule: any) => (
                    <TableRow key={schedule.date}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(schedule.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{schedule.after}</TableCell>
                      <TableCell>{schedule.before}</TableCell>
                      <TableCell>
                        <Button onClick={() => deleteSchedule(schedule)} variant={'destructive'}>
                          X
                        </Button>
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
