import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import path from "path";
import { PackageRequestBody } from "@/types";

// Configure with higher default memory and longer execution time for ZIP operations
export const config = {
  runtime: 'nodejs',
  regions: ['iad1'],
  maxDuration: 60,
};

/**
 * POST /api/package
 * Creates a zip file containing the generated artifacts and template files
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as PackageRequestBody;

    // Validate required fields
    if (!body.artifacts) {
      return NextResponse.json(
        { error: "Missing artifacts in request body" },
        { status: 400 }
      );
    }

    // Validate project name (use default if not provided)
    const projectName = body.projectName || "cursor10x-project";

    console.log(`Packaging request received for project: ${projectName}`);

    try {
      // Initialize JSZip
      const zip = new JSZip();

      // Get artifacts
      const { artifacts } = body;

      // No longer creating a project folder, directly creating folders in the root
      const docsFolder = zip.folder("docs");
      const tasksFolder = zip.folder("tasks");

      if (!docsFolder || !tasksFolder) {
        throw new Error("Failed to create subdirectories in zip");
      }

      // Add generated artifacts to specific files
      docsFolder.file("blueprint.md", artifacts.blueprint || "");
      docsFolder.file("architecture.md", artifacts.architecture || "");
      docsFolder.file("guide.md", artifacts.guide || "");
      tasksFolder.file("tasks.json", artifacts.tasks || "[]");
      
      // Add static template files - hardcoded for production deployment
      // These are the minimum required files for the template to work
      docsFolder.file("README.md", "# Cursor10x Project\n\nThis project was generated using Cursor10x.");
      
      // Add .cursor directory with configuration
      const cursorFolder = zip.folder(".cursor");
      if (cursorFolder) {
        cursorFolder.file("mcp.json", JSON.stringify({
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
        }, null, 2));
      }

      // Add .cursorrules file
      zip.file(".cursorrules", `
# Cursor10x Rules
- Follow Memory System guidelines
- Implement Project Tasks sequentially
- Track active files during implementation
- Store milestones when completing tasks
      `);

      // Add .gitignore
      zip.file(".gitignore", `
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# build
/.next/
/out/
/build
/dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# turbo
.turbo

# vercel
.vercel
      `);

      // Generate the zip content
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      // Create the filename - just cursor10x.zip now
      const filename = `cursor10x.zip`;

      // Return zip file as response
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error("Error generating zip file:", error);
      return NextResponse.json(
        { error: "Failed to generate project package" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in package API route:", error);

    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process packaging request" },
      { status: 500 }
    );
  }
}
