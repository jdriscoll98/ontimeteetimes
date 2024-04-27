"use client";

import { Button } from "@/components/ui/button";
import NeoButton from "@/components/ui/neo-button";
import {
  NeoTable,
  NeoTableBody,
  NeoTableCell,
  NeoTableHead,
  NeoTableHeader,
  NeoTableRow,
} from "@/components/ui/neo-table";
import { deleteSchedule, getSchedules } from "@/lib/firebase";
import { Schedule } from "@/types";
import { XCircle } from "lucide-react";
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
    <main className="flex flex-col items-center p-4  h-full">
      <h1 className="text-2xl font-bold mb-4">All Schedules</h1>

      <div className="w-full mt-6 overflow-scroll max-h-full">
        <div className="border rounded-lg w-full">
          <div className="relative w-full overflow-auto">
            <NeoTable>
              <NeoTableHeader>
                <NeoTableRow>
                  <NeoTableHead>Date</NeoTableHead>
                  <NeoTableHead>After</NeoTableHead>
                  <NeoTableHead>Before</NeoTableHead>
                  <NeoTableHead>Cancel</NeoTableHead>
                </NeoTableRow>
              </NeoTableHeader>
              <NeoTableBody>
                {!!schedules?.length &&
                  schedules?.map((schedule: Schedule) => (
                    <NeoTableRow key={schedule.date}>
                      <NeoTableCell className="whitespace-nowrap">
                        {new Date(schedule.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </NeoTableCell>
                      <NeoTableCell>{schedule.after}:00</NeoTableCell>
                      <NeoTableCell>{schedule.before}:00</NeoTableCell>
                      <NeoTableCell>
                        <NeoButton
                          onClick={() => deleteSchedule({ schedule })}
                          className="p-2"
                        >
                          <XCircle />
                        </NeoButton>
                      </NeoTableCell>
                    </NeoTableRow>
                  ))}
                {schedules?.length === 0 && (
                  <NeoTableRow>
                    <NeoTableCell colSpan={4} className="text-center">
                      No schedules found
                    </NeoTableCell>
                  </NeoTableRow>
                )}
                {typeof schedules === "undefined" && (
                  <NeoTableRow>
                    <NeoTableCell colSpan={4} className="text-center">
                      Loading...
                    </NeoTableCell>
                  </NeoTableRow>
                )}
              </NeoTableBody>
            </NeoTable>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
