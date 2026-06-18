"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { Send, Smile, Lock } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    isVIP: boolean;
  };
}

export function LiveChat({ matchId }: { matchId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-match", matchId);
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), msg]);
    });

    socket.on("chat-history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    return () => {
      socket.emit("leave-match", matchId);
      socket.disconnect();
    };
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !session || !socketRef.current) return;
    socketRef.current.emit("send-message", {
      matchId,
      content: input.trim(),
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/8 bg-[#121821] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/8">
        <h3 className="text-sm font-bold text-white">Live Chat</h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#00FF84]" : "bg-red-500"}`} />
          <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Reconnecting..."}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-8">
            Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={msg.user.image || ""} />
                <AvatarFallback className="text-[10px]">
                  {msg.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-bold ${
                    msg.user.role === "ADMIN" || msg.user.role === "SUPER_ADMIN"
                      ? "text-[#00FF84]"
                      : msg.user.isVIP
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}>
                    {msg.user.name || "User"}
                  </span>
                  {(msg.user.role === "ADMIN" || msg.user.role === "SUPER_ADMIN") && (
                    <Badge variant="default" className="text-[8px] px-1 py-0 h-3.5">ADMIN</Badge>
                  )}
                  {msg.user.isVIP && msg.user.role === "USER" && (
                    <Badge variant="premium" className="text-[8px] px-1 py-0 h-3.5">VIP</Badge>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {formatTimeAgo(msg.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-300 break-words leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session ? (
        <div className="p-3 border-t border-white/8">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              maxLength={200}
              className="flex-1 bg-[#0B0F14] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FF84]/40 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-[#00FF84]/10 text-[#00FF84] hover:bg-[#00FF84]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-white/8">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#00FF84]/10 text-[#00FF84] text-xs font-medium hover:bg-[#00FF84]/20 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Sign in to chat
          </Link>
        </div>
      )}
    </div>
  );
}
