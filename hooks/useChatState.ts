import { create } from "zustand";
import { ChatState, Message, UserAnswers } from "@/types";
import {
  AGENT_INTRODUCTION_MESSAGE,
  AGENT_QUESTIONS,
  END_OF_QUESTIONS_MESSAGE,
  INTERMISSION_MESSAGES,
} from "@/lib/constants";
import * as apiClient from "@/lib/apiClient";
import { toast } from "sonner";

// Initialize the Zustand store with the ChatState interface
export const useChatState = create<ChatState>((set, get) => ({
  // State properties
  messages: [
    {
      id: "initial-message",
      sender: "agent",
      content: AGENT_INTRODUCTION_MESSAGE,
      timestamp: Date.now(),
    },
    {
      id: "first-question",
      sender: "agent",
      content: AGENT_QUESTIONS[0].question,
      timestamp: Date.now() + 100,
    },
  ],
  userAnswers: {},
  generatedArtifacts: {},
  processing: false,
  statusMessage: null,
  artifactStream: null,
  currentArtifactType: null,
  artifactContent: null,
  isShowingSettings: false,
  savedStreams: {},
  currentQuestionIndex: 0,
  isAgentProcessing: false,
  isComplete: false,
  isPackaging: false,
  packageReady: false,
  currentArtifactStream: null,
  onComplete: null,

  // Actions
  addMessage: (message) => {
    const messageWithDefaults = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: message.timestamp || Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, messageWithDefaults],
    }));
  },

  // Update user answers
  updateUserAnswers: (answers) => {
    set((state) => ({
      userAnswers: { ...state.userAnswers, ...answers },
    }));
  },

  // Clear chat history
  clearChat: () => {
    set({
      messages: [
        {
          id: "initial-message",
          sender: "agent",
          content: AGENT_INTRODUCTION_MESSAGE,
          timestamp: Date.now(),
        },
        {
          id: "first-question",
          sender: "agent",
          content: AGENT_QUESTIONS[0].question,
          timestamp: Date.now() + 100,
        },
      ],
      userAnswers: {},
      generatedArtifacts: {},
      processing: false,
      statusMessage: null,
      artifactStream: null,
      currentArtifactType: null,
      artifactContent: null,
      currentQuestionIndex: 0,
      isAgentProcessing: false,
      isComplete: false,
      isPackaging: false,
      packageReady: false,
      currentArtifactStream: null,
      onComplete: null,
    });
  },

  // Toggle settings panel
  toggleSettings: () => {
    set((state) => ({
      isShowingSettings: !state.isShowingSettings,
    }));
  },

  // Set artifact content
  setArtifactContent: (content) => {
    set({ artifactContent: content });
  },

  // Set processing state and status message
  setProcessing: (isProcessing, status = undefined) => {
    set({ processing: isProcessing, statusMessage: status || null });
  },

  // Set packaging state
  setPackaging: (isPackaging, status = undefined) => {
    set({ isPackaging, statusMessage: status || null });
  },

  // Set package ready state
  setPackageReady: (isReady) => {
    set({ packageReady: isReady });
  },

  // Set completion state
  setComplete: (isComplete) => {
    set({ isComplete });
  },

  // Clear artifact stream
  clearArtifactStream: () => {
    set({
      artifactStream: null,
      currentArtifactType: null,
      onComplete: null,
    });
  },

  // Set artifact stream and type
  setArtifactStream: (stream, artifactType, completionHandler = null) => {
    console.log(`Setting artifact stream for ${artifactType}`);

    if (stream && stream.locked) {
      console.error("Stream is locked, attempting to clone");
      try {
        // Create a pair of streams
        const { readable: stream1, writable: writable1 } =
          new TransformStream();

        // Fallback to creating a new stream with an error message
        const encoder = new TextEncoder();
        const writer = writable1.getWriter();
        writer.write(
          encoder.encode("Error: Stream was locked when trying to set it.")
        );
        writer.close();

        // Use the readable stream
        set({ artifactStream: stream1, currentArtifactType: artifactType });
        return true;
      } catch (error) {
        console.error("Failed to handle locked stream:", error);
        set({ artifactStream: null, currentArtifactType: null });
        throw new Error("Stream is locked and couldn't be processed");
      }
    }

    set({
      artifactStream: stream,
      currentArtifactType: artifactType,
      onComplete: completionHandler,
    });

    return true;
  },

  // Add artifact to generated artifacts
  addArtifact: (type, content) => {
    set((state) => ({
      generatedArtifacts: {
        ...state.generatedArtifacts,
        [type]: content,
      },
    }));
  },

  // Start the artifact generation process
  startArtifactGeneration: () => {
    const { addMessage, setProcessing } = get();

    // Add a confirmation message
    addMessage({
      id: `start-generation-${Date.now()}`,
      sender: "agent",
      content:
        "I'll create your project assets now. First, I'll generate a technical blueprint...",
    });

    // Set processing state
    setProcessing(true, "Generating Technical Blueprint...");

    // Set isComplete to true to disable chat input after all questions are answered
    set({ isComplete: true });

    // Begin the blueprint generation with toast notification
    toast.promise(get().generateBlueprint(), {
      loading: "Generating technical blueprint...",
      success: "Blueprint generated successfully!",
      error: "Failed to generate blueprint. Please try again.",
    });
  },

  // Add a stream message for artifact viewers
  addStreamMessage: (
    artifactType: "blueprint" | "architecture" | "guide" | "tasks",
    stream: ReadableStream<Uint8Array>,
    completionHandler: (content: string) => void
  ): string => {
    const messageId = `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let newMessage: Message = {
      id: messageId,
      sender: "agent",
      content: `Generating ${artifactType}...`,
      timestamp: Date.now(),
    };

    switch (artifactType) {
      case "blueprint":
        newMessage = {
          ...newMessage,
          blueprintStream: stream,
          onBlueprintComplete: completionHandler,
        };
        break;
      case "architecture":
        newMessage = {
          ...newMessage,
          architectureStream: stream,
          onArchitectureComplete: completionHandler,
        };
        break;
      case "guide":
        newMessage = {
          ...newMessage,
          guideStream: stream,
          onGuideComplete: completionHandler,
        };
        break;
      case "tasks":
        newMessage = {
          ...newMessage,
          tasksStream: stream,
          onTasksComplete: completionHandler,
        };
        break;
    }

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    return messageId;
  },

  // Generate blueprint
  generateBlueprint: async () => {
    const { addStreamMessage, setProcessing, addMessage } = get();
    try {
      // Ensure UI has time to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stream = await apiClient.fetchGeneratedArtifact(
        "blueprint",
        get().userAnswers
      );

      if (!stream) {
        throw new Error("Failed to generate blueprint: No stream returned");
      }

      // Use the new addStreamMessage method instead of setArtifactStream
      addStreamMessage("blueprint", stream, get().handleBlueprintComplete);

      return stream;
    } catch (error) {
      console.error("Blueprint generation error:", error);
      setProcessing(false);

      // Check for rate limit errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("too many requests")
      ) {
        addMessage({
          sender: "agent",
          content:
            "I apologize, but the AI service is currently experiencing high demand. Please wait a few minutes and try again.",
        });
      } else {
        addMessage({
          sender: "agent",
          content:
            "I'm sorry, there was an error generating your blueprint. Please try again.",
        });
      }

      throw error;
    }
  },

  handleBlueprintComplete: (blueprintContent: string) => {
    const { addMessage, setProcessing, addArtifact, setArtifactStream } = get();
    const messages = get().messages;

    // Store the blueprint artifact
    addArtifact("blueprint", blueprintContent);

    // Find the message with the blueprint stream
    const blueprintMessageIndex = messages.findIndex(
      (msg) => "blueprintStream" in msg
    );

    if (blueprintMessageIndex !== -1) {
      // Update the existing message with artifact data
      const updatedMessages = [...messages];
      const blueprintMessage = updatedMessages[blueprintMessageIndex];

      // Create an updated message with artifact data and without the stream
      const updatedMessage = {
        ...blueprintMessage,
        content: "Here's the technical blueprint for your project:",
        artifactData: {
          type: "blueprint" as const,
          content: blueprintContent,
        },
        // Remove the stream properties
        blueprintStream: undefined,
        onBlueprintComplete: undefined,
      };

      updatedMessages[blueprintMessageIndex] = updatedMessage;

      // Update the messages array
      set({ messages: updatedMessages });
    } else {
      // Fallback: add as new message if the stream message isn't found
      addMessage({
        sender: "agent",
        content: "I've generated the technical blueprint for your project:",
        artifactData: {
          type: "blueprint" as const,
          content: blueprintContent,
        },
      });
    }

    // Add intermission message
    addMessage({
      sender: "agent",
      content:
        INTERMISSION_MESSAGES.blueprint ||
        "Blueprint complete! Now generating the file/folder architecture...",
    });

    // Start architecture generation
    setProcessing(true, "Generating File/Folder Architecture...");

    const generateArchitecture = async () => {
      try {
        const stream = await apiClient.fetchGeneratedArtifact(
          "architecture",
          get().userAnswers,
          blueprintContent // previousContext as string
        );

        if (!stream) {
          throw new Error(
            "Failed to generate architecture: No stream returned"
          );
        }

        // Use the new addStreamMessage method instead of setArtifactStream
        get().addStreamMessage(
          "architecture",
          stream,
          get().handleArchitectureComplete
        );

        return stream;
      } catch (error) {
        console.error("Architecture generation error:", error);
        setProcessing(false);

        // Check for rate limit errors
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("too many requests")
        ) {
          addMessage({
            sender: "agent",
            content:
              "I apologize, but the AI service is currently experiencing high demand. Please wait a few minutes and try again.",
          });
        } else {
          addMessage({
            sender: "agent",
            content:
              "I'm sorry, there was an error generating the architecture. Please try again.",
          });
        }

        throw error;
      }
    };

    toast.promise(generateArchitecture(), {
      loading: "Generating file/folder architecture...",
      success: "Architecture generated successfully!",
      error: "Failed to generate architecture. Please try again.",
    });
  },

  handleArchitectureComplete: (architectureContent: string) => {
    const { addMessage, setProcessing, addArtifact, setArtifactStream } = get();
    const messages = get().messages;

    // Store the architecture artifact
    addArtifact("architecture", architectureContent);

    // Find the message with the architecture stream
    const architectureMessageIndex = messages.findIndex(
      (msg) => "architectureStream" in msg
    );

    if (architectureMessageIndex !== -1) {
      // Update the existing message with artifact data
      const updatedMessages = [...messages];
      const architectureMessage = updatedMessages[architectureMessageIndex];

      // Create an updated message with artifact data and without the stream
      const updatedMessage = {
        ...architectureMessage,
        content: "Here's the file/folder architecture for your project:",
        artifactData: {
          type: "architecture" as const,
          content: architectureContent,
        },
        // Remove the stream properties
        architectureStream: undefined,
        onArchitectureComplete: undefined,
      };

      updatedMessages[architectureMessageIndex] = updatedMessage;

      // Update the messages array
      set({ messages: updatedMessages });
    } else {
      // Fallback: add as new message if the stream message isn't found
      addMessage({
        sender: "agent",
        content: "Here's the file/folder architecture for your project:",
        artifactData: {
          type: "architecture" as const,
          content: architectureContent,
        },
      });
    }

    // Add intermission message
    addMessage({
      sender: "agent",
      content:
        INTERMISSION_MESSAGES.architecture ||
        "Architecture complete! Now generating the implementation guide...",
    });

    // Start guide generation
    setProcessing(true, "Generating Implementation Guide...");

    const generateGuide = async () => {
      try {
        const stream = await apiClient.fetchGeneratedArtifact(
          "guide",
          get().userAnswers,
          get().generatedArtifacts.architecture // Pass architecture as context
        );

        if (!stream) {
          throw new Error(
            "Failed to generate implementation guide: No stream returned"
          );
        }

        // Use the addStreamMessage helper
        get().addStreamMessage("guide", stream, get().handleGuideComplete);

        return stream;
      } catch (error) {
        console.error("Guide generation error:", error);
        setProcessing(false);

        // Check for rate limit errors
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("too many requests")
        ) {
          addMessage({
            sender: "agent",
            content:
              "I apologize, but the AI service is currently experiencing high demand. Please wait a few minutes and try again.",
          });
        } else {
          addMessage({
            sender: "agent",
            content:
              "I'm sorry, there was an error generating the implementation guide. Please try again.",
          });
        }

        throw error;
      }
    };

    toast.promise(generateGuide(), {
      loading: "Generating implementation guide...",
      success: "Implementation guide generated successfully!",
      error: "Failed to generate implementation guide. Please try again.",
    });
  },

  handleGuideComplete: (guideContent: string) => {
    const { addMessage, setProcessing, addArtifact } = get();
    const messages = get().messages;

    // Store the guide artifact
    addArtifact("guide", guideContent);

    // Find the message with the guide stream
    const guideMessageIndex = messages.findIndex((msg) => "guideStream" in msg);

    if (guideMessageIndex !== -1) {
      // Update the existing message with artifact data
      const updatedMessages = [...messages];
      const guideMessage = updatedMessages[guideMessageIndex];

      // Create an updated message with artifact data and without the stream
      const updatedMessage = {
        ...guideMessage,
        content: "Here's the implementation guide for your project:",
        artifactData: {
          type: "guide" as const,
          content: guideContent,
        },
        // Remove the stream properties
        guideStream: undefined,
        onGuideComplete: undefined,
      };

      updatedMessages[guideMessageIndex] = updatedMessage;

      // Update the messages array
      set({ messages: updatedMessages });
    } else {
      // Fallback: add as new message if the stream message isn't found
      addMessage({
        sender: "agent",
        content: "Here's the implementation guide for your project:",
        artifactData: {
          type: "guide" as const,
          content: guideContent,
        },
      });
    }

    // Add intermission message
    addMessage({
      sender: "agent",
      content:
        INTERMISSION_MESSAGES.guide ||
        "Implementation guide complete! Now generating the tasks...",
    });

    // Start tasks generation
    setProcessing(true, "Generating Tasks...");

    const generateTasks = async () => {
      try {
        const stream = await apiClient.fetchGeneratedArtifact(
          "tasks",
          get().userAnswers,
          get().generatedArtifacts.guide // Pass guide as context
        );

        if (!stream) {
          throw new Error("Failed to generate tasks: No stream returned");
        }

        // Use the addStreamMessage helper
        get().addStreamMessage("tasks", stream, get().handleTasksComplete);

        return stream;
      } catch (error) {
        console.error("Tasks generation error:", error);
        setProcessing(false);

        // Check for rate limit errors
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("too many requests")
        ) {
          addMessage({
            sender: "agent",
            content:
              "I apologize, but the AI service is currently experiencing high demand. Please wait a few minutes and try again.",
          });
        } else {
          addMessage({
            sender: "agent",
            content:
              "I'm sorry, there was an error generating the tasks. Please try again.",
          });
        }

        throw error;
      }
    };

    toast.promise(generateTasks(), {
      loading: "Generating development tasks...",
      success: "Tasks generated successfully!",
      error: "Failed to generate tasks. Please try again.",
    });
  },

  handleTasksComplete: (tasksContent: string) => {
    const { addMessage, setProcessing, addArtifact } = get();
    const messages = get().messages;

    // Store the tasks artifact
    addArtifact("tasks", tasksContent);

    // Find the message with the tasks stream
    const tasksMessageIndex = messages.findIndex((msg) => "tasksStream" in msg);

    if (tasksMessageIndex !== -1) {
      // Update the existing message with artifact data
      const updatedMessages = [...messages];
      const tasksMessage = updatedMessages[tasksMessageIndex];

      // Create an updated message with artifact data and without the stream
      const updatedMessage = {
        ...tasksMessage,
        content: "Here are the development tasks for your project:",
        artifactData: {
          type: "tasks" as const,
          content: tasksContent,
        },
        // Remove the stream properties
        tasksStream: undefined,
        onTasksComplete: undefined,
      };

      updatedMessages[tasksMessageIndex] = updatedMessage;

      // Update the messages array
      set({ messages: updatedMessages });
    } else {
      // Fallback: add as new message if the stream message isn't found
      addMessage({
        sender: "agent",
        content: "I've generated the development tasks for your project:",
        artifactData: {
          type: "tasks" as const,
          content: tasksContent,
        },
      });
    }

    // Add completion message
    addMessage({
      sender: "agent",
      content:
        INTERMISSION_MESSAGES.tasks ||
        "Tasks complete! You now have all the artifacts needed to start your development project.",
    });
    
    // Set the overall completion flag
    set({
      isComplete: true,
      isAgentProcessing: false,
      statusMessage: null,
    });
    
    // Delay adding setup instructions to ensure they appear last
    setTimeout(() => {
      // Add setup instructions as the final message
      get().addMessage({
        sender: "agent",
        content: "Here are the setup instructions for your project:",
        artifactData: {
          type: "guide" as const,
          content: `## Setup Steps

1. **Configure Turso Database:**

\`\`\`bash
# Install Turso CLI
curl -sSfL https://get.turso.tech/install.sh | bash

# Login to Turso
turso auth login

# Create a database
turso db create cursor10x-mcp

# Get database URL and token
turso db show cursor10x-mcp --url
turso db tokens create cursor10x-mcp
\`\`\`

Or you can visit [Turso](https://turso.tech/) and sign up and proceed to create the database and get proper credentials. The free plan will more than cover your project memory.

2. **Configure Cursor MCP:**

Update \`.cursor/mcp.json\` in your project directory with the database url and turso auth token:

\`\`\`json
{
  "mcpServers": {
    "cursor10x-mcp": {
      "command": "npx",
      "args": ["cursor10x-mcp"],
      "enabled": true,
      "env": {
        "TURSO_DATABASE_URL": "your-turso-database-url",
        "TURSO_AUTH_TOKEN": "your-turso-auth-token"
      }
    }
  }
}
\`\`\`

4. **Copy and Paste Cursor Rules:**

Copy and paste the contents of the \`.cursorrules\` file in your project root and paste it into your cursor settings rules Cursor Settings -> Rules -> User Rules`,
        },
      });
    }, 1000); // Adding a 1 second delay to ensure this is the last message
  },

  // Update answer and progress to next question
  updateAnswerAndProgress: (answer) => {
    const { currentQuestionIndex, addMessage } = get();

    // Get the current question information
    const currentQuestion = AGENT_QUESTIONS[currentQuestionIndex];

    // Add the user's message to the chat
    addMessage({
      sender: "user",
      content: answer,
    });

    // Update the userAnswers state with the new answer
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [currentQuestion.key]: answer,
      },
    }));

    // Increment the question index
    const nextQuestionIndex = currentQuestionIndex + 1;
    set({ currentQuestionIndex: nextQuestionIndex });

    // Check if there's a next question
    if (nextQuestionIndex < AGENT_QUESTIONS.length) {
      // Add the next question as an agent message
      addMessage({
        sender: "agent",
        content: AGENT_QUESTIONS[nextQuestionIndex].question,
      });
    } else {
      // No more questions, add the end of questions message
      addMessage({
        sender: "agent",
        content: END_OF_QUESTIONS_MESSAGE,
      });

      // Start artifact generation process and disable chat input
      // startArtifactGeneration sets isComplete to true
      get().startArtifactGeneration();
    }
  },
}));

/**
 * Function to handle the complete artifact after it's been streamed
 */
export function handleArtifactComplete(
  artifactType: string,
  content: string,
  handlers: {
    addArtifact: (artifactName: string, content: string) => void;
    setProcessing: (isProcessing: boolean, status?: string) => void;
    addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  }
) {
  const { addArtifact, setProcessing, addMessage } = handlers;

  // Add the generated content to the artifacts
  addArtifact(artifactType, content);

  // Set processing to false
  setProcessing(false);

  // Add the intermission message for the next step
  if (
    INTERMISSION_MESSAGES[artifactType as keyof typeof INTERMISSION_MESSAGES]
  ) {
    addMessage({
      sender: "agent",
      content:
        INTERMISSION_MESSAGES[
          artifactType as keyof typeof INTERMISSION_MESSAGES
        ],
    });
  }

  // TODO: Trigger the next artifact generation in subsequent tasks
  // This will be implemented in task 075
}
