import { Types } from "mongoose";
import * as Yup from "yup";

export const productSchema = Yup.object().shape({
  name: Yup.string().required("Product name is required").trim(),
  price: Yup.number().required("Price is required").min(0, "Price must be at least 0").moreThan(Yup.ref("costPrice"), "Price must be greater than cost price"),
  costPrice: Yup.number().required("Cost price is required").min(0, "Cost price must be at least 0"),
  stock: Yup.number().required("Stock is required").min(0, "Stock must be at least 0"),
  minStock: Yup.number().required("Minimum stock is required").min(0, "Minimum stock must be at least 0"),
  expiryDate: Yup.date().nullable().min(new Date(), "Expiry date cannot be in the past"),
  discount: Yup.number().min(0, "Discount must be at least 0").max(100, "Discount cannot exceed 100"),
  category: Yup.string().required("Category ID is required").trim(),
  imageUrl: Yup.string().url("Image URL must be a valid URL").nullable(),
  isActive: Yup.boolean(),
  sku: Yup.string().required("SKU is required").trim(),
});

export const productUpdateSchema = Yup.object().shape({
  name: Yup.string().trim(),
  price: Yup.number().min(0, "Price must be at least 0").moreThan(Yup.ref("costPrice"), "Price must be greater than cost price"),
  costPrice: Yup.number().min(0, "Cost price must be at least 0"),
  stock: Yup.number().min(0, "Stock must be at least 0"),
  minStock: Yup.number().min(0, "Minimum stock must be at least 0"),
  expiryDate: Yup.date().nullable().min(new Date(), "Expiry date cannot be in the past"),
  discount: Yup.number().min(0, "Discount must be at least 0").max(100, "Discount cannot exceed 100"),
  category: Yup.string().trim(),
  imageUrl: Yup.string().url("Image URL must be a valid URL").nullable(),
  isActive: Yup.boolean(),
  sku: Yup.string().trim(),
});

export type TProduct = Yup.InferType<typeof productSchema>;
export type TProductUpdate = Yup.InferType<typeof productUpdateSchema>;
