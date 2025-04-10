"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ArtifactBadge from "./ArtifactBadge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface ArtifactViewerProps {
  stream: ReadableStream<Uint8Array>;
  contentType: "markdown" | "json" | "text";
  artifactType?: string;
  onComplete?: () => void;
  onContentUpdate?: (content: string) => void;
}

export function ArtifactViewer({
  stream,
  contentType,
  artifactType,
  onComplete,
  onContentUpdate,
}: ArtifactViewerProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimitError, setIsRateLimitError] = useState<boolean>(false);

  // Define a function to process the stream
  async function processStream(
    stream: ReadableStream<Uint8Array>,
    isMounted: boolean
  ) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      // Check if stream is locked before attempting to get reader
      if (stream.locked) {
        console.log(
          `Stream for ${artifactType} is already locked, cannot read`
        );
        if (isMounted) {
          setError("Stream is already being read elsewhere");
          setIsLoading(false);
        }
        return;
      }

      reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          if (isMounted) {
            setIsLoading(false);
            if (onComplete) onComplete();
          }
          break;
        }

        const text = decoder.decode(value, { stream: true });
        result += text;

        if (isMounted) {
          setContent(result);
          if (onContentUpdate) {
            onContentUpdate(result);
          }
        }
      }
    } catch (err: any) {
      console.error(`Stream error for ${artifactType}:`, err);

      if (isMounted) {
        const errorMessage = err.message || "Error processing stream";
        setError(errorMessage);

        // Check if this is a rate limit error
        if (
          errorMessage.toLowerCase().includes("rate limit") ||
          errorMessage.toLowerCase().includes("429") ||
          errorMessage.toLowerCase().includes("too many requests")
        ) {
          setIsRateLimitError(true);
        }

        setIsLoading(false);
      }
    } finally {
      if (reader) {
        try {
          reader.releaseLock();
        } catch (e) {
          console.error("Error releasing lock:", e);
        }
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    if (!stream) {
      if (isMounted) {
        setError("No stream provided");
        setIsLoading(false);
      }
      return;
    }

    // Reset states when stream changes
    setContent("");
    setError(null);
    setIsLoading(true);
    setIsRateLimitError(false);

    // Process the stream
    processStream(stream, isMounted);

    return () => {
      isMounted = false;
    };
  }, [stream]);

  // Handle retry
  const handleRetry = () => {
    if (stream) {
      setContent("");
      setError(null);
      setIsLoading(true);
      setIsRateLimitError(false);
      processStream(stream, true);
    }
  };

  // Simple loading indicator
  if (isLoading && !content) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="text-primary mb-2 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Loading {artifactType}...
        </p>
      </div>
    );
  }

  // Error display with retry option and different styling for rate limits
  if (error) {
    return (
      <div className="p-4">
        <Alert variant={isRateLimitError ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isRateLimitError
              ? "Rate Limit Exceeded"
              : "Error Processing Stream"}
          </AlertTitle>
          <AlertDescription>
            {isRateLimitError
              ? "Our AI service is currently experiencing high demand. Please wait a few minutes and try again."
              : error}
          </AlertDescription>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Content type badge
  const ContentTypeBadge = () => (
    <div className="mb-2 flex gap-2">
      {artifactType && <ArtifactBadge artifactType={artifactType} />}
      <ArtifactBadge artifactType={contentType} />
    </div>
  );

  // Content display based on content type
  switch (contentType) {
    case "markdown":
      return (
        <div className="prose dark:prose-invert max-w-none p-4">
          <ContentTypeBadge />
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <div className="my-2 overflow-hidden rounded">
                    <SyntaxHighlighter language={match[1]} style={vscDarkPlus}>
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content || ""}
          </ReactMarkdown>
        </div>
      );
    case "json":
      try {
        const parsedContent =
          content.trim().length > 0 ? JSON.parse(content) : {};
        return (
          <div className="p-4">
            <ContentTypeBadge />
            <div className="bg-muted overflow-auto rounded p-4">
              <SyntaxHighlighter language="json" style={vscDarkPlus}>
                {JSON.stringify(parsedContent, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } catch (e) {
        return (
          <div className="p-4">
            <ContentTypeBadge />
            <Alert variant="default" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>JSON Parse Error</AlertTitle>
              <AlertDescription>
                Could not parse the content as JSON. Showing raw content
                instead.
              </AlertDescription>
            </Alert>
            <pre className="bg-muted overflow-auto rounded p-4">
              <code>{content}</code>
            </pre>
          </div>
        );
      }
    default:
      return (
        <div className="p-4">
          <ContentTypeBadge />
          <pre className="bg-muted rounded p-4 whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      );
  }
}

export function getContentType(
  artifactType: string
): "markdown" | "json" | "text" {
  switch (artifactType) {
    case "blueprint":
    case "guide":
      return "markdown";
    case "architecture":
    case "tasks":
      return "json";
    default:
      return "text";
  }
}

export default ArtifactViewer;
