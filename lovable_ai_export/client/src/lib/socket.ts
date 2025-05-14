import { useState, useEffect, useRef } from "react";

export function createWebSocket(userId?: number) {
  if (!userId) return null;
  
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    return new WebSocket(wsUrl);
  } catch (error) {
    console.error("Error creating WebSocket:", error);
    return null;
  }
}

// Custom hook for WebSocket connection
export function useSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Check for user ID in session/localStorage
    const userDataStr = sessionStorage.getItem('currentUser');
    let userId: number | undefined;
    
    try {
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = userData.id;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    
    if (!userId) {
      // Try to get user ID from the /api/users/me response
      fetch('/api/users/me', { credentials: 'include' })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authenticated');
        })
        .then(userData => {
          if (userData && userData.id) {
            // Initialize WebSocket with user ID
            const newSocket = createWebSocket(userData.id);
            if (newSocket) {
              socketRef.current = newSocket;
              setSocket(newSocket);
              
              // Store user data for future use
              sessionStorage.setItem('currentUser', JSON.stringify(userData));
            }
          }
        })
        .catch(() => {
          // Not authenticated, no WebSocket needed
        });
    } else {
      // Initialize WebSocket with existing user ID
      const newSocket = createWebSocket(userId);
      if (newSocket) {
        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    }
    
    // Clean up function
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  return socket;
}
