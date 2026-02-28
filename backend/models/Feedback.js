import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxLength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export const Feedback = mongoose.model("Feedback", feedbackSchema);
