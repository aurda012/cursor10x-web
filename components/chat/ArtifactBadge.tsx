import React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, BookOpen, CheckSquare } from "lucide-react";

interface ArtifactBadgeProps {
  artifactType: string;
  className?: string;
}

export function ArtifactBadge({
  artifactType,
  className = "",
}: ArtifactBadgeProps) {
  // Get the appropriate badge variant and icon based on artifact type
  const getBadgeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "blueprint":
        return {
          variant: "outline" as const,
          label: "Blueprint",
          icon: <FileText className="h-3 w-3 mr-1" />,
        };
      case "architecture":
        return {
          variant: "secondary" as const,
          label: "Architecture",
          icon: <Database className="h-3 w-3 mr-1" />,
        };
      case "guide":
        return {
          variant: "default" as const,
          label: "Guide",
          icon: <BookOpen className="h-3 w-3 mr-1" />,
        };
      case "tasks":
        return {
          variant: "destructive" as const,
          label: "Tasks",
          icon: <CheckSquare className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          variant: "outline" as const,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          icon: null,
        };
    }
  };

  const { variant, label, icon } = getBadgeInfo(artifactType);

  return (
    <Badge variant={variant} className={`flex items-center ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}

export default ArtifactBadge;
