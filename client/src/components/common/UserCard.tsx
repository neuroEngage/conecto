import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import InterestTag from "./InterestTag";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";

interface UserCardProps {
  user: User;
  currentUserId?: number;
  isFollowing?: boolean;
  showFollowButton?: boolean;
  className?: string;
  variant?: "default" | "compact" | "suggestion";
  showMatchPercentage?: boolean;
  matchPercentage?: number;
}

export default function UserCard({
  user,
  currentUserId,
  isFollowing = false,
  showFollowButton = true,
  className = "",
  variant = "default",
  showMatchPercentage = false,
  matchPercentage = 0
}: UserCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to log in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (following) {
        await apiRequest("DELETE", `/api/users/${user.id}/unfollow`, {});
        setFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You have unfollowed ${user.displayName}`,
        });
      } else {
        await apiRequest("POST", `/api/users/${user.id}/follow`, {});
        setFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${user.displayName}`,
        });
      }
      
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/followers`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
        <div className="flex items-center p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImage || undefined} alt={user.displayName} />
            <AvatarFallback>{user.displayName?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-grow">
            <h3 className="font-medium text-sm">{user.displayName}</h3>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          {currentUserId !== user.id && showFollowButton && (
            <Button
              variant={following ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={isLoading}
            >
              {following ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </Card>
    );
  }
  
  if (variant === "suggestion") {
    return (
      <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
        <div className="flex flex-col p-4">
          <div className="flex items-start justify-between">
            <Link href={`/profile/${user.id}`}>
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImage || undefined} alt={user.displayName} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="font-medium">{user.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            </Link>
            
            {showMatchPercentage && (
              <div className="bg-secondary/10 text-secondary font-medium rounded-full px-2 py-0.5 text-xs">
                {matchPercentage}% match
              </div>
            )}
          </div>
          
          {user.location && (
            <div className="flex items-center mt-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{user.location}</span>
            </div>
          )}
          
          {user.interests && user.interests.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 4).map((interest, index) => (
                  <InterestTag key={index} text={interest} size="sm" />
                ))}
                {user.interests.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{user.interests.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            {currentUserId !== user.id && showFollowButton && (
              <Button
                variant={following ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={isLoading}
                className="w-full"
              >
                {following ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link href={`/profile/${user.id}`}>
      <Card className={cn("overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full", className)}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profileImage || undefined} alt={user.displayName} />
                <AvatarFallback>{user.displayName?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <CardTitle className="text-lg">{user.displayName}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </div>
            </div>
            
            {showMatchPercentage && (
              <div className="bg-secondary/10 text-secondary font-medium rounded-full px-3 py-1">
                {matchPercentage}% match
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {user.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {user.bio}
            </p>
          )}
          
          {user.location && (
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{user.location}</span>
            </div>
          )}
          
          {user.interests && user.interests.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1.5">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 5).map((interest, index) => (
                  <InterestTag key={index} text={interest} size="sm" />
                ))}
                {user.interests.length > 5 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{user.interests.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {user.wishlist && user.wishlist.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1.5">What I Want To Do</p>
              <div className="flex flex-wrap gap-1.5">
                {user.wishlist.slice(0, 3).map((item, index) => (
                  <InterestTag key={index} text={item} size="sm" className="bg-accent/10 text-accent-foreground hover:bg-accent/20" />
                ))}
                {user.wishlist.length > 3 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{user.wishlist.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {currentUserId !== user.id && showFollowButton && (
            <Button
              variant={following ? "outline" : "default"}
              className="w-full"
              onClick={handleFollow}
              disabled={isLoading}
            >
              {following ? "Following" : "Follow"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
