"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSchedule, getSchedules } from "@/lib/firebase";
import { Schedule } from "@/types";
import React, { useEffect } from "react";
const Page = () => {
  const [schedules, setSchedules] = React.useState<Schedule[] | undefined>(
    undefined
  );
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
                {!!schedules?.length &&
                  schedules?.map((schedule: Schedule) => (
                    <TableRow key={schedule.date}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(schedule.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{schedule.after}:00</TableCell>
                      <TableCell>{schedule.before}:00</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => deleteSchedule({ schedule })}
                          variant={"destructive"}
                        >
                          X
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {schedules?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No schedules found
                    </TableCell>
                  </TableRow>
                )}
                {typeof schedules === "undefined" && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading...
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
