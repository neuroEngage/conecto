import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertActivitySchema, 
  insertActivityParticipantSchema,
  insertMessageSchema,
  insertUserConnectionSchema,
  insertNotificationSchema
} from "@shared/schema";
import session from "express-session";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Setting up session middleware
const sessionParser = session({
  secret: process.env.SESSION_SECRET || "meetup-adventures-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // true in production (Render)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Helper function to convert ZodErrors to readable messages
function formatZodError(error: ZodError) {
  const validationError = fromZodError(error);
  return validationError.message;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Use session middleware
  app.use(sessionParser);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time messaging
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // Store active WebSocket connections
  const clients = new Map<number, WebSocket>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    const userId = Number(req.url?.split('=')[1]);
    
    if (userId && !isNaN(userId)) {
      clients.set(userId, ws);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          if (data.type === 'activity-chat') {
            const validatedMessage = insertMessageSchema.parse({
              activityId: data.activityId,
              senderId: data.senderId,
              content: data.content
            });
            
            // Save the message to storage
            const savedMessage = await storage.createMessage(validatedMessage);
            
            // Get activity participants to broadcast message
            const participants = await storage.getActivityParticipants(data.activityId);
            
            // Broadcast to all participants who are connected
            participants.forEach(participant => {
              const client = clients.get(participant.id);
              if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'activity-message',
                  message: savedMessage
                }));
              }
            });
          }
        } catch (error) {
          console.error('WebSocket message handling error:', error);
          
          if (error instanceof ZodError) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: formatZodError(error)
            }));
          } else {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to process message' 
            }));
          }
        }
      });
      
      ws.on('close', () => {
        clients.delete(userId);
      });
    } else {
      ws.close();
    }
  });
  
  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      // Set user in session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to log in' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Failed to log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // User Routes
  app.get('/api/users/me', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  app.put('/api/users/me', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const updatedData = req.body;
      
      // Remove any fields that shouldn't be updated directly
      const { id, password, createdAt, ...safeUpdateData } = updatedData;
      
      const updatedUser = await storage.updateUser(userId, safeUpdateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user data' });
    }
  });
  
  app.get('/api/users/suggested', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const suggestions = await storage.getSuggestedUsers(userId, limit);
      
      // Remove passwords from response
      const safeUsers = suggestions.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get suggested users' });
    }
  });
  
  app.get('/api/users/nearby', isAuthenticated, async (req, res) => {
    try {
      const location = req.query.location as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!location) {
        return res.status(400).json({ message: 'Location is required' });
      }
      
      const nearbyUsers = await storage.getNearbyUsers(location, limit);
      
      // Remove passwords from response
      const safeUsers = nearbyUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get nearby users' });
    }
  });
  
  // Activity Routes
  app.get('/api/activities', async (req, res) => {
    try {
      const upcoming = await storage.getUpcomingActivities();
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get activities' });
    }
  });
  
  app.get('/api/activities/nearby', async (req, res) => {
    try {
      const location = req.query.location as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      if (!location) {
        return res.status(400).json({ message: 'Location is required' });
      }
      
      const nearbyActivities = await storage.getNearbyActivities(location, limit);
      res.json(nearbyActivities);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get nearby activities' });
    }
  });
  
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get activity' });
    }
  });
  
  app.post('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const activityData = insertActivitySchema.parse({
        ...req.body,
        creatorId: userId
      });
      
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to create activity' });
    }
  });
  
  app.put('/api/activities/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      // Check if activity exists and user is the creator
      const existingActivity = await storage.getActivity(activityId);
      
      if (!existingActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      if (existingActivity.creatorId !== userId) {
        return res.status(403).json({ message: 'You can only update your own activities' });
      }
      
      // Remove fields that shouldn't be updated directly
      const { id, creatorId, createdAt, ...updateData } = req.body;
      
      const updatedActivity = await storage.updateActivity(activityId, updateData);
      res.json(updatedActivity);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update activity' });
    }
  });
  
  app.delete('/api/activities/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      // Check if activity exists and user is the creator
      const existingActivity = await storage.getActivity(activityId);
      
      if (!existingActivity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      if (existingActivity.creatorId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own activities' });
      }
      
      const deleted = await storage.deleteActivity(activityId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete activity' });
      }
      
      res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete activity' });
    }
  });
  
  // Activity Participants
  app.get('/api/activities/:id/participants', async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const participants = await storage.getActivityParticipants(activityId);
      
      // Remove passwords from response
      const safeParticipants = participants.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeParticipants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get participants' });
    }
  });
  
  app.post('/api/activities/:id/join', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      // Check if activity exists
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      // Add participant
      const participantData = insertActivityParticipantSchema.parse({
        activityId,
        userId,
        status: 'joined'
      });
      
      const participant = await storage.addActivityParticipant(participantData);
      
      // Create notification for activity creator
      if (activity.creatorId !== userId) {
        const user = await storage.getUser(userId);
        
        if (user) {
          const notificationData = insertNotificationSchema.parse({
            userId: activity.creatorId,
            type: 'activity-join',
            content: `${user.displayName} joined your activity "${activity.title}"`,
            relatedId: activityId
          });
          
          await storage.createNotification(notificationData);
        }
      }
      
      res.status(201).json(participant);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to join activity' });
    }
  });
  
  app.delete('/api/activities/:id/leave', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const removed = await storage.removeActivityParticipant(activityId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: 'You are not a participant in this activity' });
      }
      
      res.json({ message: 'Left activity successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to leave activity' });
    }
  });
  
  // Messages
  app.get('/api/activities/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: 'Invalid activity ID' });
      }
      
      const messages = await storage.getActivityMessages(activityId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });
  
  // Interest Categories
  app.get('/api/interests', async (req, res) => {
    try {
      const categories = await storage.getAllInterestCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get interest categories' });
    }
  });
  
  // User Connections
  app.get('/api/users/:id/followers', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const followers = await storage.getUserFollowers(userId);
      
      // Remove passwords from response
      const safeFollowers = followers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeFollowers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get followers' });
    }
  });
  
  app.get('/api/users/:id/following', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const following = await storage.getUserFollowing(userId);
      
      // Remove passwords from response
      const safeFollowing = following.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeFollowing);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get following' });
    }
  });
  
  app.post('/api/users/:id/follow', isAuthenticated, async (req, res) => {
    try {
      const followerId = req.session.userId;
      const followingId = parseInt(req.params.id);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Can't follow yourself
      if (followerId === followingId) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
      }
      
      // Check if user exists
      const userToFollow = await storage.getUser(followingId);
      
      if (!userToFollow) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create connection
      const connectionData = insertUserConnectionSchema.parse({
        followerId,
        followingId
      });
      
      const connection = await storage.createUserConnection(connectionData);
      
      // Create notification
      const follower = await storage.getUser(followerId);
      
      if (follower) {
        const notificationData = insertNotificationSchema.parse({
          userId: followingId,
          type: 'new-follower',
          content: `${follower.displayName} started following you`,
          relatedId: followerId
        });
        
        await storage.createNotification(notificationData);
      }
      
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to follow user' });
    }
  });
  
  app.delete('/api/users/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
      const followerId = req.session.userId;
      const followingId = parseInt(req.params.id);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const removed = await storage.deleteUserConnection(followerId, followingId);
      
      if (!removed) {
        return res.status(404).json({ message: 'You are not following this user' });
      }
      
      res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unfollow user' });
    }
  });
  
  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });
  
  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  return httpServer;
}
