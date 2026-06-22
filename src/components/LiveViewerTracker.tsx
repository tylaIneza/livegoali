"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socketClient";

export function LiveViewerTracker({ matchId }: { matchId: string }) {
  const { data: session } = useSession();

  useEffect(() => {
    const socket = getSocket();
    const userId = (session?.user as { id?: string })?.id ?? undefined;

    const join = () => socket.emit("join-match", { matchId, userId });
    join();
    socket.on("connect", join);

    return () => {
      socket.off("connect", join);
      socket.emit("leave-match", matchId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return null;
}
