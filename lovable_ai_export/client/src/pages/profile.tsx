import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ActivityCard from "@/components/common/ActivityCard";
import InterestSection from "@/components/profile/InterestSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarRange, Activity as ActivityIcon } from "lucide-react";
import { useLocation } from "wouter";
import { User, Activity } from "@shared/schema";

interface ProfileProps {
  id?: number;
}

export default function Profile({ id }: ProfileProps) {
  const [, navigate] = useLocation();
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Silently fail - user is not logged in
    }
  });
  
  // If no ID is provided, use the current user's ID
  const profileId = id || currentUser?.id;
  
  // Redirect to login if trying to view own profile but not logged in
  if (!profileId) {
    navigate("/login");
    return null;
  }
  
  // Get profile data
  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${profileId}`],
  });
  
  // Get followers and following
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: [`/api/users/${profileId}/followers`],
    enabled: !!profileId,
  });
  
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: [`/api/users/${profileId}/following`],
    enabled: !!profileId,
  });
  
  // Get user activities
  const { data: userActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: [`/api/users/${profileId}/activities`],
    enabled: !!profileId,
  });
  
  // Check if current user is following this profile
  const isFollowing = followers.some(
    (follower: User) => follower.id === currentUser?.id
  );
  
  // Determine if the profile belongs to the current user
  const isCurrentUser = currentUser?.id === profileId;

  if (profileLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-40 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-32 w-full rounded-lg mb-4" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </PageContainer>
    );
  }
  
  if (!profileUser) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <CardDescription className="mb-6 text-center">
              The profile you're looking for doesn't exist or has been removed.
            </CardDescription>
            <div className="flex gap-2">
              <button onClick={() => window.history.back()} className="text-primary">
                Go Back
              </button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <ProfileHeader
          profile={profileUser}
          isCurrentUser={isCurrentUser}
          followers={followers}
          following={following}
          isFollowing={isFollowing}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="activities">
              <TabsList className="mb-4">
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  Activities
                </TabsTrigger>
                <TabsTrigger value="participating" className="flex items-center gap-2">
                  <ActivityIcon className="h-4 w-4" />
                  Participating
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activities" className="animate-fade-in">
                {activitiesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </div>
                ) : userActivities && userActivities.length > 0 ? (
                  <div className="space-y-4">
                    {userActivities.map((activity: Activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        creator={profileUser}
                        currentUserId={currentUser?.id}
                        variant="compact"
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {isCurrentUser 
                          ? "You haven't created any activities yet." 
                          : "This user hasn't created any activities yet."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="participating" className="animate-fade-in">
                {/* We don't have this endpoint yet, so we'll show a placeholder */}
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {isCurrentUser 
                        ? "You're not participating in any activities." 
                        : "This user isn't participating in any activities."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <InterestSection
              title="Interests"
              interests={profileUser.interests || []}
              emptyMessage={isCurrentUser 
                ? "You haven't added any interests yet." 
                : "This user hasn't added any interests yet."}
            />
            
            <InterestSection
              title="What I Want To Do"
              interests={profileUser.wishlist || []}
              variant="wishlist"
              emptyMessage={isCurrentUser 
                ? "You haven't added any wishlist items yet." 
                : "This user hasn't added any wishlist activities yet."}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
