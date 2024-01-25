/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/AXXN2EMtSrs
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

export function Bookings() {
  const { bookings, cancelBooking } = useBookings();
  return (
    <main className="flex flex-col items-center p-4 bg-brand text-white">
      <h1 className="text-2xl font-bold mb-4">Current Bookings</h1>
      <div className="w-full mt-6">
        <div className="border rounded-lg w-full">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-secondary">Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="w-[4rem]">Cancel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!bookings?.length &&
                  bookings?.map((booking: any) => (
                    <TableRow key={booking.date_booked}>
                      <TableCell className="font-medium">
                        {new Date(booking.date_booked).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.time).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{booking.carts}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => cancelBooking(booking)}
                          className="border-[1px] border-white rounded-full p-4 w-4 h-4 flex items-center justify-center"
                        >
                          X
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                {bookings?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No bookings found
                    </TableCell>
                  </TableRow>
                )}
                {typeof bookings === "undefined" && (
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
}

function useBookings() {
  const [bookings, setBookings] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    if (!window.localStorage.getItem("email")) return;
    const formData = new FormData();
    formData.append("email", window.localStorage.getItem("email") || "");
    fetch("/api/bookings", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const { bookings } = await res.json();
      setBookings(bookings);
    });
  }, []);

  const cancelBooking = (booking: any) => {
    if (
      window.confirm("Are you sure you want to cancel this booking?") === false
    )
      return;
    const formData = new FormData();
    formData.append("email", window.localStorage.getItem("email") || "");
    formData.append("id", booking.TTID);
    fetch("/api/bookings", {
      method: "DELETE",
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (json.success) {
        alert("Booking cancelled");
        setBookings(bookings?.filter((b: any) => b.TTID !== booking.TTID));
      }
    });
  };

  return {
    bookings,
    cancelBooking,
  };
}
