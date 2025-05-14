import {
  users, activities, activityParticipants, messages,
  interestCategories, userConnections, notifications,
  type User, type InsertUser,
  type Activity, type InsertActivity,
  type ActivityParticipant, type InsertActivityParticipant,
  type Message, type InsertMessage,
  type InterestCategory, type InsertInterestCategory,
  type UserConnection, type InsertUserConnection,
  type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getNearbyUsers(location: string, limit?: number): Promise<User[]>;
  getSuggestedUsers(userId: number, limit?: number): Promise<User[]>;
  
  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getUpcomingActivities(limit?: number): Promise<Activity[]>;
  getNearbyActivities(location: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Activity participants
  getActivityParticipants(activityId: number): Promise<User[]>;
  addActivityParticipant(participant: InsertActivityParticipant): Promise<ActivityParticipant>;
  removeActivityParticipant(activityId: number, userId: number): Promise<boolean>;
  
  // Messages
  getActivityMessages(activityId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Interest categories
  getAllInterestCategories(): Promise<InterestCategory[]>;
  createInterestCategory(category: InsertInterestCategory): Promise<InterestCategory>;
  
  // User connections
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  createUserConnection(connection: InsertUserConnection): Promise<UserConnection>;
  deleteUserConnection(followerId: number, followingId: number): Promise<boolean>;
  
  // Notifications
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private activities: Map<number, Activity>;
  private activityParticipants: Map<number, ActivityParticipant>;
  private messages: Map<number, Message>;
  private interestCategories: Map<number, InterestCategory>;
  private userConnections: Map<number, UserConnection>;
  private notifications: Map<number, Notification>;
  
  private userId: number;
  private activityId: number;
  private participantId: number;
  private messageId: number;
  private categoryId: number;
  private connectionId: number;
  private notificationId: number;

  constructor() {
    this.users = new Map();
    this.activities = new Map();
    this.activityParticipants = new Map();
    this.messages = new Map();
    this.interestCategories = new Map();
    this.userConnections = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.activityId = 1;
    this.participantId = 1;
    this.messageId = 1;
    this.categoryId = 1;
    this.connectionId = 1;
    this.notificationId = 1;
    
    // Initialize with sample interest categories
    this.seedInterestCategories();
  }

  private seedInterestCategories() {
    const categories = [
      { name: "Hiking", icon: "mountain" },
      { name: "Photography", icon: "camera" },
      { name: "Cooking", icon: "utensils" },
      { name: "Music", icon: "music" },
      { name: "Art", icon: "palette" },
      { name: "Sports", icon: "football" },
      { name: "Technology", icon: "laptop-code" },
      { name: "Travel", icon: "plane" },
      { name: "Books", icon: "book" },
      { name: "Movies", icon: "film" },
      { name: "Gaming", icon: "gamepad" },
      { name: "Fitness", icon: "dumbbell" }
    ];
    
    categories.forEach(category => {
      const id = this.categoryId++;
      this.interestCategories.set(id, { 
        id, 
        name: category.name, 
        icon: category.icon 
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      lastActive: createdAt,
      interests: insertUser.interests || [],
      wishlist: insertUser.wishlist || [],
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...userData,
      lastActive: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getNearbyUsers(location: string, limit = 10): Promise<User[]> {
    // In a real app, this would use geolocation, but for the MVP we'll just mock it
    // by matching partial location string
    const matchingUsers = Array.from(this.users.values())
      .filter(user => user.location && user.location.toLowerCase().includes(location.toLowerCase()))
      .slice(0, limit);
    return matchingUsers;
  }
  
  async getSuggestedUsers(userId: number, limit = 10): Promise<User[]> {
    const currentUser = this.users.get(userId);
    if (!currentUser || !currentUser.interests || currentUser.interests.length === 0) {
      return [];
    }
    
    // Find users with similar interests
    const userInterests = new Set(currentUser.interests);
    const allUsers = Array.from(this.users.values()).filter(user => user.id !== userId);
    
    // Score users by number of matching interests
    const scoredUsers = allUsers.map(user => {
      const matchingInterests = (user.interests || []).filter(interest => 
        userInterests.has(interest)
      ).length;
      return { user, score: matchingInterests };
    });
    
    // Sort by score and return top users
    return scoredUsers
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.user);
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.creatorId === userId);
  }
  
  async getUpcomingActivities(limit = 20): Promise<Activity[]> {
    const now = new Date();
    return Array.from(this.activities.values())
      .filter(activity => new Date(activity.dateTime) > now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, limit);
  }
  
  async getNearbyActivities(location: string, limit = 20): Promise<Activity[]> {
    const now = new Date();
    return Array.from(this.activities.values())
      .filter(activity => 
        activity.location.toLowerCase().includes(location.toLowerCase()) &&
        new Date(activity.dateTime) > now
      )
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, limit);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
      categories: insertActivity.categories || [],
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...activityData };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }
  
  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }
  
  // Activity participants
  async getActivityParticipants(activityId: number): Promise<User[]> {
    const participantRecords = Array.from(this.activityParticipants.values())
      .filter(p => p.activityId === activityId);
    
    const participantUsers = participantRecords.map(p => this.users.get(p.userId))
      .filter((user): user is User => user !== undefined);
    
    return participantUsers;
  }
  
  async addActivityParticipant(insertParticipant: InsertActivityParticipant): Promise<ActivityParticipant> {
    const id = this.participantId++;
    const participant: ActivityParticipant = {
      ...insertParticipant,
      id,
      joinedAt: new Date()
    };
    this.activityParticipants.set(id, participant);
    return participant;
  }
  
  async removeActivityParticipant(activityId: number, userId: number): Promise<boolean> {
    const participantRecord = Array.from(this.activityParticipants.values())
      .find(p => p.activityId === activityId && p.userId === userId);
    
    if (!participantRecord) return false;
    return this.activityParticipants.delete(participantRecord.id);
  }
  
  // Messages
  async getActivityMessages(activityId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.activityId === activityId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = {
      ...insertMessage,
      id,
      sentAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
  
  // Interest categories
  async getAllInterestCategories(): Promise<InterestCategory[]> {
    return Array.from(this.interestCategories.values());
  }
  
  async createInterestCategory(insertCategory: InsertInterestCategory): Promise<InterestCategory> {
    const id = this.categoryId++;
    const category: InterestCategory = {
      ...insertCategory,
      id
    };
    this.interestCategories.set(id, category);
    return category;
  }
  
  // User connections
  async getUserFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.userConnections.values())
      .filter(connection => connection.followingId === userId)
      .map(connection => connection.followerId);
    
    const followers = followerIds.map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
    
    return followers;
  }
  
  async getUserFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.userConnections.values())
      .filter(connection => connection.followerId === userId)
      .map(connection => connection.followingId);
    
    const following = followingIds.map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
    
    return following;
  }
  
  async createUserConnection(insertConnection: InsertUserConnection): Promise<UserConnection> {
    const id = this.connectionId++;
    const connection: UserConnection = {
      ...insertConnection,
      id,
      createdAt: new Date()
    };
    this.userConnections.set(id, connection);
    return connection;
  }
  
  async deleteUserConnection(followerId: number, followingId: number): Promise<boolean> {
    const connection = Array.from(this.userConnections.values())
      .find(c => c.followerId === followerId && c.followingId === followingId);
    
    if (!connection) return false;
    return this.userConnections.delete(connection.id);
  }
  
  // Notifications
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
}

export const storage = new MemStorage();
