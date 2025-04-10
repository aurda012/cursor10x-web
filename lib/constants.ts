import { UserAnswers } from "@/types";

/**
 * The introduction message displayed at the start of the conversation
 */
export const AGENT_INTRODUCTION_MESSAGE =
  "Welcome to Cursor10x! 👋 I'll help you create a comprehensive project blueprint, file/folder architecture, implementation guide, and detailed development tasks through a series of questions. By the end you'll have a zip file including all of these things along with the entire Cursor10x system that includes a multi-layered memory system with autonomous persistence, dedicated cursor rules for top efficiency, and ready to go task management system. Make sure to answer all questions with as much detail as possible for best results. Let's get started with the basics..";

/**
 * Question objects with keys matching UserAnswers interface
 */
export const AGENT_QUESTIONS = [
  {
    key: "projectName" as keyof UserAnswers,
    question: "What would you like to name your project?",
  },
  {
    key: "projectOverview" as keyof UserAnswers,
    question:
      "Please provide me with an overview of your project. Explain what problem(s) it solves, who it's for, and why it's valuable..",
  },
  {
    key: "coreFeatures" as keyof UserAnswers,
    question:
      "Next, can you give me a list of the main features of your product. For each feature, please include a detailed explanation of what it does and how it works at a high level. Remember to hold down the shift key + return to go to a new line.",
  },
  {
    key: "uiUx" as keyof UserAnswers,
    question:
      "How would you describe the desired user interface and experience? Any specific UI frameworks or design systems in mind?",
  },
  {
    key: "techArchitecture" as keyof UserAnswers,
    question:
      "Do you have any specific technology preferences for languages, frameworks, libraries, platforms, dependencies, backend, database, and/or hosting? If not, I'll recommend appropriate options.",
  },
  {
    key: "additionalRequirements" as keyof UserAnswers,
    question:
      "Are there any additional requirements or constraints I should consider? (Authentication, scalability, performance, etc.)",
  },
];

/**
 * Message displayed after all questions have been answered
 */
export const END_OF_QUESTIONS_MESSAGE =
  "Thank you for providing all the information! I'll now use your responses to generate a comprehensive technical blueprint, file/folder architecture, implementation guide, and detailed development tasks for your project. This will take a moment...";

/**
 * Messages displayed after each artifact is generated
 */
export const INTERMISSION_MESSAGES = {
  blueprint:
    "Great! The technical blueprint is complete. Now I'll generate a file architecture diagram based on this blueprint...",
  architecture:
    "Excellent! The file architecture is complete. Now I'll create an implementation guide that breaks down the steps for building your project...",
  guide:
    "Perfect! The implementation guide is ready. Now I'll generate a list of detailed development tasks to help you execute this project...",
  tasks:
    "All artifacts have been generated successfully! You can now download your project package which includes the blueprint, architecture, implementation guide, and development tasks.",
};
