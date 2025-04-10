"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ChatHeaderProps {
  isProcessing: boolean;
  statusMessage?: string;
  artifactType?: string;
}

export default function ChatHeader({
  isProcessing,
  statusMessage,
  artifactType,
}: ChatHeaderProps) {
  // Format the artifact type for display
  const displayArtifactType = artifactType
    ? artifactType.charAt(0).toUpperCase() + artifactType.slice(1)
    : null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {displayArtifactType && (
          <span className="font-medium">{displayArtifactType}</span>
        )}
        {isProcessing && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="text-sm text-muted-foreground">{statusMessage}</div>
      )}
    </div>
  );
}
