

"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  message: string;
  user_name: string;
  created_at: string;
};
type LectureChatProps = {
  lectureId: string;
  user: {
    id: string;
    name: string;
  };
};

export default function LectureChat({ lectureId, user }: LectureChatProps) {
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("lecture_chat_messages")
        .select("*")
        .eq("lecture_id", lectureId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) setMessages(data);
    };

    fetchMessages();
  }, [lectureId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lecture_chat_messages",
          filter: `lecture_id=eq.${lectureId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lectureId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    await supabase.from("lecture_chat_messages").insert({
      lecture_id: lectureId,
      user_id: user.id,
      user_name: user.name,
      message: input,
    });

    setInput("");
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px]">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold text-blue-600">
              {msg.user_name}
            </span>
            <span className="text-gray-700 ml-2">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex border-t p-2 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt..."
          className="flex-1 border rounded px-3 py-2 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded text-sm"
        >
          Send
        </button>
      </div>

    </div>
  );
}