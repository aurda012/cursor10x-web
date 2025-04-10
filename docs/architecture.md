Okay, based on the technical blueprint, here is a detailed file and folder architecture diagram optimized for the Cursor10x Web App project using Next.js 14+ (App Router), React 18, TypeScript, and Shadcn/UI.

This structure follows industry best practices, prioritizing separation of concerns, maintainability, and scalability.

```plaintext
📁 cursor10x-web/
├── 📁 app/                          # Next.js App Router (Core application)
│   ├── 📁 api/                      # Server-side API routes (Backend logic)
│   │   ├── 📁 generate/             # Artifact generation endpoint group
│   │   │   └── 📁 [artifact]/      # Dynamic route for different artifacts
│   │   │       └── 📄 route.ts     # Handler for POST /api/generate/[artifact]
│   │   ├── 📁 package/              # Zip packaging endpoint group
│   │   │   └── 📄 route.ts         # Handler for POST /api/package
│   │   └── 📄 route.ts             # Optional: Root API route (e.g., for health check)
│   ├── 📁 (main)/                  # Route Group for the main application layout/page
│   │   ├── 📄 layout.tsx           # Root layout for the main app section
│   │   ├── 📄 page.tsx             # Main landing page component (Chat Interface)
│   │   ├── 📄 loading.tsx          # Loading UI for the page segment (Optional: Next.js convention)
│   │   └── 📄 error.tsx            # Error UI for the page segment (Optional: Next.js convention)
│   ├── 📄 layout.tsx               # Root application layout (applies to all routes)
│   ├── 📄 manifest.ts              # Optional: PWA Manifest generation
│   ├── 📄 sitemap.ts               # Optional: Sitemap generation
│   └── 📄 globals.css              # Global CSS rules, Tailwind directives
├── 📁 components/                  # Shared React components
│   ├── 📁 chat/                    # Components specific to the chat interface
│   │   ├── 📄 ArtifactViewer.tsx   # Component to display generated artifact streams
│   │   ├── 📄 ChatInput.tsx        # Input area for user messages
│   │   ├── 📄 ChatMessages.tsx     # Area displaying the conversation history
│   │   ├── 📄 ChatWindow.tsx       # Main container for the chat interface
│   │   ├── 📄 LoadingIndicator.tsx # Component showing AI processing state
│   │   └── 📄 MessageBubble.tsx    # Component for individual chat messages (user/agent)
│   ├── 📁 ui/                      # Shadcn/UI components (generated/customized)
│   │   │                            # (e.g., button.tsx, card.tsx, textarea.tsx, ...)
│   │   └── 📄 index.ts             # Optional: Barrel file to re-export ui components
│   └── 📁 common/                  # General reusable components (if any)
│       └── 📄 DownloadButton.tsx   # Button specifically for downloading the zip
├── 📁 docs/                        # Project documentation
│   ├── 📄 ARCHITECTURE.md          # This blueprint document
│   ├── 📄 SETUP.md               # Setup and installation guide
│   └── 📁 diagrams/               # Contains Mermaid/other diagrams
│       └── 📄 system_architecture.mermaid
├── 📁 hooks/                       # Custom React hooks
│   └── 📄 useChatState.ts          # Hook managing conversation state, answers, status
├── 📁 lib/                         # Shared utility functions, libraries, constants
│   ├── 📄 apiClient.ts             # Functions for calling internal Next.js API routes
│   ├── 📄 constants.ts             # Application-wide constants (e.g., initial messages)
│   ├── 📄 prompts.ts               # Functions or templates for assembling AI prompts
│   ├── 📄 streamHelper.ts          # Utilities for handling ReadableStream responses (if needed)
│   └── 📄 utils.ts                 # General utility functions (incl. Shadcn `cn` function)
├── 📁 public/                      # Static assets served directly
│   ├── 📄 favicon.ico
│   └── 📄 vercel.svg                # Example static asset
├── 📁 templates/                   # Static template files included in the final zip
│   └── 📁 cursor10x_system/        # The pre-defined Cursor10x multi-agent system
│       ├── 📄 agent_manager.py     # Example file 1
│       ├── 📄 memory_store.py      # Example file 2
│       └── 📄 task_executor.py    # Example file 3
│       └── ...                     # Other necessary template files/folders
├── 📁 types/                       # TypeScript type definitions
│   ├── 📄 api.ts                   # Types for API request/response bodies
│   ├── 📄 chat.ts                  # Types related to chat messages, state
│   └── 📄 index.ts                 # Barrel file or global types
├── 📄 .env.local                   # Local environment variables (API keys - DO NOT COMMIT)
├── 📄 .env.example                 # Example environment variables for setup
├── 📄 .eslintignore                # ESLint ignore patterns
├── 📄 .eslintrc.json               # ESLint configuration
├── 📄 .gitignore                   # Git ignore rules
├── 📄 components.json              # Shadcn/UI configuration
├── 📄 next-env.d.ts               # Next.js TypeScript environment declarations
├── 📄 next.config.mjs               # Next.js configuration (using .mjs for ESM)
├── 📄 package-lock.json            # NPM dependency lock file
├── 📄 package.json                 # Project dependencies and scripts
├── 📄 postcss.config.js            # PostCSS configuration (for Tailwind)
├── 📄 prettier.config.js            # Prettier code formatter configuration
├── 📄 prettierignore                # Prettier ignore patterns
├── 📄 README.md                   # Project overview, setup, and usage guide
├── 📄 tailwind.config.ts           # Tailwind CSS configuration (using .ts)
└── 📄 tsconfig.json                 # TypeScript compiler configuration

---
# Directory Explanations:

*   **`app/`**: Core of the Next.js application using the App Router.
    *   **`api/`**: Contains all backend serverless functions. Separated by feature (`generate`, `package`). Dynamic routes (`[artifact]`) handle variable parts of the URL. `route.ts` is the standard file name for route handlers in the App Router.
    *   **`(main)/`**: A Route Group (`(...)`) prevents the folder name from affecting the URL path. This contains the primary UI page (`page.tsx`) and its layout (`layout.tsx`).
    *   **`layout.tsx` (root):** Defines the global HTML structure, includes providers, etc.
*   **`components/`**: Reusable React components.
    *   **`chat/`**: Specific components for building the chat interface.
    *   **`ui/`**: Standard location for Shadcn/UI components. You run the Shadcn CLI to add components here.
    *   **`common/`**: Components that might be reused across different features if the app grows.
*   **`docs/`**: All project-related documentation. Essential for maintainability.
*   **`hooks/`**: Custom React hooks for encapsulating stateful logic and side effects. `useChatState` is central to managing the conversation.
*   **`lib/`**: Utility functions, helpers, and configurations not tied to specific components. Crucial for keeping components clean and logic reusable. `apiClient.ts` standardizes frontend-to-backend communication. `prompts.ts` isolates the logic for creating AI prompts.
*   **`public/`**: Static files accessible directly via URL (e.g., `yourdomain.com/favicon.ico`).
*   **`styles/`**: Global CSS definitions. `globals.css` is standard for Next.js + Tailwind.
*   **`templates/`**: Stores the static files (Cursor10x system) that will be read by the `/api/package` route and included in the downloadable zip file. This is *not* served publicly.
*   **`types/`**: Central location for shared TypeScript interfaces and types, improving code safety and readability.
*   **Root Files**: Standard configuration files for Node.js, Next.js, TypeScript, Git, ESLint, Prettier, Tailwind, etc. `.env.local` is critical for secrets and MUST be in `.gitignore`.

This structure provides a clean separation between the frontend UI (`app/(main)`, `components`, `hooks`), backend logic (`app/api`), static assets (`public`), configuration, and utilities (`lib`), making it easy to navigate, maintain, and scale the application. It aligns perfectly with the Next.js App Router conventions and the tech stack defined in the blueprint.
```
