import * as Yup from "yup";

export const loginSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const updateProfileSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").max(100, "Name must be at most 100 characters long").optional(),
  email: Yup.string().email("Invalid email format").max(100, "Email must be at most 100 characters long").optional(),
  username: Yup.string().required("Username is required").max(50, "Username must be at most 50 characters long").optional(),
});

export const changePasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().required("Old password is required"),
  newPassword: Yup.string().required("New password is required").min(6, "New password must be at least 6 characters long").max(100, "New password must be at most 100 characters long"),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Email is required"),
});

export const resetPasswordSchema = Yup.object().shape({
  token: Yup.string().required("Reset token is required"),
  newPassword: Yup.string().required("New password is required").min(6, "New password must be at least 6 characters long").max(100, "New password must be at most 100 characters long"),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

export type TLogin = Yup.InferType<typeof loginSchema>;
export type TChangePassword = Yup.InferType<typeof changePasswordSchema>;
export type TForgotPassword = Yup.InferType<typeof forgotPasswordSchema>;
export type TResetPassword = Yup.InferType<typeof resetPasswordSchema>;
