import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import router from "./routes/api";
import connect from "./utils/database";
import { env } from "./utils/env";
import { initScheduledJobs } from "./utils/scheduler";
import swaggerDocs from "./docs/route";

dotenv.config();

async function init() {
  try {
    const result = await connect();

    console.log("Database Status: ", result);

    const app = express();

    app.use(cors({
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(bodyParser.json());

    const { PORT } = env;

    app.get("/", (req, res) => {
      res.status(200).json({
        message: "Server is running!",
        status: "success",
      });
    });

    app.use("/", router);

    app.use("/api/v1", router);

    swaggerDocs(app);

    initScheduledJobs();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

init();
