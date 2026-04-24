import mongoose, { Schema } from "mongoose";

interface IForgotPasswordCooldown {
  emailKey: string;
  blockedUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ForgotPasswordCooldownSchema = new Schema<IForgotPasswordCooldown>(
  {
    emailKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    blockedUntil: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// TTL dokumen cooldown: 1 hari.
ForgotPasswordCooldownSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const ForgotPasswordCooldownModel = mongoose.model<IForgotPasswordCooldown>("ForgotPasswordCooldown", ForgotPasswordCooldownSchema);

export default ForgotPasswordCooldownModel;
