"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface CountdownContextValue {
  now: number;
}

const CountdownContext = createContext<CountdownContextValue>({ now: Date.now() });

export function CountdownProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CountdownContext.Provider value={{ now }}>
      {children}
    </CountdownContext.Provider>
  );
}

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isEnded: boolean;
  isEndingSoon: boolean;
  isEndingToday: boolean;
}

export function useCountdown(endTime: string | Date): CountdownResult {
  const { now } = useContext(CountdownContext);

  const end = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();
  const diff = Math.max(0, end - now);

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
    isEnded: diff <= 0,
    isEndingSoon: diff > 0 && diff < 24 * 60 * 60 * 1000,
    isEndingToday: diff > 0 && diff < 6 * 60 * 60 * 1000,
  };
}
