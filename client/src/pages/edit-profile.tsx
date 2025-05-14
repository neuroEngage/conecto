import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import ProfileForm from "@/components/forms/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function EditProfile() {
  const [, navigate] = useLocation();
  
  // Check if user is authenticated
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Navigate to login if not authenticated
      navigate("/login");
    }
  });

  if (isLoading) {
    return (
      <PageContainer narrow>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (!currentUser) {
    return (
      <PageContainer narrow>
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6 text-muted-foreground">You need to be logged in to edit your profile.</p>
          <div className="flex justify-center gap-3">
            <Link href="/login">
              <Button>Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <Card>
          <CardContent className="p-6">
            <ProfileForm user={currentUser} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
