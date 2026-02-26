import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name:     { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, default: '' },       // empty for Google-only accounts
        googleId: { type: String, default: null },      // set when linked via Google OAuth
        avatar:   { type: String, default: '' },        // Google profile picture URL
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };
