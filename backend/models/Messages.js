// models/Messages.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Attachment subdocument
 */
const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  name: { type: String, default: null },
  mime_type: { type: String, default: null },
  size: { type: Number, default: null },
  provider: { type: String, default: null }, // e.g. "s3", "gcs", "cloudflare"
  meta: { type: Schema.Types.Mixed, default: {} } // provider specific extra data
}, { _id: false });

/**
 * Message schema
 */
const MessageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },

  // unified sender — NOTE: ref must match model name "User"
  sender: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },

  sender_type: { type: String, enum: ["user", "guest", "system"], default: "user" },

  guest_info: {
    name: { type: String },
    email_or_token: { type: String }
  },

  // recipients optional (use "User" model)
  recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],

  text: { type: String, default: "" },
  attachments: { type: [AttachmentSchema], default: [] },

  status: { type: String, enum: ["sent", "delivered", "read", "spam", "deleted", "blocked"], default: "sent" },
  categories: { type: [String], default: [] },

  delivery: {
    delivered_at: { type: Date },
    read_at: { type: Date }
  },

  meta: {
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
    extra: { type: Schema.Types.Mixed, default: {} }
  },

  is_deleted: { type: Boolean, default: false }
}, {
  timestamps: true // createdAt and updatedAt
});

// Indexes
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

MessageSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

// Guard model registration (prevents OverwriteModelError in dev/hot-reload)
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema, "messages");
export default Message;
