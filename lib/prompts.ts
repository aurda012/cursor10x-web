import { UserAnswers } from "@/types";

/**
 * Generate a prompt for creating a technical blueprint document
 *
 * @param userAnswers - User's answers to the agent's questions
 * @returns A prompt string for the LLM
 */
export function generateBlueprintPrompt(userAnswers: UserAnswers): string {
  const {
    projectName,
    projectOverview,
    coreFeatures,
    uiUx,
    techArchitecture,
    additionalRequirements,
  } = userAnswers;

  return `Act as an expert software architect and technical writer. Create an exhaustive technical blueprint for the following project by conducting in-depth research on industry best practices, then synthesizing and optimizing the provided project details. Follow the structure below, expanding each section with detailed subsections, diagrams, and evidence-based recommendations. Make sure it includes the latest and most up to date information and best practices based on today's date of ${new Date().toISOString()}.

PROJECT INFORMATION:
- Project Name: ${projectName || "Unnamed Project"}
- Project Overview: ${projectOverview || "No overview provided"}
- Core Features: ${coreFeatures || "No core features specified"}
- UI/UX Requirements: ${uiUx || "No UI/UX requirements specified"}
- Technical Architecture: ${techArchitecture || "No technical architecture specified"}
- Additional Requirements: ${additionalRequirements || "None provided"}

RESPONSE FORMAT REQUIREMENTS:
- Respond with ONLY Markdown format
- Use proper Markdown syntax with headings, lists, code blocks, and tables
- Do NOT include any prefixes like "Here's the blueprint:" or summaries before/after the document
- Ensure all code examples are in proper syntax-highlighted code blocks with the language specified

Your blueprint should include the following sections:

# ${projectName || "Project"} Technical Blueprint

## 1. Project Overview
- High-level description
- Core functionalities
- Target users/use cases
- Technical approach

## 2. System Architecture
- Architecture diagram (described in text)
- Key components and their relationships
- Data flow between components
- Integration points with external systems (if any)

## 3. Technology Stack
- Frontend technologies and libraries
- Backend technologies and frameworks
- Database and storage solutions
- Authentication/authorization mechanisms
- Deployment and hosting considerations

## 4. Core Features
- Detailed descriptions of each major feature
- Technical implementation approach for each feature
- Potential challenges and solutions

## 5. Data Models
- Key entities and their relationships
- Database schema outline
- Data validation rules

## 6. API Design
- API architecture (REST, GraphQL, etc.)
- Key endpoints and their purposes
- Request/response formats
- Authentication and security considerations

## 7. User Interface
- Key screens/pages
- Component hierarchy
- State management approach
- Responsive design considerations

## 8. Security Considerations
- Authentication approach
- Authorization model
- Data protection mechanisms
- Security best practices to implement

## 9. Performance Considerations
- Expected load and scaling considerations
- Performance optimization strategies
- Caching approaches
- Resource optimization

## 10. Testing Strategy
- Unit testing approach
- Integration testing plan
- End-to-end testing considerations
- Testing tools and frameworks

## 11. Deployment Strategy
- CI/CD pipeline recommendations
- Environment setup (dev, staging, production)
- Infrastructure considerations
- Monitoring and logging approach

## 12. Future Considerations
- Potential scalability challenges
- Feature expansion possibilities
- Technology evolution considerations

Create a comprehensive and technically sound blueprint that would guide a development team in building this application.`;
}

/**
 * Generate a prompt for creating a file/folder architecture document
 *
 * @param userAnswers - User's answers to the agent's questions
 * @returns A prompt string for the LLM
 */
export function generateArchitecturePrompt(userAnswers: UserAnswers): string {
  const { projectName } = userAnswers;

  return `I now need you to design a detailed file/folder architecture diagram for our project based on the blueprint we just created.

Please help me design a detailed file/folder architecture diagram for the software development project. The diagram should:

1. Follow industry best practices for organization and efficiency.
2. Include every necessary folder and file we may need to create in order from the start of the development process all the way through the final product (fully finished project) based on the blueprint we created together including configurations, source code, assets, documentation, tests, and any other relevant components. DO NOT INCLUDE ANY EMPTY FOLDERS or ... insinuating that there are more files or folders than there actually are. Actually include all files and folders that are needed.
3. Be structured to support scalability and maintainability for future development.
4. Incorporate naming conventions that align with modern standards (e.g., kebab-case or camelCase for files).

Please ensure the structure is optimized for a project that uses the technology stack as outlined in the blueprint.

RESPONSE FORMAT REQUIREMENTS:
- Respond with ONLY Markdown format
- Include a tree structure representation of the file/folder architecture
- Do NOT include any prefixes like "Here's the architecture:" or summaries before/after the document
- No code blocks are needed. Must include every single file we may need to create in order from the start of the development process all the way through the final product (fully finished project).

Create a detailed file and folder architecture document that includes:

# ${projectName || "Project"} File/Folder Architecture

## Project Structure Overview
A brief explanation of the overall organization strategy and patterns used in this architecture.

## Directory Tree Structure
\`\`\`
project-root/
├── [files and folders shown in a tree structure]
├── [with appropriate indentation]
└── [include all important directories and key files]
\`\`\`

Make the architecture specific to the chosen technologies and follow the best practices and conventions for those technologies. The architecture should be comprehensive enough to guide a development team in organizing all aspects of the application.`;
}

/**
 * Generate a prompt for creating an implementation guide document
 *
 * @param userAnswers - User's answers to the agent's questions
 * @returns A prompt string for the LLM
 */
export function generateGuidePrompt(userAnswers: UserAnswers): string {
  const { projectName } = userAnswers;

  return `Now I need you to create an implementation guide based on the blueprint and architecture diagram we've already established.

This implementation guide should:

1. Build directly on the blueprint and architecture diagram you already have context for
2. Include every single file we need to create in sequential order from start to finish
3. Break down the implementation into logical phases 
4. Provide brief explanations of important aspects for each step

RESPONSE FORMAT REQUIREMENTS:
- Respond with ONLY Markdown format
- Use proper Markdown syntax with headings, lists, code blocks, and tables
- Do NOT include any prefixes like "Here's the guide:" or summaries before/after the document
- No code blocks are needed. Just a detailed guide in order of execution that includes every single file we may need to create from the start of the development process all the way through the final product.

# ${projectName || "Project"} Implementation Guide

## Implementation Approach
A brief explanation of the implementation strategy and approach.

The guide should be detailed enough for developers to follow the implementation without ambiguity, while being flexible enough to allow for different approaches where appropriate.`;
}

/**
 * Generate a prompt for creating a list of development tasks
 *
 * @param userAnswers - User's answers to the agent's questions
 * @returns A prompt string for the LLM
 */
export function generateTasksPrompt(userAnswers: UserAnswers): string {
  const { projectName } = userAnswers;

  return `Based on the blueprint, architecture, and implementation guide we've established so far, I now need you to create a comprehensive list of development tasks.

Please create all possible needed tasks for creating this project from start to finish.

RESPONSE FORMAT REQUIREMENTS:
- IMPORTANT: Your ENTIRE response must be ONLY a valid JSON string with NO other text
- DO NOT wrap the JSON in code blocks, quotes, or any other formatting
- DO NOT use \`\`\`json or \`\`\` markers at the beginning or end
- DO NOT include any explanation before or after the JSON
- DO NOT include any markdown formatting or syntax
- I need ONLY the raw JSON that can be directly parsed by JSON.parse()
- The JSON object must have the following structure:

{
  "tasks": [
    {
      "id": "001", // Three-digit numeric ID with leading zeros
      "title": "Short descriptive title",
      "file": "path/to/file.ext", // Target file path for this task, if applicable
      "status": "pending", // Always set to "pending"
      "prompt": "Detailed task description with implementation instructions and instructions for the LLM to create the file/folder structure and full development/coding for the task. Don't include code examples just needed commands for the LLM to execute."
    },
    // Additional tasks...
  ],
  "metadata": {
    "totalTasks": 0, // Set this to the total number of tasks
    "pendingCount": 0, // Set this to the number of tasks still pending
    "completeCount": 0, // Set this to the number of tasks that are complete
    "skippedCount": 0, // Set this to the number of tasks that are skipped
    "lastUpdated": "2024-04-09T10:35:00Z" // Set this to the date and time of the last update
  }
}

You need to carefully follow the implementation guide we created together and create these tasks in order of execution. Make sure they are broken down into small manageable pieces where you won't break or have an issue doing the task.

Make sure the "prompt" for each task is as detailed as possible and optimized to be sent directly back to the development team to create fully functioning files. It should not be more than 100 words in length and should be optimized for the LLM to execute. Optimally it should be around 50 words or so. If it is more than 100 words, break it down into smaller tasks.

There needs to be at least one task for each file that needs to be created based on the architecture diagram and blueprint we created together and more than one task for some more complex files.

YOU MUST NOT INCLUDE ANY MARKDOWN FORMATTING LIKE \`\`\`json or \`\`\` IN YOUR RESPONSE.
YOUR ENTIRE RESPONSE SHOULD BE ONLY THE RAW JSON OBJECT.`;
}
