import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertActivitySchema, type Activity } from "@shared/schema";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

const activityFormSchema = insertActivitySchema.extend({
  dateTime: z.date({
    required_error: "A date and time is required",
  }),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

interface ActivityFormProps {
  activity?: Activity;
}

export default function ActivityForm({ activity }: ActivityFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<string[]>(activity?.categories || []);
  const [newCategory, setNewCategory] = useState("");
  
  const DEFAULT_VALUES: Partial<ActivityFormValues> = {
    title: "",
    description: "",
    location: "",
    dateTime: addHours(new Date(), 1),
    maxParticipants: undefined,
    categories: [],
    image: "",
  };
  
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          ...activity,
          dateTime: new Date(activity.dateTime),
        }
      : DEFAULT_VALUES,
  });
  
  const isSubmitting = form.formState.isSubmitting;

  const addCategory = () => {
    const category = newCategory.trim();
    if (!category) return;
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
    setNewCategory("");
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const onSubmit = async (data: ActivityFormValues) => {
    try {
      const payload = {
        ...data,
        categories,
      };

      if (activity) {
        await apiRequest("PUT", `/api/activities/${activity.id}`, payload);
        toast({
          title: "Activity updated",
          description: "Your activity has been updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/activities", payload);
        toast({
          title: "Activity created",
          description: "Your activity has been created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      navigate("/");
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error saving activity",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for your activity" {...field} />
              </FormControl>
              <FormDescription>
                Choose a descriptive title for your activity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your activity, what participants should expect, what to bring, etc."
                  {...field}
                  className="min-h-[150px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Where is the activity taking place?" {...field} />
                </FormControl>
                <FormDescription>
                  Provide the address or a description of the location
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Set a limit or leave empty for unlimited participants
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dateTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          const hours = field.value.getHours();
                          const minutes = field.value.getMinutes();
                          const newDate = setMinutes(setHours(date, hours), minutes);
                          field.onChange(newDate);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex space-x-2">
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Time</FormLabel>
                  <div className="flex space-x-2">
                    <Select
                      value={field.value.getHours().toString()}
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        const newDate = setHours(field.value, hours);
                        field.onChange(newDate);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={field.value.getMinutes().toString()}
                      onValueChange={(value) => {
                        const minutes = parseInt(value);
                        const newDate = setMinutes(field.value, minutes);
                        field.onChange(newDate);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTES.map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter an image URL (optional)" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Add an image to represent your activity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Categories</FormLabel>
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center bg-secondary/10 text-secondary-foreground rounded-full pl-3 pr-2 py-1">
                <span className="text-sm">{category}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1"
                  onClick={() => removeCategory(category)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <Button type="button" onClick={addCategory}>
              Add
            </Button>
          </div>
          <FormDescription className="mt-1.5">
            Add categories to help people find your activity
          </FormDescription>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : activity ? "Update Activity" : "Create Activity"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
