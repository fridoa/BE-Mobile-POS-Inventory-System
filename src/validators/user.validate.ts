import * as Yup from "yup";
import { ROLES } from "../utils/constants";

export const userSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  username: Yup.string().required("Username is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  role: Yup.string<ROLES>().oneOf([ROLES.ADMIN, ROLES.KASIR], "Role must be either 'admin' or 'kasir'").required("Role is required"),
});

export const userUpdateSchema = Yup.object().shape({
  name: Yup.string(),
  username: Yup.string(),
  password: Yup.string().min(6, "Password must be at least 6 characters"),
  role: Yup.string<ROLES>().oneOf([ROLES.ADMIN, ROLES.KASIR], "Role must be either 'admin' or 'kasir'"),
});

export type UserType = Yup.InferType<typeof userSchema>;
export type UserUpdateType = Yup.InferType<typeof userUpdateSchema>;
