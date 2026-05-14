import mongoose, { Schema } from "mongoose";

export interface ICategory {
  name: string;
  imageUrl?: string;
  imageFileId?: string;
  deletedAt: Date | null;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imageFileId: {
      type: String,
      default: null,
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
