import { Request, Response } from "express";
import User from "../models/User";
import Chat from "../models/Chat";
import Message from "../models/Message";

export const initChat = async (req: Request, res: Response) => {
  try {
    const { sessionId, ipAddress, userAgent } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

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

    res.json({
      success: true,
      data: {
        userId: user.id,
        chatId: chat.id,
        sessionId: user.sessionId,
      },
    });
  } catch (error) {
    console.error("Error initializing chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize chat",
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, message, sender = "user" } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and message are required",
      });
    }

    const chat = await Chat.findByPk(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const newMessage = await Message.create({
      chatId,
      sender,
      message,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: {
        id: newMessage.id,
        chatId: newMessage.chatId,
        sender: newMessage.sender,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findOne({ where: { sessionId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const chat = await Chat.findOne({
      where: { userId: user.id, status: "active" },
      include: [
        {
          model: Message,
          as: "messages",
          order: [["timestamp", "ASC"]],
        },
      ],
    });

    if (!chat) {
      return res.json({
        success: true,
        data: {
          chatId: null,
          messages: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        chatId: chat.id,
        messages: chat.get("messages"),
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};
