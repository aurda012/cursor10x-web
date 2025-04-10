import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { Message } from "@/types/chat";

interface ChatMessagesProps {
  messages: Message[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          sender={message.sender}
          content={message.content}
          artifactData={message.artifactData}
          blueprintStream={(message as any).blueprintStream}
          onBlueprintComplete={(message as any).onBlueprintComplete}
          architectureStream={(message as any).architectureStream}
          onArchitectureComplete={(message as any).onArchitectureComplete}
          guideStream={(message as any).guideStream}
          onGuideComplete={(message as any).onGuideComplete}
          tasksStream={(message as any).tasksStream}
          onTasksComplete={(message as any).onTasksComplete}
        />
      ))}
      {/* Empty div for auto-scroll target */}
      <div ref={endOfMessagesRef} className="h-4" />
    </div>
  );
};

export default ChatMessages;
