"use client";
/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/j7QQWsTHwh8
 */
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Header() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const email = window.localStorage.getItem("email");
    if (email) setEmail(email);
  }, []);
  return (
    <header
      key="1"
      className="h-14 flex items-center justify-between px-4 bg-brand shadow-md text-white fixed top-0 w-full z-50"
    >
      <div className="text-sm">{email}</div>
      <Button
        className="p-2"
        variant="ghost"
        onClick={() => {
          window.localStorage.removeItem("email");
          window.localStorage.removeItem("password");
          window.location.reload();
        }}
      >
        Switch User
      </Button>
    </header>
  );
}


