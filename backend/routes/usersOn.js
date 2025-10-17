import express from "express";
import cookieParser from "cookie-parser";
import axios from "axios";
const router = express.Router();
import USER from "../models/User.js";
import ParticipantUser from "../models/ParticipantUser.js";
import Conversation from "../models/Conversations.js";
import Subscriptions from "../models/Subscriptions.js";
import Message from "../models/Messages.js";
import Block from "../models/Blocks.js";
import FormsData from "../models/FormsData.js";
import BankDetails from "../models/BankDetails.js";
import Transaction from "../models/Transaction.js";
import Automation from "../models/Automation.js";
import Product from "../models/ProductsCatalogue.js";
import PageAnalytics from "../models/PageAnalytics.js";
import NewsletterModel from "../models/Newsletter.js";
import ProductCategory from "../models/ProductCategory.js";
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
import Razorpay from "razorpay";
const unlinkAsync = util.promisify(fs.unlink);
import NodeCache from "node-cache";
const metaCache = new NodeCache({ stdTTL: 86400 });
import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new Storage({
  keyFilename: join(__dirname, 'service-account-key.json')});
  
const bucketName = "postlnbucketcom"; 
const bucket = storage.bucket(bucketName);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB - adjust based on your needs
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Optional but recommended: validate file types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});
const IPDATA_KEY = process.env.IPDATA_KEY;
const OID = (v) => new mongoose.Types.ObjectId(String(v));
const actorKey = (model, id) => `${model}:${id.toString()}`;


const RZP_KEY_ID = process.env.RZP_KEY_ID;
const RZP_KEY_SECRET = process.env.RZP_KEY_SECRET;

const rz = new Razorpay({
  key_id: RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});



function escapeRegex(str = "") {
  // escape special regex chars to keep regex search safe
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LINKPREVIEW_API_KEY = process.env.LINKPREVIEW_API_KEY;

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

const UA ="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36";

const getFirst = async(html, regexes) => {
  for (const rx of regexes) {
    const m = html.match(rx);
    if (m && m[1]) return m[1].trim();
  }
  return null;
};

// Amazon-specific fallbacks
async function extractAmazonImage(html) {
  // 1) data-old-hires on landing image
  let m = html.match(/id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];

  // 2) data-a-dynamic-image JSON with urls as keys
  m = html.match(/data-a-dynamic-image=['"]({.*?})['"]/i);
  if (m?.[1]) {
    try {
      const obj = JSON.parse(m[1]
        .replace(/&quot;/g, '"') // sometimes encoded
      );
      const keys = Object.keys(obj || {});
      if (keys.length) return keys[0];
    } catch (_) {}
  }

  // 3) hiRes or main image in embedded JSON
  m = html.match(/"hiRes"\s*:\s*"([^"]+)"/i);
  if (m?.[1]) return m[1];

  // 4) twitter:image as last resort (Amazon often sets this)
  m = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];

  return null;
}

const resolveUrl = async(base, maybeRelative) => {
  try { return maybeRelative ? new URL(maybeRelative, base).href : null; }
  catch { return maybeRelative || null; }
};


// low-level fetch wrapper
async function tryFetch(url, headers, timeout = 10000) {
  return axios.get(url, {
    responseType: "text",
    maxRedirects: 10,
    timeout,
    headers,
    validateStatus: (s) => s >= 200 && s < 400, // treat redirects as ok (axios follows them)
  });
}




// Helper: parse date range from key
async function getDateRange(rangeKey) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (rangeKey) {
    case "today":
      return { start: startOfToday, end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) };
    case "last7": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6); // include today => 7 days
      const end = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    }
    case "last28": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 27);
      const end = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    }
    default:
      return null; // no filter
  }
}

// utils/extractSubdomain.js
async function extractHandleFromHost(host, roots = ["myhandle.in"]) {
  if (!host) return "";
  const raw = String(host).toLowerCase().split(":")[0]; // strip :3000, etc.

  // If the host matches any known root (or is a subdomain of it)
  for (const root of roots) {
    if (raw === root || raw.endsWith("." + root)) {
      // remove ".root" from the end to get the left part(s)
      const left = raw.replace(new RegExp("\\." + root.replace(/\./g, "\\.") + "$"), "");
      if (!left) return "";

      // e.g. "sid4real" or "www.sid4real"
      const parts = left.split(".");
      // If there's a leading "www", drop it and pick the next label
      const last = parts[0] === "www" ? parts.slice(1) : parts;
      return last.length ? last[last.length - 1] : "";
    }
  }

  // Generic fallback: sub.domain.tld => take first label (with www handling)
  const parts = raw.split(".");
  if (parts.length >= 3) return parts[0] === "www" ? parts[1] : parts[0];
  return "";
}

// --- helpers ---
const RESERVED = new Set([
  "www","admin","root","api","mail","support","help","blog","status","app","cdn",
  "static","images","dev","test","staging","beta"
]);

const isValidSubdomain = (s) =>
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s);


function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}
const ALLOWED = new Set([
  "keywords",
  "hasPublicReply",
  "publicReply",
  "dm.enabled",
  "dm.message",
  "dm.button",
  "dm.button.text",
  "dm.button.url",
]);


const IG_API_VERSION = "v21.0"; // bump if you’re targeting a newer Graph version

// Axios client
const ig = axios.create({
  baseURL: `https://graph.facebook.com/${IG_API_VERSION}`,
  timeout: 20000,
});



// async function uploadBufferToGCS(buffer, originalName, mimeType) {
//   if (!bucket) throw new Error("GCS bucket not configured.");
//   const ext = path.extname(originalName) || "";
//   const objectName = `products/${Date.now()}-${crypto
//     .randomBytes(6)
//     .toString("hex")}${ext}`;
//   const file = bucket.file(objectName);

//   return new Promise((resolve, reject) => {
//     const stream = file.createWriteStream({
//       metadata: { contentType: mimeType },
//       resumable: false,
//     });

//     stream.on("error", (err) => reject(err));
//     stream.on("finish", async () => {
//       try {
//         await file.makePublic();
//         const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
//         resolve({ publicUrl, objectName });
//       } catch (err) {
//         reject(err);
//       }
//     });

//     // 🔑 Actually write the in-memory buffer to GCS
//     stream.end(buffer);
//   });
// }



async function uploadBufferToGCS(buffer, filename, mimetype) {
  try {
    console.log('uploadBufferToGCS called:', { 
      bufferSize: buffer.length, 
      filename, 
      mimetype 
    });

    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`uploads/${Date.now()}-${filename}`);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('GCS stream error:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        try {
          await blob.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          console.log('GCS upload successful:', publicUrl);
          resolve({ publicUrl, objectName: blob.name });
        } catch (err) {
          console.error('Error making file public:', err);
          reject(err);
        }
      });

      blobStream.end(buffer);
    });
  } catch (err) {
    console.error('uploadBufferToGCS error:', err);
    throw err;
  }
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

async function makeReceipt(productId) {
  const pid = String(productId || "na").replace(/[^a-zA-Z0-9_-]/g, "").slice(-8); // last 8 safe chars
  const ts = Date.now().toString(36);        // compact timestamp
  const rnd = Math.random().toString(36).slice(2, 6); // 4-char randomness
  // e.g. r_pidAbcd_ts4fzgc_rndk9x2
  const receipt = `r_${pid}_${ts}_${rnd}`;
  return receipt.slice(0, 40);
}

router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("tokenMyhandleProf", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".myhandle.in",  // CRITICAL: Must match cookie creation
    path: "/",
  });
  
  res.status(200).json({ message: "Logged out successfully" });
});

const DEMO_EMAIL = "demoaccount@myhandle.in";
const DEMO_PASS = "demoaccount";

router.post("/demo-login", async (req, res) => {
try {
const { demoEmail, demoPass } = req.body || {};


if (!demoEmail || !demoPass) {
return res.status(400).json({ success: false, message: "Missing email or password" });
}


// Constant-time-ish comparison for tiny hardcoded creds
const ok = demoEmail.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && demoPass === DEMO_PASS;


if (!ok) {
return res.status(401).json({ success: false, message: "Invalid demo credentials" });
}


   const DEMO_USER_ID = new mongoose.Types.ObjectId("68cbc39db5f421a8a043046f");

    await USER.updateOne(
      { _id: DEMO_USER_ID },
      {
        $set: {
          demo_logged_in: true,
          demo_logged_date: new Date(),
        },
      }
    );


    const token = await generateJWTtoken('68cbc39db5f421a8a043046f', 'techiebhaskar7@gmail.com');

    // Cookie options: adjust for your environment (see notes below)
      res.cookie("tokenMyhandleProf", token, {
  httpOnly: true,
  secure: true,                  // required when SameSite=None
  sameSite: "none",              // critical for iOS/Safari & any cross-site/iframe usage
   domain: ".myhandle.in",// needed if crossing subdomains
  path: "/",             // ensure all routes get it
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    return res.status(200).json({
      success: true,
      user: {
        user_id: '68cbc39db5f421a8a043046f',
        user_email: 'techiebhaskar7@gmail.com',
      },
      token
    });
} catch (err) {
console.error("demo-login error", err);
return res.status(500).json({ success: false, message: "Server error" });
}
});

router.get("/get-my-transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1) Find user's handle/ subdomain
    const user = await USER.findById(userId).select("handleUserName email name").lean();
    if (!user || !user.handleUserName) {
      return res.status(404).json({ error: "User or handle not found" });
    }
    const subdomain = user.handleUserName;

    // 2) Parse query
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);

    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 7); // last 7 days by default

    const start = req.query.start ? new Date(req.query.start) : defaultStart;
    const end = req.query.end ? new Date(req.query.end) : now;
    // normalize end to end-of-day
    end.setHours(23, 59, 59, 999);

    const match = {
      subdomain,
      status: "paid",
      paidAt: { $gte: start, $lte: end },
    };

    // 3) Count + fetch (project only what UI needs + a few audit fields)
    const [total, rows] = await Promise.all([
      Transaction.countDocuments(match),
      Transaction.find(match)
        .sort({ paidAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .select({
          productTitle: 1,
          paidAt: 1,
          amount: 1,
          currency: 1,
          customer: 1,
          paymentMethod: 1,
          orderId: 1,
          paymentId: 1,
          subdomain: 1,
          status: 1,
        })
        .lean()
    ]);

    res.json({
      page,
      limit: perPage,
      total,
      hasMore: page * perPage < total,
      range: { start, end },
      subdomain,
      data: rows,
    });
  } catch (err) {
    console.error("GET /api/transactions/mine error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// router.post("/connect-instagram", authenticateToken, async (req, res) => {
  
//   try {
//     const userId = req.user?.user_id;
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//    const FB_APP_ID = process.env.FB_APP_ID;
//     const FB_APP_SECRET = process.env.FB_APP_SECRET;

//     const { data } = req.body || {};
//     if (!data || !data.accessToken) {
//       return res.status(400).json({ error: "Missing authentication data" });
//     }
//     const userAccessToken = data.accessToken;
//     // --- Resolve igUserId without asking the user ---
//     const providedIgUserId = data.userID;

//     let igAccounts = [];
//     let igUsername = null;
//     let igProfilePic = null;
//     let followersCount = null;
//     let igMediaCount = null;
//     let pageAccessToken = null; // not used in direct path

//   // --- Direct IG user path with Business Account fallback ---
// if (providedIgUserId) {
//   try {
//     // Step 1: Try to get basic user info (this endpoint has limited fields)
//     const basicFields = "businesses";
//     const { data: igResp } = await axios.get(
//       `https://graph.facebook.com/v20.0/${providedIgUserId}`,
//       { params: { fields: basicFields, access_token: userAccessToken } }
//     );


//     const businesses_id = igResp.businesses.data[0].id;

//     const ownedAssBasicFields = "owned_instagram_assets";

//       const { data: ownedAssResp } = await axios.get(
//       `https://graph.facebook.com/v20.0/${businesses_id}`,
//       { params: { fields: ownedAssBasicFields, access_token: userAccessToken } }
//     );

//     const ig_user_id = ownedAssResp.owned_instagram_assets.data[0].ig_user_id;


//       // Step 2: Try to get followers_count via Instagram Business Account
//       let followersData = null;

//       try {
//         const { data: businessResp } = await axios.get(
//           `https://graph.facebook.com/v20.0/${ig_user_id}`,
//           {
//             params: {
//               fields: "id,followers_count,has_profile_pic,ig_id,name,profile_picture_url,biography,media_count,username,follows_count",
//               access_token: userAccessToken,
//             },
//           }
//         );
//         followersData = businessResp;
//         console.log('Business Account Data:', followersData);
//       } 
//       catch (businessErr) {
//         console.warn("Could not fetch business account metrics:", businessErr?.response?.data?.error?.message);
//         followersData = null;
//       }

//       followersCount = followersData?.followers_count ?? null;
//       igMediaCount = followersData?.media_count ?? null;


//       igAccounts.push({
//         ig_user_id: followersData?.id ?? null,
//         followers_count: followersData?.followers_count ?? null,
//         has_profile_pic: followersData?.has_profile_pic ?? false,
//         ig_id: followersData?.ig_id ?? null,
//         ig_name: followersData?.name ?? null,
//         profile_picture_url: followersData?.profile_picture_url ?? null,
//         biography: followersData?.biography ?? "",
//         media_count: followersData?.media_count ?? 0,
//         ig_username: followersData?.username ?? "",
//         follows_count: followersData?.follows_count ?? 0,
       
//       });
    
//   } catch (e) {
//     console.warn("Direct IG fetch failed:", {
//       status: e?.response?.status,
//       error: e?.response?.data?.error?.message || e.message,
//       code: e?.response?.data?.error?.code,
//     });
//   }
// }

//     // --- Long-lived token exchange (best effort) ---
//     let longLivedToken = null;
//     try {
//       const { data: tokenExchange } = await axios.get(
//         "https://graph.facebook.com/v20.0/oauth/access_token",
//         {
//           params: {
//             grant_type: "fb_exchange_token",
//             client_id: FB_APP_ID,
//             client_secret: FB_APP_SECRET,
//             fb_exchange_token: userAccessToken,
//           },
//         }
//       );
//       longLivedToken = tokenExchange?.access_token || null;
//     } catch (e) {
//       console.warn("Could not exchange for long-lived token:", e?.message);
//     }

//     // --- Token expiry (works for short/long) ---
//     let tokenExpiry = null;
//     try {
//       const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
//       const tokenToInspect = longLivedToken || userAccessToken;
//       const { data: debugResp } = await axios.get(
//         "https://graph.facebook.com/debug_token",
//         {
//           params: {
//             input_token: tokenToInspect,
//             access_token: appAccessToken,
//           },
//         }
//       );
//       const expiresAt = debugResp?.data?.expires_at; // unix seconds
//       if (expiresAt) tokenExpiry = new Date(expiresAt * 1000).toISOString();
//     } catch (e) {
//       console.warn("Could not fetch token expiry via debug_token:", e?.message);
//     }

//     // --- Save ---
//     if (igAccounts.length > 0) {
//       const first = igAccounts[0];

//         igAccounts.push({

//         ig_user_id: first?.id ?? null,
//         followers_count: first?.followers_count ?? null,
//         has_profile_pic: first?.has_profile_pic ?? false,
//         ig_id: first?.ig_id ?? null,
//         ig_name: first?.name ?? null,
//         profile_picture_url: first?.profile_picture_url ?? null,
//         biography: first?.biography ?? "",
//         media_count: first?.media_count ?? 0,
//         ig_username: first?.username ?? "",
//         follows_count: first?.follows_count ?? 0,
       
//       });

//       await USER.updateOne(
//         { _id: userId },
//         {
//           $set: {
//             instagramConnected: true,
//             igUserId: first.ig_user_id,
//             igUsername: first.ig_username,
//             igProfilePic: first.profile_picture_url,
//             igFollowersCount: first.followers_count,
//             igFollowsCount: first.follows_count,
//             igMediaCount: first.media_count,
//             igId: first.ig_id,
//             igName: first.ig_name,
//             igBiography: first.biography,
//             has_profile_pic_ig: first.has_profile_pic,
//             fbLongLivedToken: longLivedToken || userAccessToken,
//             fbTokenExpiry: tokenExpiry || null,
//           },
//         }
//       );
//     } else {
//       // Nothing fetched → explain clearly what’s missing
//       return res.status(400).json({
//         error: providedIgUserId
//           ? "Could not fetch Instagram account with the stored igUserId. Ensure the token has instagram_basic and the IG account is Business/Creator."
//           : "igUserId not found in request or user record. Save igUserId once during onboarding, or include it in the request.",
//       });
//     }

//     return res.json({
//       success: true,
//       igAccounts,
//       igUsername,
//       igProfilePic,
//       followersCount,
//       message: `Connected ${igUsername || "Instagram account"}.`,
//     });
//   } catch (err) {
//     console.error("IG connect error:", err?.response?.data || err.message);
//     return res.status(500).json({
//       error: err?.response?.data?.error?.message || err.message || "Server error",
//       details: err?.response?.data,
//     });
//   }
// });

router.post("/connect-instagram", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data } = req.body || {};
    if (!data || !data.accessToken || !data.userID) {
      return res.status(400).json({ error: "Missing authentication data" });
    }

    const FB_APP_ID = process.env.FB_APP_ID;
    const FB_APP_SECRET = process.env.FB_APP_SECRET;

    const shortLivedUserToken = data.accessToken;

    // 1) Exchange short-lived user token -> long-lived (recommended)
    let longLivedUserToken = shortLivedUserToken;
    try {
      const { data: tokenExchange } = await axios.get(
        "https://graph.facebook.com/v20.0/oauth/access_token",
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: FB_APP_ID,
            client_secret: FB_APP_SECRET,
            fb_exchange_token: shortLivedUserToken,
          },
          timeout: 15000,
        }
      );
      if (tokenExchange?.access_token) {
        longLivedUserToken = tokenExchange.access_token;
      }
    } catch (e) {
      console.warn("Token exchange failed, using short-lived token:", e?.message);
    }

    // 2) Derive token expiry using debug_token
    let userTokenExpiryISO = null;
    try {
      const appAccessToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
      const { data: debugResp } = await axios.get(
        "https://graph.facebook.com/debug_token",
        {
          params: {
            input_token: longLivedUserToken,
            access_token: appAccessToken,
          },
          timeout: 15000,
        }
      );
      const expiresAt = debugResp?.data?.expires_at; // unix seconds
      if (expiresAt) userTokenExpiryISO = new Date(expiresAt * 1000).toISOString();
    } catch (e) {
      console.warn("debug_token failed:", e?.message);
    }

    // 3) Pages (need access_token + instagram_business_account)
    const { data: pagesResponse } = await axios.get(
      "https://graph.facebook.com/v20.0/me/accounts",
      {
        params: {
          fields: "name,id,access_token,instagram_business_account{id}",
          access_token: longLivedUserToken,
        },
        timeout: 15000,
      }
    );

    const pages = pagesResponse?.data || [];
    const pageWithIG = pages.find(
      (p) => p?.instagram_business_account?.id && p?.access_token
    );

    const igAccounts = [];
    let fbPageId = null;
    let fbPageAccessToken = null;

    // IG profile fields we’ll fill
    let igUserId = null;      // canonical IG user id
    let igId = null;          // kept for schema compatibility; same as igUserId
    let igUsername = null;
    let igName = null;        // best-effort (see below)
    let igProfilePic = null;
    let igFollowersCount = null;
    let igFollowsCount = null;
    let igMediaCount = null;
    let igBiography = null;
    let has_profile_pic_ig = false;

    if (pageWithIG) {
      fbPageId = pageWithIG.id;
      fbPageAccessToken = pageWithIG.access_token;
      igUserId = pageWithIG.instagram_business_account.id;
      igId = igUserId; // mirror for legacy field usage

      // 3b) Fetch IG user details (either user token or page token works)
      const { data: igDetail } = await axios.get(
        `https://graph.facebook.com/v20.0/${igUserId}`,
        {
          params: {
            fields:
              "username,profile_picture_url,followers_count,follows_count,media_count,biography",
            access_token: longLivedUserToken,
          },
          timeout: 15000,
        }
      );

      igUsername = igDetail?.username || null;
      igProfilePic = igDetail?.profile_picture_url || null;
      igFollowersCount =
        typeof igDetail?.followers_count === "number" ? igDetail.followers_count : 0;
      igFollowsCount =
        typeof igDetail?.follows_count === "number" ? igDetail.follows_count : 0;
      igMediaCount =
        typeof igDetail?.media_count === "number" ? igDetail.media_count : 0;
      igBiography = igDetail?.biography || null;

      // IG Graph API doesn’t expose a separate "name" for the IG user.
      // Reasonable fallback: use the connected Page name (brand) or the username.
      igName = pageWithIG?.name || igUsername || null;

      has_profile_pic_ig = Boolean(igProfilePic);

      igAccounts.push({
        pageId: fbPageId,
        pageName: pageWithIG.name,
        igUserId,
        username: igUsername,
        profilePic: igProfilePic,
        followersCount: igFollowersCount,
        mediaCount: igMediaCount,
      });

      // 4) Persist ALL requested fields
      await USER.updateOne(
        { _id: userId },
        {
          $set: {
            instagramConnected: true,

            // IG identifiers & names
            igUserId,         // canonical IG user id
            igId,             // duplicate for schema compatibility
            igName,           // best-effort (Page name or username)
            igUsername,

            // Profile & counts
            igProfilePic,
            has_profile_pic_ig,
            igFollowersCount,
            igFollowsCount,
            igMediaCount,
            igBiography,

            // Tokens & expiry
            fbLongLivedToken: longLivedUserToken,
            fbTokenExpiry: userTokenExpiryISO ? new Date(userTokenExpiryISO) : null,

            // Page token (needed for DMs) & id
            fbPageAccessToken,
            fbPageId,

            // Optional capability flag
            dm_enabled: true,
          },
        }
      );
    } else {
      // No IG-linked page found — clear IG-related fields
      await USER.updateOne(
        { _id: userId },
        {
          $set: { instagramConnected: false, dm_enabled: false },
          $unset: {
            igUserId: 1,
            igId: 1,
            igName: 1,
            igUsername: 1,
            igProfilePic: 1,
            has_profile_pic_ig: 1,
            igFollowersCount: 1,
            igFollowsCount: 1,
            igMediaCount: 1,
            igBiography: 1,
            fbLongLivedToken: 1,
            fbTokenExpiry: 1,
            fbPageAccessToken: 1,
            fbPageId: 1,
          },
        }
      );
    }

    return res.json({
      success: true,
      message: pageWithIG
        ? `Connected @${igUsername} via Page ${pageWithIG.name}`
        : "No Facebook Page with a linked Instagram Business/Creator account was found.",
      igAccounts,
      igUsername,
      igProfilePic,
      igFollowersCount,
      igMediaCount,
      fbPageId: fbPageId || null,
      // Do NOT send tokens to the client.
    });
  } catch (err) {
    console.error("IG connect error:", err?.response?.data || err.message);
    return res.status(500).json({
      error: err?.response?.data?.error?.message || err.message || "Server error",
      details: err?.response?.data,
    });
  }
});



  router.get('/instagram-status', authenticateToken, async function (req, res){

    const userId = req.user?.user_id;

        if (!userId) {
          return res.status(400).json({ message: "Username is invalid." });
        }
  
    USER.findById(userId).then((result)=>{
  
      if(result){
  
      res.status(200).send({ instagramConnected : result.instagramConnected, igProfilePic : result.igProfilePic, igUsername : result.igUsername, followersCount : result.igFollowersCount});
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

  router.post('/unlink-instagram', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fields we typically set during Instagram linking.
    // Adjust this list if your schema uses different names.
    const fieldsToClear = {
      instagramConnected: false,
      igUserId: null,
      fbPageAccessToken: null,
      igUsername: null,
      igProfilePic: null,
      igFollowersCount: null,
      igMediaCount: null,
      fbLongLivedToken: null,
      fbTokenExpiry: null,
    };

    // You can either $set nulls, or $unset.
    // Using $set to null is nice because the shape stays visible.
    const updated = await USER.findByIdAndUpdate(
      userId,
      { $set: fieldsToClear },
      { new: true, projection: { fbPageAccessToken: 0, fbLongLivedToken: 0 } } // don't echo tokens even if null
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error('❌ Error unlinking Instagram:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function saveBankDetails(req, res) {
  try {
    const rawUserId = req.user?.user_id;
    const userId = mongoose.isValidObjectId(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    let { name, bankName, accountNumber, ifsc } = req.body || {};
    name = (name || "").trim();
    bankName = (bankName || "").trim();
    accountNumber = (accountNumber || "").trim();
    ifsc = (ifsc || "").trim().toUpperCase();

    if (!name || !bankName || !accountNumber || !ifsc) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!/^\d{6,18}$/.test(accountNumber)) {
      return res.status(400).json({ message: "Account Number should be 6–18 digits." });
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return res.status(400).json({ message: "Invalid IFSC code." });
    }

    const doc = await BankDetails.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          name_on_bank: name,
          bank_name: bankName,
          account_number: accountNumber,
          bank_ifsc: ifsc,
          is_del: false,
        },
        $setOnInsert: { user_id: userId },
      },
      { new: true, upsert: true }
    ).lean();

    return res.json({
      bankDetails: {
        name: doc.name_on_bank,
        bankName: doc.bank_name,
        accountNumber: doc.account_number,
        ifsc: doc.bank_ifsc,
      },
    });
  } catch (e) {
    console.error("saveBankDetails error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

router.post("/automation/config-duplicate", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id; // or req.user._id depending on your auth middleware
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { postId, keywords, action } = req.body || {};

    // Basic validation
    if (!postId || !String(postId).trim()) {
      return res.status(400).json({ success: false, message: "postId is required" });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, message: "At least one keyword is required" });
    }
    if (!action || typeof action !== "object") {
      return res.status(400).json({ success: false, message: "action object is required" });
    }

    const type = action.type;
    const title = action.title?.trim();
    const url = action.url?.trim();
    const fileName = action.fileName?.trim();

    if (!["Affiliate Link", "Download Link"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid action.type" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "action.title is required" });
    }
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ success: false, message: "Valid action.url is required" });
    }
    if (type === "Download Link" && !fileName) {
      // Optional, but nice to have for logs/UX
      console.warn("Download Link provided without fileName");
    }

    // Normalize keywords: trim + dedupe + remove empties
    const normalizedKeywords = [...new Set(
      keywords.map(k => String(k || "").trim()).filter(Boolean)
    )];

    // LOGGING (condition-based)
    console.log("=== Automation Config ===");
    console.log("User ID:", userId);
    console.log("Post ID:", postId);
    console.log("Keywords:", normalizedKeywords);

    if (type === "Download Link") {
      console.log("[Download Link]");
      console.log("Title:", title);
      console.log("Public URL (GCS):", url);
      if (fileName) console.log("File Name:", fileName);
    } else {
      console.log("[Affiliate Link]");
      console.log("Title:", title);
      console.log("Affiliate URL:", url);
    }

    // Persist to DB (create new; or upsert if you want one per postId)
    // const doc = await AutomationConfig.create({
    //   userId,
    //   postId: String(postId),
    //   keywords: normalizedKeywords,
    //   action: { type, title, url, fileName },
    //   status: "active",
    // });

    return res.json({
      success: true,
      // automationId: doc._id,
      message: "Automation configuration saved",
      // data: doc,
    });
  } catch (err) {
    console.error("POST /automation/config error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save automation config",
      error: err?.message || String(err),
    });
  }
});


router.get("/instagram/media", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await USER.findById(userId)
      .select("igUserId fbLongLivedToken")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const ig_user_id = user.igUserId;
    const access_token = user.fbLongLivedToken;
    if (!ig_user_id || !access_token) {
      return res.status(400).json({
        error:
          "Instagram not connected for this user (missing ig_user_id or access_token).",
      });
    }

    const fields =
      "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
    const limit = 25;
    const after = req.query.after
      ? `&after=${encodeURIComponent(req.query.after)}`
      : "";

    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      ig_user_id
    )}/media?fields=${encodeURIComponent(fields)}&limit=${limit}${after}&access_token=${encodeURIComponent(
      access_token
    )}`;

    const data = await getWithRetries(url, { retries: 3, timeout: 5000 });
    const media = Array.isArray(data?.data) ? data.data : [];

    const igPostIds = media.map((m) => m.id);
    if (igPostIds.length === 0) {
      return res.json({
        data: [],
        paging: data?.paging
          ? { next: Boolean(data.paging.next), cursors: data.paging.cursors || {} }
          : null,
      });
    }

    // Find automations for these posts for THIS user
    const automations = await Automation.find({
      userId,
      postId: { $in: igPostIds },
    })
      .select("postId")
      .lean();

    const automatedPostIdSet = new Set(automations.map((a) => String(a.postId)));

    // EXCLUDE any posts that have an automation
    const filteredMedia = media.filter((m) => !automatedPostIdSet.has(String(m.id)));
const normalizedMedia = filteredMedia.map((m) => ({
  ...m,
  thumbnail_url:
    m.media_type === "VIDEO"
      ? (m.thumbnail_url || m.media_url)
      : m.media_url,
}));
   return res.json({
  data: normalizedMedia,
  paging: data?.paging
    ? { next: Boolean(data.paging.next), cursors: data.paging.cursors || {} }
    : null,
  meta: {
    totalFetched: media.length,
    excludedForAutomation: media.length - filteredMedia.length,
  },
});

  } catch (err) {
    return res.status(500).json({
      error: "Unable to fetch Instagram media",
      message: err.message,
      details: err.details || undefined,
    });
  }
});


router.post("/automation/config", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      postId,
      keywords,
      commentReply, // optional
      dmEnabled,
      caption,
      dm, // optional when dmEnabled = false
      media, // optional { thumbnail, caption }
      status, // optional override
    } = req.body || {};

    // Basic validation
    if (!postId || !String(postId).trim()) {
      return res.status(400).json({ success: false, message: "postId is required" });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, message: "At least one keyword is required" });
    }

    // Normalize
    const normalizedKeywords = [...new Set(
      keywords.map((k) => String(k || "").trim()).filter(Boolean)
    )];

    const normalizedReply = commentReply ? String(commentReply).trim() : null;

    // DM validation/shape
    let dmPayload = { enabled: !!dmEnabled };
    if (dmEnabled === true) {
      if (!dm || typeof dm !== "object") {
        return res.status(400).json({ success: false, message: "dm object is required when dmEnabled is true" });
      }
      const message = String(dm.message || "").trim();
      if (!message) {
        return res.status(400).json({ success: false, message: "dm.message is required" });
      }

      let button;
      if (dm.button) {
        const text = String(dm.button.text || "").trim();
        const url = String(dm.button.url || "").trim();
        if (!text) {
          return res.status(400).json({ success: false, message: "dm.button.text is required when button is provided" });
        }
        if (!isValidUrl(url)) {
          return res.status(400).json({ success: false, message: "Valid dm.button.url is required" });
        }
        button = { text, url };
      }

      dmPayload = { enabled: true, message, ...(button ? { button } : {}) };
    }

    // Optional media snapshot
    const mediaPayload = media
      ? {
          thumbnail: media.thumbnail ? String(media.thumbnail).trim() : undefined,
          caption: media.caption ? String(media.caption).trim() : undefined,
        }
      : undefined;

    // Prepare doc for upsert
    const update = {
      platform: "instagram",
      keywords: normalizedKeywords,
      publicReply: normalizedReply || null,
      dm: dmPayload,
      caption,
      ...(mediaPayload ? { media: mediaPayload } : {}),
      ...(status ? { status } : {}), // allow overriding status if you pass it
    };

    // Upsert by (userId, postId)
    const doc = await Automation.findOneAndUpdate(
      { userId, postId: String(postId) },
      { $set: update, $setOnInsert: { userId, postId: String(postId) } },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Automation configuration saved",
      data: doc,
    });
  } catch (err) {
    console.error("POST /automation/config error:", err);
    // Handle unique index race condition gracefully
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An automation for this post already exists for this user",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to save automation config",
      error: err?.message || String(err),
    });
  }
});


// GET /usersOn/automations
router.get("/automations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const query = { userId };
    const projection = "postId status createdAt caption thumbnail";
    const sort = { createdAt: -1 };

    const [total, docs] = await Promise.all([
      Automation.countDocuments(query),
      Automation.find(query).select(projection).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const items = (docs || []).map((d) => ({
      _id: d._id,
      postId: d.postId,
      status: d.status,                             // "active" | "inactive"
      status: d.status,                             // "active" | "inactive"
      caption: d.caption,
      thumbnail: d.thumbnail,
      createdAt: d.createdAt,                       // ISO string; format on client
    }));

    console.log('Items : ', items);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /usersOn/automations error:", err);
    return res.status(500).json({ message: "Failed to fetch automations" });
  }
});



router.post("/automation/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?._id;
    const { postId } = req.body || {};

    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    // 1) Load the Automation first
    const doc = await Automation.findOne({ userId, postId }).lean();
    if (!doc) {
      return res.status(404).json({ message: "Automation not found" });
    }

    // 2) Get user's FB token for Graph calls
    const user = await USER.findById(userId)
      .select("fbLongLivedToken")
      .lean();
    if (!user?.fbLongLivedToken) {
      return res.status(400).json({
        message: "Instagram not connected for this user (missing access token)",
      });
    }

    // 3) Fetch the post details from Graph API
    const fields = "id,caption,media_type,media_url,thumbnail_url";
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      postId
    )}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(
      user.fbLongLivedToken
    )}`;

    let fetchedCaption = null;
    let fetchedThumbnail = null;
    let fetchedMediaType = null;

    try {
      const ig = await getWithRetries(url, { retries: 3, timeout: 5000 });
      fetchedCaption = typeof ig?.caption === "string" ? ig.caption : null;
      fetchedMediaType = ig?.media_type || null;

      // Normalize thumbnail:
      // VIDEO -> thumbnail_url || media_url
      // non-VIDEO -> media_url
      if (ig) {
        if (ig.media_type === "VIDEO") {
          fetchedThumbnail = ig.thumbnail_url || ig.media_url || null;
        } else {
          fetchedThumbnail = ig.media_url || null;
        }
      }
    } catch (graphErr) {
      // If the Graph call fails, we’ll just fall back to what’s in the Automation doc
      // but still return a 200 with the best data we have.
      // Optionally log the error:
      console.warn("Graph fetch failed for post", postId, graphErr?.message);
    }

    // 4) Persist the fetched fields back to Automation (only if we got them)
    const updateSet = {};
    if (fetchedCaption !== null) updateSet.caption = fetchedCaption;
    if (fetchedThumbnail !== null) updateSet.thumbnail = fetchedThumbnail;

    if (Object.keys(updateSet).length > 0) {
      await Automation.updateOne({ _id: doc._id }, { $set: updateSet });
    }

    // 5) Build payload using freshest values (Graph > DB > fallback)
    const captionForPayload =
      (fetchedCaption ?? doc.caption ?? "").trim();

    const thumbnailForPayload =
      (fetchedThumbnail ??
        (doc.thumbnail && doc.thumbnail.trim()));

    // normalize shape for frontend (same 3-step UI fields)
    const payload = {
      postId: doc.postId,
      mediaType: fetchedMediaType || doc.mediaType || "", // optional: include it if useful
      caption: captionForPayload,
      thumbnail: thumbnailForPayload,

      keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
      publicReply: doc.publicReply || "",
      status: doc.status || "",
      hasPublicReply:
        !!(doc.publicReply && doc.publicReply.trim() !== ""),

      dm: {
        enabled: !!doc?.dmEnabled || (!!doc?.dm && !!doc.dm.enabled),
        message: doc?.dm?.message || doc?.dmMessage || "",
        button: doc?.dm?.button || (doc?.dmButton ? { ...doc.dmButton } : undefined),
      },
    };

    return res.json(payload);
  } catch (err) {
    console.error("POST /automation/details error:", err);
    return res.status(500).json({ message: "Failed to load automation" });
  }
});


router.post("/automation/update", authenticateToken, async (req, res) => {
  try {
    const { postId, patch } = req.body || {};
    if (!postId) return res.status(400).json({ message: "postId is required" });
    if (!patch || typeof patch !== "object")
      return res.status(400).json({ message: "patch object is required" });

    const userId = req.user?.user_id || req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Filter to allowed keys only
    const setObj = {};
    for (const [k, v] of Object.entries(patch)) {
      if (ALLOWED.has(k)) setObj[k] = v;
    }

    if (Object.keys(setObj).length === 0) {
      return res.status(200).json({ message: "No changes" });
    }

    // If patch sets dm.button to null, $unset the subdoc
    const unsetObj = {};
    if ("dm.button" in setObj && setObj["dm.button"] === null) {
      unsetObj["dm.button"] = ""; // remove the whole subdocument
      delete setObj["dm.button"];  // prevent $set: { "dm.button": null }
    }

    const update = { $currentDate: { updatedAt: true } };
    if (Object.keys(setObj).length) update.$set = setObj;
    if (Object.keys(unsetObj).length) update.$unset = unsetObj;

    // Match by BOTH userId and postId
    const query = { userId, postId };

    const result = await Automation.updateOne(query, update, { upsert: false });

    // Mongoose v6: { acknowledged, matchedCount, modifiedCount }
    // Mongoose v5 compat: { n, nModified, ok }
    const matched =
      typeof result.matchedCount === "number" ? result.matchedCount : result.n;
    if (!matched) {
      return res.status(404).json({ message: "Automation not found" });
    }

    const modified =
      typeof result.modifiedCount === "number" ? result.modifiedCount : result.nModified;

    return res.status(200).json({ message: "Updated", modifiedCount: modified });
  } catch (err) {
    console.error("automation/update error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
});



// Toggle or set status: "active" | "inactive"
router.post("/automation/stop", authenticateToken, async (req, res) => {
  try {
    const { postId, status } = req.body || {};
    const userId = req.user?.user_id || req.user?._id;

    if (!postId) return res.status(400).json({ message: "postId is required" });
    if (!userId) return res.status(400).json({ message: "userId is required" });

    // If status explicitly provided, use it; otherwise toggle
    let nextStatus;
    if (status === "active" || status === "inactive") {
      nextStatus = status;
    } else {
      const existing = await Automation.findOne({ userId, postId });
      if (!existing) {
        return res
          .status(404)
          .json({ message: "Automation not found for the given userId/postId" });
      }
      nextStatus = existing.status === "active" ? "inactive" : "active";
    }

    const updated = await Automation.findOneAndUpdate(
      { userId, postId },
      { $set: { status: nextStatus, updatedAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Automation not found for the given userId/postId" });
    }

    return res.json({
      message: `Automation status updated to ${nextStatus}`,
      automation: updated,
    });
  } catch (err) {
    console.error("Stop/Resume automation error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/automation/upload-pdf", authenticateToken, upload.single("pdf"),
  async (req, res) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      console.log('Body : ', req.body);

      // Multer memoryStorage provides file.buffer
      const file = req.file;
      const title = req.body?.title;

      // Basic validation
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Ensure you send multipart/form-data with field name 'pdf'.",
        });
      }

      // Validate PDF file type
      if (file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are allowed.",
        });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required.",
        });
      }

      // Upload buffer to GCS (your helper) - it should return { publicUrl, objectName }
      const { publicUrl, objectName } = await uploadBufferToGCS(
        file.buffer,
        file.originalname || `automation-pdf-${Date.now()}.pdf`,
        file.mimetype || "application/pdf"
      );

      if (!publicUrl) {
        return res.status(500).json({ success: false, message: "Failed to upload to storage" });
      }

      // Log the final URL
      console.log("PDF uploaded successfully!");
      console.log("Public URL:", publicUrl);
      console.log("Object Name:", objectName);
      console.log("File Name:", file.originalname);
      console.log("Title:", title);
      console.log("User ID:", userId);

      // Optional: Save automation config to database here
      // const automationConfig = await AutomationConfig.create({
      //   userId,
      //   title,
      //   fileUrl: publicUrl,
      //   fileName: file.originalname,
      //   objectName,
      //   createdAt: new Date()
      // });

      return res.json({
        success: true,
        publicUrl,
        fileName: file.originalname,
        objectName,
        title,
        message: "PDF uploaded successfully",
      });
    } catch (err) {
      console.error("upload-pdf error:", err);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err?.message || String(err),
      });
    }
  }
);

router.put("/bank-details", authenticateToken, saveBankDetails);
router.post("/bank-details", authenticateToken, saveBankDetails);

router.get("/bank-details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const doc = await BankDetails.findOne({ user_id: userId }).lean();
    if (!doc) return res.json({ bankDetails: null });
    return res.json({
      bankDetails: {
        name: doc.name_on_bank,
        bankName: doc.bank_name,
        accountNumber: doc.account_number,
        ifsc: doc.bank_ifsc,
      },
    });
  } catch (e) {
    console.error("getBankDetails error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/payments/razorpay-key", async (req, res) => {
  return res.json({ key: RZP_KEY_ID });
});

router.post("/payments/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", productId, title, imageUrl, subdomain, payer } = req.body;

    const amt = Number(amount);
    if (!Number.isInteger(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount (must be integer paise)" });
    }

    const receipt = await makeReceipt(productId);

    const order = await rz.orders.create({
      amount: amt,
      currency,
      receipt,
      notes: {
        productId: String(productId || ""),
        title: String(title || ""),
        subdomain: String(subdomain || ""),
        // optional: echo buyer info into notes
        buyer_name: payer?.name || "",
        buyer_email: payer?.email || "",
        buyer_phone: payer?.phone || ""
      }
    });

    await Transaction.create({
      userId: req.user?._id,
      userEmail: req.user?.email,
      userName: req.user?.name,

      productId: productId || null,
      productTitle: title || null,
      productImage: imageUrl || null,
      subdomain: subdomain || null,

      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",

      customer: {
        name: payer?.name || req.user?.name || null,
        email: payer?.email || req.user?.email || null,
        phone: payer?.phone || null
      },

      razorpay: { order },
      rawOrder: order
    });

    res.json({
      order,
      user: { name: req.user?.name, email: req.user?.email }
    });
  } catch (e) {
    const status = e?.statusCode || 500;
    const msg = e?.error?.description || "Failed to create order";
    console.error("create-order error:", JSON.stringify(e, null, 2));
    res.status(status).json({ error: msg });
  }
});



router.post("/payments/verify", async (req, res) => {
  try {
    const { orderId, paymentId, signature, productId, payer } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", RZP_KEY_SECRET)
      .update(body)
      .digest("hex");

    const valid = expectedSignature === signature;

    // Fetch canonical payment info from Razorpay
    let payment = null;
    try {
      payment = await rz.payments.fetch(paymentId); // ← gives method, bank, card last4, vpa, email, contact, status, fees, tax, etc.
    } catch (err) {
      console.warn("Could not fetch payment from Razorpay:", err?.message || err);
    }

    // Build method snapshot
    const method = payment?.method || null;
    const methodDetails = {
      type: method || null,
      bank: payment?.bank || null,
      wallet: payment?.wallet || null,
      vpa: payment?.vpa || null,
      card: payment?.card
        ? {
            last4: payment.card.last4 || null,
            network: payment.card.network || null,
            issuer: payment.card.issuer || null,
            type: payment.card.type || null,
            international: payment.card.international || false
          }
        : undefined
    };

    // Prefer Razorpay-provided buyer contact if available
    const canonicalCustomer = {
      name: payer?.name || undefined,
      email: payment?.email || payer?.email || undefined,
      phone: payment?.contact || payer?.phone || undefined
    };

    const update = {
      paymentId,
      signature,
      status: valid ? "paid" : "failed",
      rawVerifyPayload: req.body,
      productId: productId || undefined,
      paidAt: valid ? new Date() : undefined,
      customer: { ...canonicalCustomer },
      paymentMethod: methodDetails,
      razorpay: {
        payment: payment || undefined
      },
      // amount/currency from payment if present (sometimes fees/tax included)
      amount: payment?.amount || undefined,
      currency: payment?.currency || undefined
    };

    let tx = await Transaction.findOneAndUpdate({ orderId }, { $set: update }, { new: true });

    if (!tx) {
      tx = await Transaction.create({
        userId: req.user?._id,
        userEmail: req.user?.email,
        userName: req.user?.name,

        productId: productId || null,

        orderId,
        ...update
      });
    }

    return res.json({ ok: !!valid, txId: tx?._id });
  } catch (e) {
    console.error("verify error:", e);
    return res.status(500).json({ error: "Verification failed" });
  }
});


router.get('/details-for-mandate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await USER.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  } catch (err) {
    console.error('GET /usersOn/me/profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post("/create-subscription", authenticateToken, async (req, res) => {
  try {
    const { plan_id } = req.body;
      const userId = req.user?.user_id;

    const startAt = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);

    // total_count is required; pick a big number or store your own end/cancel logic.
    const sub = await rz.subscriptions.create({
      plan_id,
      total_count: 48,             // ~83 years if monthly
      start_at: startAt,            // first charge after 7 days
      customer_notify: 1,           // Razorpay can send emails/SMS if configured
      notes: { userId: userId || "anonymous" },
    });

    res.json({ subscription_id: sub.id, plan_id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/subscription/verify", authenticateToken, async (req, res) => {
  try {

    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { payment_id, subscription_id, signature } = req.body;
    if (!payment_id || !subscription_id || !signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const body = `${payment_id}|${subscription_id}`;
    const expected = crypto
      .createHmac("sha256", RZP_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Signature is valid — save/update the subscription
    // Decide subscription_starts_at: if you offer a 7-day trial, set now+7 days
    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const update = {
      user_id: userId,
      razorpay_payment_id: payment_id,
      razorpay_subscription_id: subscription_id,
      razorpay_signature: signature,
      subscription_starts_at: startsAt,
      status: "pending_activation", // you can flip to 'active' on webhook
      updatedAt: new Date(),
    };

    await Subscriptions.updateOne(
      { user_id : userId },                 // unique per user
      { $set: update, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get('/fetch-payment-details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    // If user_id is not available, return hasAccess: false (no 401)
    if (!userId) {
      return res.json({ hasAccess: false });
    }

    const user = await Subscriptions.findOne({ user_id : userId}).lean();


    if (!user) {

      return res.status(201).json({ error: 'User not found', hasAccess: false });
    }

    // Check subscription status
    const sub = await Subscriptions.findOne({ user_id: userId }).select('status').lean();

    const hasAccess = !!(sub && ['pending_activation', 'active'].includes(sub.status));

    return res.json({
      hasAccess,
    });
  } catch (err) {
    console.error('GET /fetch-payment-details error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

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

    const requesterId = req.user?.user_id;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    const OID = (v) => new mongoose.Types.ObjectId(String(v));

    // Pull raw conversation
    const convo = await Conversation.findOne({
      _id: conversationId,
      is_deleted: { $ne: true },
    })
      .select(
        "_id participants conversation_type metadata last_message last_message_text last_message_at message_count createdAt updatedAt"
      )
      .lean();

    if (!convo) return res.status(404).json({ error: "conversation not found" });

    const parts = Array.isArray(convo.participants) ? convo.participants : [];

    // Ensure requester is in this conversation (allow either User or ParticipantUser)
    const requesterInConvo = parts.some(
      (p) =>
        (p?.actor?.model === "User" && String(p.actor?.id) === String(requesterId)) ||
        (p?.actor?.model === "ParticipantUser" && String(p.actor?.id) === String(requesterId))
    );
    if (!requesterInConvo) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    // Collect ids by model
    const userIds = parts
      .filter((p) => p?.actor?.model === "User" && p?.actor?.id)
      .map((p) => OID(p.actor.id));
    const participantUserIds = parts
      .filter((p) => p?.actor?.model === "ParticipantUser" && p?.actor?.id)
      .map((p) => OID(p.actor.id));

    // Fetch docs via Mongoose models (NOT req.app.get('db'))
    const [users, participants] = await Promise.all([
      userIds.length
        ? USER.find({ _id: { $in: userIds } })
            .select("_id name fullName handleUserName picture email")
            .lean()
        : [],
      participantUserIds.length
        ? ParticipantUser.find({ _id: { $in: participantUserIds } })
            .select("_id name fullName username picture email")
            .lean()
        : [],
    ]);

    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
    const participantMap = Object.fromEntries(participants.map((u) => [String(u._id), u]));

    // Hydrate participants with their profile doc
    const hydratedParticipants = parts.map((p) => {
      const model = p?.actor?.model;
      const idStr = p?.actor?.id ? String(p.actor.id) : null;
      const base = {
        actor: { model, id: idStr },
        role: p.role,
        joined_at: p.joined_at,
        last_read_at: p.last_read_at,
        last_read_message_id: p.last_read_message_id,
        muted: p.muted,
      };
      if (!model || !idStr) return { ...base, profile: null };

      const profile =
        model === "User" ? userMap[idStr] || null
        : model === "ParticipantUser" ? participantMap[idStr] || null
        : null;

      return { ...base, profile };
    });

    // Identify follower (ParticipantUser) and influencer (User)
    const followerEntry = hydratedParticipants.find((p) => p.actor.model === "ParticipantUser");
    const influencerEntry = hydratedParticipants.find((p) => p.actor.model === "User");

    return res.json({
      ok: true,
      conversation: {
        _id: String(convo._id),
        conversation_type: convo.conversation_type,
        metadata: convo.metadata,
        last_message: convo.last_message ? String(convo.last_message) : null,
        last_message_text: convo.last_message_text || "",
        last_message_at: convo.last_message_at || null,
        message_count: convo.message_count || 0,
        participants: hydratedParticipants,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
      },
      participant: followerEntry?.profile || null,  // follower profile doc
      influencer: influencerEntry?.profile || null, // influencer (User) profile doc
      participantRole: followerEntry?.role || "member",
      participantMetadata: {
        role: followerEntry?.role || "member",
        last_read_at: followerEntry?.last_read_at || null,
        joined_at: followerEntry?.joined_at || null,
        muted: !!followerEntry?.muted,
      },
      others: hydratedParticipants
        .filter((p) => p.actor.model === "User" && p.actor.id !== String(influencerEntry?.actor?.id))
        .map((p) => p.profile)
        .filter(Boolean),
    });
  } catch (err) {
    console.error("DEBUG: GET conversation error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

  router.get("/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
    try {
      const { conversationId } = req.params;
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: "conversationId required and must be a valid ObjectId" });
      }

      const requesterId = req.user?.user_id;
      if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
        return res.status(401).json({ error: "unauthenticated" });
      }

      // Load convo just to confirm membership (as a User)
      const convo = await Conversation.findOne({
        _id: conversationId,
        "participants.actor.model": "User",
        "participants.actor.id": new mongoose.Types.ObjectId(requesterId),
        is_deleted: { $ne: true },
      })
        .select("_id participants")
        .lean();

      if (!convo) return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });

      // Fetch messages (new schema)
      const docs = await Message.find({
        conversation: new mongoose.Types.ObjectId(conversationId),
        is_deleted: { $ne: true },
      })
        .sort({ createdAt: 1 })
        .select("_id text attachments status createdAt sender recipients")
        .lean();

     const messages = docs.map((m) => {
        const s = m.sender || null; // { model, id }
        const sModel = s?.model || null;
        const sId = s?.id ? String(s.id) : null;

        const senderRole =
          sModel === "User" ? "influencer"
          : sModel === "ParticipantUser" ? "participant"
          : undefined;

        return {
          _id: String(m._id),
          conversation: { _id: String(conversationId) },
          text: m.text || "",
          createdAt: m.createdAt,
          sender: s ? { model: sModel, id: sId } : null,
          senderRole,
          attachments: m.attachments || [],
          status: m.status || "sent",
        };
      });

      return res.json({
        ok: true,
        conversation: { _id: String(conversationId) },
        messages,
      });
    } catch (err) {
      console.error("GET conversation messages error:", err);
      return res.status(500).json({ error: "internal", details: err.message });
    }
  });

router.post("/messages/send", authenticateParticipant, async (req, res) => {
  try {
    const { conversationId, text, attachments } = req.body || {};
    const OID = (v) => new mongoose.Types.ObjectId(String(v));
    const actorKey = (model, id) => `${model}:${id.toString()}`;

    // ---- validate inputs ----
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId required and must be a valid ObjectId" });
    }
    const trimmed = String(text ?? "").trim();
    if (!trimmed) {
      return res.status(400).json({ error: "text required" });
    }

    // ---- participant auth ----
    const participantId = req.user?.user_id || req.user?.id;
    if (!participantId) {
      return res.status(401).json({ error: "unauthenticated" });
    }
    const participantOID = OID(participantId);

    // ---- load conversation & membership check ----
    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ error: "conversation not found" });

    const parts = Array.isArray(convo.participants) ? convo.participants : [];
    const isInConvo = parts.some(
      (p) => p?.actor?.model === "ParticipantUser" && String(p.actor?.id) === String(participantOID)
    );
    if (!isInConvo) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    // ---- recipients: everyone except the participant sender ----
    const recipients = parts
      .map((p) => p.actor)
      .filter(Boolean)
      .filter((a) => !(a.model === "ParticipantUser" && String(a.id) === String(participantOID)))
      .map((a) => ({ model: a.model, id: OID(String(a.id)) }));

    // ---- persist message ----
    const created = await Message.create({
      conversation: OID(conversationId),
      sender: { model: "ParticipantUser", id: participantOID },
      recipients,
      text: trimmed,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: "sent",
      categories: [],
      delivery: {},
      meta: {},
      is_deleted: false,
    });

    // ---- denorm updates (unread_counts) ----
    const incPaths = {};
    for (const r of recipients) {
      incPaths[`unread_counts.${actorKey(r.model, r.id)}`] = 1;
    }
    await Conversation.findByIdAndUpdate(convo._id, {
      $set: {
        last_message: created._id,
        last_message_text: trimmed.slice(0, 500),
        last_message_at: created.createdAt || new Date(),
      },
      $inc: { message_count: 1, ...incPaths },
    });

    // ---- response payload (same shape as socket) ----
    const responseMessage = {
      _id: String(created._id),
      conversation: { _id: String(conversationId) },
      sender: { model: "ParticipantUser", id: String(participantOID) },
      recipients: recipients.map((r) => ({ model: r.model, id: String(r.id) })),
      text: created.text,
      attachments: created.attachments || [],
      status: created.status,
      createdAt: created.createdAt,
      senderRole: "participant",
    };

    // ---- realtime fanout ----
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${String(convo._id)}`).emit("message:received", { message: responseMessage });
      for (const r of recipients) {
        const rid = String(r.id);
        if (r.model === "User") io.to(`influencer:${rid}`).emit("message:received", { message: responseMessage });
        if (r.model === "ParticipantUser") io.to(`participant:${rid}`).emit("message:received", { message: responseMessage });
      }
    }

    return res.json({ ok: true, message: responseMessage });
  } catch (err) {
    console.error("POST /messages/send error:", err);
    return res.status(500).json({ error: "internal", details: err?.message || String(err) });
  }
});


router.post("/messages/send-as-influencer", authenticateToken, async (req, res) => {
  try {
    const { conversationId, text, attachments } = req.body || {};

    // 1) input validation
    if (!conversationId ) {
      return res.status(400).json({ error: "conversationId required and must be a valid ObjectId" });
    }
    const trimmed = String(text ?? "").trim();
    if (!trimmed) return res.status(400).json({ error: "text required" });

    // 2) requester (influencer) identity
    const requesterId = req.user?.user_id || req.user?.id;
    if (!requesterId) {
      return res.status(401).json({ error: "unauthenticated" });
    }
    const requesterOID = OID(requesterId);

    // 3) ensure requester is a 'User' participant in the conversation
    const convo = await Conversation.findOne({
      _id: OID(conversationId),
      "participants.actor.model": "User",
      "participants.actor.id": requesterOID,
      is_deleted: { $ne: true },
    }).lean();

    if (!convo) {
      return res.status(403).json({ error: "forbidden - you are not a participant of this conversation" });
    }

    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];

    // 4) compute recipients = everyone except the influencer sender
    const recipients = participantsArr
      .map((p) => p?.actor)
      .filter(Boolean)
      .filter((a) => !(a.model === "User" && String(a.id) === String(requesterOID)))
      .map((a) => ({ model: a.model, id: OID(String(a.id)) }));

    // 5) persist message
    const created = await Message.create({
      conversation: OID(conversationId),
      sender: { model: "User", id: requesterOID },
      recipients,
      text: trimmed,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: "sent",
      categories: [],
      delivery: {},
      meta: {},
      is_deleted: false,
    });

    // 6) denorm updates (IMPORTANT: use actorKey for unread_counts to match schema)
    const incPaths = {};
    for (const r of recipients) {
      incPaths[`unread_counts.${actorKey(r.model, r.id)}`] = 1;
    }

    await Conversation.findByIdAndUpdate(convo._id, {
      $set: {
        last_message: created._id,
        last_message_text: trimmed.slice(0, 500),
        last_message_at: created.createdAt || new Date(),
      },
      $inc: { message_count: 1, ...incPaths },
    });

    // 7) build response payload consistent with socket path
    const responseMessage = {
      _id: String(created._id),
      conversation: { _id: String(conversationId) },
      sender: { model: "User", id: String(requesterOID) },
      recipients: recipients.map((r) => ({ model: r.model, id: String(r.id) })),
      text: created.text,
      attachments: created.attachments || [],
      status: created.status,
      createdAt: created.createdAt,
      senderRole: "influencer",
    };

    // 8) realtime fanout
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${String(convo._id)}`).emit("message:received", { message: responseMessage });
      for (const r of recipients) {
        const rid = String(r.id);
        if (r.model === "User") io.to(`influencer:${rid}`).emit("message:received", { message: responseMessage });
        if (r.model === "ParticipantUser") io.to(`participant:${rid}`).emit("message:received", { message: responseMessage });
      }
    }

    return res.json({ ok: true, message: responseMessage });
  } catch (err) {
    console.error("POST /messages/send-as-influencer error:", err);
    return res.status(500).json({ error: "internal", details: err?.message || String(err) });
  }
});

router.post("/page-analytics", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body || {};
    const userIdStr = req.user?.user_id;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      return res.status(401).json({ message: "Unauthorized: invalid user" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userIdStr);

    const matchStage = {
      $match: {
        user_id: userObjectId,
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        is_del: { $ne: true },
      },
    };

    // Total page views (records) for this user
    const pageViewsPromise = PageAnalytics.countDocuments(matchStage.$match);

    // Unique visitors by IP across the whole range
    const visitorsPromise = PageAnalytics.aggregate([
      matchStage,
      { $group: { _id: "$ip" } },
      { $count: "uniqueIps" },
    ]);

    // Unique visitors & page views by city
    const citiesPromise = PageAnalytics.aggregate([
      matchStage,
      {
        $group: {
          _id: { city: "$city" },
          pageViews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          pageViews: 1,
        },
      },
    ]);

    // Unique visitors per city (dedupe IP within each city)
    const cityVisitorsPromise = PageAnalytics.aggregate([
      matchStage,
      { $group: { _id: { city: "$city", ip: "$ip" } } },
      { $group: { _id: "$_id.city", visitors: { $sum: 1 } } },
      { $project: { _id: 0, city: "$_id", visitors: 1 } },
    ]);

    // Regions: page views & unique visitors
    const regionsPromise = PageAnalytics.aggregate([
      matchStage,
      { $group: { _id: { region: "$region" }, pageViews: { $sum: 1 } } },
      { $project: { _id: 0, region: "$_id.region", pageViews: 1 } },
    ]);

    const regionVisitorsPromise = PageAnalytics.aggregate([
      matchStage,
      { $group: { _id: { region: "$region", ip: "$ip" } } },
      { $group: { _id: "$_id.region", visitors: { $sum: 1 } } },
      { $project: { _id: 0, region: "$_id", visitors: 1 } },
    ]);

    const [pageViews, visitorsArr, citiesPV, citiesUV, regionsPV, regionsUV] = await Promise.all([
      pageViewsPromise,
      visitorsPromise,
      citiesPromise,
      cityVisitorsPromise,
      regionsPromise,
      regionVisitorsPromise,
    ]);

    const visitors = visitorsArr?.[0]?.uniqueIps || 0;

    // Merge city metrics
    const cityMap = new Map();
    for (const c of citiesPV) {
      cityMap.set(c.city || "", { city: c.city || "", pageViews: c.pageViews || 0, visitors: 0 });
    }
    for (const c of citiesUV) {
      const cur = cityMap.get(c.city || "") || { city: c.city || "", pageViews: 0, visitors: 0 };
      cur.visitors = c.visitors || 0;
      cityMap.set(c.city || "", cur);
    }
    const cities = Array.from(cityMap.values());

    // Merge region metrics
    const regionMap = new Map();
    for (const r of regionsPV) {
      regionMap.set(r.region || "", { region: r.region || "", pageViews: r.pageViews || 0, visitors: 0 });
    }
    for (const r of regionsUV) {
      const cur = regionMap.get(r.region || "") || { region: r.region || "", pageViews: 0, visitors: 0 };
      cur.visitors = r.visitors || 0;
      regionMap.set(r.region || "", cur);
    }
    const regions = Array.from(regionMap.values());

    res.json({
      summary: { visitors, pageViews },
      cities,
      regions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/newsletters-subscribe", async (req, res) => {
  try {
    const {
      email,
      newsletterText = "",
      blockId = null,
      submittedAt = null,
      handle = null,
      meta = {},
    } = req.body || {};

    // validate email
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "email is required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "invalid email" });
    }

    // collect request context (ip, ua, referrer), and geo
    const ip = await getClientIp(req);
    const ua = req.headers["user-agent"] || "";
    const ref = req.headers["referer"] || req.headers["referrer"] || "";
    const geo = await lookupGeo_ipdata(ip);

    // resolve user_id by handle (if provided)
    let userId = null;
    if (handle && String(handle).trim()) {
      const maybeUser = await USER.findOne({
        handleUserName: String(handle).trim(),
      })
        .select("_id")
        .lean()
        .exec();
      if (maybeUser) userId = maybeUser._id;
    }

    // Build query to locate the correct newsletter doc
    const baseQuery = { user_id: userId || null, is_del: false };

    if (blockId) {
      // if blockId provided, prefer doc for that block
      baseQuery.blockId = blockId;
    } else if (newsletterText && String(newsletterText).trim()) {
      // otherwise try to match by newsletterText
      baseQuery.newsletterText = String(newsletterText).trim();
      baseQuery.blockId = null;
    } else {
      baseQuery.blockId = null;
    }

    // prepare the email subdocument with geo fields
    const emailEntry = {
      email: normalizedEmail,
      subscribed_at: submittedAt ? new Date(submittedAt) : new Date(),
      ip: geo?.ip || ip || undefined,
      referrer: ref || undefined,
      country: geo?.country || undefined,
      region: geo?.region || undefined,
      city: geo?.city || undefined,
      postal: geo?.postal || undefined,
      latitude: geo?.latitude ? String(geo.latitude) : undefined,
      longitude: geo?.longitude ? String(geo.longitude) : undefined,
      meta: {
        ...meta,
        user_agent: ua, // keep UA in meta as well for convenience
      },
    };

    // find existing doc
    let doc = await NewsletterModel.findOne(baseQuery).exec();

    if (doc) {
      // check duplicate email
      const exists =
        Array.isArray(doc.emails) &&
        doc.emails.some((e) => String(e.email).toLowerCase() === normalizedEmail);
      if (exists) {
        return res.status(200).json({ message: "Already subscribed" });
      }

      // push with geo fields
      doc.emails.push(emailEntry);
      doc.updatedAt = new Date();
      await doc.save();

      return res.status(201).json({ message: "Successfully subscribed", id: doc._id });
    }

    // create new doc with first email
    const newDoc = await NewsletterModel.create({
      user_id: userId || null,
      handle: handle || null,
      blockId: blockId || null,
      newsletterText: String(newsletterText || ""),
      emails: [emailEntry],
    });

    return res.status(201).json({ message: "Successfully subscribed", id: newDoc._id });
  } catch (err) {
    console.error("POST /newsletters/subscribe error:", err);
    if (err && err.code === 11000) {
      // defensive for rare race on unique indexes (if you add one later)
      return res.status(200).json({ message: "Already subscribed" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/newsletter-list-emails", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { page = 1, limit = 10, blockId = null } = req.body || {};
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * perPage;

    const matchStage = {
      user_id: new mongoose.Types.ObjectId(String(userId)),
      is_del: false,
      ...(blockId ? { blockId: new mongoose.Types.ObjectId(String(blockId)) } : {}),
    };

    const now = new Date();
    const last7 = new Date(now); last7.setDate(now.getDate() - 7);
    const last28 = new Date(now); last28.setDate(now.getDate() - 28);

    const [result] = await NewsletterModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // 1) Paginated rows
          rows: [
            { $unwind: "$emails" },
            { $sort: { "emails.subscribed_at": -1 } },
            { $skip: skip },
            { $limit: perPage },
            {
              $project: {
                _id: 0,
                email: "$emails.email",
                subscribed_at: "$emails.subscribed_at",
              },
            },
          ],

          // 2) Stats for counts
          stats: [
            { $unwind: "$emails" },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                last7: {
                  $sum: {
                    $cond: [{ $gte: ["$emails.subscribed_at", last7] }, 1, 0],
                  },
                },
                last28: {
                  $sum: {
                    $cond: [{ $gte: ["$emails.subscribed_at", last28] }, 1, 0],
                  },
                },
              },
            },
          ],

          // 3) Top Cities
          topCities: [
            { $unwind: "$emails" },
            {
              $project: {
                city: {
                  $trim: { input: { $ifNull: ["$emails.city", "Unknown"] } },
                },
              },
            },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, name: "$_id", count: 1 } },
          ],

          // 4) Top Regions (State/Region)
          topRegions: [
            { $unwind: "$emails" },
            {
              $project: {
                region: {
                  $trim: {
                    input: {
                      $ifNull: [
                        { $ifNull: ["$emails.region", "$emails.state"] },
                        "Unknown",
                      ],
                    },
                  },
                },
              },
            },
            { $group: { _id: "$region", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, name: "$_id", count: 1 } },
          ],
        },
      },
    ]);

    const rows = result?.rows || [];
    const statsDoc = (result?.stats && result.stats[0]) || { total: 0, last7: 0, last28: 0 };
    const topCities = result?.topCities || [];
    const topRegions = result?.topRegions || [];

    return res.json({
      rows,                            // [{ email, subscribed_at }]
      pagination: { page: pageNum, limit: perPage },
      total: statsDoc.total || 0,      // for TablePagination
      stats: {
        totalSubscribers: statsDoc.total || 0,
        last7Days: statsDoc.last7 || 0,
        last28Days: statsDoc.last28 || 0,
      },
      topCities,
      topRegions,
    });
  } catch (err) {
    console.error("list-emails error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/dashboard-analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id; // set by authenticateToken
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Parse date range; default to last 28 days (inclusive)
    const { startDate, endDate } = req.body || {};
    const now = new Date();

    const start = startDate ? new Date(startDate) : new Date(now);
    if (!startDate) start.setDate(start.getDate() - 27);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(now);
    end.setHours(23, 59, 59, 999);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // The authenticated dashboard owner is a "User" actor in Conversation.participants
    const myActorModel = "User";

    // ---------------------------
    // Build parallel promises
    // ---------------------------
    const totalViewsPromise = PageAnalytics.countDocuments({
      user_id: userObjectId,
      is_del: { $ne: true },
      created_at: { $gte: start, $lte: end },
    });

    const totalClicksAggPromise = Block.aggregate([
      { $match: { user_id: userObjectId, is_del: { $ne: true } } },
      { $unwind: "$link_click_analytics" },
      {
        $match: {
          "link_click_analytics.created_at": { $gte: start, $lte: end },
        },
      },
      { $count: "total" },
    ]);

    const totalSubscribersAggPromise = NewsletterModel.aggregate([
      { $match: { user_id: userObjectId, is_del: { $ne: true } } },
      { $unwind: "$emails" },
      {
        $match: {
          "emails.subscribed_at": { $gte: start, $lte: end },
        },
      },
      { $count: "total" },
    ]);

    const topCitiesAggPromise = PageAnalytics.aggregate([
      {
        $match: {
          user_id: userObjectId,
          is_del: { $ne: true },
          created_at: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: { city: "$city" }, visitors: { $sum: 1 } } },
      { $project: { _id: 0, city: "$_id.city", visitors: 1 } },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
    ]);

    const topRegionsAggPromise = PageAnalytics.aggregate([
      {
        $match: {
          user_id: userObjectId,
          is_del: { $ne: true },
          created_at: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: { region: "$region" }, visitors: { $sum: 1 } } },
      { $project: { _id: 0, region: "$_id.region", visitors: 1 } },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
    ]);

    // ----- Total CONVERSATIONS (DMs) where user is a participant -----
    // Count distinct conversations created in the date range where the user is a participant
    const totalDMsPromise = Conversation.countDocuments({
      is_deleted: { $ne: true },
      createdAt: { $gte: start, $lte: end },
      participants: {
        $elemMatch: {
          "actor.model": myActorModel,
          "actor.id": userObjectId,
        },
      },
    });

    // Run all in parallel
    const [
      totalViews,
      totalClicksAgg,
      totalSubscribersAgg,
      topCitiesAgg,
      topRegionsAgg,
      totalDMs,
    ] = await Promise.all([
      totalViewsPromise,
      totalClicksAggPromise,
      totalSubscribersAggPromise,
      topCitiesAggPromise,
      topRegionsAggPromise,
      totalDMsPromise,
    ]);

    // Normalize results
    const totalClicks = totalClicksAgg?.[0]?.total || 0;
    const totalSubscribers = totalSubscribersAgg?.[0]?.total || 0;

    const cities = (topCitiesAgg || []).map((c) => ({
      city: c.city || "Unknown",
      visitors: c.visitors || 0,
    }));

    const regions = (topRegionsAgg || []).map((r) => ({
      region: r.region || "Unknown",
      visitors: r.visitors || 0,
    }));

    return res.json({
      summary: {
        totalViews,
        totalClicks,
        totalSubscribers,
        totalDMs, // total conversations count
      },
      cities,
      regions,
    });
  } catch (err) {
    console.error("dashboard-analytics error:", err);
    return res.status(500).json({ message: "Failed to load dashboard analytics" });
  }
});


router.get("/blocks/options", authenticateToken, async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user_id" });
    }

    const blocks = await Block.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          is_del: { $ne: true },
          archived: { $ne: true },
        },
      },
      { $sort: { order: 1, created_at: 1 } },
      {
        $project: {
          name: 1,
          order: 1,
          clicks: { $size: { $ifNull: ["$link_click_analytics", []] } },
          visitors: {
            $size: {
              $setUnion: [
                {
                  $map: {
                    input: { $ifNull: ["$link_click_analytics", []] },
                    as: "a",
                    in: "$$a.ip",
                  },
                },
                [],
              ],
            },
          },
        },
      },
    ]);

    res.json({ blocks });
  } catch (err) {
    console.error("GET /blocks/options error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATED: now accepts startDate & endDate, filters events by created_at
router.post("/analytics/blocks", authenticateToken, async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: missing user_id" });
    }

    const { blockId, startDate, endDate } = req.body || {};

    // Safety: require valid dates
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid or missing date range" });
    }

    const baseMatch = {
      user_id: new mongoose.Types.ObjectId(userId),
      is_del: { $ne: true },
      archived: { $ne: true },
    };
    if (blockId) baseMatch._id = new mongoose.Types.ObjectId(blockId);

    const results = await Block.aggregate([
      { $match: baseMatch },
      { $sort: { order: 1, created_at: 1 } },

      // Filter the nested events by created_at into a new array "events"
      {
        $addFields: {
          events: {
            $filter: {
              input: { $ifNull: ["$link_click_analytics", []] },
              as: "e",
              cond: {
                $and: [
                  { $gte: ["$$e.created_at", start] },
                  { $lt: ["$$e.created_at", end] },
                ],
              },
            },
          },
        },
      },

      {
        $facet: {
          // still useful to show order-wise info when "All" is selected
          perBlock: [
            {
              $project: {
                name: 1,
                order: 1,
                clicks: { $size: { $ifNull: ["$events", []] } }, // Views
                visitors: {
                  $size: {
                    $setUnion: [
                      {
                        $map: {
                          input: { $ifNull: ["$events", []] },
                          as: "a",
                          in: "$$a.ip",
                        },
                      },
                      [],
                    ],
                  },
                },
              },
            },
            { $sort: { order: 1 } },
          ],

          // Totals for the selected scope (All blocks or a single block)
          totals: [
            { $unwind: { path: "$events", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                clicks: {
                  $sum: {
                    $cond: [{ $ifNull: ["$events", false] }, 1, 0],
                  },
                },
                ips: { $addToSet: "$events.ip" },
              },
            },
            {
              $project: {
                _id: 0,
                clicks: 1,
                visitors: { $size: { $ifNull: ["$ips", []] } },
              },
            },
          ],

          // Top Cities (within range)
          topCities: [
            { $unwind: { path: "$events", preserveNullAndEmptyArrays: false } },
            {
              $match: {
                "events.city": { $nin: [null, "", "Unknown", "undefined"] },
              },
            },
            {
              $group: {
                _id: "$events.city",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, name: "$_id", count: 1 } },
          ],

          // Top States/Regions (within range)
          topStates: [
            { $unwind: { path: "$events", preserveNullAndEmptyArrays: false } },
            {
              $match: {
                "events.region": { $nin: [null, "", "Unknown", "undefined"] },
              },
            },
            {
              $group: {
                _id: "$events.region",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, name: "$_id", count: 1 } },
          ],
        },
      },
      {
        $project: {
          perBlock: 1,
          totals: {
            $ifNull: [{ $arrayElemAt: ["$totals", 0] }, { clicks: 0, visitors: 0 }],
          },
          topCities: 1,
          topStates: 1,
        },
      },
    ]);

    res.json(
      results[0] || {
        perBlock: [],
        totals: { clicks: 0, visitors: 0 },
        topCities: [],
        topStates: [],
      }
    );
  } catch (err) {
    console.error("POST /analytics/blocks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/product-analytics/table", authenticateToken, async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id ||
      req.headers["x-user-id"];

    if (!userId) return res.status(400).json({ message: "user_id header is required" });

    const pipeline = [
      { $match: { is_del: { $ne: true }, user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          title: 1,
          imageUrl: 1,
          created_at: 1,
          // Total events
          clicks: { $size: { $ifNull: ["$link_click_analytics", []] } },
          // Unique IPs (exclude null/empty), count them
          visitors: {
            $size: {
              $setDifference: [
                {
                  $setUnion: [
                    {
                      $map: {
                        input: { $ifNull: ["$link_click_analytics", []] },
                        as: "lc",
                        in: "$$lc.ip", // keep raw ip
                      },
                    },
                    [], // ensure array
                  ],
                },
                [null, ""], // exclude bad values
              ],
            },
          },
        },
      },
      { $sort: { created_at: -1 } },
    ];

    const docs = await Product.aggregate(pipeline);
    res.json({ ok: true, data: docs });
  } catch (err) {
    console.error("/product-analytics/table error", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});



router.post("/product-analytics/details", authenticateToken, async (req, res) => {
  try {
     const userId =
      req.user?.id ||
      req.user?.user_id ||
      req.headers["x-user-id"];
    const { productId, rangeKey = "last7" } = req.body || {};
    if (!userId) return res.status(400).json({ message: "user_id header is required" });
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const range = await getDateRange(rangeKey);
    const matchBase = { _id: new mongoose.Types.ObjectId(productId), user_id: new mongoose.Types.ObjectId(userId), is_del: { $ne: true } };

    // Fetch basic product
    const product = await Product.findOne(matchBase, { title: 1 }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const dateMatch = range
      ? { "link_click_analytics.created_at": { $gte: range.start, $lt: range.end } }
      : {};

    // clicks (count events) + visitors (unique IPs)
    const clicksVisitors = await Product.aggregate([
      { $match: matchBase },
      { $unwind: "$link_click_analytics" },
      ...(range ? [{ $match: dateMatch }] : []),
      {
        $group: {
          _id: null,
          clicks: { $sum: 1 },
          ips: { $addToSet: "$link_click_analytics.ip" },
        },
      },
      { $project: { _id: 0, clicks: 1, visitors: { $size: "$ips" } } },
    ]);

    const summary = clicksVisitors[0] || { clicks: 0, visitors: 0 };

    // Top 10 Cities (by unique visitors/IP)
    const topCities = await Product.aggregate([
      { $match: matchBase },
      { $unwind: "$link_click_analytics" },
      ...(range ? [{ $match: dateMatch }] : []),
      {
        $group: {
          _id: { city: "$link_click_analytics.city", ip: "$link_click_analytics.ip" },
        },
      },
      { $group: { _id: "$_id.city", visitors: { $sum: 1 } } },
      { $project: { _id: 0, name: { $ifNull: ["$_id", "Unknown"] }, visitors: 1 } },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
    ]);

    // Top 10 States/Regions (by unique visitors/IP)
    const topStates = await Product.aggregate([
      { $match: matchBase },
      { $unwind: "$link_click_analytics" },
      ...(range ? [{ $match: dateMatch }] : []),
      {
        $group: {
          _id: { state: "$link_click_analytics.region", ip: "$link_click_analytics.ip" },
        },
      },
      { $group: { _id: "$_id.state", visitors: { $sum: 1 } } },
      { $project: { _id: 0, name: { $ifNull: ["$_id", "Unknown"] }, visitors: 1 } },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      ok: true,
      data: {
        product: { id: productId, title: product.title },
        range: rangeKey,
        summary,
        topCities,
        topStates,
      },
    });
  } catch (err) {
    console.error("/product-analytics/details error", err);
    res.status(500).json({ ok: false, message: "Server error" });
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

router.post("/conversations/find-or-create", authenticateParticipant, async (req, res) => {
  try {
    const { subdomain } = req.body || {};
    if (!subdomain) return res.status(400).json({ error: "subdomain required" });

    const influencer = await USER.findOne({ handleUserName: subdomain }).lean();
    if (!influencer) return res.status(404).json({ error: "influencer not found" });

    // participant id strictly from authenticateParticipant (ParticipantUser)
    const participantIdRaw = req.user?.user_id;
    if (!participantIdRaw || !mongoose.Types.ObjectId.isValid(participantIdRaw)) {
      return res.status(401).json({ error: "participant not authenticated" });
    }

    const influencerId = String(influencer._id);
    const participantId = String(participantIdRaw);

    if (influencerId === participantId) {
      return res.status(400).json({ error: "cannot create conversation with yourself" });
    }

    // Build actor keys and sorted key used by the unique index
    const infKey = actorKey("User", influencerId);
    const memKey = actorKey("ParticipantUser", participantId);
    const participant_keys_sorted = [infKey, memKey].sort().join("|");

    // Find existing DM by unique compound index
    const existing = await Conversation.findOne({
      participant_keys_sorted,
      conversation_type: "dm",
      is_deleted: { $ne: true },
    }).lean();

    if (existing) {
      return res.json({ conversation: existing });
    }

    // Create DM participants using new ActorSubSchema shape
    const participants = [
      {
        actor: { model: "User", id: new mongoose.Types.ObjectId(influencerId) },
        role: "influencer",
        joined_at: new Date(),
        last_read_at: null,
        last_read_message_id: null,
        muted: false,
      },
      {
        actor: { model: "ParticipantUser", id: new mongoose.Types.ObjectId(participantId) },
        role: "member",
        joined_at: new Date(),
        last_read_at: null,
        last_read_message_id: null,
        muted: false,
      },
    ];

    const toInsert = {
      participants,
      participant_keys_sorted,
      conversation_type: "dm",
      last_message: null,
      last_message_text: "",
      last_message_at: null,
      message_count: 0,
      // unread_counts map must use the actorKey strings as keys
      unread_counts: {
        [infKey]: 0,
        [memKey]: 0,
      },
      metadata: { title: null, tags: [], pinned: false },
      is_deleted: false,
    };

    let convo = null;
    try {
      convo = await Conversation.create(toInsert);
    } catch (err) {
      // Handle race: unique index on (participant_keys_sorted, conversation_type)
      if (err && err.code === 11000) {
        const again = await Conversation.findOne({
          participant_keys_sorted,
          conversation_type: "dm",
          is_deleted: { $ne: true },
        }).lean();
        if (again) return res.json({ conversation: again });
      }
      throw err;
    }

    return res.json({ conversation: convo });
  } catch (err) {
    console.error("POST /usersOn/conversations/find-or-create error:", err);
    return res.status(500).json({ error: "internal", details: err.message });
  }
});

router.get("/messages/:conversationId", authenticateParticipant, async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "invalid conversation id" });
    }

    // ParticipantUser id from auth
    const participantId = req.user?.user_id;
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    // Ensure requester is a participant (by ActorSubSchema fields)
    const convo = await Conversation.findOne({
      _id: conversationId,
      "participants.actor.model": "ParticipantUser",
      "participants.actor.id": new mongoose.Types.ObjectId(participantId),
      is_deleted: { $ne: true },
    })
      .select("_id participants conversation_type metadata")
      .lean();

    if (!convo) {
      return res.status(403).json({ error: "not authorized for this conversation" });
    }

    // Identify influencer & member from participants
    const participantsArr = Array.isArray(convo.participants) ? convo.participants : [];

    // Influencer: role === "influencer" OR actor.model === "User"
    const influencerEntry =
      participantsArr.find((p) => p.role === "influencer") ||
      participantsArr.find((p) => p.actor?.model === "User");

    // Member: actor.model === "ParticipantUser" && id == requester
    const participantEntry = participantsArr.find(
      (p) =>
        p.actor?.model === "ParticipantUser" &&
        String(p.actor?.id) === String(participantId)
    );

    const influencerId = influencerEntry ? String(influencerEntry.actor?.id) : null;
    const memberId = participantEntry ? String(participantEntry.actor?.id) : String(participantId);

    if (!influencerId || !memberId) {
      return res.status(500).json({ error: "conversation participants malformed" });
    }

    // Fetch messages for this conversation
    const docs = await Message.find({
      conversation: new mongoose.Types.ObjectId(conversationId),
      is_deleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .select("_id text createdAt conversation sender sender_key attachments status")
      .lean();

    const messages = docs.map((d) => {
      const s = d.sender || null; // { model, id }
      const sModel = s?.model;
      const sId = s?.id ? String(s.id) : null;

      const senderRole =
        sModel === "User" && sId === influencerId
          ? "influencer"
          : sModel === "ParticipantUser" && sId === memberId
          ? "member"
          : undefined;

      return {
        _id: d._id,
        text: d.text || "",
        createdAt: d.createdAt,
        conversation: { _id: String(conversationId) },
        sender: s
          ? { model: sModel, id: sId }
          : undefined,
        senderRole,
        // include if you want on client:
        // attachments: d.attachments || [],
        // status: d.status,
      };
    });

    return res.json({ messages });
  } catch (err) {
    console.error("GET /usersOn/messages/:conversationId error:", err);
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
    const participantCollection = "participant_user";

    const pipeline = [
      { $match: { is_deleted: false } },

      // Join the conversation
      {
        $lookup: {
          from: "conversations",
          localField: "conversation",
          foreignField: "_id",
          as: "conversation"
        }
      },
      { $unwind: { path: "$conversation", preserveNullAndEmptyArrays: false } },

      // Filter to only "incoming to influencer"
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  recipients: {
                    $elemMatch: {
                      model: "User",
                      id: influencerObjectId
                    }
                  }
                },
                {
                  "conversation.participants": {
                    $elemMatch: {
                      "actor.model": "User",
                      "actor.id": influencerObjectId
                    }
                  }
                }
              ]
            },
            {
              $or: [
                { "sender.model": { $ne: "User" } },
                { "sender.id": { $ne: influencerObjectId } }
              ]
            }
          ]
        }
      },

      // Sort newest first, then group to pick the latest per conversation
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversation._id",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },

      // Pagination
      { $skip: skip },
      { $limit: limit },

      // Look up sender details
      {
        $lookup: {
          from: "users",
          let: { sid: "$sender.id", smodel: "$sender.model" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$$smodel", "User"] }, { $eq: ["$_id", "$$sid"] }] } } },
            { $project: { _id: 1, name: 1, fullName: 1, handleUserName: 1, email: 1 } }
          ],
          as: "user_sender"
        }
      },
      { $unwind: { path: "$user_sender", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: participantCollection,
          let: { sid: "$sender.id", smodel: "$sender.model" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$$smodel", "ParticipantUser"] }, { $eq: ["$_id", "$$sid"] }] } } },
            { $project: { _id: 1, name: 1, fullName: 1, username: 1, email: 1 } }
          ],
          as: "participant_sender"
        }
      },
      { $unwind: { path: "$participant_sender", preserveNullAndEmptyArrays: true } },

      // Build robust name fallback
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
                      { $ifNull: ["$user_sender.handleUserName", { $ifNull: ["$participant_sender.email", "$user_sender.email"] }] }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },

      {
        $project: {
          _id: 1,
          conversation_id: "$conversation._id",
          sender: "$sender",
          text: 1,
          createdAt: 1,
          from_name: 1,
          // NEW: Include category fields
          category: "$conversation.category",
          category_confidence: "$conversation.category_confidence",
          category_analyzed_at: "$conversation.category_analyzed_at"
        }
      }
    ];

    const results = await Message.aggregate(pipeline).exec();

    const rows = results.map((m) => ({
      _id: m._id,
      conversation_id: m.conversation_id ? String(m.conversation_id) : null,
      from_id: m?.sender?.id ? String(m.sender.id) : null,
      from_model: m?.sender?.model || null,
      from_name: m.from_name || "Unknown",
      text: m.text || "",
      created_at: m.createdAt || null,
      // NEW: Include category data
      category: m.category || "Uncategorized",
      category_confidence: m.category_confidence || null,
      category_analyzed_at: m.category_analyzed_at || null
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

router.get("/product-categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const search = (req.query.search || "").trim();
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const q = {
      user_id: userId,
      is_del: { $ne: true },
      ...(search ? { name: { $regex: safe, $options: "i" } } : {}),
    };

    const items = await ProductCategory.find(q)
      .sort({ name: 1 })
      .limit(50)
      .lean();

    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/product-categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "name required" });

    // Check if category exists for THIS user (active one; allow reusing soft-deleted name by reviving it)
    let existing = await ProductCategory.findOne({
      user_id: userId,
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existing) {
      // If it was soft-deleted, revive it
      if (existing.is_del) {
        existing.is_del = false;
        existing.updatedAt = new Date();
        await existing.save();
      }
      return res.json({ category: existing });
    }

    const created = await ProductCategory.create({
      user_id: userId,
      name,
    });

    res.json({ category: created });
  } catch (e) {
    // If you adopt a compound unique index, surfacing 11000 is useful
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: e.message || "Failed to create category" });
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



    res.cookie("tokenMyhandleProf", token, {
  httpOnly: true,
  secure: true,                  // required when SameSite=None
  sameSite: "none",              // critical for iOS/Safari & any cross-site/iframe usage
   domain: ".myhandle.in",// needed if crossing subdomains
  path: "/",             // ensure all routes get it
  maxAge: 7 * 24 * 60 * 60 * 1000
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
  secure: true,                  // required when SameSite=None
  sameSite: "none",              // critical for iOS/Safari & any cross-site/iframe usage
   domain: ".myhandle.in",// needed if crossing subdomains
  path: "/",             // ensure all routes get it
  maxAge: 7 * 24 * 60 * 60 * 1000
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
  
      res.status(200).send({ success: true, data: { name: result.name, handleUserName: result.handleUserName, picture : result.picture, intro: result.intro, leftHeadImage: result.leftHeadImage, rightTopImage: result.rightTopImage, rightBottomImage: result.rightBottomImage, store_enabled: result.store_enabled, dm_enabled: result.dm_enabled, email: result.email}});
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
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    const inferred = extractHandleFromHost(host, ["myhandle.in"]);
    const handle = (req.query.handle || inferred || "").trim().toLowerCase();

    if (!handle) return res.status(400).json({ error: "handle required" });

    const user = await USER.findOne({ handleUserName: handle }).lean();
    if (!user) return res.status(404).json({ error: "not found" });

    const blocks = await Block.find({ user_id: user._id, is_del: false })
      .sort({ order: 1, created_at: -1 })
      .lean();

    const { _id, __v, ...userRest } = user;
    const payload = {
      ...userRest,
      id: String(_id),
      blocks: blocks || [],
      socials: user.socials || [],
    };

    // === Analytics logging ===
    (async () => {
      try {
        const ip = await getClientIp(req);
        const ua = req.headers["user-agent"] || "";
        const ref = req.headers["referer"] || req.headers["referrer"] || "";

        const geo = await lookupGeo_ipdata(ip);

        let geoLanguages = [];
        try {
          const rawLangs = geo?.raw?.languages;
          if (Array.isArray(rawLangs) && rawLangs.length) {
            geoLanguages = rawLangs
              .map((l) => ({
                name: l?.name || l?.language || null,
                native: l?.native || null,
                code: l?.code || l?.iso || null,
              }))
              .filter(Boolean);
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

router.post("/subdomain/check", async (req, res) => {
  try {
    const raw = (req.body?.subdomain ?? "").toString().trim();
    const subdomain = raw.toLowerCase();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


    // Basic validations (the frontend also does this, but never trust the client)
    if (!subdomain || !isValidSubdomain(subdomain) || RESERVED.has(subdomain)) {
      // You can also include a reason if you want
      return res.json({ available: false });
    }

    // Case-insensitive exact match on handleUserName
    // Prefer storing a normalized field (e.g., handleUserNameLower) and indexing that.
    // This regex approach is safe & exact but slower without an index.
    const rx = new RegExp(`^${escapeRegex(subdomain)}$`, "i");

    const exists = await USER.exists({ handleUserName: rx });
    return res.json({ available: !Boolean(exists) });
  } catch (err) {
    console.error("subdomain check error:", err);
    return res.status(500).json({ available: false });
  }
});



router.post("/url-metadata", authenticateToken, async (req, res) => {
  try {
    const url = req.body?.url;
    if (!url) return res.status(400).json({ message: "url required" });

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: "Invalid URL protocol" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Check cache first
    const cached = metaCache.get(url);
    if (cached) {
      console.log('Returning cached metadata for:', url);
      return res.json(cached);
    }
    
    if (!LINKPREVIEW_API_KEY) {
      console.error("LINKPREVIEW_API_KEY not set in environment variables");
      return res.status(500).json({ message: "API configuration error" });
    }

    console.log('Fetching metadata from LinkPreview.net for:', url);

    const response = await axios.post(
      'https://api.linkpreview.net',
      { q: url },
      {
        headers: {
          'X-Linkpreview-Api-Key': LINKPREVIEW_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    // LinkPreview.net returns: title, description, image, url
    let image = data.image || null;

    // Force HTTPS for images if available
    if (image && image.startsWith('http://')) {
      image = image.replace(/^http:\/\//, 'https://');
    }

    const result = {
      title: data.title || null,
      image: image,
      description: data.description || null,
    };

    // Cache successful results
    if (result.title || result.image) {
      metaCache.set(url, result);
    }

    res.json(result);

  } catch (e) {
    console.error("url-metadata error:", e?.response?.data || e?.message);
    
    // Handle LinkPreview.net specific errors
    if (e?.response?.status === 429) {
      return res.status(200).json({
        title: null,
        image: null,
        description: null,
        error: "Rate limit exceeded. Please try again later."
      });
    }

    if (e?.response?.status === 401) {
      console.error("LinkPreview API authentication failed. Check your API key.");
      return res.status(500).json({
        message: "API authentication failed"
      });
    }

    // Return graceful fallback for other errors
    res.status(200).json({
      title: null,
      image: null,
      description: null,
      error: "Could not fetch metadata"
    });
  }
});



router.post("/upload-product", upload.single("image"), authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const {
        type,               // 'affiliate' | 'digital' | etc.
        title,
        link,
        description,
        price,
        category_id,        // optional: ObjectId string
        category_name,      // optional: string (e.g., "Fitness")
        imageUrlFromMeta,   // optional
      } = req.body;

      // Basic validation
      if (!type) return res.status(400).json({ message: "type is required" });
      if (type === "affiliate") {
        if (!title || !link)
          return res.status(400).json({ message: "title and link required for affiliate" });
      } else if (type === "digital") {
        if (!title)
          return res.status(400).json({ message: "product name (title) required for digital" });
      } else {
        if (!title) return res.status(400).json({ message: "title is required" });
      }

      // ---------- Image handling (upload to GCS / or use meta) ----------
      let imageUrl = null;
      let imagePublicId = null;

      if (req.file) {
        if (req.file.path) {
          const uploaded = await uploadFilePathToGCS(
            req.file.path,
            req.file.originalname,
            req.file.mimetype
          );
          imageUrl = uploaded.publicUrl;
          imagePublicId = uploaded.objectName;
          if (fs.existsSync(req.file.path)) {
            try { await unlinkAsync(req.file.path); } catch {}
          }
        } else if (req.file.buffer) {
          const uploaded = await uploadBufferToGCS(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );
          imageUrl = uploaded.publicUrl;
          imagePublicId = uploaded.objectName;
        }
      } else if (imageUrlFromMeta) {
        imageUrl = imageUrlFromMeta; // allow affiliate thumbnail w/o upload
      }

      // ---------- Resolve/ensure category (ObjectId on productCategory) ----------
      let productCategoryId = null;

      // Priority 1: explicit category_id (validate it belongs to this user)
      if (category_id) {
        const cat = await ProductCategory.findOne(
          { _id: category_id, user_id: userId, is_del: false },
          { _id: 1, name: 1 }
        ).lean();
        if (!cat) {
          return res.status(400).json({ message: "Invalid category_id for this user" });
        }
        productCategoryId = cat._id;
      }
      // Priority 2: category_name -> find or create (case-insensitive, per-user unique)
      else if (category_name && String(category_name).trim()) {
        const name = String(category_name).trim();
        // Try find same name (case-insensitive) for this user
        let cat = await ProductCategory.findOne(
          { user_id: userId, is_del: false, name: new RegExp("^" + escapeRegex(name) + "$", "i") },
          { _id: 1, name: 1 }
        ).lean();

        if (!cat) {
          // Create a new category for this user
          const created = await ProductCategory.create({
            user_id: userId,
            name,
            is_del: false,
          });
          productCategoryId = created._id;
        } else {
          productCategoryId = cat._id;
        }
      }

      // ---------- Create product ----------
      const productDoc = {
        user_id: userId,
        type,
        title,
        link: link || null,
        description: description || null,
        price:
          price !== undefined && price !== null && String(price).trim() !== ""
            ? Number(price)
            : undefined,
        imageUrl,
        imagePublicId,
        productCategory: productCategoryId || null,
        // DO NOT persist legacy fields anymore:
        // category_id, category_name
      };

      const created = await Product.create(productDoc);

      // Return populated + flat category string (for easy UI)
      const saved = await Product.findById(created._id)
        .populate({ path: "productCategory", select: "name", strictPopulate: false })
        .lean();

      const response = {
        ...saved,
        category: saved?.productCategory?.name || null,
      };

      return res.json({ product: response });
    } catch (err) {
      console.error("Create product error:", err);
      return res
        .status(500)
        .json({ message: "Error creating product", error: err.message });
    }
  }
);


router.post("/edit-product/:id", upload.single("image"), authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      type,
      title,
      link,
      description,
      price,
      category_id,
      category_name,
      imageUrlFromMeta,
    } = req.body;

    // Find existing product and verify ownership
    const existingProduct = await Product.findOne({ _id: id, user_id: userId });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Build update object
    const update = { updated_at: new Date() };
    
    if (type) update.type = type;
    if (title !== undefined) update.title = title;
    if (link !== undefined) update.link = link;
    if (description !== undefined) update.description = description;
    
    // Handle price (allow null/empty to clear it)
    if (price !== undefined && price !== null && String(price).trim() !== "") {
      update.price = Number(price);
    } else if (price === null || price === "") {
      update.price = null;
    }

    // ---------- Image handling (same priority as upload) ----------
    if (req.file) {
      // Priority 1: New manual upload
      if (req.file.path) {
        const uploaded = await uploadFilePathToGCS(
          req.file.path,
          req.file.originalname,
          req.file.mimetype
        );
        update.imageUrl = uploaded.publicUrl;
        update.imagePublicId = uploaded.objectName;
        
        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
          try { await unlinkAsync(req.file.path); } catch {}
        }
        
        // Optional: Delete old image from GCS if it exists
        if (existingProduct.imagePublicId) {
          try {
            await deleteFromGCS(existingProduct.imagePublicId);
          } catch (err) {
            console.warn("Failed to delete old image:", err);
          }
        }
      } else if (req.file.buffer) {
        const uploaded = await uploadBufferToGCS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        update.imageUrl = uploaded.publicUrl;
        update.imagePublicId = uploaded.objectName;
        
        // Optional: Delete old image from GCS
        if (existingProduct.imagePublicId) {
          try {
            await deleteFromGCS(existingProduct.imagePublicId);
          } catch (err) {
            console.warn("Failed to delete old image:", err);
          }
        }
      }
    } else if (imageUrlFromMeta) {
      // Priority 2: Auto-fetched URL from metadata
      update.imageUrl = imageUrlFromMeta;
      // Note: Don't set imagePublicId since this is an external URL
      update.imagePublicId = null;
    }

    // ---------- Category handling (same logic as upload) ----------
    let productCategoryId = existingProduct.productCategory; // Keep existing by default

    // Priority 1: explicit category_id
    if (category_id) {
      const cat = await ProductCategory.findOne(
        { _id: category_id, user_id: userId, is_del: false },
        { _id: 1, name: 1 }
      ).lean();
      
      if (!cat) {
        return res.status(400).json({ message: "Invalid category_id for this user" });
      }
      productCategoryId = cat._id;
    }
    // Priority 2: category_name -> find or create
    else if (category_name && String(category_name).trim()) {
      const name = String(category_name).trim();
      
      // Try find same name (case-insensitive) for this user
      let cat = await ProductCategory.findOne(
        { 
          user_id: userId, 
          is_del: false, 
          name: new RegExp("^" + escapeRegex(name) + "$", "i") 
        },
        { _id: 1, name: 1 }
      ).lean();

      if (!cat) {
        // Create a new category for this user
        const created = await ProductCategory.create({
          user_id: userId,
          name,
          is_del: false,
        });
        productCategoryId = created._id;
      } else {
        productCategoryId = cat._id;
      }
    }
    // If category_name is explicitly empty string, clear the category
    else if (category_name === "") {
      productCategoryId = null;
    }

    update.productCategory = productCategoryId;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      update,
      { new: true }
    )
      .populate({ path: "productCategory", select: "name", strictPopulate: false })
      .lean();

    // Return with flat category field for UI compatibility
    const response = {
      ...updatedProduct,
      category: updatedProduct?.productCategory?.name || null,
    };

    return res.json({ product: response });
    
  } catch (err) {
    console.error("Edit product error:", err);
    return res.status(500).json({ 
      message: "Error editing product", 
      error: err.message 
    });
  }
});


// GET /api/products/fet-user-products?page=1&limit=10
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

// router.post("/upload-header-image", authenticateToken, upload.single("image"),
//   async (req, res) => {
//     try {
//       const userId = req.user?.user_id;
//       if (!userId) {
//         return res.status(401).json({ success: false, message: "Unauthorized" });
//       }

//       // Multer memoryStorage provides file.buffer
//       const file = req.file;
//       const rawPosition = req.body?.position;

//       // Basic validation
//       if (!file || !file.buffer) {
//         return res.status(400).json({
//           success: false,
//           message: "No file uploaded. Ensure you send multipart/form-data with field name 'image'.",
//         });
//       }

//       const targetField = normalizePosition(rawPosition);
//       if (!targetField) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid position value. Acceptable values: left | headerImage1 | 1, rightTop | headerImage2 | 2, rightBottom | headerImage3 | 3",
//         });
//       }

//       // Upload buffer to GCS (your helper) - it should return { publicUrl, objectName }
//       const { publicUrl, objectName } = await uploadBufferToGCS(
//         file.buffer,
//         file.originalname || `upload-${Date.now()}`,
//         file.mimetype || "application/octet-stream"
//       );

//       if (!publicUrl) {
//         return res.status(500).json({ success: false, message: "Failed to upload to storage" });
//       }

//       // Update user doc
//       const update = { [targetField]: publicUrl, updated_at: new Date() };
//       const updatedUser = await USER.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();

//       if (!updatedUser) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }

//       return res.json({
//         success: true,
//         url: publicUrl,
//         updatedField: targetField,
//         objectName,
//         user: {
//           _id: updatedUser._id,
//           leftHeadImage: updatedUser.leftHeadImage,
//           rightTopImage: updatedUser.rightTopImage,
//           rightBottomImage: updatedUser.rightBottomImage,
//         },
//       });
//     } catch (err) {
//       console.error("upload-header-image error:", err);
//       return res.status(500).json({
//         success: false,
//         message: "Upload failed",
//         error: err?.message || String(err),
//       });
//     }
//   }
// );


router.post("/upload-header-image", 
  authenticateToken, 
  (req, res, next) => {
    console.log('=== Upload Request Started ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('User:', req.user?.user_id);
    next();
  },
  upload.single("image"),
  async (req, res) => {
    try {
      console.log('=== After Multer Middleware ===');
      console.log('File received:', !!req.file);
      console.log('File details:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        bufferLength: req.file.buffer?.length
      } : 'NO FILE');
      console.log('Body:', req.body);
      
      const userId = req.user?.user_id;
      if (!userId) {
        console.error('No userId found');
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const file = req.file;
      const rawPosition = req.body?.position;

      if (!file || !file.buffer) {
        console.error('File validation failed:', { hasFile: !!file, hasBuffer: !!file?.buffer });
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Ensure you send multipart/form-data with field name 'image'.",
        });
      }

      const targetField = normalizePosition(rawPosition);
      if (!targetField) {
        console.error('Invalid position:', rawPosition);
        return res.status(400).json({
          success: false,
          message:
            "Invalid position value. Acceptable values: left | headerImage1 | 1, rightTop | headerImage2 | 2, rightBottom | headerImage3 | 3",
        });
      }

      console.log('Uploading to GCS...', {
        bufferSize: file.buffer.length,
        filename: file.originalname,
        mimetype: file.mimetype
      });

      // Upload buffer to GCS
      const { publicUrl, objectName } = await uploadBufferToGCS(
        file.buffer,
        file.originalname || `upload-${Date.now()}`,
        file.mimetype || "application/octet-stream"
      );

      console.log('GCS upload result:', { publicUrl, objectName });

      if (!publicUrl) {
        console.error('GCS upload failed - no publicUrl returned');
        return res.status(500).json({ success: false, message: "Failed to upload to storage" });
      }

      console.log('Updating user document...', { userId, targetField, publicUrl });

      // Update user doc
      const update = { [targetField]: publicUrl, updated_at: new Date() };
      const updatedUser = await USER.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();

      if (!updatedUser) {
        console.error('User not found:', userId);
        return res.status(404).json({ success: false, message: "User not found" });
      }

      console.log('Upload successful!');

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
      console.error("=== UPLOAD ERROR ===");
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.error("Full error:", err);
      
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err?.message || String(err),
        errorName: err?.name,
      });
    }
  }
);

router.get("/fetch-influencer-products", async (req, res) => {
  try {
    console.log("Incoming URL:", req.originalUrl);

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    const qRaw = (req.query.q || "").trim();
    const subdomainRaw = (req.query.subdomain || "").trim();
    const categoryRaw = (req.query.category || "").trim(); // e.g. "Fitness"

    if (!subdomainRaw) {
      console.log("No subdomain provided");
      return res.json({ data: [], total: 0 });
    }

    // Resolve subdomain/handle -> user
    const handleRegex = new RegExp("^" + escapeRegex(subdomainRaw) + "$", "i");
    const user = await USER.findOne(
      { $or: [{ handleUserName: handleRegex }, { handle: handleRegex }] },
      { _id: 1 }
    ).lean();

    if (!user) {
      console.log("No user found for subdomain:", subdomainRaw);
      return res.json({ data: [], total: 0 });
    }
    const userId = user._id;

    // Build product filter
    const filter = { user_id: userId, is_del: false };

    if (qRaw) {
      const safe = escapeRegex(qRaw);
      const re = new RegExp(safe, "i");
      filter.$or = [{ title: re }, { name: re }, { link: re }];
    }

    // If a category NAME is provided, resolve it to that user's category _id
    if (categoryRaw && categoryRaw.toLowerCase() !== "all") {
      const nameRegex = new RegExp("^" + escapeRegex(categoryRaw) + "$", "i");
      const catDoc = await ProductCategory.findOne(
        { user_id: userId, is_del: false, name: nameRegex },
        { _id: 1 }
      ).lean();

      if (!catDoc) {
        // No such category for this user -> empty result
        return res.json({ data: [], total: 0 });
      }

      filter.productCategory = catDoc._id;
    }

    // Fetch products and populate category; then add plain `category` string into each item
    const [rawData, total] = await Promise.all([
      Product.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        // strictPopulate:false guards while you ensure Product schema has `productCategory` ref
        .populate({ path: "productCategory", select: "name", strictPopulate: false })
        .lean(),
      Product.countDocuments(filter),
    ]);

    const data = rawData.map((doc) => {
      const categoryName = doc?.productCategory?.name || null;
      return { ...doc, category: categoryName };
    });

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
