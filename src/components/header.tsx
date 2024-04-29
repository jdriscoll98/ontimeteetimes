"use client";
/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/j7QQWsTHwh8
 */
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import NeoButton from "./ui/neo-button";

export function Header() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const email = window.localStorage.getItem("email");
    if (email) setEmail(email);
  }, []);
  return (
    <header
      key="1"
      className="h-16 flex items-center justify-between px-4 bg-white shadow-md text-black fixed top-0 w-full z-50 border-b-4 border-black"
    >
      <div className="text-sm">{email}</div>
      {window?.localStorage.getItem("email") && (
        <NeoButton
          className="p-2 bg-white"
          onClick={() => {
            window.localStorage.removeItem("email");
            window.localStorage.removeItem("password");
            window.location.reload();
          }}
        >
          Switch User
        </NeoButton>
      )}
    </header>
  );
}
