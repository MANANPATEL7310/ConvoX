import mongoose, { Schema } from "mongoose";

const scheduledMeetingSchema = new Schema(
  {
    hostUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostName: { type: String, required: true },
    hostEmail: { type: String, required: true },
    title: { type: String, default: "Scheduled Meeting" },
    meetingCode: { type: String, required: true },
    meetingUrl: { type: String, required: true },
    scheduledFor: { type: Date, required: true, index: true },
    timezone: { type: String, default: "UTC" },
    attendees: { type: [String], default: [] },
    reminder5Sent: { type: Boolean, default: false },
    reminder10Sent: { type: Boolean, default: false },
    startSent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["scheduled", "started", "completed", "cancelled"],
      default: "scheduled",
    },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

const ScheduledMeeting = mongoose.model("ScheduledMeeting", scheduledMeetingSchema);

export { ScheduledMeeting };
