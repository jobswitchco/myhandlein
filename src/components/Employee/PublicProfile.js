import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LinkIcon from "@mui/icons-material/Link";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import MovieIcon from "@mui/icons-material/Movie";
import AddIcon from "@mui/icons-material/Add";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import IndiaFlag from "../../images/flag.png";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Checkbox } from "@mui/material";
import newsletterBg from "../../images/newsLetterBg.jpg";
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";


export default function PublicProfile({ handle, initialProfile = null }) {
  
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [currentFormBlock, setCurrentFormBlock] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [snack, setSnack] = useState({ open: false, message: "" });
  const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
  const [newsletterDialogText, setNewsletterDialogText] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterAccept, setNewsletterAccept] = useState(true);
  const [newsletterDialogBlock, setNewsletterDialogBlock] = useState(null); // store block opened
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const API_BASE = "/api/usersOn";


  
function openNewsletterDialog(block) {
  setNewsletterDialogBlock(block || null);
  setNewsletterDialogText(block?.action || block?.title || "Subscribe to Newsletter");
  setNewsletterEmail("");
  setNewsletterAccept(true);
  setNewsletterDialogOpen(true);
}

  
  function closeNewsletterDialog() {
    setNewsletterDialogOpen(false);
  }


    const makeWaUrl = (input, message = "") => {
  if (!input) return "";

  let raw = String(input).trim();

  // If it's already a WA link, just append message if provided
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/i.test(raw)) {
    if (message) {
      const sep = raw.includes("?") ? "&" : "?";
      return `${raw}${sep}text=${encodeURIComponent(message)}`;
    }
    return raw;
  }

  // Strip everything except digits and a leading +
  raw = raw.replace(/[^\d+]/g, "");
  // wa.me path should NOT contain '+'
  raw = raw.replace(/^\+/, "");

  let url = `https://wa.me/${raw}`;
  if (message) url += `?text=${encodeURIComponent(message)}`;
  return url;
};




  function extractHandleFromHostname(hostname, roots = ["myhandle.in"]) {
  if (!hostname) return "";
  const raw = String(hostname).toLowerCase();

  for (const root of roots) {
    if (raw === root || raw.endsWith("." + root)) {
      const left = raw.replace(new RegExp("\\." + root.replace(/\./g, "\\.") + "$"), "");
      if (!left) return "";
      const parts = left.split(".");
      const last = parts[0] === "www" ? parts.slice(1) : parts;
      return last.length ? last[last.length - 1] : "";
    }
  }

  const parts = raw.split(".");
  if (parts.length >= 3) return parts[0] === "www" ? parts[1] : parts[0];
  return "";
}


const derivedHandle = handle || extractHandleFromHostname(typeof window !== "undefined" ? window.location.hostname : "", ["myhandle.in"]);

   async function handleSubscribe() {
  // basic checks
  if (!newsletterEmail || !String(newsletterEmail).trim()) {
    return setSnack?.({ open: true, message: "Please enter your email" }) || alert("Please enter your email");
  }

  const email = String(newsletterEmail).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return setSnack?.({ open: true, message: "Please enter a valid email" }) || alert("Invalid email");
  }

  if (!newsletterAccept) {
    return setSnack?.({ open: true, message: "Please accept terms & conditions" }) || alert("Accept terms");
  }

  setNewsletterSubmitting(true);

  try {
    // payload includes optional metadata (blockId / newsletter text)
const payload = {
  email,
  newsletterText: newsletterDialogText || "",
  blockId: newsletterDialogBlock?._id || newsletterDialogBlock?.id || null,
  submittedAt: new Date().toISOString(),
  handle: derivedHandle || null, // <-- send handle so backend can resolve user_id
};


    // POST to your newsletter subscribe endpoint
    const res = await axios.post(`${API_BASE}/newsletters-subscribe`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    // success feedback
    const message = res?.data?.message || "Successfully subscribed";
    toast.success(message);
    setNewsletterDialogOpen(false);
    setNewsletterEmail("");
    setNewsletterDialogBlock(null);
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    const msg = err?.response?.data?.message || err?.message || "Failed to subscribe";
    setSnack?.({ open: true, message: msg });
  } finally {
    setNewsletterSubmitting(false);
  }
}

useEffect(() => {
    if (!derivedHandle) return;
    if (profile) return;

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get(`${API_BASE}/profile`, {
          params: { handle: derivedHandle }, // <= pass it explicitly
          signal,
        });
        setProfile(resp.data);
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        if (err.response && err.response.status === 404) setError("notfound");
        else {
          setError("network");
          console.error("Profile fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedHandle]);


  async function handleLinkClick(block, url, opts = { newTab: true, awaitPost: false }) {
    if (!url) return;
    const apiEndpoint = `${API_BASE}/link-click-analytics`;
    const linkKey = block?._id || block?.id || block?.key || block?.actionKey || block?.slug || block?.name || url;

    const payload = {
      handle: derivedHandle || block?.ownerHandle || (profile && profile.handleUserName) || undefined,
      link_key: String(linkKey),
      block_name: block?.name || block?.title || undefined,
    };

  // 1) Try navigator.sendBeacon first (best for navigation/unload)
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const ok = navigator.sendBeacon(apiEndpoint, blob);
      // sendBeacon is fire-and-forget; we don't get a response
      // continue to navigation below
    } catch (beErr) {
      console.warn("sendBeacon failed, falling back to axios POST:", beErr);
      // fall through to axios below
      try {
        // fire-and-forget axios (not awaited) so navigation isn't blocked
        axios.post(apiEndpoint, payload, { headers: { "Content-Type": "application/json" }, timeout: 2500 })
          .catch((e) => console.warn("axios POST (fallback) failed:", e?.message || e));
      } catch (e) {
        // ignore
      }
    } finally {
      // navigate immediately — sendBeacon already queued the payload
      if (opts.newTab) window.open(url, "_blank");
      else window.location.href = url;
      return;
    }
  }

  // 2) If sendBeacon not available, use axios. If opts.awaitPost is true we will await it (safer), otherwise fire-and-forget.
  try {
    const postPromise = axios.post(apiEndpoint, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 2500, // short timeout to avoid long waits if we do await
    });

    if (opts.awaitPost) {
      // wait for the POST to finish (may add latency)
      try {
        await postPromise;
      } catch (err) {
        console.warn("axios POST failed (await):", err?.message || err);
      }
      // then navigate
      if (opts.newTab) window.open(url, "_blank");
      else window.location.href = url;
      return;
    } else {
      // fire-and-forget: don't await; still handle rejection to avoid unhandled rejections
      postPromise.catch((err) => console.warn("axios POST failed (non-blocking):", err?.message || err));
    }
  } catch (err) {
    // final fallback ignore
    console.warn("axios POST error (unexpected):", err?.message || err);
  } finally {
    // navigation (if not already done)
    if (opts.newTab) window.open(url, "_blank");
    else window.location.href = url;
  }
}


  if (!handle) return <div style={{ padding: 24 }}>Invalid profile handle</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) {
    if (error === "notfound") return <div style={{ padding: 24 }}>Profile not found</div>;
    if (error === "network") return <div style={{ padding: 24 }}>Network/CORS error — check backend</div>;
    return <div style={{ padding: 24 }}>Error: {String(error)}</div>;
  }
  if (!profile) return <div style={{ padding: 24 }}>Profile not found</div>;

  // normalize user fields
  const userDetails = {
    name: profile.name || profile.displayName || "",
    picture: profile.picture || profile.avatarUrl || profile.ogImage || "",
    handleUserName: profile.handleUserName || profile.handle || handle,
    socials: profile.socials || profile.links || [],
    intro: profile.intro || profile.bio || profile.description || "",
  };


  // pick store flag from profile variations
const storeEnabled = profile.store_enabled ?? profile.storeEnabled ?? profile.storeEnabledFlag ?? false;
const dmEnabled = profile.dm_enabled ?? profile.dmEnabled ?? profile.dmEnabledFlag ?? false;

  // header images (use the fields you asked for; fallback to other likely names)
  const leftImage =
    profile.leftHeadImage ||
    profile.leftImage ||
    profile.headerImage1 ||
    profile.headerLeft ||
    profile.leftHead ||
    "";
  const rightTopImage =
    profile.rightTopImage ||
    profile.headerImage2 ||
    profile.headerRightTop ||
    profile.rightTop ||
    "";
  const rightBottomImage =
    profile.rightBottomImage ||
    profile.headerImage3 ||
    profile.headerRightBottom ||
    profile.rightBottom ||
    "";

  const avatarUrl = userDetails.picture || "";
  const name = userDetails.name || userDetails.handleUserName || handle;
  const socials = Array.isArray(userDetails.socials) ? userDetails.socials : [];
  const blocks = Array.isArray(profile.blocks) ? profile.blocks : [];

  const getYouTubeId = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      if (u.hostname === "youtu.be") return u.pathname.slice(1);
    } catch (e) {
      return null;
    }
    return null;
  };

  function openFormDialog(block) {
    let fields = block.fields;
    if (!fields && typeof block.action === "string") {
      try {
        const parsed = JSON.parse(block.action);
        fields = parsed?.fields || parsed;
      } catch (e) {}
    }
    fields = fields || [];

    const values = {};
    const normalized = fields.map((f, i) => {
      const key = f.key || f.name || (f.label ? f.label.toLowerCase().replace(/\s+/g, "_") : `f_${i}`);
      let options = undefined;
      if (f && f.options !== undefined) {
        if (Array.isArray(f.options)) {
          options = f.options.map((o) => String(o).trim()).filter(Boolean);
        } else if (typeof f.options === "string") {
          options = f.options.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          options = [String(f.options)];
        }
      }
      values[key] = "";
      return { ...f, _key: key, options };
    });

    setCurrentFormBlock({ ...block, _renderFields: normalized });
    setFormValues(values);
    setFormErrors({});
    setFormDialogOpen(true);
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    setCurrentFormBlock(null);
    setFormValues({});
    setFormErrors({});
    setFormSubmitting(false);
  }

  async function submitForm() {
    if (!currentFormBlock) return;
    const fields = currentFormBlock._renderFields || [];
    const errors = {};
    fields.forEach((f) => {
      const key = f._key;
      if (f.required && !String(formValues[key] ?? "").trim()) {
        errors[key] = `${f.label || "This field"} is required`;
      }
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      blockId: currentFormBlock._id || currentFormBlock.id,
      blockName: currentFormBlock.name || currentFormBlock.title || "form",
      values: formValues,
      meta: { submittedAt: new Date().toISOString(), fromHandle: handle },
    };

    setFormSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/submit-form`, payload, { withCredentials: false });
      setSnack({ open: true, message: res?.data?.message || "Submitted" });
      closeFormDialog();
    } catch (err) {
      console.error("Form submit error:", err);
      const msg = err?.response?.data?.message || "Failed to submit";
      setSnack({ open: true, message: msg });
      setFormSubmitting(false);
    }
  }

  function renderPreviewBlock(b) {
    if (!b) return null;
    const title = b.name || b.title || "(untitled)";
    const url = b.action || b.actionUrl || b.link || "";
    const type = (b.type || "").toLowerCase();

    if (type === "form") {
      let fields = b.fields;
      if (!fields && typeof b.action === "string") {
        try { fields = JSON.parse(b.action).fields; } catch {}
      }
      return (
        <Paper key={b._id || title} elevation={0} sx={{
         minWidth: '100%', display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: "pointer"
        }} onClick={() => openFormDialog(b)}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#10b981", 0.06), color: "#10b981", flexShrink: 0 }}>
              <AddIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton aria-label="open" onClick={() => openFormDialog(b)} sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha("#10b981", 0.06), color: "#10b981", "&:hover": { bgcolor: alpha("#10b981", 0.14) } }} size="small">
              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Paper>
      );
    }

    if (type === "link" || type === "cta" || !type) {
      return (
        <Paper key={b._id || url || title} elevation={0} sx={{
          minWidth: '100%', display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: url ? "pointer" : "default"
        }}
        onClick={() => url && handleLinkClick(b, url, { newTab: true })}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#6366f1", 0.06), color: "#6366f1", flexShrink: 0 }}>
              <LinkIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ display: "flex", overflow: "hidden", minWidth: 0 }}>
              <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton aria-label="open"  sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha("#6d28d9", 0.06), color: "#6d28d9", "&:hover": { bgcolor: alpha("#6d28d9", 0.14) } }} size="small">
              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Paper>
      );
    }

    if (type === "video") {
      const ytId = getYouTubeId(url);
      const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

      return (
        <Paper key={b._id || url || title} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: url ? "pointer" : "default" }} onClick={() => url && handleLinkClick(b, url, { newTab: true })}>
          <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", bgcolor: "#000" }}>
            {thumb ? (
              <Box component="img" src={thumb} alt={title} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F3F4F6" }}>
                <MovieIcon sx={{ fontSize: 28, color: "rgba(15,23,42,0.6)" }} />
              </Box>
            )}
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" fill="#fff" />
                </svg>
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

    
     if (b.type === "newsletter") {
        return (
          <Paper
            key={b.id}
            sx={{
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 2,
              minWidth: '100%',
          background: (t) =>
          t.palette.mode === "dark"
            ? `linear-gradient(rgba(0,0,0,0.36), rgba(0,0,0,0.36)), url(${newsletterBg})`
            : `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.06)), url(${newsletterBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff",                          // ensures text is visible
        boxShadow: "0 8px 24px rgba(2,6,23,0.08)",
        cursor: "pointer",
        textAlign: "left",
        transition: "transform .12s ease, box-shadow .12s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(2,6,23,0.16)" },
        // optional: ensure rounded corners clip the image
        overflow: "hidden",
            boxShadow: "0 8px 24px rgba(2,6,23,0.08)",
              transition: "transform .12s ease, box-shadow .12s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(2,6,23,0.12)" },
            }}
            onClick={() => openNewsletterDialog(b)}
            elevation={0}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  border: '1px solid #1055C9',
                  flexShrink: 0,
                }}
              >
               <MailOutlinedIcon sx={{ color: '#1055C9'}}/>
              </Box>
    
              <Box sx={{display : 'flex', flexDirection : 'column', minWidth: 0 }}>
                <Typography sx={{ fontFamily: "Inter", fontSize: 15, fontWeight: 500, mb: 1, color: '#FFFFFF' }}>
                  {b.action || b.title || "Subscribe to Newsletter"}
                </Typography>
    
         <Box
      sx={{
        width: '220%',
        border: "1px solid black",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",  
        justifyContent: "flex-start",
        px: 1.25,                   
        py: 1,
        cursor: "pointer",
      }}
    >
      <Typography
        sx={{
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1,  
          mb: 0,
          py: 1,     
          color: '#CBDCEB'     
        }}
      >
        Your Email
      </Typography>
    </Box>
    
              
               
              </Box>
            </Box>
    
          
          </Paper>
        );
      }

    return (
      <Paper key={b._id || url || title} elevation={0} sx={{
        minWidth: '100%', display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
        boxShadow: "0 10px 30px rgba(2,6,23,0.12)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#6366f1", 0.06), color: "#6366f1", flexShrink: 0 }}>
            <LinkIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 15 }}>{title}</Typography>
        </Box>

        <IconButton aria-label="open" onClick={() => url && handleLinkClick(b, url, { newTab: true })} sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha("#6d28d9", 0.06), color: "#6d28d9", "&:hover": { bgcolor: alpha("#6d28d9", 0.14) } }} size="small">
          <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Paper>
    );
  }

  function SocialIconFor(platform) {
    const key = (platform || "").toLowerCase();
    if (key === "youtube") return YouTubeIcon;
    if (key === "twitter") return TwitterIcon;
    if (key === "whatsapp") return WhatsAppIcon;
    if (key === "instagram") return InstagramIcon;
    if (key === "linkedin") return LinkedInIcon;
    return LinkIcon;
  }

  return (
    <Box sx={{ display : 'flex', justifyContent : 'center'}}>
    
   <Grid
  container
  justifyContent="center"
  sx={{background: "#0b0b0b", 
  maxWidth : { xs: "100%", sm: "85%", md: "30%"} }}
>


 
<Box
  sx={{
    width: "100%",
    boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0f0c29 0%, #0b0b0b 40%, #0b0b0b 100%)",
    position: "relative", // ✅ must be relative for overlay to anchor
  }}
>
  {/* hero image */}
  <Box
    component="img"
    src={leftImage || avatarUrl}
    alt="hero"
    sx={{
      width: "100%",
      height: "360px",
      objectFit: "cover",
      objectPosition: { xs: "center 15%", sm: "center 25%" },
      display: "block",
      background:
        "linear-gradient(135deg, #0f0c29 0%, #0b0b0b 60%, #0b0b0b 60%)",
    }}
  />

  {/* bottom gradient overlay */}
  <Box
    sx={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "25%", // ✅ must have height, controls how far the fade goes up
      background:
        "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(8,8,12,0.55) 45%, #0b0b0b 85%, #0b0b0b 100%)",
      pointerEvents: "none",
      zIndex: 2,
    }}
  />
</Box>

            {/* Name + socials row (no avatar) */}
           <Grid container spacing={1} sx={{ mt: 0, px: 3.5, pb:2, textAlign : 'left', background: " #0b0b0b"}}>
              {/* Left: name */}
             
              <Grid size={{ xs: 12, sm: 12, md: 12}}>
                <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <Typography sx={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: 600, fontSize: { xs: 16, sm: 18 } }}>
                    {name}
                  </Typography>
                </Box>
              </Grid>

              {/* Intro: full width below the row */}
                  <Grid size={{ xs: 12, sm: 12, md: 12}}>
                {userDetails.intro ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter", fontWeight: 400, fontSize: 13, mt: 0.5, textAlign: "left" }}>
                    {userDetails.intro}
                  </Typography>
                ) : null}
              </Grid>

             {/* Right: social icons */}
              <Grid size={{ xs: 12, sm: 12, md: 12}}>
                <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 1, alignItems: "center" }}>
                  {socials && socials.length > 0 ? (
                    <>
                      {socials.map((s) => {
                        const key = (s.platform || s.name || "").toLowerCase();
                        const IconComp = SocialIconFor(key);

                        const BRAND = {
                          youtube: "#FF0000",
                          twitter: "#1DA1F2",
                          whatsapp: "#25D366",
                          instagram: "#E1306C",
                          linkedin: "#0077B5",
                          default: "#6366f1",
                        };
                        const color = BRAND[key] || BRAND.default;
                        const bg = alpha(color, 0.03);
                        const hoverBg = alpha(color, 0.18);

                        const rawUrl = s.url || s.link || s.href || s.number || "";
                        const url = key === "whatsapp" ? makeWaUrl(rawUrl, s.message || "") : rawUrl;


                        return (
                          <Tooltip key={s._id || url} title={(key && key.charAt(0).toUpperCase() + key.slice(1)) || "Link"} arrow>
                            <IconButton
                              onClick={() => url && window.open(url, "_blank")}
                              sx={{
                                bgcolor: bg,
                                borderRadius: 1,
                                "&:hover": { bgcolor: hoverBg },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              aria-label={`open ${key}`}
                              size="small"
                            >
                              <IconComp sx={{ fontSize: 28, color: color }} />
                              {/* {key==='instagram' ? (
                                <Typography sx={{ color : '#FFFFFF', ml: 1, fontFamily : 'Inter', fontSize : '14px'}}>22.5K</Typography>
                              ) : ('')} */}
                            </IconButton>
                          </Tooltip>
                        );
                      })}

                      {/* Store icon (appended after socials) */}
                      {storeEnabled && (
          <Tooltip title="Visit store" arrow>
            <IconButton
         onClick={() => {
  const url = "https://myhandle.in/products-affiliate?subdomain=" + encodeURIComponent(derivedHandle || "");
  window.location.href = url;
}}


              sx={{
                // bgcolor: "rgba(255,255,255,0.03)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // border: "1px solid rgba(255,255,255,0.06)",
                // "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
              }}
              aria-label="open store"
              size="small"
            >
              <StorefrontIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />
            </IconButton>
          </Tooltip>
        )}

        
          {dmEnabled && (
          <Tooltip title="Direct Message" arrow>
            <IconButton
 onClick={() => {
  const url = "https://myhandle.in/influencer/participant/login?subdomain=" + encodeURIComponent(derivedHandle || "");
  window.open(url, "_blank", "noopener,noreferrer");
}}



              sx={{
                // bgcolor: "rgba(255,255,255,0.03)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // border: "1px solid rgba(255,255,255,0.06)",
                // "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
              }}
              aria-label="open store"
              size="small"
            >
              <SmsOutlinedIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />
            </IconButton>
          </Tooltip>
        )}
                    </>
                  ) : (
                    <Paper elevation={0} sx={{ px: 2, py: 1, borderRadius: 2, border: "1px dashed rgba(255,255,255,0.06)", bgcolor: "transparent" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                        Social accounts will appear here when you add them.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>


          
              
            </Grid>


 <Grid item xs={12} md={4}>
          <Box sx={{ px: { xs: 1.5, sm: 2 }, alignItems: 'center', justifyContent : 'center'}}>


            {/* blocks area */}
            <Box sx={{   
           
         
            px: 2,
            pt: 1
           
           }}>
            <Stack spacing={1.25} sx={{ mt: 1, mb: 1 }}>
              {blocks && blocks.length > 0 ? (
                blocks.map((b) => renderPreviewBlock(b))
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                    No links / blocks added yet.
                  </Typography>
                </Box>
              )}
            </Stack>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center", mt: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1, mb: 1 }}>
                <Typography sx={{ fontFamily: "Inter", fontWeight: 400, color: "rgba(255,255,255,0.8)", fontSize: { xs: 12, sm: 12 }, mb: 0.25 }}>Made in India</Typography>
                <Box component="img" src={IndiaFlag} alt="India flag" sx={{ width: 18, height: "auto", display: "block", borderRadius: "2px" }} aria-hidden={false} />
              </Box>
            </Box>
            </Box>


        </Box>
      </Grid>

      {/* Form dialog (unchanged) */}
      <Dialog open={formDialogOpen} onClose={closeFormDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentFormBlock?.name || currentFormBlock?.title || "Submit form"}</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 0.5, display: "grid", gap: 1 }}>
            {currentFormBlock?._renderFields?.length === 0 && (
              <Typography variant="body2" color="text.secondary">This form has no fields.</Typography>
            )}

            {currentFormBlock?._renderFields?.map((f) => {
              const key = f._key;
              const value = formValues[key] ?? "";
              const error = formErrors[key];

              if ((f.type || "text") === "textarea") {
                return (
                  <TextField key={key} fullWidth multiline rows={4} label={f.label || "Field"} placeholder={f.placeholder || ""} value={value} onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))} error={!!error} helperText={error || (f.required ? "Required" : "")} margin="dense" />
                );
              }

              if (f.type === "radio") {
                const opts = Array.isArray(f.options) ? f.options : (typeof f.options === "string" ? f.options.split(',').map(s => s.trim()).filter(Boolean) : []);
                return (
                  <FormControl key={key} component="fieldset" margin="dense" error={!!error}>
                    <FormLabel component="legend">{f.label}</FormLabel>
                    <RadioGroup value={formValues[key] ?? ""} onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))}>
                      {opts.map((opt, idx) => (<FormControlLabel key={idx} value={opt} control={<Radio />} label={opt} />))}
                    </RadioGroup>
                    {error && <Typography variant="caption" color="error">{error}</Typography>}
                  </FormControl>
                );
              }

              return (
                <TextField key={key} fullWidth label={f.label || "Field"} placeholder={f.placeholder || ""} type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"} value={value} onChange={(e) => setFormValues((s) => ({ ...s, [key]: e.target.value }))} error={!!error} helperText={error || (f.required ? "Required" : "")} margin="dense" />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, p: 2 }}>
          <Button onClick={closeFormDialog} variant="text">Cancel</Button>
          <Button onClick={submitForm} variant="contained" disabled={formSubmitting}>
            {formSubmitting ? <CircularProgress size={18} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>


   <Dialog open={newsletterDialogOpen} onClose={() => { if (!newsletterSubmitting) closeNewsletterDialog(); }} fullWidth maxWidth="sm">
  <DialogTitle sx={{ fontWeight: 700 }}>{newsletterDialogText || "Subscribe to Newsletter"}</DialogTitle>

  <DialogContent dividers>
    <Stack spacing={2}>
      <TextField
        label="Your email"
        type="email"
        fullWidth
        value={newsletterEmail}
        onChange={(e) => setNewsletterEmail(e.target.value)}
        placeholder="you@company.com"
        InputProps={{ sx: { borderRadius: 2 } }}
        disabled={newsletterSubmitting}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={newsletterAccept}
            onChange={(e) => setNewsletterAccept(e.target.checked)}
            size="small"
            disabled={newsletterSubmitting}
          />
        }
        label={<Typography sx={{ fontSize: 13 }}>I accept all terms &amp; conditions</Typography>}
      />
    </Stack>
  </DialogContent>

  <DialogActions sx={{ px: 2, py: 1 }}>
    <Box sx={{ flex: 1 }} /> {/* pushes subscribe to right */}
    <Button onClick={() => { if (!newsletterSubmitting) closeNewsletterDialog(); }} sx={{ mr: 1 }} disabled={newsletterSubmitting}>
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleSubscribe}
      disabled={!newsletterAccept || newsletterSubmitting}
      sx={{ borderRadius: 2, minWidth: 120, position: "relative" }}
    >
      {newsletterSubmitting ? (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} thickness={5} />
          <span>Subscribing...</span>
        </Box>
      ) : (
        "Subscribe"
      )}
    </Button>
  </DialogActions>
</Dialog>


      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ open: false, message: "" })} message={snack.message} />
    </Grid>
    </Box>
  );
}
