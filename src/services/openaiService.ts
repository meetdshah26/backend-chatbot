import OpenAI from "openai";
import Message  from "../models/Message";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIService {
  private systemPrompt: string;
  private conversationHistory: Map<number, ChatMessage[]>;

  constructor() {
    this.systemPrompt =
      process.env.OPENAI_SYSTEM_PROMPT ||
      `You are a helpful customer support assistant. You are friendly, professional, and concise.
      Your goal is to help users with their questions and provide accurate information.
      Keep your responses clear and to the point. If you don't know something, admit it politely.`;

    this.conversationHistory = new Map();
  }

  /**
   * Generate AI response for user message
   */
  async generateResponse(
    chatId: number,
    userMessage: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    try {
      // Get or initialize conversation history
      let history = this.conversationHistory.get(chatId);

      if (!history) {
        // Load conversation history from database
        history = await this.loadConversationHistory(chatId);
        this.conversationHistory.set(chatId, history);
      }

      // Add user message to history
      history.push({
        role: "user",
        content: userMessage,
      });

      // Keep only last 20 messages to manage token limits
      if (history.length > 20) {
        history = history.slice(-20);
        this.conversationHistory.set(chatId, history);
      }

      // Prepare messages for OpenAI
      const messages: ChatMessage[] = [
        { role: "system", content: this.systemPrompt },
        ...history,
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: options?.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const aiResponse =
        completion.choices[0]?.message?.content ||
        "I apologize, but I'm having trouble generating a response. Please try again.";

      // Add AI response to history
      history.push({
        role: "assistant",
        content: aiResponse,
      });

      this.conversationHistory.set(chatId, history);

      return aiResponse;
    } catch (error) {
      console.error("OpenAI API Error:", error);

      // Fallback response
      if (error instanceof Error && error.message.includes("rate_limit")) {
        return "I'm experiencing high traffic right now. Please try again in a moment.";
      }

      return "I apologize, but I'm having trouble processing your request. An admin will assist you shortly.";
    }
  }

  /**
   * Load conversation history from database
   */
  private async loadConversationHistory(
    chatId: number
  ): Promise<ChatMessage[]> {
    try {
      const messages = await Message.findAll({
        where: { chatId },
        order: [["timestamp", "ASC"]],
        limit: 20,
      });

      return messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.message,
      }));
    } catch (error) {
      console.error("Error loading conversation history:", error);
      return [];
    }
  }

}

// Create singleton instance
export const openAIService = new OpenAIService();

// Export for use in controllers
export default openAIService;
