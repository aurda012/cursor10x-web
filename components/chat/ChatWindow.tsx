import React, { useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ArtifactBadge from "./ArtifactBadge";

interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
  isComplete?: boolean;
  statusMessage?: string;
  onSubmit: (msg: string) => void;
  inputPlaceholder?: string;
}

export default function ChatWindow({
  messages,
  isProcessing,
  isComplete = false,
  statusMessage,
  onSubmit,
  inputPlaceholder,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="py-4 text-center">
          <h1 className="text-xl font-semibold">Cursor10x Project Generator</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Use the ChatMessages component for the conversation */}
        <ChatMessages messages={messages} />

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <ChatInput
          isDisabled={isProcessing || isComplete}
          onSubmit={onSubmit}
          placeholder={inputPlaceholder || "Type your answer here..."}
        />
      </div>
    </div>
  );
}
