import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  location: text("location"),
  interests: text("interests").array(),
  wishlist: text("wishlist").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  privacySettings: jsonb("privacy_settings")
});

// Activities/Events table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creatorId: integer("creator_id").notNull(),
  location: text("location").notNull(),
  dateTime: timestamp("date_time").notNull(),
  maxParticipants: integer("max_participants"),
  categories: text("categories").array(),
  image: text("image"),
  status: text("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity participants
export const activityParticipants = pgTable("activity_participants", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("joined"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Interest categories
export const interestCategories = pgTable("interest_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon")
});

// User connections (followers/following)
export const userConnections = pgTable("user_connections", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  relatedId: integer("related_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for data insertion
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, lastActive: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
  });

export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    dateTime: z.coerce.date(),
    maxParticipants: z.number().optional(),
    categories: z.array(z.string())
  });

export const insertActivityParticipantSchema = createInsertSchema(activityParticipants)
  .omit({ id: true, joinedAt: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, sentAt: true });

export const insertInterestCategorySchema = createInsertSchema(interestCategories)
  .omit({ id: true });

export const insertUserConnectionSchema = createInsertSchema(userConnections)
  .omit({ id: true, createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true, isRead: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ActivityParticipant = typeof activityParticipants.$inferSelect;
export type InsertActivityParticipant = z.infer<typeof insertActivityParticipantSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type InterestCategory = typeof interestCategories.$inferSelect;
export type InsertInterestCategory = z.infer<typeof insertInterestCategorySchema>;

export type UserConnection = typeof userConnections.$inferSelect;
export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
