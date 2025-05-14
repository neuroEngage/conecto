import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import ChatWindow from "@/components/messaging/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface ChatProps {
  activityId: number;
}

export default function Chat({ activityId }: ChatProps) {
  const [, navigate] = useLocation();
  
  // Check if user is authenticated
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Navigate to login if not authenticated
      navigate("/login");
    }
  });
  
  // Get activity details
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId,
  });
  
  // Get participants to check if user is part of this activity
  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: [`/api/activities/${activityId}/participants`],
    enabled: !!activityId && !!currentUser,
  });
  
  // Check if user is a participant in this activity
  useEffect(() => {
    if (currentUser && participants && !participantsLoading) {
      const isParticipant = participants.some((p: any) => p.id === currentUser.id);
      
      // If not a participant, redirect to activity page
      if (!isParticipant) {
        navigate(`/activity/${activityId}`);
      }
    }
  }, [currentUser, participants, participantsLoading, activityId, navigate]);
  
  const isLoading = userLoading || activityLoading || participantsLoading;

  if (isLoading) {
    return (
      <PageContainer className="h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[calc(100vh-12rem)] w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!currentUser || !activity) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have access to this chat or the activity doesn't exist.
            </p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/activity/${activityId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Chat</h1>
      </div>
      
      <div className="h-[calc(100vh-12rem)]">
        <ChatWindow 
          activity={activity} 
          currentUser={currentUser} 
        />
      </div>
    </PageContainer>
  );
}
