"use client";

import React, { useEffect } from "react";
import {
  useChatState,
  handleArtifactComplete as handleComplete,
} from "@/hooks/useChatState";
import ChatWindow from "@/components/chat/ChatWindow";
import { AGENT_INTRODUCTION_MESSAGE } from "@/lib/constants";
import { Toaster } from "sonner";
import { DownloadButton } from "@/components/common/DownloadButton";
import * as apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export default function Home() {
  // Access the store directly without a selector function to avoid infinite loops
  const messages = useChatState((state) => state.messages);
  const isAgentProcessing = useChatState((state) => state.isAgentProcessing);
  const statusMessage = useChatState((state) => state.statusMessage);
  const isComplete = useChatState((state) => state.isComplete);
  const updateAnswerAndProgress = useChatState(
    (state) => state.updateAnswerAndProgress
  );
  const currentArtifactStream = useChatState(
    (state) => state.currentArtifactStream
  );
  const currentArtifactType = useChatState(
    (state) => state.currentArtifactType
  );
  const onComplete = useChatState((state) => state.onComplete);
  const generatedArtifacts = useChatState((state) => state.generatedArtifacts);
  const userAnswers = useChatState((state) => state.userAnswers);

  // Add initial message when the component mounts if messages array is empty
  useEffect(() => {
    if (messages.length === 0) {
      useChatState.getState().addMessage({
        sender: "agent",
        content: AGENT_INTRODUCTION_MESSAGE,
      });
    }
  }, [messages.length]);

  // Add detailed logging to see if we have an artifact stream
  useEffect(() => {
    console.log("Artifact stream in page component:", {
      hasArtifactStream: Boolean(currentArtifactStream),
      artifactStreamLocked: currentArtifactStream?.locked,
      artifactType: currentArtifactType,
    });
  }, [currentArtifactStream, currentArtifactType]);

  // Handle artifact completion safely
  const handleArtifactComplete = (content: string) => {
    if (onComplete) {
      try {
        onComplete(content);
      } catch (error) {
        console.error("Error in artifact completion handler:", error);
      }
    }
  };

  // Handle download of the packaged project
  const handleDownload = async () => {
    try {
      // Call the API to fetch the packaged project
      const response = await apiClient.fetchPackage({
        artifacts: generatedArtifacts,
        projectName: userAnswers.projectName || "cursor10x-project",
      });

      // Create a blob from the response
      const blob = await response.blob();

      // Create object URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a download link with fixed filename
      const link = document.createElement("a");
      link.href = url;
      link.download = `cursor10x.zip`;

      // Add the link to the document body
      document.body.appendChild(link);

      // Click the link to trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      toast.success("Project package downloaded successfully");
    } catch (error) {
      console.error("Error downloading project package:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download project package"
      );
    }
  };

  // Determine the appropriate placeholder text
  const getPlaceholderText = () => {
    if (isAgentProcessing) {
      return "Please wait...";
    } else if (isComplete) {
      return "Project generation in progress...";
    } else {
      return "Type your answer here...";
    }
  };

  // Check if download is ready
  const isDownloadReady =
    isComplete &&
    Boolean(generatedArtifacts.blueprint) &&
    Boolean(generatedArtifacts.architecture) &&
    Boolean(generatedArtifacts.guide) &&
    Boolean(generatedArtifacts.tasks);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="bg-card mb-4 h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg shadow-lg">
        <ChatWindow
          messages={messages}
          isProcessing={isAgentProcessing}
          isComplete={isComplete}
          statusMessage={statusMessage || undefined}
          onSubmit={updateAnswerAndProgress}
          inputPlaceholder={getPlaceholderText()}
        />
      </div>

      {isComplete && (
        <div className="mt-4">
          <DownloadButton
            onClick={handleDownload}
            isReady={isDownloadReady}
            projectName={userAnswers.projectName || "cursor10x-project"}
          />
        </div>
      )}

      <Toaster />
    </div>
  );
}
