import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Edit3, UserPlus, UserMinus, Users } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface ProfileHeaderProps {
  profile: User;
  isCurrentUser: boolean;
  followers: User[];
  following: User[];
  isFollowing: boolean;
}

export default function ProfileHeader({
  profile,
  isCurrentUser,
  followers,
  following,
  isFollowing,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState(isFollowing);

  const handleFollowToggle = async () => {
    if (!profile) return;

    setFollowLoading(true);
    try {
      if (followStatus) {
        await apiRequest("DELETE", `/api/users/${profile.id}/unfollow`, {});
        setFollowStatus(false);
        toast({
          title: "Unfollowed",
          description: `You have unfollowed ${profile.displayName}`,
        });
      } else {
        await apiRequest("POST", `/api/users/${profile.id}/follow`, {});
        setFollowStatus(true);
        toast({
          title: "Following",
          description: `You are now following ${profile.displayName}`,
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile.id}/followers`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="w-full gradient-border p-0.5 mb-6">
        <div className="bg-background rounded-[calc(0.75rem-1px)]">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage
                  src={profile.profileImage || undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback className="text-4xl">
                  {profile.displayName?.charAt(0) || profile.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                <div className="flex gap-2 md:ml-auto">
                  {isCurrentUser ? (
                    <Link href="/edit-profile">
                      <Button className="gap-2">
                        <Edit3 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      variant={followStatus ? "outline" : "default"}
                      className="gap-2"
                    >
                      {followStatus ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{followers.length}</span>
                  <span className="text-muted-foreground">Followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{following.length}</span>
                  <span className="text-muted-foreground">Following</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.location}</span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div>
                  <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
