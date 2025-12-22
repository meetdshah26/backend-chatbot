import { Server, Socket } from "socket.io";
import Chat from "../models/Chat";
import User from "../models/User";
import Message from "../models/Message";

interface UserSocket extends Socket {
  sessionId?: string;
  userId?: number;
  chatId?: number;
}

const activeUsers = new Map<string, string>(); // sessionId -> socketId
const typingUsers = new Map<string, boolean>(); // sessionId -> isTyping

export const setupSocketIO = (io: Server) => {
  io.on("connection", async (socket: UserSocket) => {

    // Handle user initialization
    socket.on(
      "init",
      async (data: {
        sessionId: string;
        ipAddress?: string;
        userAgent?: string;
      }) => {
        try {
          const { sessionId, ipAddress, userAgent } = data;
          socket.sessionId = sessionId;

          // Find or create user
          let user = await User.findOne({ where: { sessionId } });

          if (!user) {
            user = await User.create({
              sessionId,
              ipAddress,
              userAgent,
              isActive: true,
              lastSeen: new Date(),
            });
          } else {
            await user.update({
              isActive: true,
              lastSeen: new Date(),
              ipAddress,
              userAgent,
            });
          }

          socket.userId = user.id;
          activeUsers.set(sessionId, socket.id);

          // Find or create active chat
          let chat = await Chat.findOne({
            where: { userId: user.id, status: "active" },
          });

          if (!chat) {
            chat = await Chat.create({
              userId: user.id,
              status: "active",
            });
          }

          socket.chatId = chat.id;
          socket.join(`chat_${chat.id}`);

          // Send chat history
          const messages = await Message.findAll({
            where: { chatId: chat.id },
            order: [["timestamp", "ASC"]],
          });

          socket.emit("chatHistory", {
            chatId: chat.id,
            messages: messages.map((m) => ({
              id: m.id,
              text: m.message,
              sender: m.sender,
              timestamp: m.timestamp,
            })),
          });

          // Notify admin dashboard
          io.emit("userConnected", {
            userId: user.id,
            sessionId: user.sessionId,
            chatId: chat.id,
            timestamp: new Date(),
          });

        } catch (error) {
          console.error("Error initializing user:", error);
          socket.emit("error", { message: "Failed to initialize chat" });
        }
      }
    );

    // Handle new message from user
    socket.on("sendMessage", async (data: { message: string }) => {
      try {
        if (!socket.chatId || !socket.userId) {
          socket.emit("error", { message: "Chat not initialized" });
          return;
        }

        const message = await Message.create({
          chatId: socket.chatId,
          sender: "user",
          message: data.message,
          timestamp: new Date(),
        });

        const messageData = {
          id: message.id,
          text: message.message,
          sender: message.sender,
          timestamp: message.timestamp,
          chatId: socket.chatId,
        };

        // Send to user
        socket.emit("newMessage", messageData);

        // Send to admin dashboard
        io.emit("adminNewMessage", {
          ...messageData,
          userId: socket.userId,
          sessionId: socket.sessionId,
        });

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message from admin
    socket.on(
      "adminSendMessage",
      async (data: { chatId: number; message: string }) => {
        try {
          const message = await Message.create({
            chatId: data.chatId,
            sender: "admin",
            message: data.message,
            timestamp: new Date(),
          });

          const messageData = {
            id: message.id,
            text: message.message,
            sender: message.sender,
            timestamp: message.timestamp,
          };

          // Send to specific chat room (user)
          io.to(`chat_${data.chatId}`).emit("newMessage", messageData);

          // Confirm to admin
          socket.emit("messageSent", messageData);

        } catch (error) {
          console.error("Error sending admin message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("userTyping", ({ chatId, isTyping }) => {
      if (!chatId) return;

      // send typing ONLY to admin or other participant
      socket.to(`chat_${chatId}`).emit("typingStatus", {
        isTyping,
      });
    });

    socket.on("adminTyping", (data: { chatId: number; isTyping: boolean }) => {

      io.to(`chat_${data.chatId}`).emit("adminTypingStatus", {
        isTyping: data.isTyping,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {

      if (socket.sessionId) {
        activeUsers.delete(socket.sessionId);
        typingUsers.delete(socket.sessionId);

        if (socket.userId) {
          await User.update(
            { isActive: false, lastSeen: new Date() },
            { where: { id: socket.userId } }
          );
        }

        io.emit("userDisconnected", {
          sessionId: socket.sessionId,
          userId: socket.userId,
          chatId: socket.chatId,
        });
      }
    });
  });
};

export { activeUsers, typingUsers };
