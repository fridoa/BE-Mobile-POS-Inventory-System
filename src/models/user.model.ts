import mongoose, { Schema, Query } from "mongoose";
import { IUser } from "../utils/interfaces";
import { ROLES } from "../utils/constants";
import { hashPassword, verifyPassword } from "../utils/password";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.KASIR],
      required: true,
      default: ROLES.KASIR,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      token: String,
      previousToken: String,
      lastRotatedAt: Date,
    },
  },
  { timestamps: true },
);

// Partial Unique Index: username & email hanya unik untuk user yang belum dihapus
UserSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
UserSchema.index({ email: 1 }, { unique: true, sparse: true, partialFilterExpression: { deletedAt: null } });

UserSchema.pre("save", async function () {
  const user = this;
  if (!user.isModified("password")) {
    return;
  }

  user.password = await hashPassword(user.password);
});

UserSchema.pre<Query<IUser, IUser>>("findOneAndUpdate", async function () {
  const update = this.getUpdate() as { password?: string };

  if (!update.password) {
    return;
  }

  try {
    update.password = await hashPassword(update.password);
  } catch (error) {
    throw new Error("Gagal hash password saat update");
  }
});

UserSchema.methods.comparePassword = function (passwordInput: string): Promise<boolean> {
  return verifyPassword(passwordInput, this.password);
};

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.fcmToken;
  delete user.__v;
  return user;
};

const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
