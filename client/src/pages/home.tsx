import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/layout/PageContainer";
import UpcomingActivities from "@/components/home/UpcomingActivities";
import RecommendedUsers from "@/components/home/RecommendedUsers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { User } from "@shared/schema";

export default function Home() {
  // Get current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Silently fail - user is not logged in
    }
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Hero section */}
        <section className="relative mb-12 animate-fade-in">
          <div className="rounded-xl bg-gradient-to-r from-primary via-secondary to-accent p-0.5">
            <div className="bg-card rounded-[calc(0.75rem-1px)] p-8 md:p-12">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Connect with people who share your interests
                </h1>
                <p className="text-muted-foreground text-lg mb-6">
                  Join activities, create your own adventures, and meet new friends based on common passions
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/explore">
                    <Button size="lg">Explore Activities</Button>
                  </Link>
                  {currentUser ? (
                    <Link href="/create-activity">
                      <Button size="lg" variant="outline">Create Activity</Button>
                    </Link>
                  ) : (
                    <Link href="/register">
                      <Button size="lg" variant="outline">Sign Up</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming activities section */}
        <section>
          <UpcomingActivities currentUser={currentUser} />
        </section>

        {/* Recommended users section */}
        {currentUser ? (
          <section>
            <RecommendedUsers currentUser={currentUser} />
          </section>
        ) : (
          <section className="animate-fade-in">
            <div className="rounded-xl border bg-card p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Get personalized recommendations</h2>
              <p className="text-muted-foreground mb-6">
                Sign up to get matched with people who share your interests and discover activities you'll love
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Log In</Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
