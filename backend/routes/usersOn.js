import express from "express";
import cookieParser from "cookie-parser";
import axios from "axios";
const router = express.Router();
import USER from "../models/User.js";
import ParticipantUser from "../models/ParticipantUser.js";
import Conversation from "../models/Conversations.js";
import Message from "../models/Messages.js";
import Block from "../models/Blocks.js";
import FormsData from "../models/FormsData.js";
import Product from "../models/ProductsCatalogue.js";
import PageAnalytics from "../models/PageAnalytics.js";
import mongoose from 'mongoose';
router.use(cookieParser());
import authenticateToken from "../middleware/authenticateTokenProfessional.js";
import authenticateParticipant from "../middleware/authenticateParticipant.js";
import generateJWTtoken  from "../middleware/generateJWTtoken.js";
import fs from "fs";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import util from "util";
const unlinkAsync = util.promisify(fs.unlink);
import { Storage } from '@google-cloud/storage';
const storage = new Storage();
const bucketName = "postlnbucketcom"; 
const bucket = storage.bucket(bucketName);
const upload = multer({ storage: multer.memoryStorage() });
const IPDATA_KEY = process.env.IPDATA_KEY;


function escapeRegex(str = "") {
  // escape special regex chars to keep regex search safe
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


async function lookupGeo_ipdata(ip) {
  if (!IPDATA_KEY) {
    console.warn("IPDATA_API_KEY not set; skipping ipdata lookup");
    return null;
  }

  try {
    const ipSegment = ip ? `/${encodeURIComponent(ip)}` : "";
    const url = `https://api.ipdata.co${ipSegment}?api-key=${encodeURIComponent(IPDATA_KEY)}`;

    const resp = await axios.get(url, { timeout: 3000 }); // 3s timeout
    const d = resp.data;

    return {
      ip: d.ip,
      country: d.country_code || d.country,
      country_name: d.country_name,
      region: d.region,
      city: d.city,
      postal: d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.time_zone?.name || d.time_zone,
      raw: d
    };
  } catch (err) {
    // log but don't throw (caller should handle null)
    console.warn("ipdata lookup failed:", err?.response?.status, err?.message || err);
    return null;
  }
}

 function isPrivateIp(ip) {
  if (!ip) return false;
  // remove IPv6 zone id if present (e.g. fe80::1%lo0)
  const clean = ip.split("%")[0];

  // normalize IPv6 mapped IPv4
  const normalized = clean.startsWith("::ffff:") ? clean.split("::ffff:")[1] : clean;

  // quick private checks (IPv4)
  if (/^127\./.test(normalized)) return true; // loopback
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalized)) return true;

  // IPv6 local/unique-local/loopback
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique-local
  if (normalized.startsWith("fe80")) return true; // link-local

  return false;
}

async function normalizeIp(ip) {
  if (!ip) return null;
  const cleaned = ip.split("%")[0]; // drop zone id
  if (cleaned.startsWith("::ffff:")) return cleaned.split("::ffff:")[1];
  return cleaned;
}

async function getClientIp(req) {
  // common proxy headers (X-Forwarded-For can be a comma list)
  const headerChecks = [
    "x-client-ip",
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip", // Cloudflare
    "fastly-client-ip",
    "true-client-ip",
    "x-appengine-user-ip",
  ];

  let ip = null;
  for (const h of headerChecks) {
    const val = req.headers[h];
    if (!val) continue;
    // X-Forwarded-For may contain a list of IPs; take the first non-empty one
    const candidate = val.split(",")[0].trim();
    if (candidate) {
      ip = candidate;
      break;
    }
  }

  // fallback to Express/Node remote address
  if (!ip) {
    ip = req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || null;
  }

  ip = await normalizeIp(ip);

  // if local/private, return null (so callers know not to call external geo APIs)
  if (isPrivateIp(ip)) return null;

  return ip;
}


router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("token_professional", {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

async function uploadBufferToGCS(buffer, originalName, mimeType) {
  if (!bucket) throw new Error("GCS bucket not configured.");
  const ext = path.extname(originalName) || "";
  const objectName = `products/${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}${ext}`;
  const file = bucket.file(objectName);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false,
    });

    stream.on("error", (err) => reject(err));
    stream.on("finish", async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
        resolve({ publicUrl, objectName });
      } catch (err) {
        reject(err);
      }
    });

    // 🔑 Actually write the in-memory buffer to GCS
    stream.end(buffer);
  });
}


// Upload from a local file path (works with multer({ dest: "uploads/" }))
async function uploadFilePathToGCS(filePath, originalName, mimeType) {
  if (!bucket) throw new Error("GCS bucket not configured.");
  const ext = path.extname(originalName) || path.extname(filePath) || "";
  const objectName = `products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const file = bucket.file(objectName);

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = file.createWriteStream({
      metadata: { contentType: mimeType || "application/octet-stream" },
      resumable: false,
    });

    readStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });

    writeStream.on("finish", async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

        // cleanup local file - don't block the response if deletion fails, but attempt it
        try {
          await unlinkAsync(filePath);
        } catch (unlinkErr) {
          console.warn("Failed to remove local upload file:", unlinkErr.message);
        }

        resolve({ publicUrl, objectName });
      } catch (err) {
        reject(err);
      }
    });

    // pipe the local file into GCS write stream
    readStream.pipe(writeStream);
  });
}


function normalizePosition(pos) {
  if (!pos) return null;
  const p = String(pos).trim().toLowerCase();
  if (["left", "headerimage1", "headerimage_1", "1"].includes(p)) return "leftHeadImage";
  if (["righttop", "right_top", "headerimage2", "headerimage_2", "2"].includes(p)) return "rightTopImage";
  if (["rightbottom", "right_bottom", "headerimage3", "headerimage_3", "3"].includes(p)) return "rightBottomImage";
  return null;
}

router.get("/influencer/:subdomain", async (req, res) => {
  try {
    const sub = String(req.params.subdomain || "").toLowerCase();
    if (!sub) return res.status(400).json({ error: "subdomain required" });
    const influencer = await USER.findOne({ handleUserName: sub }).select("_id name picture handleUserName").lean();
    if (!influencer) return res.status(404).json({ error: "not found" });
    return res.json({ influencer });
  } catch (err) {
    console.error("GET /influencer error:", err);
    return res.status(500).json({ error: "internal" });
  }
});

router.get("/conversations/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "conversationId required and must be a valid ObjectId" });
    }

    // ensure we have requester id from authenticateToken
    const requesterId = req.user?.user_id;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    // Populate participants.user (basic fields) and last_message (basic fields + sender)
    const convo = await Conversation.findById(conversationId)
      .populate({
        path: "participants.user",
        select: "_id name handleUserName picture email"
      })
      .populate({
        path: "last_message",
        select: "_id text sender createdAt",
        populate: { path: "sender", select: "_id name handleUserName picture" }
      })
      .lean();

      console.log('convo : ', convo);

    if (!convo) {
      return res.status(404).json({ error: "conversation not found" });
    }

    // Normalize participants: array of { user: {..}, role, last_read_at, ... }
    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];

    // Find the participant entry for the requester
    const requesterParticipant = participantsArr.find(p => {
      const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
      return uid === requesterId;
    });

    // If requester is not part of the conversation, forbid access
    if (!requesterParticipant) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    // Other participants (useful to show the 'influencer' or recipients)
    const otherParticipants = participantsArr
      .filter(p => {
        const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
        return uid && uid !== requesterId;
      })
      .map(p => p.user); // map to populated user doc or id

    // For compatibility with previous code, pick "participant" (requester) and "influencer" (first other)
    const participant = {
      user: requesterParticipant.user,
      role: requesterParticipant.role,
      last_read_at: requesterParticipant.last_read_at,
      joined_at: requesterParticipant.joined_at,
      muted: requesterParticipant.muted
    };

    const influencer = otherParticipants.length ? otherParticipants[0] : null;

    // Respond with the conversation and resolved participant/influencer
    return res.json({
      ok: true,
      conversation: convo,
      participant,
      influencer,
      others: otherParticipants
    });
  } catch (err) {
    console.error("DEBUG: GET conversation error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.get("/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('conversation Id : ', conversationId);
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "conversationId required and must be a valid ObjectId" });
    }

    // requester id from authenticateToken (ensure authenticateToken sets req.user.id/_id)
    const requesterId = req.user?.user_id;

    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    // Load conversation and populate participant user docs (basic fields)
   const convo = await Conversation.findById(conversationId)
  .populate({ path: "participants.user", model: "User", select: "_id name handleUserName picture email" })
  .lean();

    if (!convo) return res.status(404).json({ error: "conversation not found" });

    // Find requester participant entry
    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];
    console.log('participants Array : ', participantsArr);
    const requesterParticipantEntry = participantsArr.find(p => {
      const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
      return uid === requesterId;
    });

    if (!requesterParticipantEntry) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    // Resolve influencer/other participants (first other participant)
    const otherParticipants = participantsArr
      .filter(p => {
        const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
        return uid && uid !== requesterId;
      })
      .map(p => p.user);

    const participantDoc = requesterParticipantEntry.user;
    const influencerDoc = otherParticipants.length ? otherParticipants[0] : null;

    // Fetch messages (use new Message schema fields)
    // Message schema: conversation (ref), sender (ref to User), is_deleted, timestamps (createdAt)
    const msgs = await Message.find({ conversation: conversationId, is_deleted: false })
      .sort({ createdAt: 1 })
      .populate({ path: "sender", select: "_id name handleUserName picture" })
      .lean();

    // Normalize each message to your expected shape
    const normalized = msgs.map(m => {
      // determine sender id (if populated sender object, use its _id)
      const senderId = m.sender ? String(m.sender._id) : (m.senderId ? String(m.senderId) : null);

      // decide whether this message is from the participant (requester) or influencer (other)
      let senderRole = "influencer";
      if (senderId && participantDoc && String(participantDoc._id) === senderId) {
        senderRole = "participant";
      } else if (senderId && influencerDoc && String(influencerDoc._id) === senderId) {
        senderRole = "influencer";
      } else {
        // ambiguous — fallback to: if recipients include influencer -> participant else influencer
        const recipients = Array.isArray(m.recipients) ? m.recipients.map(r => String(r)) : [];
        if (recipients.length && influencerDoc && recipients.includes(String(influencerDoc._id))) {
          senderRole = "participant";
        } else if (senderId && participantDoc && senderId === String(participantDoc._id)) {
          senderRole = "participant";
        } else {
          // default to influencer (since UI is influencer-facing)
          senderRole = "influencer";
        }
      }

      return {
        _id: m._id,
        conversation_id: m.conversation || conversationId,
        sender: senderRole,                 // "participant" | "influencer"
        senderId: senderId || null,
        text: m.text || m.body || "",
        created_at: m.createdAt || m.created_at || new Date(),
        raw: m // optional - remove or omit for production
      };
    });

    // optional debug log
    console.log("GET /conversations/:id/messages normalized count:", normalized.length);

    return res.json({
      ok: true,
      conversation: convo,
      participant: participantDoc,
      influencer: influencerDoc,
      messages: normalized
    });
  } catch (err) {
    console.error("GET conversation messages error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.post("/messages/send", async (req, res) => {
  try {
    const { conversationId, text, attachments } = req.body || {};
    if (!conversationId || !text) return res.status(400).json({ error: "conversationId and text required" });
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ error: "invalid conversationId" });

    // --- extract participantId from cookie tokenParticipantMyHandle (same as your original flow) ---
    const cookies = req.headers.cookie || "";
    const parsedCookies = require("cookie").parse(cookies || "");
    const token = parsedCookies.tokenParticipantMyHandle;
    if (!token) return res.status(401).json({ error: "authentication tokenParticipantMyHandle required" });

    const jwt = require("jsonwebtoken");
    let participantId = null;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
      participantId = payload.userId || payload.user_id || payload.id || null;
    } catch (e) {
      return res.status(401).json({ error: "invalid token" });
    }
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(401).json({ error: "invalid participant id in token" });
    }
    const participantObjectId = new mongoose.Types.ObjectId(participantId);

    // --- ensure conversation exists and requester is a participant ---
    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ error: "conversation not found" });

    // participants are stored as objects: { user: ObjectId, role, ... }
    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];
    const requesterEntry = participantsArr.find(p => {
      const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
      return uid === String(participantId);
    });

    if (!requesterEntry) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    // Determine the "other" participant(s) — here we pick the first other user as influencer (if any)
    const otherUsers = participantsArr
      .map(p => (p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null)))
      .filter(uid => uid && uid !== String(participantId));

    const influencerId = otherUsers.length ? otherUsers[0] : null;
    const influencerObjectId = influencerId ? new mongoose.Types.ObjectId(influencerId) : null;

    // --- build message doc according to new Message schema ---
    const messagePayload = {
      conversation: new mongoose.Types.ObjectId(conversationId),
      sender: participantObjectId,
      sender_type: "user",
      recipients: influencerObjectId ? [influencerObjectId] : [],
      text: String(text || ""),
      attachments: Array.isArray(attachments) ? attachments : [], // attachments must match your AttachmentSchema shape
      status: "sent",
      is_deleted: false
    };

    const created = await Message.create(messagePayload);

    // populate sender for emission & response (lightweight)
    const populatedMessage = await Message.findById(created._id)
      .populate({ path: "sender", select: "_id name handleUserName picture" })
      .lean();

    // --- update conversation: set last_message to message _id and increment unread count for influencer ---
    const updateOps = {
      $set: { last_message: created._id, updatedAt: new Date() }
    };
    if (influencerId) {
      updateOps.$inc = { [`unread_counts.${influencerId}`]: 1 };
    }
    await Conversation.findByIdAndUpdate(convo._id, updateOps);

    // --- socket emission (if io exists on app) ---
    const io = req.app.get("io");
    if (io) {
      // emit to influencer-specific room and conversation room
      if (influencerId) {
        io.to(`influencer:${String(influencerId)}`).emit("message:received", { message: populatedMessage });
      }
      io.to(`conversation:${String(convo._id)}`).emit("message:received", { message: populatedMessage });
    }

    return res.json({ ok: true, message: populatedMessage });
  } catch (err) {
    console.error("POST /messages/send error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.post("/conversations/find-or-create", authenticateParticipant, async (req, res) => {
  try {
    const { subdomain } = req.body || {};
    console.log('hit : ', req.body);
    if (!subdomain) return res.status(400).json({ error: "subdomain required" });

    // fetch influencer by subdomain/handle (case-insensitive optional)
    const influencer = await USER.findOne({ handleUserName: subdomain }).lean();
    if (!influencer) return res.status(404).json({ error: "influencer not found" });

    // get participant id from authenticateToken middleware
    const participantIdRaw = req.user?.user_id || req.user?._id || req.user?.id;

    console.log('participantIdRaw : ', participantIdRaw);

    if (!participantIdRaw) return res.status(401).json({ error: "participant not authenticated" });
    if (!mongoose.Types.ObjectId.isValid(participantIdRaw)) return res.status(400).json({ error: "invalid participant id" });

    const influencerId = String(influencer._id);
    const participantId = String(participantIdRaw);

    console.log('participantId : ', participantId);


    // prevent creating a DM with self
    if (influencerId === participantId) {
      return res.status(400).json({ error: "cannot create conversation with yourself" });
    }

    // build deterministic sorted participant ids string (lexicographic)
    const sortedIds = [influencerId, participantId].map(s => String(s)).sort();
    const participant_ids_sorted = sortedIds.join("|");

    // try to find an existing DM by the deterministic key
    const existing = await Conversation.findOne({
      participant_ids_sorted,
      "metadata.conversation_type": "dm",
      is_deleted: { $ne: true }
    }).lean();

    if (existing) {
      return res.json({ conversation: existing });
    }

    // not found -> create new conversation doc
    const participants = [
      {
        user: new mongoose.Types.ObjectId(influencerId),
        role: "influencer",     // keep influencer role as before
        joined_at: new Date()
      },
      {
        user: new mongoose.Types.ObjectId(participantId),
        role: "member",         // <-- use "member" (valid enum in your schema) instead of "participant"
        joined_at: new Date()
      }
    ];

    const toInsert = {
      participants,
      participant_ids_sorted,
      last_message: null, // no messages yet; Message._id will be set once messages exist
      unread_counts: { [influencerId]: 0, [participantId]: 0 },
      metadata: { conversation_type: "dm", title: null, tags: [], pinned: false }
    };

    let convo;
    try {
      convo = await Conversation.create(toInsert);
    } catch (err) {
      // Handle race: another process may have created the same conversation
      if (err && err.code === 11000) {
        const existingAgain = await Conversation.findOne({
          participant_ids_sorted,
          "metadata.conversation_type": "dm",
          is_deleted: { $ne: true }
        }).lean();
        if (existingAgain) return res.json({ conversation: existingAgain });
      }
      // bubble other errors
      throw err;
    }

    return res.json({ conversation: convo });
  } catch (err) {
    console.error("POST /conversations/find-or-create error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.get('/store-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing user id' });
    }

    // Only fetch the one field; use bracket notation because of the hyphen in the key.
    const user = await USER.findById(
      userId,
      { ['store_enabled']: 1 }, // projection
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const enabled = Boolean(user?.['store_enabled']);
    return res.json({ enabled });
  } catch (err) {
    console.error('GET /store-status failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/dm-inbox-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing user id' });
    }

    // Only fetch the one field; use bracket notation because of the hyphen in the key.
    const user = await USER.findById(
      userId,
      { ['dm_enabled']: 1 },
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const enabled = Boolean(user?.['dm_enabled']);
    return res.json({ enabled });
  } catch (err) {
    console.error('GET /store-status failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/enable-dm-inbox", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Accept { enabled: true/false } in body; default to true if not provided
    const { enabled = true } = req.body ?? {};

    // validate boolean-ish values
    const dmEnabled = enabled === true || enabled === "true" || enabled === 1 || enabled === "1";

    // Update the user's document
    const update = { $set: { dm_enabled: dmEnabled } };

    // findOneAndUpdate returns the previous by default; pass { new: true } to get updated document
    const updated = await USER.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true, projection: { dm_enabled: 1, _id: 0 } }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, enabled: Boolean(updated.dm_enabled) });
  } catch (err) {
    console.error("POST /enable-dm-inbox error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/messages/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "invalid conversation id" });
    }

    // ensure requester identity is present
    const authId = req.user?.user_id;

    if (!authId || !mongoose.Types.ObjectId.isValid(authId)) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    // load conversation and participants (lightweight)
    const convo = await Conversation.findById(conversationId)
      .populate({ path: "participants.user", select: "_id name handleUserName picture email" })
      .lean();
    if (!convo) return res.status(404).json({ error: "conversation not found" });

    // check if requester is participant
    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];
    const isParticipant = participantsArr.some(p => {
      const uid = p?.user?._id ? String(p.user._id) : (p?.user ? String(p.user) : null);
      return uid === authId;
    });

    if (!isParticipant) {
      // strict access control — change if influencer/dashboard-level access is allowed
      return res.status(403).json({ error: "not authorized for this conversation" });
    }

    // fetch messages using new Message schema fields
    const msgs = await Message.find({ conversation: conversationId, is_deleted: false })
      .sort({ createdAt: 1 })
      .populate({ path: "sender", select: "_id name handleUserName picture" })
      .populate({ path: "recipients", select: "_id name handleUserName picture" })
      .lean();

    // normalize minimal fields the frontend expects (optional)
    const normalized = msgs.map(m => ({
      _id: m._id,
      conversation_id: String(m.conversation || conversationId),
      senderId: m.sender ? String(m.sender._id) : null,
      sender: m.sender ? {
        _id: m.sender._id,
        name: m.sender.name,
        handleUserName: m.sender.handleUserName,
        picture: m.sender.picture
      } : null,
      recipients: Array.isArray(m.recipients) ? m.recipients.map(r => ({
        _id: r._id,
        name: r.name,
        handleUserName: r.handleUserName,
        picture: r.picture
      })) : [],
      text: m.text || "",
      attachments: m.attachments || [],
      status: m.status || "sent",
      created_at: m.createdAt || m.created_at || null,
      raw: m // remove this in production if not needed
    }));

    return res.json({ ok: true, conversation: convo, messages: normalized });
  } catch (err) {
    console.error("GET /messages/:conversationId error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});


router.post("/influencer/messages", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user?.user_id || req.user?.id || req.user?._id;
    let { limit = 200, skip = 0 } = req.body || {};
    limit = Math.min(parseInt(limit, 10) || 200, 1000);
    skip = parseInt(skip, 10) || 0;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: "user_id required and must be valid" });
    }
    const influencerObjectId = new mongoose.Types.ObjectId(user_id);
    const ObjectId = mongoose.Types.ObjectId;

   const participantCollection = "participant_user"; 

const pipeline = [
  { $match: { is_deleted: false } },

  {
    $lookup: {
      from: "conversations",
      localField: "conversation",
      foreignField: "_id",
      as: "conversation"
    }
  },
  { $unwind: { path: "$conversation", preserveNullAndEmptyArrays: true } },

  // Only messages incoming to influencer
  {
    $match: {
      $or: [
        { recipients: influencerObjectId },
        {
          $and: [
            { "conversation.participants.user": influencerObjectId },
            { $expr: { $ne: ["$sender", influencerObjectId] } }
          ]
        }
      ]
    }
  },

  // Normalize sender to ObjectId for lookups
  {
    $addFields: {
      senderObjId: {
        $cond: [
          { $eq: [{ $type: "$sender" }, "string"] },
          { $toObjectId: "$sender" },
          "$sender"
        ]
      }
    }
  },

  { $sort: { createdAt: -1 } },
  {
    $group: {
      _id: { $ifNull: ["$conversation._id", "$senderObjId"] },
      doc: { $first: "$$ROOT" }
    }
  },
  { $replaceRoot: { newRoot: "$doc" } },

  // Pagination
  { $skip: skip },
  { $limit: limit },

  // Lookups
  {
    $lookup: {
      from: "users",
      localField: "senderObjId",
      foreignField: "_id",
      as: "user_sender"
    }
  },
  { $unwind: { path: "$user_sender", preserveNullAndEmptyArrays: true } },

  {
    $lookup: {
      from: participantCollection,
      localField: "senderObjId",
      foreignField: "_id",
      as: "participant_sender"
    }
  },
  { $unwind: { path: "$participant_sender", preserveNullAndEmptyArrays: true } },

  // Build robust name/email fallbacks in the pipeline itself
  {
    $addFields: {
      from_name: {
        $ifNull: [
          { $ifNull: ["$participant_sender.name", "$participant_sender.fullName"] },
          {
            $ifNull: [
              { $ifNull: ["$user_sender.name", "$user_sender.fullName"] },
              {
                $ifNull: [
                  "$participant_sender.username",
                  {
                    $ifNull: [
                      "$user_sender.handleUserName",
                      {
                        $ifNull: [
                          "$participant_sender.email",
                          { $ifNull: ["$user_sender.email", { $ifNull: ["$guest_info.name", "Unknown"] }] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      conversation_id: { $ifNull: ["$conversation._id", "$conversation"] } // ensure an id
    }
  },

  {
    $project: {
      _id: 1,
      conversation_id: 1,
      sender: "$senderObjId",
      text: 1,
      createdAt: 1,
      from_name: 1
    }
  }
];

const results = await Message.aggregate(pipeline).exec();

const rows = results.map(m => ({
  _id: m._id,
  conversation_id: m.conversation_id ? String(m.conversation_id) : null,
  from_id: m.sender ? String(m.sender) : null,
  from_name: m.from_name || "Unknown",
  text: m.text || "",
  created_at: m.createdAt || null
}));

return res.json({ ok: true, conversations: rows, total: rows.length });


  } catch (err) {
    console.error("POST /influencer/messages error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.post("/enable-store", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Accept { enabled: true/false } in body; default to true if not provided
    const { enabled = true } = req.body ?? {};

    // validate boolean-ish values
    const storeEnabled = enabled === true || enabled === "true" || enabled === 1 || enabled === "1";

    // Update the user's document
    const update = { $set: { store_enabled: storeEnabled } };

    // findOneAndUpdate returns the previous by default; pass { new: true } to get updated document
    const updated = await USER.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true, projection: { store_enabled: 1, _id: 0 } }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, enabled: Boolean(updated.store_enabled) });
  } catch (err) {
    console.error("POST /enable-store error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/product-click-analytics", async (req, res) => {
  try {

    const { link_key } = req.body || {};
    if (!link_key) return res.status(400).json({ error: "link_key required" });

    // find block exists (quick check). You can also do the update blindly and check modifiedCount.
    const productExists = await Product.exists({ _id: link_key });
    if (!productExists) return res.status(404).json({ error: "block not found" });

    // get client info
    const ip = await getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const referrer = req.headers["referer"] || req.headers["referrer"] || null;
    const geo = await lookupGeo_ipdata(ip);

    const analyticsEntry = {
      ip: geo.ip || null,
      user_agent: userAgent,
      referrer: referrer,
      country: geo?.country || null,
      country_code: geo?.country || geo?.country_code || null,
      region: geo?.region || null,
      city: geo?.city || null,
      postal: geo?.postal || null,
      latitude: geo?.latitude || null,
      longitude: geo?.longitude || null,
    };

    // atomic push into the array
    const updateResult = await Product.updateOne(
      { _id: link_key },
      { $push: { link_click_analytics: analyticsEntry } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "block not found (race?)" });
    }

    return res.status(201).json({ ok: true, analytics: analyticsEntry });
  } catch (err) {
    console.error("Error saving link click analytics:", err);
    return res.status(500).json({ message: "Failed to save link click analytics" });
  }
});


router.get("/fetch-blocks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const q = { user_id: userId, archived: false, is_del: false };
    if (req.query.type) q.type = req.query.type;

    const blocks = await Block.find(q).sort({ order: 1 }).lean().exec();

    // Normalize to frontend-friendly shape if you like
    const normalized = blocks.map((b) => ({
      id: b._id,
      name: b.name,
      action: b.action,
      type: b.type,
      order: b.order,
      created_at: b.created_at,
      updated_at: b.updated_at,
      raw: b,
    }));

    return res.json(normalized);
  } catch (err) {
    console.error("GET /api/blocks error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/save-blocks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const { name, action, type = "link", fields } = req.body;

    // Basic validation: name always required
    if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

    const allowed = ["link", "video", "product", "store", "form", "cta"];
    if (!allowed.includes(type)) return res.status(400).json({ error: "invalid type" });

    // If it's a form, expect an array of fields (but allow empty array if user will add later)
    let normalizedFields = undefined;
    if (type === "form") {
      if (fields !== undefined) {
        if (!Array.isArray(fields)) return res.status(400).json({ error: "fields must be an array" });
        // Basic per-field validation + normalization
        normalizedFields = fields.map((f, i) => {
          const key = (f.key || f.name || `field_${i}`).toString();
          const label = (f.label || "").toString();
          const ftype = (f.type || "text").toString();
          const placeholder = f.placeholder ? String(f.placeholder) : "";
          const required = !!f.required;

          if (!label || !label.trim()) throw { status: 400, message: `field ${i} missing label` };

          // extend supported types to include 'radio' and 'textarea' etc.
          const supportedTypes = ["text", "email", "tel", "textarea", "number", "radio"];
          if (!supportedTypes.includes(ftype)) throw { status: 400, message: `field ${i} has invalid type` };

          // normalize options for radio fields
          let options = undefined;
          if (ftype === "radio") {
            // accept array or comma-string
            if (f.options === undefined) {
              throw { status: 400, message: `field ${i} (radio) missing options` };
            }
            if (Array.isArray(f.options)) {
              options = f.options.map((o) => String(o).trim()).filter(Boolean);
            } else if (typeof f.options === "string") {
              options = f.options.split(",").map((s) => s.trim()).filter(Boolean);
            } else {
              throw { status: 400, message: `field ${i} (radio) options must be array or comma string` };
            }
            if (options.length === 0) throw { status: 400, message: `field ${i} (radio) requires at least one option` };
          }

          // Build normalized field object including options when present
          const normalized = { key, label: label.trim(), type: ftype, placeholder, required };
          if (options !== undefined) normalized.options = options;
          return normalized;
        });
      } else {
        // fields not supplied by the client — allow empty array to be created
        normalizedFields = [];
      }
    } else {
      // non-form: action required (URL or string)
      if (!action || !action.trim()) return res.status(400).json({ error: "action (URL) is required for this block type" });
    }

    // compute new order: put at the end
    const last = await Block.findOne({ user_id: userId }).sort({ order: -1 }).select("order").lean().exec();
    const newOrder = last ? last.order + 100 : 100;

    const payload = {
      user_id: userId,
      name: name.trim(),
      action: (action && action.trim()) || "",
      type,
      order: newOrder,
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (type === "form") {
      payload.fields = normalizedFields;
      // optional: store a little preview in action for backward compatibility
      payload.action = JSON.stringify({ fields: normalizedFields });
    }

    const doc = await Block.create(payload);

    // return normalized created block
    return res.status(201).json({
      id: doc._id,
      name: doc.name,
      action: doc.action,
      type: doc.type,
      order: doc.order,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    });
  } catch (err) {
    // handle thrown validation object from map above
    if (err && err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error("POST /api/blocks error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete('/delete-block/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const blockId = req.params.id;
    if (!blockId) return res.status(400).json({ success: false, message: 'Block id missing' });

    const block = await Block.findOne({ _id: blockId, user_id: userId }).lean();
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

    await Block.deleteOne({ _id: blockId, user_id: userId });

    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('delete-block error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get("/verify-login-token", authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ valid: false });
  }
  return res.status(200).json({ valid: true, user: req.user });
  
});

router.get("/verify-participant-login-token", authenticateParticipant, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ valid: false });
  }
  return res.status(200).json({ valid: true, user: req.user });
  
});


router.post("/user-login-gmail", async (req, res) => {
  try {
    const { email, firstName, lastName, picture } = req.body;
    console.log("email : ", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await USER.findOne({ email });
    let wasNew = false;

    if (!user) {
      user = await USER.create({
        email,
        name: `${firstName || ""} ${lastName || ""}`.trim(),
        picture,
        is_google_user: true,
      });
      wasNew = true;
    }

    const token = await generateJWTtoken(user._id, user.email);

    // Cookie options: adjust for your environment (see notes below)
    res.cookie("tokenMyhandleProf", token, {
      httpOnly: true,
      secure: true,    // set true in production when using HTTPS
      sameSite: "Lax",  // or 'None' if your frontend is on a different domain and you use HTTPS
    });

    return res.status(200).json({
      success: true,
      message: wasNew ? "User registered successfully" : "User logged in successfully",
      user: {
        user_id: user._id,
        user_email: user.email,
      },
      token,
      wasNew
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error", message: "An error occurred" });
  }
});

router.post("/participant-user-login-gmail", async (req, res) => {
  try {
    const { email, firstName, lastName, picture } = req.body;
    console.log("email : ", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await ParticipantUser.findOne({ email });
    let wasNew = false;

    if (!user) {
      user = await ParticipantUser.create({
        email,
        name: `${firstName || ""} ${lastName || ""}`.trim(),
        picture,
        is_google_user: true,
      });
      wasNew = true;
    }

    const token = await generateJWTtoken(user._id, user.email);

    // Cookie options: adjust for your environment (see notes below)
    res.cookie("tokenParticipantMyHandle", token, {
      httpOnly: true,
      secure: true,    // set true in production when using HTTPS
      sameSite: "Lax",  // or 'None' if your frontend is on a different domain and you use HTTPS
    });

    return res.status(200).json({
      success: true,
      message: wasNew ? "User registered successfully" : "User logged in successfully",
      user: {
        user_id: user._id,
        user_email: user.email,
      },
      token,
      wasNew
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error", message: "An error occurred" });
  }
});

router.post("/save-username", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });

    let { handleUserName, goal } = req.body || {};
    if (!handleUserName || typeof handleUserName !== "string") {
      return res.status(400).json({ success: false, message: "handleUserName is required" });
    }

    // sanitize & normalize
    handleUserName = handleUserName.trim().toLowerCase();

    // validate same pattern as frontend
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    if (!usernameRegex.test(handleUserName)) {
      return res.status(400).json({ success: false, message: "Invalid username format" });
    }

    // check uniqueness (exclude current user)
    const existing = await USER.findOne({ handleUserName });
    if (existing && String(existing._id) !== String(userId)) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    // update current user
    const updated = await USER.findByIdAndUpdate(
      userId,
      { handleUserName, goal, updated_at: new Date() },
      { new: true }
    ).select("-password"); // remove sensitive fields if any

    return res.json({ success: true, message: "Username saved", user: updated });
  } catch (err) {
    console.error("handle-username error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/user/socials", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const user = await USER.findById(userId).select("socials").lean();
    return res.json({ socials: user?.socials || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/user/socials", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    const { platform, url } = req.body;
    if (!platform || !url) return res.status(400).json({ error: "platform and url required" });

    const allowed = ["youtube", "twitter", "instagram", "linkedin", "whatsapp"];
    if (!allowed.includes(platform)) return res.status(400).json({ error: "invalid platform" });

    const user = await USER.findById(userId).select("socials");
    if (!user) return res.status(404).json({ error: "user not found" });

    // Case-insensitive duplicate check
    const exists = user.socials.some(s => String(s.platform).toLowerCase() === platform.toLowerCase());
    if (exists) return res.status(409).json({ error: "platform already added" });

    const socialObj = { platform, url, created_at: new Date() };
    user.socials.push(socialObj);
    await user.save();

    // return the new social (last item)
    const added = user.socials[user.socials.length - 1];
    return res.status(201).json({ social: added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.delete("/user/socials/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "invalid id" });

    const user = await USER.findById(userId).exec();
    if (!user) return res.status(404).json({ error: "user not found" });

    user.socials = user.socials.filter((s) => String(s._id) !== String(id));
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


  router.get('/get-user-details', authenticateToken, async function (req, res){

    const userId = req.user?.user_id;

        if (!userId) {
          return res.status(400).json({ message: "Username is invalid." });
        }
  
    USER.findById(userId).then((result)=>{
  
      if(result){
  
      res.status(200).send({ success: true, data: { name: result.name, handleUserName: result.handleUserName, picture : result.picture, intro: result.intro, leftHeadImage: result.leftHeadImage, rightTopImage: result.rightTopImage, rightBottomImage: result.rightBottomImage, store_enabled: result.store_enabled, dm_enabled: result.dm_enabled}});
      res.end();

  
      }
  
      else{
      res.status(200).send({ success: false, data: null });
      res.end();
  
      }
  
    }).catch(e2=>{
  
      console.error("❌ Error fetching campaign details:", e2);
      return res.status(500).json({ error: "Internal Server Error" });
  
    })
  });

  router.post('/update-block-order', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid payload' });

    // For safety only allow updating blocks belonging to this user
    const bulkOps = order.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.id, user_id: userId },
          update: { $set: { order: parseInt(item.order, 10) || 0, updated_at: new Date() } },
        },
      };
    });

    if (bulkOps.length === 0) return res.json({ success: true, message: 'No changes' });

    const result = await Block.bulkWrite(bulkOps);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('update-block-order error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get("/profile", async (req, res) => {
  try {
    // const handle = (req.query.handle || extractSubdomain(req.headers.host || "") || "").trim().toLowerCase();
    const handle = "sid4real";
    if (!handle) return res.status(400).json({ error: "handle required" });

    const user = await USER.findOne({ handleUserName: handle }).lean();
    if (!user) return res.status(404).json({ error: "not found" });

    const blocks = await Block.find({ user_id: user._id, is_del: false })
      .sort({ order: 1, created_at: -1 })
      .lean();

    const { _id, __v, ...userRest } = user;
    const payload = { ...userRest, id: String(_id), blocks: blocks || [], socials: user.socials || [] };

    // === Analytics logging ===
    (async () => {
      try {
        const ip = await getClientIp(req);
        const ua = req.headers["user-agent"] || "";
        const ref = req.headers["referer"] || req.headers["referrer"] || "";

        // call ipdata; if null, we'll still create event with ip only
        const geo = await lookupGeo_ipdata(ip);

         let geoLanguages = [];
  try {
    const rawLangs = geo?.raw?.languages;
    if (Array.isArray(rawLangs) && rawLangs.length) {
      geoLanguages = rawLangs.map((l) => {
        // l may be { name, native, code } or other shapes; be defensive
        return {
          name: l?.name || l?.language || null,
          native: l?.native || null,
          code: l?.code || l?.iso || null,
        };
      }).filter(Boolean);
    }
  } catch (langErr) {
    console.warn("Failed to parse geo languages:", langErr?.message || langErr);
  }

        const eventDoc = {
          user_id: user._id,
          user_agent: ua,
          referrer: ref,
          ip: geo?.ip,
          country: geo?.country,
          region: geo?.region,
          city: geo?.city,
          postal: geo?.postal,
          latitude: geo?.latitude,
          longitude: geo?.longitude,
          geo_languages: geoLanguages,
        };

        await PageAnalytics.create(eventDoc);

        // upsert daily counter
        const dateKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        // await PageAnalyticsCounter.updateOne(
        //   { user_id: user._id, date: dateKey, event: "profile_view" },
        //   { $inc: { count: 1 }, $set: { updated_at: new Date() } },
        //   { upsert: true }
        // );
      } catch (aerr) {
        console.warn("analytics logging error (profile):", aerr?.message || aerr);
      }
    })(); 

    return res.json(payload);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return res.status(500).json({ error: "internal" });
  }
});

router.post("/submit-form", async (req, res) => {
  try {
    // extract possible keys (be tolerant of different names)
    const {
      formId,
      userId,
      blockId,
      blockName,
      values = {},
      meta = {},
    } = req.body || {};

    // basic validation: values should be an object
    if (values == null || typeof values !== "object") {
      return res.status(400).json({ message: "Invalid values payload; expected an object." });
    }

   (async () => {
      try {
        const ip = await getClientIp(req);
        const ua = req.headers["user-agent"] || "";
        const ref = req.headers["referer"] || req.headers["referrer"] || "";

        // call ipdata; if null, we'll still create event with ip only
        const geo = await lookupGeo_ipdata(ip);

      const doc = new FormsData({
      form_id: formId || undefined,
      user_id: userId || undefined,
      block_id: blockId || undefined,
      block_name: blockName || undefined,
      values,
      meta,
      submitted_at: meta?.submittedAt ? new Date(meta.submittedAt) : undefined,
        user_agent: ua,
          referrer: ref,
          country: geo?.country,
          ip: geo?.ip,
          region: geo?.region,
          city: geo?.city,
          postal: geo?.postal,
          latitude: geo?.latitude,
          longitude: geo?.longitude,
    });

    await doc.save();

    return res.status(201).json({ message: "Form submitted", id: doc._id });

      } catch (aerr) {
        console.warn("analytics logging error (profile):", aerr?.message || aerr);
      }
    })(); 



  } catch (err) {
    console.error("Error saving form submission:", err);
    return res.status(500).json({ message: "Failed to save submission" });
  }
});

router.post("/link-click-analytics", async (req, res) => {
  try {
    const { link_key } = req.body || {};
    if (!link_key) return res.status(400).json({ error: "link_key required" });

    // find block exists (quick check). You can also do the update blindly and check modifiedCount.
    const blockExists = await Block.exists({ _id: link_key });
    if (!blockExists) return res.status(404).json({ error: "block not found" });

    // get client info
    const ip = await getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const referrer = req.headers["referer"] || req.headers["referrer"] || null;
    const geo = await lookupGeo_ipdata(ip);

    const analyticsEntry = {
      ip: geo.ip || null,
      user_agent: userAgent,
      referrer: referrer,
      country: geo?.country || null,
      country_code: geo?.country || geo?.country_code || null,
      region: geo?.region || null,
      city: geo?.city || null,
      postal: geo?.postal || null,
      latitude: geo?.latitude || null,
      longitude: geo?.longitude || null,
    };

    // atomic push into the array
    const updateResult = await Block.updateOne(
      { _id: link_key },
      { $push: { link_click_analytics: analyticsEntry } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "block not found (race?)" });
    }

    return res.status(201).json({ ok: true, analytics: analyticsEntry });
  } catch (err) {
    console.error("Error saving link click analytics:", err);
    return res.status(500).json({ message: "Failed to save link click analytics" });
  }
});

router.post("/upload-product", upload.single("image"), authenticateToken, async (req, res) => {
  try {

    const userId = req.user?.user_id;

    const { title, link } = req.body;
    if (!title || !link) {
      return res.status(400).json({ message: "title and link required" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      // Case A: multer({ dest: "uploads/" }) -> req.file.path exists (disk)
      if (req.file.path) {
        const uploaded = await uploadFilePathToGCS(req.file.path, req.file.originalname, req.file.mimetype);
        imageUrl = uploaded.publicUrl;
        imagePublicId = uploaded.objectName;
        // uploadFilePathToGCS already tries to unlink the local file after upload,
        // but in case your helper doesn't, ensure cleanup:
        if (fs.existsSync(req.file.path)) {
          try { await unlinkAsync(req.file.path); } catch (e) { /* ignore */ }
        }
      }
      // Case B: multer.memoryStorage() -> req.file.buffer exists
      else if (req.file.buffer) {
        const uploaded = await uploadBufferToGCS(req.file.buffer, req.file.originalname, req.file.mimetype);
        imageUrl = uploaded.publicUrl;
        imagePublicId = uploaded.objectName;
      } else {
        // Fallback: unexpected multer shape
        console.warn("Uploaded file present but no path or buffer found:", req.file);
      }
    }

    const prod = await Product.create({ user_id: userId, title, link, imageUrl, imagePublicId });
    return res.json({ product: prod });
  } catch (err) {
    console.error("Create product error:", err);

    // attempt to remove multer temp file on error (best-effort)
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        await unlinkAsync(req.file.path);
      }
    } catch (cleanupErr) {
      console.warn("Failed to cleanup temp file:", cleanupErr.message);
    }

    return res.status(500).json({ message: "Error creating product", error: err.message });
  }
});


router.get("/fet-user-products", authenticateToken, async (req, res) => {

    const userId = req.user?.user_id;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    try {
      // support req.user.id or req.user._id
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: no user id" });
      }

      const filter = { user_id: userId, is_del: false };

      const [data, total] = await Promise.all([
        Product.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      return res.json({ data, total });
    } catch (err) {
      console.error("List user products error:", err);
      return res.status(500).json({ message: "Error fetching products" });
    }
  }
);

router.post("/edit-product/:id", authenticateToken, upload.single("image"), async (req, res) => {
    try {

      const userId = req.user?.user_id;
      const id = req.params.id;
      const { title, link } = req.body;

      const product = await Product.findOne({_id: id, user_id : userId});
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Update fields
      if (title) product.title = title;
      if (link) product.link = link;

      // If new image uploaded, upload to GCS and delete old object (if exists)
      if (req.file) {
        let uploaded;
        // Case A: multer({ dest: "uploads/" }) -> req.file.path exists (disk)
        if (req.file.path) {
          uploaded = await uploadFilePathToGCS(req.file.path, req.file.originalname, req.file.mimetype);
          // uploadFilePathToGCS already tries to unlink the local file after upload,
          // but double-check and cleanup if still present:
          try {
            if (fs.existsSync(req.file.path)) {
              await unlinkAsync(req.file.path);
            }
          } catch (e) {
            console.warn("Failed to unlink temp file:", e.message);
          }
        }
        // Case B: multer.memoryStorage() -> req.file.buffer exists
        else if (req.file.buffer) {
          uploaded = await uploadBufferToGCS(req.file.buffer, req.file.originalname, req.file.mimetype);
        } else {
          console.warn("Uploaded file present but neither path nor buffer found:", req.file);
        }

        if (uploaded) {
          // delete old object if exists
          if (product.imagePublicId && bucket) {
            try {
              await bucket.file(product.imagePublicId).delete();
            } catch (err) {
              console.warn("Failed to delete old image from GCS:", err.message);
              // not fatal
            }
          }

          product.imageUrl = uploaded.publicUrl;
          product.imagePublicId = uploaded.objectName;
        }
      }

      await product.save();
      return res.json({ product });
    } catch (err) {
      console.error("Edit product error:", err);

      // attempt to remove multer temp file on error (best-effort)
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          await unlinkAsync(req.file.path);
        }
      } catch (cleanupErr) {
        console.warn("Failed to cleanup temp file:", cleanupErr.message);
      }

      return res.status(500).json({ message: "Error editing product", error: err.message });
    }
  }
);

router.delete("/delete-product/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.user_id;
      const id = req.params.id;

      // validate id
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      // find product
      const product = await Product.findOne({_id: id, user_id : userId});

      if (!product) return res.status(404).json({ message: "Product not found" });


      // if already soft-deleted
      if (product.is_del) {
        return res.status(400).json({ message: "Product already deleted" });
      }

      // Soft-delete: mark flags but keep DB row and GCS object intact
      product.is_del = true;
      product.updated_at = new Date();
      await product.save();

      return res.json({ message: "Product soft-deleted", productId: id });
    } catch (err) {
      console.error("Delete product error:", err);
      return res.status(500).json({ message: "Error deleting product" });
    }
  }
);

router.post("/upload-header-image", authenticateToken, upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Multer memoryStorage provides file.buffer
      const file = req.file;
      const rawPosition = req.body?.position;

      // Basic validation
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Ensure you send multipart/form-data with field name 'image'.",
        });
      }

      const targetField = normalizePosition(rawPosition);
      if (!targetField) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid position value. Acceptable values: left | headerImage1 | 1, rightTop | headerImage2 | 2, rightBottom | headerImage3 | 3",
        });
      }

      // Upload buffer to GCS (your helper) - it should return { publicUrl, objectName }
      const { publicUrl, objectName } = await uploadBufferToGCS(
        file.buffer,
        file.originalname || `upload-${Date.now()}`,
        file.mimetype || "application/octet-stream"
      );

      if (!publicUrl) {
        return res.status(500).json({ success: false, message: "Failed to upload to storage" });
      }

      // Update user doc
      const update = { [targetField]: publicUrl, updated_at: new Date() };
      const updatedUser = await USER.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.json({
        success: true,
        url: publicUrl,
        updatedField: targetField,
        objectName,
        user: {
          _id: updatedUser._id,
          leftHeadImage: updatedUser.leftHeadImage,
          rightTopImage: updatedUser.rightTopImage,
          rightBottomImage: updatedUser.rightBottomImage,
        },
      });
    } catch (err) {
      console.error("upload-header-image error:", err);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err?.message || String(err),
      });
    }
  }
);


router.get("/fetch-influencer-products", async (req, res) => {
  try {
    console.log("Incoming URL:", req.originalUrl);
    console.log("Query object:", req.query);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;
    const qRaw = (req.query.q || "").trim();

    const subdomainRaw = (req.query.subdomain || "").trim();
    if (!subdomainRaw) {
      // No subdomain supplied — return empty set (or treat as public/global)
      // You can instead return all products or 400; choose what's appropriate.
      console.log("No subdomain provided");
      return res.json({ data: [], total: 0 });
    }

    // Find user by handleUserName (case-insensitive); fallback to 'handle' if you have that field
    // Use exact match (case-insensitive) rather than substring for safety.
    const handleRegex = new RegExp("^" + escapeRegex(subdomainRaw) + "$", "i");
    const user = await USER.findOne(
      { $or: [{ handleUserName: handleRegex }, { handle: handleRegex }] },
      { _id: 1 } // projection: only need _id
    ).lean();

    if (!user) {
      console.log("No user found for subdomain:", subdomainRaw);
      // return empty result — optional: res.status(404).json({ error: "User not found" });
      return res.json({ data: [], total: 0 });
    }

    const userId = user._id;
    console.log("Resolved subdomain -> userId:", userId.toString());

    // Build product filter for that user
    const filter = { user_id: userId, is_del: false };

    if (qRaw) {
      const safe = escapeRegex(qRaw);
      const re = new RegExp(safe, "i");
      filter.$or = [{ title: re }, { name: re }, { link: re }];
    }

    const projection = {}; // adjust if you want to exclude heavy fields

    const [data, total] = await Promise.all([
      Product.find(filter, projection).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({ data, total });
  } catch (err) {
    console.error("List influencer products error:", err);
    return res.status(500).json({ message: "Error fetching products" });
  }
});

router.post("/enable-store", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Accept { enabled: true/false } in body; default to true if not provided
    const { enabled = true } = req.body ?? {};

    // validate boolean-ish values
    const storeEnabled = enabled === true || enabled === "true" || enabled === 1 || enabled === "1";

    // Update the user's document
    const update = { $set: { store_enabled: storeEnabled } };

    // findOneAndUpdate returns the previous by default; pass { new: true } to get updated document
    const updated = await USER.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true, projection: { store_enabled: 1, _id: 0 } }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, enabled: Boolean(updated.store_enabled) });
  } catch (err) {
    console.error("POST /enable-store error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
