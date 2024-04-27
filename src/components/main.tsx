"use client";

import React, { useEffect, useState } from "react";
import { LoginForm } from "./login-form";

const Main = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const email = window.localStorage.getItem("email");
    if (email) setEmail(email);
  }, []);
  return <div className="grow py-14 bg-bg">{email ? children : <LoginForm />}</div>;
};

export default Main;
