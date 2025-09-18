// models/Block.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const BlockSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, index: true, ref: "users" },

    // 'link' | 'video' | 'product' | 'store'
    type: {
      type: String,
      enum: ["link", "video", "product", "store"],
      required: true,
      index: true,
    },

    // human readable title for the block
    name: { type: String, required: true, trim: true },

    // main payload (URL for link/video etc)
    action: { type: String, required: true, trim: true },

    // order: smaller numbers appear higher (top-to-bottom)
    order: { type: Number, required: true, default: 1000, index: true },

    // lifecycle flags
    published: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },

    // soft-delete (keeps naming similar to your waitlist schema)
    is_del: { type: Boolean, default: false },

    // simple analytics counters (optional)
    clicks: { type: Number, default: 0 },

    // timestamps in snake_case to match your style
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

// keep updated_at fresh
BlockSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

BlockSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updated_at: Date.now() });
  next();
});

// indexes
BlockSchema.index({ user_id: 1, order: 1 });
BlockSchema.index({ user_id: 1, type: 1 });

const BlockModel = mongoose.model("blocks", BlockSchema);
export default BlockModel;
