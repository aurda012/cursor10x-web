import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DownloadButtonProps {
  /**
   * Function to call when button is clicked
   */
  onClick: () => Promise<void>;

  /**
   * Whether the button should be enabled
   */
  isReady: boolean;

  /**
   * Project name to use in the button text
   */
  projectName: string;
}

/**
 * Button component for downloading the packaged project
 */
export function DownloadButton({
  onClick,
  isReady,
  projectName,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    if (isDownloading || !isReady) return;

    setIsDownloading(true);

    try {
      await onClick();
    } catch (error) {
      console.error("Download failed:", error);
      // Error is handled in the onClick function
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isReady || isDownloading}
      className="w-full md:w-auto"
      size="lg"
      variant="default"
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing Download...
        </>
      ) : (
        `Download Project Package`
      )}
    </Button>
  );
}
