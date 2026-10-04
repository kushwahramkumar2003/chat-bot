import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { chat, conversationList } from "../controller/chat";
const route = Router();
route.post("/text", asyncHandler(chat));
route.post("/chats", asyncHandler(conversationList));
export default route;
