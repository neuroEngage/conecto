import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, User, Users, MessageSquare, Pencil, Share, Trash2 } from "lucide-react";
import { format } from "date-fns";
import InterestTag from "@/components/common/InterestTag";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActivityPageProps {
  id: number;
}

export default function Activity({ id }: ActivityPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isJoined, setIsJoined] = useState(false);
  
  // Queries
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: [`/api/activities/${id}`],
  });
  
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Silently fail - user is not logged in
    }
  });
  
  const { data: creator } = useQuery({
    queryKey: [activity ? `/api/users/${activity.creatorId}` : null],
    enabled: !!activity,
  });
  
  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: [`/api/activities/${id}/participants`],
    enabled: !!activity,
  });
  
  // Check if the current user has joined the activity
  useEffect(() => {
    if (currentUser && participants) {
      const userJoined = participants.some((p: any) => p.id === currentUser.id);
      setIsJoined(userJoined);
    }
  }, [currentUser, participants]);
  
  // Join activity mutation
  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/activities/${id}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${id}/participants`] });
      toast({
        title: "Joined successfully",
        description: "You have joined this activity",
      });
      setIsJoined(true);
    },
    onError: (error) => {
      toast({
        title: "Error joining activity",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Leave activity mutation
  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${id}/leave`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${id}/participants`] });
      toast({
        title: "Left activity",
        description: "You have left this activity",
      });
      setIsJoined(false);
    },
    onError: (error) => {
      toast({
        title: "Error leaving activity",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete activity mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Activity deleted",
        description: "Your activity has been deleted",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error deleting activity",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleJoinLeave = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to join this activity",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (isJoined) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Activity link copied to clipboard",
    });
  };
  
  if (activityLoading) {
    return (
      <PageContainer narrow>
        <div className="space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContainer>
    );
  }
  
  if (!activity) {
    return (
      <PageContainer narrow>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-2">Activity Not Found</h1>
            <p className="text-muted-foreground mb-6">The activity you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }
  
  const {
    title,
    description,
    location,
    dateTime,
    maxParticipants,
    categories,
    image,
    creatorId,
    status
  } = activity;
  
  const date = new Date(dateTime);
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");
  const formattedTime = format(date, "h:mm a");
  const isCreator = currentUser?.id === creatorId;
  const participantCount = participants?.length || 0;
  const isFull = maxParticipants ? participantCount >= maxParticipants : false;
  const isPastEvent = new Date(dateTime) < new Date();
  
  const getRandomPlaceholderImage = () => {
    const patterns = [
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1540324155974-7523202daa3f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  return (
    <PageContainer narrow className="animate-fade-in">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories?.map((category, index) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 self-start">
            {isCreator && (
              <>
                <Link href={`/edit-activity/${id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this activity.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src={image || getRandomPlaceholderImage()} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">{formattedTime}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-sm text-muted-foreground">
                  {participantCount} {participantCount === 1 ? "person" : "people"}
                  {maxParticipants ? ` / ${maxParticipants}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{description}</p>
              </CardContent>
            </Card>
            
            {isJoined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Group Chat</CardTitle>
                    <CardDescription>Chat with other participants</CardDescription>
                  </div>
                  <Link href={`/chat/${id}`}>
                    <Button variant="secondary">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Join the conversation with other participants to discuss details, coordinate, or just get to know each other before the activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                {creator ? (
                  <Link href={`/profile/${creator.id}`}>
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <Avatar>
                        <AvatarImage src={creator.profileImage || undefined} alt={creator.displayName} />
                        <AvatarFallback>{creator.displayName?.charAt(0) || creator.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{creator.displayName}</p>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {participantsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {participants.map((participant: any) => (
                      <Link key={participant.id} href={`/profile/${participant.id}`}>
                        <div className="flex items-center space-x-3 cursor-pointer">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.profileImage || undefined} alt={participant.displayName} />
                            <AvatarFallback>{participant.displayName?.charAt(0) || participant.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{participant.displayName}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No participants yet.</p>
                )}
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3">
              {!isCreator && !isPastEvent && (
                <Button 
                  onClick={handleJoinLeave} 
                  disabled={(!isJoined && isFull) || joinMutation.isPending || leaveMutation.isPending}
                  variant={isJoined ? "outline" : "default"}
                >
                  {joinMutation.isPending ? "Joining..." : 
                   leaveMutation.isPending ? "Leaving..." :
                   isJoined ? "Leave Activity" : 
                   isFull ? "Activity Full" : "Join Activity"}
                </Button>
              )}
              
              {isJoined && (
                <Link href={`/chat/${id}`} className="w-full">
                  <Button variant="secondary" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with Group
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
