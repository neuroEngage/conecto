import { useQuery } from "@tanstack/react-query";
import ActivityCard from "@/components/common/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { User, Activity } from "@shared/schema";
import { Calendar, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface UpcomingActivitiesProps {
  currentUser: User | null | undefined;
}

export default function UpcomingActivities({ currentUser }: UpcomingActivitiesProps) {
  const [location] = useLocation();
  const [searchLocation, setSearchLocation] = useState("");
  const [submittedLocation, setSubmittedLocation] = useState("");
  
  // Using the nearby activities API if a location is provided, otherwise get all upcoming
  const queryKey = submittedLocation 
    ? [`/api/activities/nearby?location=${encodeURIComponent(submittedLocation)}`]
    : ["/api/activities"];
  
  const { data: activities, isLoading } = useQuery({
    queryKey,
  });

  // Function to get creator data for each activity
  const getCreator = (creatorId: number) => {
    return users?.find((user: User) => user.id === creatorId);
  };

  // Using a simple query to get all users for displaying the creator
  // In a full implementation, this could be optimized
  const { data: users } = useQuery({
    queryKey: ['/api/users/nearby?location='],
  });

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLocation(searchLocation);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Upcoming Activities</h2>
        
        <div className="flex w-full sm:w-auto items-center gap-2">
          <form onSubmit={handleLocationSearch} className="flex w-full sm:w-auto gap-2">
            <div className="relative flex-grow">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by location..." 
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          {currentUser && location !== "/create-activity" && (
            <Link href="/create-activity">
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
      ) : activities && activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activities.map((activity: Activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              creator={getCreator(activity.creatorId)}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No activities found {submittedLocation && `in ${submittedLocation}`}</p>
          {currentUser && (
            <Link href="/create-activity">
              <Button className="mt-4">
                Create an Activity
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
