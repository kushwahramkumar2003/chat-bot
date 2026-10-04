import express from "express";
import cors from "cors";
import routes from "./routes";
import { contextMiddleware } from "./middleware/context";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
    exposedHeaders: ["X-Conversation-Id"],
  })
);
app.use(contextMiddleware);
app.use("/api/v1", routes);

app.listen(8080, () => {
  console.log("Server listning of port 8080");
});
