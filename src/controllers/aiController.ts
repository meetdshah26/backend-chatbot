import { Request, Response } from "express";
import openAIService from "../services/openaiService";

// In-memory AI status (in production, store in database)
let aiEnabled = true;
let aiSettings = {
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 500,
  autoRespond: true,
};

export const getAIStatus = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        enabled: aiEnabled,
        settings: aiSettings,
      },
    });
  } catch (error) {
    console.error("Error getting AI status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI status",
    });
  }
};

export const toggleAI = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Enabled must be a boolean value",
      });
    }

    aiEnabled = enabled;

    res.json({
      success: true,
      message: `AI auto-response ${enabled ? "enabled" : "disabled"}`,
      data: { enabled: aiEnabled },
    });
  } catch (error) {
    console.error("Error toggling AI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle AI",
    });
  }
};

export const updateSystemPrompt = async (req: Request, res: Response) => {
  try {
    const { systemPrompt } = req.body;

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid system prompt is required",
      });
    }

    openAIService.setSystemPrompt(systemPrompt);

    res.json({
      success: true,
      message: "System prompt updated successfully",
      data: { systemPrompt },
    });
  } catch (error) {
    console.error("Error updating system prompt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update system prompt",
    });
  }
};

export const getAISettings = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: aiSettings,
    });
  } catch (error) {
    console.error("Error getting AI settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI settings",
    });
  }
};

export const getSuggestedResponses = async (req: Request, res: Response) => {
  try {
    const { chatId, userMessage } = req.body;

    if (!chatId || !userMessage) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and user message are required",
      });
    }

    const suggestions = await openAIService.generateSuggestedResponses(
      chatId,
      userMessage
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate suggestions",
    });
  }
};

// Export AI status checker for socket handler
export const isAIEnabled = () => aiEnabled;
export const setAIEnabled = (enabled: boolean) => {
  aiEnabled = enabled;
};
