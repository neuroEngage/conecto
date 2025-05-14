import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Navbar from "@/components/layout/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Activity from "@/pages/activity";
import CreateActivity from "@/pages/create-activity";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import Chat from "@/pages/chat";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if user is authenticated
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    onError: () => {
      // Silently fail - user is not logged in
    }
  });
  
  useEffect(() => {
    // Show onboarding for new users (after they register)
    if (currentUser && localStorage.getItem('onboarding_completed') !== 'true') {
      setShowOnboarding(true);
    }
  }, [currentUser]);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <TooltipProvider>
      <Toaster />
      {showOnboarding && currentUser ? (
        <OnboardingFlow onComplete={completeOnboarding} user={currentUser} />
      ) : (
        <>
          <Navbar user={currentUser} isLoading={isLoading} />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/explore" component={Explore} />
            <Route path="/activity/:id">
              {params => <Activity id={parseInt(params.id)} />}
            </Route>
            <Route path="/create-activity" component={CreateActivity} />
            <Route path="/profile/:id">
              {params => <Profile id={parseInt(params.id)} />}
            </Route>
            <Route path="/profile">
              {() => currentUser ? <Profile id={currentUser.id} /> : <Login />}
            </Route>
            <Route path="/edit-profile" component={EditProfile} />
            <Route path="/chat/:activityId">
              {params => <Chat activityId={parseInt(params.activityId)} />}
            </Route>
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route component={NotFound} />
          </Switch>
        </>
      )}
    </TooltipProvider>
  );
}

export default App;
