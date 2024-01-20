"use client";

import React, { useEffect, useState } from "react";
import { LoginForm } from "./login-form";

const Main = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const email = window.localStorage.getItem("email");
    if (email) setEmail(email);
  }, []);
  if (!email) return <LoginForm />;
  return children;
};

export default Main;
