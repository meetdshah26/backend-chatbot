import { Request, Response } from "express";
import jwt from "jsonwebtoken";
// import { User, Chat, Message } from "../models";
import User from "../models/User";
import Chat from "../models/Chat";
import Message from "../models/Message";
import { Op } from "sequelize";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Simple hardcoded admin credentials (in production, use hashed passwords)
const ADMIN_CREDENTIALS = {
  // username: process.env.ADMIN_USERNAME || "admin",
  username: process.env.ADMIN_USERNAME || "meetdshah98@gmail.com",
  password: process.env.ADMIN_PASSWORD || "123",
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        success: true,
        token,
        admin: { username, role: "admin" },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const getAllChats = async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const chats = await Chat.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "sessionId", "ipAddress", "isActive", "lastSeen"],
        },
        {
          model: Message,
          as: "messages",
          limit: 1,
          order: [["timestamp", "DESC"]],
          attributes: ["id", "message", "sender", "timestamp"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const totalCount = await Chat.count({ where });

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
};

export const getChatById = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findByPk(chatId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "sessionId",
            "ipAddress",
            "userAgent",
            "isActive",
            "lastSeen",
            "createdAt",
          ],
        },
      ],
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
    });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const messages = await Message.findAll({
      where: { chatId },
      order: [["timestamp", "ASC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const totalCount = await Message.count({ where: { chatId } });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

export const closeChat = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findByPk(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    await chat.update({ status: "closed" });

    res.json({
      success: true,
      message: "Chat closed successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error closing chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close chat",
    });
  }
};

