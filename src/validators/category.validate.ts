import * as Yup from "yup";

export const categorySchema = Yup.object().shape({
  name: Yup.string().required("Category name is required").trim(),
  imageUrl: Yup.string().nullable(),
  imageFileId: Yup.string().nullable(),
});

export type TCategory = Yup.InferType<typeof categorySchema>;
