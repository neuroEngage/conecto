import { useQuery } from "@tanstack/react-query";
import UserCard from "@/components/common/UserCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { User } from "@shared/schema";

interface RecommendedUsersProps {
  currentUser: User | null | undefined;
}

export default function RecommendedUsers({ currentUser }: RecommendedUsersProps) {
  const { data: suggestedUsers, isLoading } = useQuery({
    queryKey: ['/api/users/suggested'],
    enabled: !!currentUser,
  });

  const { data: following } = useQuery({
    queryKey: [`/api/users/${currentUser?.id}/following`],
    enabled: !!currentUser,
  });

  const isFollowing = (userId: number) => {
    return following?.some((user: User) => user.id === userId);
  };

  // Generate a mock match percentage based on interests overlap
  const getMatchPercentage = (user: User) => {
    if (!currentUser || !currentUser.interests || !user.interests) return 0;
    
    const currentUserInterests = new Set(currentUser.interests);
    const userInterests = new Set(user.interests);
    
    // Find intersection
    const intersection = new Set(
      [...currentUserInterests].filter(x => userInterests.has(x))
    );
    
    // Calculate percentage
    const totalUniqueInterests = new Set([
      ...currentUserInterests,
      ...userInterests
    ]).size;
    
    return Math.round((intersection.size / totalUniqueInterests) * 100);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Recommended For You</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : suggestedUsers && suggestedUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suggestedUsers.map((user: User) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={currentUser?.id}
              isFollowing={isFollowing(user.id)}
              variant="suggestion"
              showMatchPercentage={true}
              matchPercentage={getMatchPercentage(user)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>Complete your profile with interests to see recommendations</p>
        </div>
      )}
    </div>
  );
}
