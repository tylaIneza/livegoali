"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, Lock } from "lucide-react";
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
  const [sending, setSending] = useState(false);
  const lastTimestamp = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const url = lastTimestamp.current
        ? `/api/chat?matchId=${matchId}&after=${encodeURIComponent(lastTimestamp.current)}`
        : `/api/chat?matchId=${matchId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      if (data.length > 0) {
        setMessages((prev) =>
          lastTimestamp.current ? [...prev, ...data] : data
        );
        lastTimestamp.current = data[data.length - 1].createdAt;
      }
    } catch {}
  }, [matchId]);

  // Initial load + poll every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !session || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, content }),
      });
      if (res.ok) {
        const msg: ChatMessage = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastTimestamp.current = msg.createdAt;
      }
    } catch {} finally {
      setSending(false);
      inputRef.current?.focus();
    }
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
          <div className="w-2 h-2 rounded-full bg-[#00FF84] live-pulse" />
          <span className="text-xs text-gray-500">Live</span>
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
                  <span className="text-[10px] text-gray-600">{formatTimeAgo(msg.createdAt)}</span>
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
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              maxLength={200}
              disabled={sending}
              className="flex-1 bg-[#0B0F14] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00FF84]/40 transition-colors disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
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
