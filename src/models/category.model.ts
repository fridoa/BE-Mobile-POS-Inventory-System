import mongoose, { Schema } from "mongoose";

export interface ICategory {
  name: string;
  deletedAt: Date | null;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Partial Unique Index: nama kategori hanya unik untuk yang belum dihapus
CategorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);

export default CategoryModel;
