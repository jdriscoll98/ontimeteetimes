/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/ICbd4Zhpx0p
 */
import { CalendarIcon, ClockIcon, InfoIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

export function AppBar() {
  return (
    <div className="flex lg:flex-row bg-brand text-white border-t w-full fixed bottom-0 h-14">
      <Link
        href="/bookings"
        className="flex-1 flex items-center justify-center py-4 lg:py-6 border-r lg:border-r-0 lg:border-b cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div className="text-center flex items-center flex-col gap-[0.8rem]">
          <CalendarIcon />
        </div>
      </Link>
      <Link
        href="/schedules"
        className="flex-1 flex items-center justify-center py-4 lg:py-6 border-r lg:border-r-0 lg:border-b cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div className="text-center flex items-center  flex-col gap-[0.8rem]">
          <ClockIcon />
        </div>
      </Link>
      <Link
        href="/"
        className="flex-1 flex items-center justify-center py-4 lg:py-6 border-r lg:border-r-0 lg:border-b cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div className="text-center flex items-center  flex-col gap-[0.8rem]">
          <PlusIcon />
        </div>
      </Link>
      <Link
        href="/all"
        className="flex-1 flex items-center justify-center py-4 lg:py-6 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div className="text-center flex items-center  flex-col gap-[0.8rem]">
          <InfoIcon />
        </div>
      </Link>
    </div>
  );
}
