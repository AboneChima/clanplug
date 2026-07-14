'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
  markAsRead: (chatId: string, messageId?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinChat: () => {},
  leaveChat: () => {},
  sendTyping: () => {},
  markAsRead: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No token found, skipping Socket.IO connection');
      return;
    }

    // Initialize Socket.IO connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('👋 Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.IO');
      socketInstance.disconnect();
    };
  }, []);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:join', chatId);
      console.log(`📥 Joined chat: ${chatId}`);
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:leave', chatId);
      console.log(`📤 Left chat: ${chatId}`);
    }
  }, [socket, isConnected]);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('chat:typing', { chatId, isTyping });
    }
  }, [socket, isConnected]);

  const markAsRead = useCallback((chatId: string, messageId?: string) => {
    if (socket && isConnected) {
      socket.emit('chat:read', { chatId, messageId });
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinChat,
      leaveChat,
      sendTyping,
      markAsRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
}
