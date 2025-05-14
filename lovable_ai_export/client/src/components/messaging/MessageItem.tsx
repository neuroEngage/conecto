import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: Message;
  sender?: User;
  isCurrentUser: boolean;
}

export default function MessageItem({ message, sender, isCurrentUser }: MessageItemProps) {
  const formattedTime = format(new Date(message.sentAt), "h:mm a");
  
  return (
    <div className={cn(
      "flex items-start gap-2 max-w-[85%]",
      isCurrentUser ? "ml-auto flex-row-reverse" : ""
    )}>
      {sender ? (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.profileImage || undefined} alt={sender.displayName} />
          <AvatarFallback>{sender.displayName?.charAt(0) || sender.username.charAt(0)}</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-8 w-8">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-3 py-2 rounded-lg",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted rounded-tl-none"
        )}>
          <p className="text-sm break-words">{message.content}</p>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>{sender?.displayName || "Unknown user"}</span>
          <span>•</span>
          <span>{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
