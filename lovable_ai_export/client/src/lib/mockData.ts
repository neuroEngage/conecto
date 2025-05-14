// This file contains AI-powered suggestion algorithms that generate match recommendations
// For the MVP, we'll use this to generate matches and recommendations
// Later these would be replaced with real AI/ML models

import { User, Activity } from "@shared/schema";

interface MatchScore {
  userId: number;
  score: number;
}

export function calculateUserSimilarity(currentUser: User, otherUsers: User[]): MatchScore[] {
  if (!currentUser.interests || currentUser.interests.length === 0) {
    // If no interests, return random scores
    return otherUsers.map(user => ({
      userId: user.id,
      score: Math.floor(Math.random() * 100) // Random score between 0-100
    }));
  }

  const currentUserInterests = new Set(currentUser.interests);
  
  return otherUsers
    .filter(user => user.id !== currentUser.id) // Exclude current user
    .map(user => {
      let score = 0;
      
      // Interest similarity
      if (user.interests && user.interests.length > 0) {
        const otherUserInterests = new Set(user.interests);
        
        // Calculate intersection
        const sharedInterests = new Set(
          [...currentUserInterests].filter(x => otherUserInterests.has(x))
        );
        
        // Calculate similarity score based on shared interests
        if (sharedInterests.size > 0) {
          // Score is percentage of shared interests
          const maxInterests = Math.max(currentUserInterests.size, otherUserInterests.size);
          score += (sharedInterests.size / maxInterests) * 70; // Interest match is 70% of score
        }
      }
      
      // Location similarity
      if (currentUser.location && user.location) {
        // Simplistic location matching - check if locations contain the same city/region
        const currentUserLocationLower = currentUser.location.toLowerCase();
        const otherUserLocationLower = user.location.toLowerCase();
        
        // Check if locations share words
        const currentUserWords = currentUserLocationLower.split(/[,\s]+/);
        const otherUserWords = otherUserLocationLower.split(/[,\s]+/);
        
        const sharedWords = currentUserWords.filter(word => 
          word.length > 2 && otherUserWords.includes(word)
        );
        
        if (sharedWords.length > 0) {
          score += 30; // Location match is 30% of score
        }
      }
      
      // Add some randomness to make it more interesting (±10%)
      const randomFactor = 0.9 + (Math.random() * 0.2);
      score = Math.min(100, Math.round(score * randomFactor));
      
      return {
        userId: user.id,
        score
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending
}

export function suggestActivities(user: User, allActivities: Activity[]): Activity[] {
  if (!user.interests || user.interests.length === 0) {
    // If no interests, just return the activities sorted by date
    return [...allActivities].sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }

  const userInterests = new Set(user.interests);
  
  // Score activities based on interest match and proximity
  const scoredActivities = allActivities.map(activity => {
    let score = 0;
    
    // Match activity categories with user interests
    if (activity.categories && activity.categories.length > 0) {
      const matchingInterests = activity.categories.filter(category => 
        userInterests.has(category)
      );
      
      if (matchingInterests.length > 0) {
        score += (matchingInterests.length / activity.categories.length) * 70;
      }
    }
    
    // Location matching
    if (user.location && activity.location) {
      // Simple location matching
      const userLocationLower = user.location.toLowerCase();
      const activityLocationLower = activity.location.toLowerCase();
      
      const userWords = userLocationLower.split(/[,\s]+/);
      const activityWords = activityLocationLower.split(/[,\s]+/);
      
      const sharedWords = userWords.filter(word => 
        word.length > 2 && activityWords.includes(word)
      );
      
      if (sharedWords.length > 0) {
        score += 30;
      }
    }
    
    // Add some randomness (±10%)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    score = Math.min(100, Math.round(score * randomFactor));
    
    return {
      activity,
      score
    };
  });
  
  // Sort by score and return just the activities
  return scoredActivities
    .sort((a, b) => b.score - a.score)
    .map(item => item.activity);
}
