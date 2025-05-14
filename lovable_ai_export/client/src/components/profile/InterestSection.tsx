import InterestTag from "@/components/common/InterestTag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InterestSectionProps {
  title: string;
  interests: string[];
  emptyMessage?: string;
  variant?: "interests" | "wishlist";
}

export default function InterestSection({
  title,
  interests,
  emptyMessage = "No items added yet.",
  variant = "interests"
}: InterestSectionProps) {
  const gradientClass = 
    variant === "interests" 
      ? "from-primary to-secondary" 
      : "from-accent to-secondary";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <span className={`bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, index) => (
              <InterestTag
                key={index}
                text={interest}
                selected={false}
                className={
                  variant === "wishlist" 
                    ? "bg-accent/10 text-accent-foreground hover:bg-accent/20" 
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
