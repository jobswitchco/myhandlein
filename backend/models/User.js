import mongoose from "mongoose";
const { Schema } = mongoose;

const User_Schema = new Schema({

  email: {
    type: String,
    required: true,
  },

  name: {
    type: String,
  },

    intro: {
    type: String,
  },

  sub: {
    type: String,
  },

  picture: {
    type: String,
  },

  is_google_user: {
    type: Boolean
  },

   handleUserName: {
    type: String
  },

  socials: [
  {
    platform: { type: String },
    url: { type: String },
    created_at: { type: Date, default: Date.now },
  }
],

  account_delete_code: { type: Number },

  last_login: {
    type: Date,
  },

  loginHistory: [
    {
      type: Date,
    },
  ],

  free_trial: {
    type: Boolean,
    default: true,
  },

  free_trial_started_date: {
    type: Date,
    default: Date.now,

  },


  is_del: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  updated_at: {
    type: Date,
  },
});

const User_Schema_Model = mongoose.model("users", User_Schema);
export default User_Schema_Model;
