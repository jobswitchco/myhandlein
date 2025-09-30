import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Conversation schema
 *
 * - participants: array of objects for per-user metadata (last_read_at, role, muted)
 * - participant_ids_sorted: string join of sorted user ids (useful for quick DM lookup & unique constraint)
 * - last_message: ObjectId ref to Message (small and fast to populate)
 * - unread_counts: Map<userId, Number>
 * - metadata: flexible tagging/pinning/etc.
 *
 * Timestamps add createdAt and updatedAt automatically.
 */

const ParticipantSubSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["member", "influencer", "admin", "guest"], default: "member" },
  joined_at: { type: Date, default: Date.now },
  last_read_at: { type: Date, default: null }, // used to compute unread client-side if needed
  muted: { type: Boolean, default: false },
}, { _id: false });

const ConversationSchema = new Schema({
  participants: { type: [ParticipantSubSchema], validate: v => Array.isArray(v) && v.length > 0 },

  // deterministic sorted participant ids for quick DM lookup and unique constraint for 1:1
  participant_ids_sorted: { type: String, index: true }, // automatically computed before save

  // reference to the last message (fast to populate in inbox queries)
  last_message: { type: Schema.Types.ObjectId, ref: "Message", default: null },

  // unread counts per participant (Map<userId, Number>)
  unread_counts: { type: Map, of: Number, default: {} },

  metadata: {
    title: { type: String, default: null }, // optional for group chats
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    conversation_type: { type: String, enum: ["dm", "group", "system"], default: "dm" }
  },

  is_deleted: { type: Boolean, default: false },

}, {
  timestamps: true // createdAt, updatedAt
});

/**
 * Build participant_ids_sorted from participants before validate.
 * Sorting by string form of ObjectId ensures deterministic order.
 */
ConversationSchema.pre("validate", function(next) {
  try {
    if (Array.isArray(this.participants) && this.participants.length > 0) {
      const ids = this.participants
        .map(p => p && p.user && p.user.toString())
        .filter(Boolean)
        .sort(); // lexicographic sort of ObjectId string
      this.participant_ids_sorted = ids.join("|");
    } else {
      this.participant_ids_sorted = undefined;
    }
  } catch (err) {
    // don't break save on unexpected errors, but surface
    return next(err);
  }
  next();
});

/**
 * Indexes
 * - fast inbox queries by participants array and updatedAt
 * - fast lookup by participant_ids_sorted (useful for ensuring single DM exists between two users)
 */
ConversationSchema.index({ "participants.user": 1, updatedAt: -1 });
ConversationSchema.index({ participant_ids_sorted: 1, "metadata.conversation_type": 1 }); // can be unique if you want one DM per pair
ConversationSchema.index({ last_message: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;
