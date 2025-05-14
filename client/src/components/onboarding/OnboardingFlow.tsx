import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InterestTag from "@/components/common/InterestTag";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { X } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
  user: User;
}

export default function OnboardingFlow({ onComplete, user }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<Partial<User>>({
    displayName: user.displayName,
    bio: user.bio || "",
    location: user.location || "",
    interests: user.interests || [],
    wishlist: user.wishlist || [],
  });
  const [newInterest, setNewInterest] = useState("");
  const [newWishlistItem, setNewWishlistItem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get interest categories for suggestions
  const { data: interestCategories } = useQuery({
    queryKey: ['/api/interests'],
  });
  
  const handleUpdateUserData = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };
  
  const addInterest = () => {
    const interest = newInterest.trim();
    if (!interest) return;
    if (!userData.interests?.includes(interest)) {
      handleUpdateUserData('interests', [...(userData.interests || []), interest]);
    }
    setNewInterest("");
  };
  
  const removeInterest = (interest: string) => {
    handleUpdateUserData(
      'interests',
      userData.interests?.filter(i => i !== interest)
    );
  };
  
  const addWishlistItem = () => {
    const item = newWishlistItem.trim();
    if (!item) return;
    if (!userData.wishlist?.includes(item)) {
      handleUpdateUserData('wishlist', [...(userData.wishlist || []), item]);
    }
    setNewWishlistItem("");
  };
  
  const removeWishlistItem = (item: string) => {
    handleUpdateUserData(
      'wishlist',
      userData.wishlist?.filter(i => i !== item)
    );
  };
  
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("PUT", "/api/users/me", userData);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      toast({
        title: "Profile completed",
        description: "Your profile has been updated successfully",
      });
      
      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome to MeetupMatch!
          </CardTitle>
          <CardDescription className="text-center">
            Let's set up your profile to help you connect with others
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-lg font-medium">Tell us about yourself</h3>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Display Name</label>
                <Input
                  value={userData.displayName || ""}
                  onChange={(e) => handleUpdateUserData('displayName', e.target.value)}
                  placeholder="What should we call you?"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Location</label>
                <Input
                  value={userData.location || ""}
                  onChange={(e) => handleUpdateUserData('location', e.target.value)}
                  placeholder="Where are you based? (City, Country)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps us find activities near you
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Bio</label>
                <Textarea
                  value={userData.bio || ""}
                  onChange={(e) => handleUpdateUserData('bio', e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(userData.bio?.length || 0)}/300 characters
                </p>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-lg font-medium">What are your interests?</h3>
              <p className="text-sm text-muted-foreground">
                Select or add your interests to find like-minded people
              </p>
              
              {interestCategories && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Suggested interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {interestCategories.map((category: any) => (
                      <InterestTag
                        key={category.id}
                        text={category.name}
                        selected={userData.interests?.includes(category.name)}
                        onClick={() => {
                          if (userData.interests?.includes(category.name)) {
                            removeInterest(category.name);
                          } else {
                            handleUpdateUserData('interests', [...(userData.interests || []), category.name]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your interests:</label>
                <div className="flex flex-wrap gap-2 min-h-[36px] mb-3">
                  {userData.interests?.map((interest, index) => (
                    <div key={index} className="flex items-center bg-primary/10 text-primary rounded-full pl-3 pr-2 py-1">
                      <span className="text-sm">{interest}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
                        onClick={() => removeInterest(interest)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a custom interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterest();
                      }
                    }}
                  />
                  <Button type="button" onClick={addInterest}>Add</Button>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-lg font-medium">What would you like to do?</h3>
              <p className="text-sm text-muted-foreground">
                Add activities you're interested in doing with others
              </p>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your activity wishlist:</label>
                <div className="flex flex-wrap gap-2 min-h-[36px] mb-3">
                  {userData.wishlist?.map((item, index) => (
                    <div key={index} className="flex items-center bg-accent/10 text-accent-foreground rounded-full pl-3 pr-2 py-1">
                      <span className="text-sm">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1"
                        onClick={() => removeWishlistItem(item)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a wishlist item"
                    value={newWishlistItem}
                    onChange={(e) => setNewWishlistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addWishlistItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={addWishlistItem}>Add</Button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Need inspiration? Try these:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Hiking trip", "Photography meetup", "Group dinner", "Movie night", "Board games", "Cycling tour"].map((item) => (
                      <Button
                        key={item}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!userData.wishlist?.includes(item)) {
                            handleUpdateUserData('wishlist', [...(userData.wishlist || []), item]);
                          }
                        }}
                        className="rounded-full"
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-lg font-medium">You're all set!</h3>
              <p className="text-sm text-muted-foreground">
                Your profile is ready. You can now start connecting with others and joining activities.
              </p>
              
              <div className="border rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-sm font-medium">Display Name: </span>
                  <span className="text-sm">{userData.displayName}</span>
                </div>
                {userData.location && (
                  <div>
                    <span className="text-sm font-medium">Location: </span>
                    <span className="text-sm">{userData.location}</span>
                  </div>
                )}
                {userData.interests && userData.interests.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Interests: </span>
                    <span className="text-sm">{userData.interests.join(", ")}</span>
                  </div>
                )}
                {userData.wishlist && userData.wishlist.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Want to do: </span>
                    <span className="text-sm">{userData.wishlist.join(", ")}</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm">
                You can always edit your profile later if you need to make changes.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 4 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Get Started"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
