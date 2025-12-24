import { useEffect, useRef } from "react";
import { MessageItem } from "./VoiceRealtimeAgent";

interface Props {
  messages: MessageItem[];
}

export default function ChatMessages({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom (stream feeling)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[400px] w-full  flex-col gap-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
      {messages
        .filter((ms) => ms.type === "message")
        .map((msg) => {
          const isUser = msg.role === "user";

          const text =
            msg?.content?.find((c) => c.transcript)?.transcript ?? "";
          return (
            <div
              key={msg.itemId}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {!isUser && (
                  <div className="mb-1 text-xs font-medium text-gray-500">
                    AI Agent
                  </div>
                )}

                {text ?? "..."}
              </div>
            </div>
          );
        })}

      <div ref={bottomRef} />
    </div>
  );
}
