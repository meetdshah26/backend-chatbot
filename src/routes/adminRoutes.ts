import express from "express";
// import { adminAuth } from "../middleware/auth";
import {
  login,
  getAllChats,
  getChatById,
  getChatMessages,
  closeChat,
} from "../controllers/adminController";

const router = express.Router();

// router.post("/login", login);
// router.get("/chats", adminAuth, getAllChats);
// router.get("/chats/:chatId", adminAuth, getChatById);
// router.get("/chats/:chatId/messages", adminAuth, getChatMessages);
// router.put("/chats/:chatId/close", adminAuth, closeChat);

router.post("/login", login);
router.get("/chats",  getAllChats);
router.get("/chats/:chatId",  getChatById);
router.get("/chats/:chatId/messages",  getChatMessages);
router.put("/chats/:chatId/close",  closeChat);

export default router;
