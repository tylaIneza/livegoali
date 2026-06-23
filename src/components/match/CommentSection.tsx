"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ThumbsUp, Reply, Trash, Lock } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import toast from "react-hot-toast";
import type { CommentData } from "@/types";

interface Props {
  matchId: string;
}

export function CommentSection({ matchId }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const { data: comments = [], isLoading } = useQuery<CommentData[]>({
    queryKey: ["comments", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?matchId=${matchId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, content, parentId: replyTo?.id }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", matchId] });
      setComment("");
      setReplyTo(null);
      toast.success("Comment posted!");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", matchId] });
      toast.success("Comment deleted");
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;
    postMutation.mutate(comment.trim());
  };

  return (
    <div className="rounded-xl border border-white/8 bg-[#121821] overflow-hidden">
      <div className="p-4 border-b border-white/8 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#00FF84]" />
        <h3 className="font-bold text-white">Comments</h3>
        <span className="text-xs text-white/70 ml-1">({comments.length})</span>
      </div>

      {/* Input */}
      {session ? (
        <div className="p-4 border-b border-white/8">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-lg bg-[#00FF84]/5 border border-[#00FF84]/20">
              <span className="text-xs text-white/75">Replying to <strong className="text-[#00FF84]">@{replyTo.name}</strong></span>
              <button onClick={() => setReplyTo(null)} className="text-white/70 hover:text-white text-xs">✕</button>
            </div>
          )}
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                maxLength={500}
                className="w-full bg-[#0B0F14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#00FF84]/40 resize-none transition-colors"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/60">{comment.length}/500</span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!comment.trim() || postMutation.isPending}
                >
                  {postMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-white/8">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00FF84]/5 border border-[#00FF84]/20 text-[#00FF84] text-sm font-medium hover:bg-[#00FF84]/10 transition-all"
          >
            <Lock className="w-4 h-4" />
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments list */}
      <div className="divide-y divide-white/6">
        {isLoading ? (
          <div className="p-6 text-center text-white/70 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-center text-white/70 text-sm">
            Be the first to comment!
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={session?.user.id}
              onReply={(id, name) => setReplyTo({ id, name })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: CommentData;
  currentUserId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className={`p-4 ${isReply ? "ml-10 bg-[#0B0F14]/50" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={comment.user.image || ""} />
          <AvatarFallback>{comment.user.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${
              comment.user.role === "ADMIN" || comment.user.role === "SUPER_ADMIN"
                ? "text-[#00FF84]"
                : comment.user.isVIP
                ? "text-yellow-400"
                : "text-white"
            }`}>
              {comment.user.name || "User"}
            </span>
            {(comment.user.role === "ADMIN" || comment.user.role === "SUPER_ADMIN") && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">ADMIN</Badge>
            )}
            {comment.user.isVIP && comment.user.role === "USER" && (
              <Badge variant="premium" className="text-[10px] px-1.5 py-0">VIP</Badge>
            )}
            <span className="text-xs text-white/60">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1 text-xs text-white/70 hover:text-[#00FF84] transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              {comment.likes > 0 ? comment.likes : ""}
            </button>
            {!isReply && (
              <button
                onClick={() => onReply(comment.id, comment.user.name || "User")}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
            {currentUserId === comment.user.id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Replies */}
          {comment._count && comment._count.replies > 0 && !isReply && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="mt-2 text-xs text-[#00FF84] hover:underline"
            >
              {showReplies ? "Hide" : `Show ${comment._count.replies}`} replies
            </button>
          )}
          {showReplies && comment.replies && comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      </div>
    </div>
  );
}
