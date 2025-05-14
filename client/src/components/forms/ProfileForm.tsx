import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import InterestTag from "@/components/common/InterestTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";
import { X } from "lucide-react";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema> & {
  interests?: string[];
  wishlist?: string[];
};

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [wishlist, setWishlist] = useState<string[]>(user.wishlist || []);
  const [newInterest, setNewInterest] = useState("");
  const [newWishlistItem, setNewWishlistItem] = useState("");
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || "",
      username: user.username || "",
      email: user.email || "",
      bio: user.bio || "",
      location: user.location || "",
      profileImage: user.profileImage || "",
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  const addInterest = () => {
    const interest = newInterest.trim();
    if (!interest) return;
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
    setNewInterest("");
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const addWishlistItem = () => {
    const item = newWishlistItem.trim();
    if (!item) return;
    if (!wishlist.includes(item)) {
      setWishlist([...wishlist, item]);
    }
    setNewWishlistItem("");
  };

  const removeWishlistItem = (item: string) => {
    setWishlist(wishlist.filter((i) => i !== item));
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const payload = {
        ...data,
        interests,
        wishlist,
      };

      await apiRequest("PUT", "/api/users/me", payload);
      
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 space-y-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.profileImage || undefined} alt={user.displayName} />
                <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem className="w-full mt-4">
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter image URL"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a URL to your profile image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how your name will appear to others
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your unique username for your account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Your city, country" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Where you're based (helps with finding local activities)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      {...field}
                      value={field.value || ""}
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormDescription>
                    <span className={`${form.watch("bio")?.length || 0 > 280 ? "text-destructive" : ""}`}>
                      {(form.watch("bio")?.length || 0)}/300
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Interests</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {interests.map((interest, index) => (
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
                  placeholder="Add an interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <Button type="button" onClick={addInterest}>
                  Add
                </Button>
              </div>
              <FormDescription className="mt-1.5">
                Add your interests to connect with like-minded people
              </FormDescription>
            </div>

            <div>
              <FormLabel>What I Want To Do</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {wishlist.map((item, index) => (
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
                <Button type="button" onClick={addWishlistItem}>
                  Add
                </Button>
              </div>
              <FormDescription className="mt-1.5">
                Add activities you'd like to do
              </FormDescription>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
