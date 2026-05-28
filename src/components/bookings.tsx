import {
  NeoTable,
  NeoTableBody,
  NeoTableCell,
  NeoTableHead,
  NeoTableHeader,
  NeoTableRow,
} from "@/components/ui/neo-table";
import { useEffect, useState } from "react";
import NeoButton from "./ui/neo-button";
import { XCircle } from "lucide-react";
import { EagleReservation } from "@/lib/eagle";

function formatDate(yyyymmdd: string): string {
  const y = parseInt(yyyymmdd.slice(0, 4), 10);
  const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const d = parseInt(yyyymmdd.slice(6, 8), 10);
  return new Date(y, m, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(hhmm: string): string {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = parseInt(hhmm.slice(2, 4), 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function Bookings() {
  const { bookings, cancelBooking } = useBookings();
  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold">Current Bookings</h1>
      <div className="w-full mt-6">
        <div className="border rounded-lg w-full">
          <div className="relative w-full overflow-auto">
            <NeoTable>
              <NeoTableHeader>
                <NeoTableRow>
                  <NeoTableHead>Date</NeoTableHead>
                  <NeoTableHead>Time</NeoTableHead>
                  <NeoTableHead>Course</NeoTableHead>
                  <NeoTableHead>Players</NeoTableHead>
                  <NeoTableHead>Cancel</NeoTableHead>
                </NeoTableRow>
              </NeoTableHeader>
              <NeoTableBody>
                {!!bookings?.length &&
                  bookings.map((booking) => (
                    <NeoTableRow key={`${booking.appointmentDetailId}_${booking.appointmentSlotDetailId}`}>
                      <NeoTableCell className="font-medium">{formatDate(booking.date)}</NeoTableCell>
                      <NeoTableCell>{formatTime(booking.time)}</NeoTableCell>
                      <NeoTableCell>{booking.nineName}</NeoTableCell>
                      <NeoTableCell>{booking.players}</NeoTableCell>
                      <NeoTableCell>
                        <NeoButton className="p-2 bg-white" onClick={() => cancelBooking(booking)}>
                          <XCircle />
                        </NeoButton>
                      </NeoTableCell>
                    </NeoTableRow>
                  ))}
                {bookings?.length === 0 && (
                  <NeoTableRow>
                    <NeoTableCell colSpan={5} className="text-center">
                      No bookings found
                    </NeoTableCell>
                  </NeoTableRow>
                )}
                {typeof bookings === "undefined" && (
                  <NeoTableRow>
                    <NeoTableCell colSpan={5} className="text-center">
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
}

function useBookings() {
  const [bookings, setBookings] = useState<EagleReservation[] | undefined>(undefined);

  useEffect(() => {
    const email = window.localStorage.getItem("email");
    if (!email) return;
    const formData = new FormData();
    formData.append("email", email);
    fetch("/api/bookings", { method: "POST", body: formData }).then(async (res) => {
      const { bookings } = await res.json();
      setBookings(bookings ?? []);
    });
  }, []);

  const cancelBooking = (booking: EagleReservation) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    const formData = new FormData();
    formData.append("email", window.localStorage.getItem("email") || "");
    formData.append("appointmentDetailId", String(booking.appointmentDetailId));
    formData.append("appointmentSlotDetailId", String(booking.appointmentSlotDetailId));
    fetch("/api/bookings", { method: "DELETE", body: formData }).then(async (res) => {
      const json = await res.json();
      if (json.success) {
        alert("Booking cancelled");
        setBookings(
          bookings?.filter(
            (b) =>
              b.appointmentDetailId !== booking.appointmentDetailId ||
              b.appointmentSlotDetailId !== booking.appointmentSlotDetailId
          )
        );
      }
    });
  };

  return { bookings, cancelBooking };
}
