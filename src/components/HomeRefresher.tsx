"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socketClient";

export function HomeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();

    const joinGlobal = () => socket.emit("join-global");
    joinGlobal();
    socket.on("connect", joinGlobal);

    // Refresh when any match score or status updates
    socket.on("match-updated", () => router.refresh());

    // Fallback: soft refresh every 30s to catch status changes from admin
    const interval = setInterval(() => router.refresh(), 30_000);

    return () => {
      socket.off("connect", joinGlobal);
      socket.off("match-updated");
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
