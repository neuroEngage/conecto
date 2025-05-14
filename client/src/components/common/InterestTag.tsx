import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InterestTagProps {
  text: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function InterestTag({
  text,
  selected = false,
  onClick,
  className = "",
  size = "md"
}: InterestTagProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5"
  };

  const colors = {
    selected: "bg-primary hover:bg-primary/90 text-primary-foreground",
    notSelected: "bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground/90"
  };

  return (
    <Badge
      className={cn(
        "rounded-full font-medium cursor-pointer transition-all",
        selected ? colors.selected : colors.notSelected,
        sizeClasses[size],
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      {text}
    </Badge>
  );
}
