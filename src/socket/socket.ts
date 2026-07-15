import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server;

export const initializeSocketIO = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      
      console.log(`✅ Socket authenticated: User ${decoded.userId}`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userId} (${socket.id})`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join chat rooms
    socket.on('chat:join', async (chatId: string) => {
      try {
        // Verify user is participant
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            chatId,
            userId: socket.userId,
            isActive: true,
          },
        });

        if (participant) {
          socket.join(`chat:${chatId}`);
          console.log(`✅ User ${socket.userId} joined chat ${chatId}`);
          
          // Notify others in the room
          socket.to(`chat:${chatId}`).emit('user:joined', {
            userId: socket.userId,
            chatId,
          });
        } else {
          console.log(`❌ User ${socket.userId} not authorized for chat ${chatId}`);
        }
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Leave chat room
    socket.on('chat:leave', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
    });

    // Join community room
    socket.on('community:join', async (communityId: string) => {
      try {
        // Verify user is a member
        const member = await prisma.chatParticipant.findFirst({
          where: {
            chatId: communityId,
            userId: socket.userId,
            isActive: true,
          },
        });

        if (member) {
          socket.join(`community:${communityId}`);
          console.log(`✅ User ${socket.userId} joined community ${communityId}`);
        } else {
          console.log(`❌ User ${socket.userId} not a member of community ${communityId}`);
        }
      } catch (error) {
        console.error('Error joining community:', error);
      }
    });

    // Leave community room
    socket.on('community:leave', (communityId: string) => {
      socket.leave(`community:${communityId}`);
      console.log(`👋 User ${socket.userId} left community ${communityId}`);
    });

    // Community typing indicator
    socket.on('community:typing', ({ communityId, isTyping }: { communityId: string; isTyping: boolean }) => {
      socket.to(`community:${communityId}`).emit('user:typing', {
        userId: socket.userId,
        communityId,
        isTyping,
      });
    });

    // Typing indicator
    socket.on('chat:typing', async ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${chatId}`).emit('user:typing', {
        userId: socket.userId,
        chatId,
        isTyping,
      });
    });

    // Mark messages as read
    socket.on('chat:read', async ({ chatId, messageId }: { chatId: string; messageId?: string }) => {
      try {
        await prisma.chatParticipant.update({
          where: {
            chatId_userId: {
              chatId,
              userId: socket.userId!,
            },
          },
          data: {
            lastReadAt: new Date(),
          },
        });

        socket.to(`chat:${chatId}`).emit('messages:read', {
          userId: socket.userId,
          chatId,
          messageId,
        });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`👋 User disconnected: ${socket.userId} (${socket.id})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper functions for emitting events
export const emitToChat = (chatId: string, event: string, data: any) => {
  if (io) {
    io.to(`chat:${chatId}`).emit(event, data);
  }
};

export const emitToCommunity = (communityId: string, event: string, data: any) => {
  if (io) {
    io.to(`community:${communityId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
