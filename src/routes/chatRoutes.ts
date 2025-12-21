import express from "express";
import {
  initChat,
  sendMessage,
  getChatHistory,
} from "../controllers/chatController";

const router = express.Router();

router.post("/init", initChat);
router.post("/message", sendMessage);
router.get("/history/:sessionId", getChatHistory);

export default router;
