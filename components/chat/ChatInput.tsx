import React, { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

interface ChatInputProps {
  onSubmit: (input: string) => void;
  isDisabled: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isDisabled,
  placeholder = "Type your message...",
}) => {
  const [inputValue, setInputValue] = useState("");

  // Handle form submission
  const handleSubmit = () => {
    if (inputValue.trim() && !isDisabled) {
      onSubmit(inputValue);
      setInputValue("");
    }
  };

  // Handle key press (Enter to submit)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="py-4 px-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <Textarea
          placeholder={placeholder}
          className="min-h-[60px] max-h-[200px] resize-none flex-1 py-3 px-4 rounded-lg"
          disabled={isDisabled}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          className="h-10 w-10 rounded-full"
          disabled={isDisabled || !inputValue.trim()}
          size="icon"
          onClick={handleSubmit}
          type="button"
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
