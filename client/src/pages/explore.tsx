import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import ActivityCard from "@/components/common/ActivityCard";
import UserCard from "@/components/common/UserCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Search, MapPin, Users, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import InterestTag from "@/components/common/InterestTag";

export default function Explore() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Silently fail - user is not logged in
    }
  });
  
  // Get activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities'],
  });
  
  // Get nearby users
  const { data: nearbyUsers, isLoading: usersLoading } = useQuery({
    queryKey: [locationFilter ? `/api/users/nearby?location=${encodeURIComponent(locationFilter)}` : '/api/users/nearby?location='],
  });
  
  // Get interest categories
  const { data: interests } = useQuery({
    queryKey: ['/api/interests'],
  });
  
  // Get the user's following list
  const { data: following } = useQuery({
    queryKey: [currentUser ? `/api/users/${currentUser.id}/following` : null],
    enabled: !!currentUser,
  });
  
  // Function to check if the current user is following someone
  const isFollowing = (userId: number) => {
    return following?.some((user: any) => user.id === userId);
  };
  
  // Function to get creator data for activities
  const getCreator = (creatorId: number) => {
    return nearbyUsers?.find((user: any) => user.id === creatorId);
  };
  
  // Filter activities based on search term, location, and interests
  const filteredActivities = activities?.filter((activity: any) => {
    // Filter by search term (title and description)
    const matchesSearch = searchTerm === "" || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by location
    const matchesLocation = locationFilter === "" ||
      activity.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Filter by selected interests
    const matchesInterests = selectedInterests.length === 0 ||
      selectedInterests.some(interest => 
        activity.categories?.includes(interest)
      );
    
    return matchesSearch && matchesLocation && matchesInterests;
  });
  
  // Filter users based on search term and location
  const filteredUsers = nearbyUsers?.filter((user: any) => {
    // Filter by search term (display name, username, bio)
    const matchesSearch = searchTerm === "" || 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by location
    const matchesLocation = locationFilter === "" ||
      (user.location && user.location.toLowerCase().includes(locationFilter.toLowerCase()));
    
    // Filter by selected interests
    const matchesInterests = selectedInterests.length === 0 ||
      selectedInterests.some(interest => 
        user.interests?.includes(interest)
      );
    
    return matchesSearch && matchesLocation && matchesInterests;
  });
  
  // Function to toggle interest selection
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-6">Explore</h1>
        
        {/* Search and filter */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities and people..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by location..."
                className="pl-10"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Interest filters */}
        {interests && interests.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">Filter by interests</span>
              {selectedInterests.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedInterests([])}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: any) => (
                <InterestTag 
                  key={interest.id}
                  text={interest.name}
                  selected={selectedInterests.includes(interest.name)}
                  onClick={() => toggleInterest(interest.name)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Tab navigation */}
        <Tabs defaultValue="activities" className="animate-fade-in">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>
          
          {/* Activities tab */}
          <TabsContent value="activities" className="pt-4">
            {activitiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-48 w-full rounded-md mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredActivities && filteredActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity: any) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    creator={getCreator(activity.creatorId)}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activities found matching your criteria.</p>
                {currentUser && (
                  <Button className="mt-4">
                    Create a New Activity
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* People tab */}
          <TabsContent value="people" className="pt-4">
            {usersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                  </Card>
                ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user: any) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                    isFollowing={isFollowing(user.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No people found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
