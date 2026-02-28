import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meetingId: { type: Schema.Types.ObjectId, ref: "ScheduledMeeting" },
    meetingCode: { type: String, default: "" },
    meetingTitle: { type: String, default: "" },
    scheduledFor: { type: Date },
    type: { type: String, default: "info" },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export { Notification };
