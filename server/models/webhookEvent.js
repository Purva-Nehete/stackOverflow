import mongoose from "mongoose";

const webhookEventSchema = mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    processedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("webhookEvent", webhookEventSchema);
