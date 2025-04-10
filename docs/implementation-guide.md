## Cursor10x Web App: Implementation Guide

**Objective:** To build the Cursor10x Web App following the technical blueprint and file architecture, resulting in a functional single-page application that guides users through project definition and generates a downloadable project starter package.

**Technology Stack:** Next.js 14+ (App Router), React 18, TypeScript, Shadcn/UI, Zustand/Jotai (Example: Zustand), Google Gemini API, JSZip.

---

### Phase 0: Project Setup & Initial Configuration

**Goal:** Initialize the project, install dependencies, set up core configurations, and prepare the development environment.

1.  **Initialize Next.js Project:**

    - Command: `npx create-next-app@latest cursor10x-web-app --typescript --tailwind --eslint --app`
    - Navigate into the directory: `cd cursor10x-web-app`
    - Files Created/Modified: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `next-env.d.ts`, `.eslintrc.json`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `styles/globals.css`, `public/*`

2.  **Configure Basic Project Information:**

    - Edit `package.json`: Update name, description, author, etc.
    - Create `README.md`: Add initial project title and description.

3.  **Setup Code Formatting & Linting:**

    - Install Prettier: `npm install --save-dev prettier prettier-plugin-tailwindcss`
    - Create `prettier.config.js`: Configure formatting rules (e.g., `plugins: ['prettier-plugin-tailwindcss']`).
    - Create `.prettierignore`: Add files/folders to ignore (e.g., `.next`, `node_modules`, `*.zip`).
    - Enhance `.eslintrc.json`: Add Prettier integration (`"extends": ["next/core-web-vitals", "prettier"]`).
    - Create `.eslintignore`: Add files/folders to ignore.

4.  **Setup Git Hooks (Optional but Recommended):**

    - Install Husky & lint-staged: `npm install --save-dev husky lint-staged`
    - Initialize Husky: `npx husky init` (creates `.husky/`)
    - Edit `.husky/pre-commit`: Add `npx lint-staged` to the script.
    - Configure `lint-staged` in `package.json`: Define commands to run on staged files (e.g., `prettier --write`, `eslint --fix`).
      ```json
      // package.json excerpt
      "lint-staged": {
        "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.{json,md,css}": ["prettier --write"]
      }
      ```

5.  **Initialize Shadcn/UI:**

    - Command: `npx shadcn-ui@latest init`
    - Follow prompts: Choose TypeScript, style, `globals.css`, `tailwind.config.ts`, App Router, configure `components` alias (`@/components`), `utils` alias (`@/lib/utils`).
    - Files Created/Modified: `components.json`, `lib/utils.ts`, `tailwind.config.ts` (updated), `styles/globals.css` (updated).

6.  **Add Initial Shadcn/UI Components:**

    - Command: `npx shadcn-ui@latest add card scroll-area textarea button avatar progress alert toast` (add others as needed)
    - Files Created: `components/ui/card.tsx`, `components/ui/scroll-area.tsx`, etc.

7.  **Setup Environment Variables:**

    - Create `.env.local`: Add `GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE`.
    - Create `.env.example`: Add `GEMINI_API_KEY=`.
    - **Crucially:** Add `.env.local` to `.gitignore`.

8.  **Install State Management:**

    - Command: `npm install zustand` (Example choice)

9.  **Create Core Directories:**
    - Manually create the following empty directories if they don't exist:
      - `app/api/generate/[artifact]`
      - `app/api/package`
      - `components/chat`
      - `components/common`
      - `docs/diagrams`
      - `hooks`
      - `templates/cursor10x_system`
      - `types`

---

### Phase 1: Core Chat Interface & State Management

**Goal:** Build the visual chat interface and implement client-side logic for the conversational flow _without_ AI interaction.

1.  **Define Types:**

    - Create `types/chat.ts`: Define interfaces for `Message` (sender, content, type), `ChatState`, `UserAnswers`, etc.
    - Create `types/index.ts`: Export types from `chat.ts`.

2.  **Implement State Management Hook:**

    - Create `hooks/useChatState.ts`:
      - Initialize Zustand store.
      - Define state: `messages: Message[]`, `userAnswers: UserAnswers`, `currentQuestionIndex: number`, `isAgentProcessing: boolean`, `generatedArtifacts: Record<string, string>`, `statusMessage: string | null`.
      - Define actions: `addMessage`, `updateAnswer`, `nextQuestion`, `setProcessing`, `setArtifact`, `setStatusMessage`.
      - Implement logic to automatically add the next agent question message when an answer is submitted.

3.  **Create Chat UI Components:**

    - Create `components/chat/MessageBubble.tsx`: Renders a single message using `Card`, `Avatar` (optional), differentiating between 'user' and 'agent' senders.
    - Create `components/chat/ChatMessages.tsx`: Uses `ScrollArea` to display the list of messages from the state (`messages` array). Should auto-scroll to the bottom.
    - Create `components/chat/ChatInput.tsx`:
      - Uses `Textarea` and `Button`.
      - Manages local input state.
      - Handles submission (Enter key, Shift+Enter for newlines, Button click).
      - On submit, calls the appropriate action from `useChatState` (`addMessage`, `updateAnswer`, `nextQuestion`).
      - Disables input when `isAgentProcessing` is true.
    - Create `components/chat/LoadingIndicator.tsx`: Displays a message and `Progress` bar or spinner when `isAgentProcessing` is true.
    - Create `components/chat/ChatWindow.tsx`: Assembles `ChatMessages`, `ChatInput`, and `LoadingIndicator` into the main chat interface container (e.g., using `Card`).

4.  **Implement Main Page:**

    - Modify `app/(main)/page.tsx`:
      - Import and use `useChatState`.
      - Render the `ChatWindow` component, passing necessary state and actions.
      - Initialize the chat with the first introductory message from the agent upon component mount (use `useEffect` and check message count).

5.  **Implement Layouts:**

    - Modify `app/layout.tsx` (Root Layout): Set up HTML structure, potentially include global providers (like Toaster for `toast`). Ensure Tailwind classes work.
    - Create `app/(main)/layout.tsx`: Layout specific to the chat interface section (if needed, otherwise can rely on root layout).

6.  **Add Initial Content:**

    - Create `lib/constants.ts`: Define the sequence of agent questions and introductory/intermission messages.
    - Use these constants in `useChatState.ts` to drive the conversation flow.

7.  **Refine Styles:**
    - Adjust `styles/globals.css` and use Tailwind utility classes within components for styling.

---

### Phase 2: AI Integration & Blueprint Generation

**Goal:** Connect the frontend to the backend, integrate the Gemini API, and implement the generation and streaming display of the first artifact (Technical Blueprint).

1.  **Define API Types:**

    - Create `types/api.ts`: Define interfaces for request bodies (`GenerateRequest`, `PackageRequest`) and potential response structures.
    - Update `types/index.ts`.

2.  **Implement Backend API Route (Blueprint):**

    - Create `app/api/generate/[artifact]/route.ts`:
      - Import necessary types and Gemini client.
      - Handle `POST` requests.
      - Read `artifact` param and request body (`userAnswers`).
      - Check if `artifact` is 'blueprint'.
      - Retrieve API key from `process.env.GEMINI_API_KEY`.
      - Initialize Gemini client (`@google/generative-ai`).
      - Call `lib/prompts.ts` function to get the formatted prompt.
      - Call Gemini API (`generateContentStream` for streaming).
      - Implement robust error handling (try/catch blocks).
      - Return a `ReadableStream` response. Use helper functions (`lib/streamHelper.ts` if needed) to adapt Gemini's stream format if necessary.

3.  **Implement Prompt Generation Logic:**

    - Create `lib/prompts.ts`:
      - Add function `generateBlueprintPrompt(answers: UserAnswers): string`.
      - Construct the detailed prompt for the technical blueprint using the user's answers, based on the requirements in the blueprint.

4.  **Implement Frontend API Client:**

    - Create `lib/apiClient.ts`:
      - Add function `fetchGeneratedArtifact(artifact: string, payload: GenerateRequest): Promise<ReadableStream>`.
      - Uses `fetch` API to call the internal Next.js route (`/api/generate/${artifact}`).
      - Handles POST method, headers (`Content-Type: application/json`), and body serialization.
      - Returns the response body as a stream (`response.body`). Include error handling for non-ok responses.

5.  **Integrate API Call into Frontend:**

    - Modify `hooks/useChatState.ts`:
      - When the final question is answered, set `isAgentProcessing` to true.
      - Call `apiClient.fetchGeneratedArtifact('blueprint', { userAnswers })`.
      - Handle the returned stream.

6.  **Implement Streaming Display:**

    - Create `components/chat/ArtifactViewer.tsx` (or enhance `MessageBubble.tsx`):
      - Accepts a `ReadableStream` as a prop.
      - Uses `useEffect` to read the stream chunk by chunk (`ReadableStreamDefaultReader`).
      - Updates local component state with the accumulated streamed text.
      - Renders the accumulating text, potentially using Markdown rendering or code block formatting.
    - Modify `hooks/useChatState.ts`: When the stream starts, add a new agent message with the `ArtifactViewer` component and pass the stream to it. When the stream ends, update message state and set `isAgentProcessing` to false. Add the complete artifact text to the `generatedArtifacts` state. Trigger the next step (intermission message/next artifact).

7.  **Add Loading/Status Feedback:**
    - Update `useChatState.ts`: Set appropriate status messages (`"Generating Technical Blueprint..."`) displayed via `LoadingIndicator` or toasts (`components/ui/toast.tsx`). Use `Alert` (`components/ui/alert.tsx`) for intermission messages.

---

### Phase 3: Generation of Remaining Artifacts

**Goal:** Extend the AI generation process to create the File/Folder Architecture, Implementation Guide, and Tasks sequentially.

1.  **Enhance API Route:**

    - Modify `app/api/generate/[artifact]/route.ts`:
      - Add `else if` blocks or a `switch` statement to handle `artifact` values: 'architecture', 'guide', 'tasks'.
      - For 'architecture', 'guide', 'tasks', include relevant previously generated artifacts (from the request body's `previousContext` field) in the prompt context sent to Gemini.
      - Call the respective prompt generation functions from `lib/prompts.ts`.
      - Return the stream as before.

2.  **Enhance Prompt Generation Logic:**

    - Modify `lib/prompts.ts`:
      - Add `generateArchitecturePrompt(answers: UserAnswers, blueprint: string): string`.
      - Add `generateGuidePrompt(answers: UserAnswers, architecture: string): string`.
      - Add `generateTasksPrompt(answers: UserAnswers, guide: string): string`. Ensure the prompt asks for the specific task format (ID, Title, Path, Task File Name, Status, Prompt).

3.  **Update Frontend API Client:**

    - Modify `lib/apiClient.ts`: Ensure `fetchGeneratedArtifact` can optionally send the `previousContext` in the request body payload.

4.  **Update State Management for Sequencing:**
    - Modify `hooks/useChatState.ts`:
      - After the 'blueprint' stream successfully completes:
        - Store the completed blueprint text in `generatedArtifacts.blueprint`.
        - Add the intermission message ("Blueprint complete. Generating Architecture...").
        - Set `isAgentProcessing` true, update status message.
        - Call `apiClient.fetchGeneratedArtifact('architecture', { userAnswers, previousContext: { technicalBlueprint: ... } })`.
      - Repeat this pattern for 'architecture' -> 'guide' and 'guide' -> 'tasks', passing the necessary context each time.
      - Ensure the `ArtifactViewer` component is reused for displaying each streamed artifact.

---

### Phase 4: Packaging & Download

**Goal:** Create the backend endpoint to package generated artifacts and the static template into a zip file, and provide a download mechanism on the frontend.

1.  **Add Static Template Files:**

    - Place the pre-defined `Cursor10x` system files inside the `templates/cursor10x_system/` directory (e.g., `agent_manager.py`, `memory_store.py`, etc.).

2.  **Install Zip Library:**

    - Command: `npm install jszip @types/jszip`

3.  **Implement Packaging API Route:**

    - Create `app/api/package/route.ts`:
      - Import `jszip`. Import `fs/promises` and `path` (Node.js modules).
      - Handle `POST` requests. Read the request body containing the final `artifacts` content.
      - Initialize `JSZip`.
      - Add generated artifacts to the zip object (e.g., `zip.file('technical_blueprint.md', artifacts.technicalBlueprint)`). Consider how tasks are stored/added (single JSON? individual files?).
      - Define the path to the template directory (`templates/cursor10x_system`).
      - Recursively read the template directory contents (use `fs.readdir`, `fs.stat`).
      - Add each file/folder from the template directory into the zip object, preserving the structure (e.g., `zip.folder('cursor10x_system').file(...)`).
      - Generate the zip content as a Node.js Buffer: `const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });`
      - Return the buffer with appropriate headers:
        - `Content-Type: application/zip`
        - `Content-Disposition: attachment; filename="${projectName}_cursor10x_package.zip"` (get `projectName` from request body if needed)

4.  **Update State Management:**

    - Modify `hooks/useChatState.ts`:
      - Add state for packaging status (e.g., `isPackaging: boolean`, `packageReady: boolean`).
      - After the 'tasks' artifact stream completes:
        - Set `isPackaging` true, update status message ("Packaging files...").
        - Call a new function in `lib/apiClient.ts` to trigger the `/api/package` endpoint.

5.  **Update API Client:**

    - Modify `lib/apiClient.ts`:
      - Add function `fetchPackage(payload: PackageRequest): Promise<Response>`.
      - Calls `POST /api/package` with the final artifact data. Returns the raw `Response` object to handle the blob/download on the client.

6.  **Implement Download Trigger:**
    - Create `components/common/DownloadButton.tsx`: A button component that becomes active when `packageReady` is true.
    - Modify `app/(main)/page.tsx`:
      - Render the `DownloadButton` conditionally.
      - When the package API call in the state hook resolves successfully, set `packageReady` to true.
      - The `DownloadButton`'s `onClick` handler will likely trigger the `apiClient.fetchPackage` call again (or use the initially fetched response if stored). It then needs to handle the response: get the blob (`response.blob()`) create an object URL (`URL.createObjectURL(blob)`), create a temporary link (`<a>` element), set its `href` and `download` attributes, click it programmatically, and revoke the object URL.

---

### Phase 5: Testing & Refinement

**Goal:** Ensure application quality, stability, and usability through comprehensive testing and iterative improvements.

1.  **Write Unit & Integration Tests:**

    - Install testing libraries: `npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom` (if using Jest). Configure `jest.config.js`.
    - Create test files (`*.test.tsx` or in `__tests__` folders) for:
      - Core UI Components (`MessageBubble`, `ChatInput`, etc.).
      - State Management (`useChatState` - test actions and state transitions).
      - Utility Functions (`lib/prompts.ts`, `lib/utils.ts`).
      - API Client (`lib/apiClient.ts` - mock `fetch`).
      - API Routes (requires more setup, potentially using tools like `next-test-api-route-handler` or integration tests).

2.  **Write End-to-End Tests:**

    - Install E2E testing framework: `npm install --save-dev cypress` or `playwright`.
    - Configure the chosen framework.
    - Create test specs (`*.cy.ts` or similar) to simulate the full user journey:
      - Loading the page.
      - Answering all questions.
      - Verifying loading states appear/disappear.
      - Verifying artifact content appears (basic checks).
      - Verifying download button appears and triggers a download (mocking the download might be needed).

3.  **Manual & Exploratory Testing:**

    - Test the full flow with various realistic and edge-case inputs.
    - Verify UI/UX consistency and clarity.
    - Test across different browsers (Chrome, Firefox, Safari, Edge).
    - Check responsiveness (though primarily desktop-focused).
    - Verify error handling for API failures.
    - Assess the quality and usefulness of the generated artifacts.

4.  **Refinement & Bug Fixing:**

    - Address any bugs found during testing.
    - Refine AI prompts in `lib/prompts.ts` based on output quality assessment.
    - Optimize performance (e.g., rendering, API response times where possible).
    - Improve UI/UX based on testing feedback.

5.  **Documentation:**
    - Update `README.md` with final setup instructions, how to run, and project details.
    - Create/Finalize `docs/SETUP.md`, `docs/ARCHITECTURE.md`.
    - Add code comments where logic is complex.

---

### Phase 6: Deployment & CI/CD

**Goal:** Deploy the application to a hosting provider and automate the deployment process.

1.  **Prepare for Deployment:**

    - Ensure all necessary environment variables (`GEMINI_API_KEY`) are configured in the hosting provider's settings (e.g., Vercel Environment Variables).
    - Verify build command (`npm run build`) runs successfully.

2.  **Deploy:**

    - Use the hosting provider's mechanism (e.g., Vercel Git integration, Vercel CLI `vercel deploy --prod`).

---

This guide provides a structured path through the development lifecycle. Remember that development is iterative; testing should occur _within_ each phase, and refinements might necessitate revisiting earlier steps. Good luck!
