import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  statusMessage: string | null;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  statusMessage,
}) => {
  if (!statusMessage) return null;

  return (
    <Alert className="mt-2 bg-muted/50">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>{statusMessage}</AlertDescription>
      </div>
      <Progress className="mt-2" value={undefined} />
    </Alert>
  );
};

export default LoadingIndicator;
