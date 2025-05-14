import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Compass,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  User,
  X,
  Home,
  Settings,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";

interface NavbarProps {
  user: UserType | null | undefined;
  isLoading: boolean;
}

export default function Navbar({ user, isLoading }: NavbarProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.invalidateQueries();
      navigate("/login");
      toast({
        title: "Logged out successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">
                  MeetupMatch
                </span>
              </Link>
              <div className="grid gap-2 py-6">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start flex gap-2">
                    <Home className="h-5 w-5" />
                    Home
                  </Button>
                </Link>
                <Link href="/explore" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start flex gap-2">
                    <Compass className="h-5 w-5" />
                    Explore
                  </Button>
                </Link>
                <Link href="/create-activity" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start flex gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Create Activity
                  </Button>
                </Link>
                {user && (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex gap-2">
                        <User className="h-5 w-5" />
                        Profile
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start flex gap-2" onClick={handleLogout}>
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </>
                )}
                {!user && !isLoading && (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full justify-start">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold hidden md:inline-block bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">
              MeetupMatch
            </span>
            <span className="text-xl font-bold md:hidden bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">
              MM
            </span>
          </Link>

          <div className="hidden md:flex md:gap-6">
            <Link href="/">
              <Button variant={location === "/" ? "secondary" : "ghost"}>
                Home
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant={location === "/explore" ? "secondary" : "ghost"}>
                Explore
              </Button>
            </Link>
            {user && (
              <Link href="/create-activity">
                <Button variant={location === "/create-activity" ? "secondary" : "ghost"}>
                  Create Activity
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search activities..."
              className="w-[200px] lg:w-[300px] pl-8 rounded-xl"
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">
                        {unreadNotifications.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px] p-2">
                  <div className="font-medium text-sm px-2 py-1.5">
                    Notifications
                  </div>
                  <DropdownMenuSeparator />
                  {notificationsLoading ? (
                    <div className="p-4 flex flex-col gap-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : notifications && notifications.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto space-y-1 py-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-2 py-1.5 text-sm rounded-md ${notification.isRead ? '' : 'bg-muted/50 font-medium'}`}
                        >
                          {notification.content}
                          <div className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      No notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={user.profileImage || undefined} alt={user.displayName} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/edit-profile" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
