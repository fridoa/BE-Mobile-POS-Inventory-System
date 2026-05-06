import { Types } from "mongoose";
import * as Yup from "yup";

export const productSchema = Yup.object().shape({
  name: Yup.string().required("Product name is required").trim(),
  basePrice: Yup.number().required("Base price is required").min(0, "Base price must be at least 0"),
  price: Yup.number().min(0).nullable().optional(),
  costPrice: Yup.number().required("Cost price is required").min(0, "Cost price must be at least 0"),
  stock: Yup.number().required("Stock is required").min(0, "Stock must be at least 0"),
  minStock: Yup.number().required("Minimum stock is required").min(0, "Minimum stock must be at least 0"),
  expiryDate: Yup.date().nullable().min(new Date(), "Expiry date cannot be in the past"),
  discount: Yup.number().min(0, "Discount must be at least 0").max(100, "Discount cannot exceed 100"),
  category: Yup.string().required("Category ID is required").trim(),
  imageUrl: Yup.string().url("Image URL must be a valid URL").nullable(),
  sku: Yup.string().nullable().optional().trim(),
});

export const productUpdateSchema = Yup.object().shape({
  name: Yup.string().trim(),
  basePrice: Yup.number().min(0, "Base price must be at least 0"),
  price: Yup.number().min(0).nullable(),
  costPrice: Yup.number().min(0, "Cost price must be at least 0"),
  stock: Yup.number().min(0, "Stock must be at least 0"),
  minStock: Yup.number().min(0, "Minimum stock must be at least 0"),
  expiryDate: Yup.date().nullable().optional(),
  discount: Yup.number().min(0, "Discount must be at least 0").max(100, "Discount cannot exceed 100"),
  category: Yup.string().trim(),
  imageUrl: Yup.string().url("Image URL must be a valid URL").nullable(),
  sku: Yup.string().trim(),
});

export type TProduct = Yup.InferType<typeof productSchema>;
export type TProductUpdate = Yup.InferType<typeof productUpdateSchema>;
