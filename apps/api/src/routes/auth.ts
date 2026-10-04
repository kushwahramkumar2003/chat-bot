import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { login, signup } from "../controller/auth.controller";
const route = Router();
route.post("/signup", asyncHandler(signup));
route.post("/login", asyncHandler(login));
export default route;
