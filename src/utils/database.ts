import mongoose from "mongoose";
import { env } from "./env";


const connect = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL_DEMO, {
      dbName: "db_pos_demo",
    });
    return Promise.resolve("Database connected");
  } catch (error) {
    return Promise.reject("Database connection failed");
  }
};
export default connect;
