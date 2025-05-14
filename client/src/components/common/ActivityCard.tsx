import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import type { Activity, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ActivityCardProps {
  activity: Activity;
  creator?: User;
  currentUserId?: number;
  participants?: User[];
  className?: string;
  variant?: "default" | "compact";
  showJoin?: boolean;
  onJoin?: () => void;
  isJoined?: boolean;
}

export default function ActivityCard({
  activity,
  creator,
  currentUserId,
  participants = [],
  className = "",
  variant = "default",
  showJoin = false,
  onJoin,
  isJoined = false
}: ActivityCardProps) {
  const {
    id,
    title,
    description,
    location,
    dateTime,
    maxParticipants,
    categories,
    image
  } = activity;

  const isCreator = currentUserId === activity.creatorId;
  const date = new Date(dateTime);
  const formattedDate = format(date, "EEEE, MMMM d");
  const formattedTime = format(date, "h:mm a");
  const participantCount = participants.length;
  
  const isFull = maxParticipants ? participantCount >= maxParticipants : false;

  const getRandomPlaceholderImage = () => {
    const patterns = [
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1540324155974-7523202daa3f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
        <div className="flex flex-col md:flex-row">
          <div className="relative h-32 md:h-auto md:w-40 flex-shrink-0">
            <img
              src={image || getRandomPlaceholderImage()}
              alt={title}
              className="object-cover h-full w-full"
            />
          </div>
          <div className="flex flex-col flex-grow">
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base md:text-lg truncate">{title}</CardTitle>
                {creator && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={creator.profileImage || undefined} alt={creator.displayName} />
                    <AvatarFallback>{creator.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1.5 flex-grow">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{location}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="border-2 border-background h-6 w-6">
                    <AvatarImage src={participant.profileImage || undefined} alt={participant.displayName} />
                    <AvatarFallback>{participant.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {participantCount > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    +{participantCount - 3}
                  </div>
                )}
              </div>
              <Link href={`/activity/${id}`}>
                <Button size="sm" variant="secondary">View</Button>
              </Link>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
      <div className="relative">
        <img
          src={image || getRandomPlaceholderImage()}
          alt={title}
          className="h-48 w-full object-cover image-hover-zoom"
        />
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
          {categories?.map((category, index) => (
            <Badge key={index} variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {category}
            </Badge>
          ))}
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate">{title}</CardTitle>
          {creator && (
            <Link href={`/profile/${creator.id}`}>
              <Avatar className="cursor-pointer">
                <AvatarImage src={creator.profileImage || undefined} alt={creator.displayName} />
                <AvatarFallback>{creator.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid gap-3">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
              {maxParticipants ? ` (max ${maxParticipants})` : ""}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <div className="flex -space-x-3">
          {participants.slice(0, 4).map((participant) => (
            <Avatar key={participant.id} className="border-2 border-background">
              <AvatarImage src={participant.profileImage || undefined} alt={participant.displayName} />
              <AvatarFallback>{participant.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {participantCount > 4 && (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm">
              +{participantCount - 4}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {showJoin && !isCreator && !isJoined && (
            <Button 
              onClick={onJoin} 
              disabled={isFull}
              variant="secondary"
            >
              {isFull ? "Full" : "Join"}
            </Button>
          )}
          {isJoined && !isCreator && (
            <Button variant="outline">Joined</Button>
          )}
          <Link href={`/activity/${id}`}>
            <Button>View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
