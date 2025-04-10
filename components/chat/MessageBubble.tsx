import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types/chat";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BlueprintViewer from "./BlueprintViewer";
import ArchitectureViewer from "./ArchitectureViewer";
import GuideViewer from "./GuideViewer";
import TasksViewer from "./TasksViewer";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";
import ArtifactBadge from "./ArtifactBadge";

interface MessageBubbleProps {
  sender: "user" | "agent";
  content: string;
  artifactData?: {
    type: "blueprint" | "architecture" | "guide" | "tasks";
    content: string;
  };
  blueprintStream?: ReadableStream<Uint8Array>;
  onBlueprintComplete?: (content: string) => void;
  architectureStream?: ReadableStream<Uint8Array>;
  onArchitectureComplete?: (content: string) => void;
  guideStream?: ReadableStream<Uint8Array>;
  onGuideComplete?: (content: string) => void;
  tasksStream?: ReadableStream<Uint8Array>;
  onTasksComplete?: (content: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  sender,
  content,
  artifactData,
  blueprintStream,
  onBlueprintComplete,
  architectureStream,
  onArchitectureComplete,
  guideStream,
  onGuideComplete,
  tasksStream,
  onTasksComplete,
}) => {
  const isUser = sender === "user";

  // Common markdown component configuration
  const MarkdownComponent = ({ content }: { content: string }) => (
    <div className="prose dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm prose-p:my-2 w-full max-w-full overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="my-2 overflow-hidden rounded">
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus}
                  customStyle={{ maxWidth: "100%" }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="mt-5 mb-2 text-xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-lg font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1 text-base font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-2 mb-1 text-sm font-semibold">{children}</h4>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full p-4",
        isUser ? "bg-secondary/20 justify-end" : "bg-background justify-start"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div
          className={cn(
            "bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow select-none",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {isUser ? (
            <UserIcon className="h-5 w-5" />
          ) : (
            <span className="text-xs font-semibold">AI</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1 pt-1 text-left">
          {/* Render message content */}
          <div className="max-w-full rounded-md">
            {isUser ? (
              <div className="whitespace-pre-wrap">{content}</div>
            ) : (
              <MarkdownComponent content={content} />
            )}
          </div>

          {/* Render specialized viewers for streams */}
          {blueprintStream && (
            <BlueprintViewer
              stream={blueprintStream}
              onComplete={onBlueprintComplete}
            />
          )}

          {architectureStream && (
            <ArchitectureViewer
              stream={architectureStream}
              onComplete={onArchitectureComplete}
            />
          )}

          {guideStream && (
            <GuideViewer stream={guideStream} onComplete={onGuideComplete} />
          )}

          {tasksStream && (
            <TasksViewer stream={tasksStream} onComplete={onTasksComplete} />
          )}

          {/* Render artifact data if present */}
          {artifactData && (
            <div className="mt-2">
              <div className="mb-2 flex items-center">
                <ArtifactBadge artifactType={artifactData.type} />
                <h3 className="ml-2 text-sm font-medium">
                  {artifactData.type.charAt(0).toUpperCase() +
                    artifactData.type.slice(1)}
                </h3>
              </div>
              <div className="bg-card max-h-[400px] overflow-auto rounded-lg border p-4">
                {artifactData.type === "tasks" ? (
                  <pre className="overflow-x-auto text-sm whitespace-pre-wrap">
                    <code>{artifactData.content}</code>
                  </pre>
                ) : (
                  <MarkdownComponent content={artifactData.content} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
