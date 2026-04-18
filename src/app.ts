import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { HttpError } from "./errors/http-error";

dotenv.config();

console.log(process.env.PORT);

const app: Application = express();

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to API World!");
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});

export default app;
