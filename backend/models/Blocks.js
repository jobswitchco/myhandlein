// models/Block.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Field subdocument for form blocks
 * - key: stable key used in form submissions (e.g. "name", "phone")
 * - label: human label shown to users
 * - type: input type (text, email, tel, textarea, number, etc.)
 * - placeholder: optional placeholder text
 * - required: boolean
 *
 * _id: false so Mongoose doesn't create separate ids for each field
 */
const FieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: "text" },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
     options: {
      type: [String],
      required: false,
      default: undefined,
    },
  },
  { _id: false }
);

const BlockSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, index: true, ref: "users" },
    type: {
      type: String,
      enum: ["link", "video", "product", "store", "form", "cta"],
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    action: {
      type: String,
      trim: true,
      required: function () {
        return this.type !== "form";
      },
      default: "",
    },

    fields: {
      type: [FieldSchema],
      required: false,
      default: undefined,
    },

    order: { type: Number, required: true, default: 1000, index: true },
    published: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },

    is_del: { type: Boolean, default: false },
    clicks: { type: Number, default: 0 },
link_click_analytics: [{
  ip: { type: String, index: true },
  user_agent: { type: String },
  referrer: { type: String },
  country: { type: String, index: true },
  country_code: { type: String, index: true },
  region: { type: String },
  city: { type: String },
  postal: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
}],

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
