import express from "express";
import dotenv from "dotenv";
import router from "./routes/api";

dotenv.config();

const app = express();
const { PORT } = process.env;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running!",
    status: "success",
  });
});

app.use("/api/v1", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
