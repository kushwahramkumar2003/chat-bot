import { Router } from "express";
import authRoute from "./auth";
import chatRoute from "./chat";
const route = Router();

route.use("/auth", authRoute);
route.use("/chat", chatRoute);

export default route;
