import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { promises as fs } from "fs";
import path from "path";
import { PackageRequestBody } from "@/types";

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

      // Define the path to the template directory
      const templateDir = path.resolve(process.cwd(), "templates", "cursor10x");

      // Modified recursive function to keep the same folder structure from the template
      const addFilesToZip = async (
        directoryPath: string,
        directoryName: string,
        zipFolder: JSZip
      ) => {
        const items = await fs.readdir(directoryPath);

        for (const item of items) {
          const itemPath = path.join(directoryPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.isFile()) {
            // Skip placeholder files that will be replaced with generated content
            const relativePath = path.relative(templateDir, itemPath);

            // Skip specific placeholder files that will be replaced with content
            if (
              relativePath === "docs/blueprint.md" ||
              relativePath === "docs/architecture.md" ||
              relativePath === "docs/guide.md" ||
              relativePath === "tasks/tasks.json"
            ) {
              // These will be added with content later
              continue;
            }

            // Read and add file
            const content = await fs.readFile(itemPath);
            zipFolder.file(item, content);
          } else if (stats.isDirectory()) {
            // Create directory in zip
            const newZipFolder = zipFolder.folder(item);

            if (newZipFolder) {
              // Recursively add files from subdirectory
              await addFilesToZip(itemPath, item, newZipFolder);
            }
          }
        }
      };

      // Add template files to zip - starting from the root now
      await addFilesToZip(templateDir, "", zip);

      // Add generated artifacts to specific files
      docsFolder.file("blueprint.md", artifacts.blueprint || "");
      docsFolder.file("architecture.md", artifacts.architecture || "");
      docsFolder.file("guide.md", artifacts.guide || "");
      tasksFolder.file("tasks.json", artifacts.tasks || "[]");

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
