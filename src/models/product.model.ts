import mongoose, { Query, Schema, Types } from "mongoose";

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  basePrice: number;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  expiryDate?: Date;
  discount?: number;
  category: Types.ObjectId;
  imageUrl?: string;
  imageFileId?: string;
  isActive: boolean;
  sku: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      default: 5,
    },
    expiryDate: {
      type: Date,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageFileId: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1, name: 1 });
ProductSchema.index({ name: "text", sku: "text" });

ProductSchema.pre(/^find/, async function (this: Query<any, any>) {
  this.where({ isActive: { $ne: false } });
});

const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);

export default ProductModel;
