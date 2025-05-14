import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import ActivityForm from "@/components/forms/ActivityForm";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CreateActivity() {
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
        <div className="h-[60vh] flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  if (!currentUser) {
    return (
      <PageContainer narrow>
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6 text-muted-foreground">You need to be logged in to create an activity.</p>
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
        <h1 className="text-3xl font-bold">Create Activity</h1>
        <p className="text-muted-foreground">
          Share an activity or event with others who share your interests.
        </p>
        
        <ActivityForm />
      </div>
    </PageContainer>
  );
}
