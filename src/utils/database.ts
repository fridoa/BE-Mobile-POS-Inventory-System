import mongoose from "mongoose";
import { env } from "./env";

const getDatabaseConfig = () => {
  switch (env.NODE_ENV) {
    case "production":
      return { url: env.DATABASE_URL_PROD, dbName: "db_pos_prod" };
    case "test":
      return { url: env.DATABASE_URL_TEST, dbName: "db_pos_test" };
    default:
      return { url: env.DATABASE_URL_DEMO, dbName: "db_pos_demo" };
  }
};

const connect = async () => {
  const { url, dbName } = getDatabaseConfig();
  try {
    await mongoose.connect(url, {
      dbName: dbName,
    });
    return Promise.resolve(`Database connected (${env.NODE_ENV})`);
  } catch (error) {
    return Promise.reject("Database connection failed");
  }
};
export default connect;
