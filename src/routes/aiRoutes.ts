import express from "express";
// import { adminAuth } from "../middleware/auth";
import {
  toggleAI,
  getAIStatus,
  updateSystemPrompt,
  getSuggestedResponses,
  getAISettings,
} from "../controllers/aiController";

const router = express.Router();

// AI Management Routes
// router.get("/status", adminAuth, getAIStatus);
// router.post("/toggle", adminAuth, toggleAI);
// router.put("/system-prompt", adminAuth, updateSystemPrompt);
// router.get("/settings", adminAuth, getAISettings);
// router.post("/suggestions", adminAuth, getSuggestedResponses);


router.get("/status",  getAIStatus);
router.post("/toggle",  toggleAI);
router.put("/system-prompt",  updateSystemPrompt);
router.get("/settings",  getAISettings);
router.post("/suggestions",  getSuggestedResponses);
export default router;
