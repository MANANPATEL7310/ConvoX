import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name:     { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email:    { type: String, unique: true, sparse: true },
        password: { type: String, default: '' },       // empty for Google-only accounts
        googleId: { type: String, default: null },      // set when linked via Google OAuth
        avatar:   { type: String, default: '' },        // Google profile picture URL
        lastActiveAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };
