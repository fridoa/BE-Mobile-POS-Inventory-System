import * as Yup from "yup";

export const loginSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const changePasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().required("Old password is required"),
  newPassword: Yup.string().required("New password is required").min(6, "New password must be at least 6 characters long").max(100, "New password must be at most 100 characters long"),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

export type TLogin = Yup.InferType<typeof loginSchema>;
export type TChangePassword = Yup.InferType<typeof changePasswordSchema>;
