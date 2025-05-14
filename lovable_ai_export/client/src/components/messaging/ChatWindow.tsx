import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MessageItem from "./MessageItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { Activity, User, Message } from "@shared/schema";

interface ChatWindowProps {
  activity: Activity;
  currentUser: User;
}

export default function ChatWindow({ activity, currentUser }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socket = useSocket();
  
  // Get initial messages
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: [`/api/activities/${activity.id}/messages`],
  });
  
  // Get activity participants
  const { data: participants } = useQuery({
    queryKey: [`/api/activities/${activity.id}/participants`],
  });
  
  // Get message sender data
  const getSender = (senderId: number) => {
    return participants?.find((user: User) => user.id === senderId);
  };
  
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Set up WebSocket message handler
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'activity-message' && data.message.activityId === activity.id) {
            setMessages((prevMessages) => [...prevMessages, data.message]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.addEventListener('message', handleMessage);
      
      // Clean up
      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, activity.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection error",
        description: "Not connected to chat server",
        variant: "destructive",
      });
      return;
    }
    
    try {
      socket.send(JSON.stringify({
        type: 'activity-chat',
        activityId: activity.id,
        senderId: currentUser.id,
        content: message.trim()
      }));
      
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Group Chat: {activity.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex items-start gap-2 max-w-[80%] ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-16 w-48 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                sender={getSender(msg.senderId)}
                isCurrentUser={msg.senderId === currentUser.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
