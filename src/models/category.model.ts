import mongoose, { Schema } from "mongoose";

export interface ICategory {
  name: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);

export default CategoryModel;
