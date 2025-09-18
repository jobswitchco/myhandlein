// ProfileBlocksEditor.js
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
  Snackbar,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import avatarUrl from "../images/sid4real.jpeg";
import SaveIcon from "@mui/icons-material/Save";
import ShareIcon from "@mui/icons-material/Share";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MovieIcon from "@mui/icons-material/Movie";
import axios from "axios";
import { toast } from "react-toastify";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



// ---------- Responsive Custom styled buttons ----------
const PrimaryBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  cursor: "pointer",
  padding: "10px 16px",
  borderRadius: 999,
  color: "#fff",
  fontWeight: 700,
  background: "linear-gradient(90deg,#7c3aed,#9f7aea)",
  boxShadow: "0 8px 24px rgba(124,58,237,0.14)",
  transition: "transform .12s ease, box-shadow .12s ease",
  fontSize: 14,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "12px 14px",
  },
}));

const ShareUrlBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#fff",
  fontFamily: "Inter",
  fontWeight: 600,
  background: "linear-gradient(90deg,#7c3aed,#9f7aea)",
  boxShadow: "0 8px 24px rgba(124,58,237,0.14)",
  transition: "transform .12s ease, box-shadow .12s ease",
  fontSize: 12,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const GhostBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(99,102,241,0.14)",
  cursor: "pointer",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#374151",
  background: "#FFF",
  fontFamily: "Inter",
  fontWeight: 600,
  fontSize: 12,
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const HandleBtn = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(99,102,241,0.14)",
  padding: "8px 14px",
  borderRadius: 999,
  color: "#374151",
  background: "#FFF",
  textTransform: "none",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "10px 12px",
  },
}));

const AddPill = styled("button")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  cursor: "pointer",
  padding: "10px 18px",
  borderRadius: 999,
  color: "#fff",
  fontWeight: 700,
  background: "#6d28d9",
  boxShadow: "0 12px 30px rgba(99,102,241,0.12)",
  fontSize: 14,
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "center",
    padding: "12px 14px",
  },
}));

// ---------- Component ----------
export default function ProfileBlocksEditor() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [tempLink, setTempLink] = useState("");
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [copySnackOpen, setCopySnackOpen] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
  const baseUrl="/api/usersOn";

  const [ userDetails, setUserDetails ] = useState({});
  
  // Social state
  const [socials, setSocials] = useState([]);        // list fetched from backend
const [loadingSocials, setLoadingSocials] = useState(false);
const [addingSocial, setAddingSocial] = useState(false);
const [selectedPlatform, setSelectedPlatform] = useState(null); // 'youtube' | 'twitter' ...
const [socialUrl, setSocialUrl] = useState("");
const [socialApiMsg, setSocialApiMsg] = useState(null);


const PLATFORMS = [
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "twitter", label: "Twitter", Icon: TwitterIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
];

const availablePlatforms = PLATFORMS.filter(
  (p) => !socials.some((s) => String(s.platform).toLowerCase() === String(p.key).toLowerCase())
);


  // blocks + drag & drop: start empty and load from backend
  const [blocks, setBlocks] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  // Add block dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockAction, setNewBlockAction] = useState("");
  const [tab, setTab] = useState("link");

  // API/loading states
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [apiSnack, setApiSnack] = useState({ open: false, message: "" });


  const api = axios.create({ baseURL: baseUrl || "", withCredentials: true });


  useEffect(() => {
  fetchSocials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function fetchSocials() {
  setLoadingSocials(true);
  try {
    const res = await api.get("/user/socials"); // backend route
    setSocials(res.data.socials || []);
  } catch (err) {
    console.error("fetchSocials", err);
    setSocialApiMsg("Failed to load socials");
  } finally {
    setLoadingSocials(false);
  }
}

async function saveSocial() {
  if (!selectedPlatform || !socialUrl.trim()) {
    setSocialApiMsg("Pick a platform and enter a URL");
    return;
  }
  setAddingSocial(true);
  try {
    const payload = { platform: selectedPlatform, url: socialUrl.trim() };
    const res = await api.post("/user/socials", payload);
    // server returns the updated social or the updated list. We'll push returned item.
    const added = res.data.social;
    if (added) {
      setSocials((s) => [...s, added]);
    } else {
      // fallback: refresh list
      await fetchSocials();
    }
    // reset
    setSelectedPlatform(null);
    setSocialUrl("");
    setSocialApiMsg("Saved");
  } catch (err) {
    console.error("saveSocial", err);
    setSocialApiMsg(err?.response?.data?.message || "Failed to save");
  } finally {
    setAddingSocial(false);
    // clear message after a bit
    setTimeout(() => setSocialApiMsg(null), 2000);
  }
}

async function deleteSocial(id) {
  try {
    await api.delete(`/user/socials/${id}`);
    setSocials((s) => s.filter((x) => String(x._id || x.id) !== String(id)));
  } catch (err) {
    console.error("deleteSocial", err);
    setSocialApiMsg("Delete failed");
    setTimeout(() => setSocialApiMsg(null), 2000);
  }
}


    const handleSessionExpired = () => {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          navigate('/professional/login');
        }, 2000);
      };


      useEffect(() => {
        const verifyToken = async () => {
          setLoading(true);
        
          try {
            const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });
        
            if (res.data.valid) {
              fetchData();
            } else {
              handleSessionExpired();
            }
          } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
              handleSessionExpired();
            } else {
              toast.error("Network error, please try again later.");
              handleSessionExpired();
  
            }
          } finally {
            setLoading(false);
          }
        };
        
    
        verifyToken();
      }, []);
  
   
            const fetchData = async () => {
              try {
        
                      await axios.get(baseUrl + "/get-user-details", { withCredentials : true}).then(ress=>{
  
                        if(ress.data.success){
                          setUserDetails(ress.data.data);
                          
                        }
                        else {
                          setLoading(false);
                          toast.error("Session expired. Please log in again.");
                          setTimeout(() => {
                          navigate('/professional/login');
                          }, 2000);
                        }
              
                  }).catch(e=>{
              
                  })
              
              } catch (error) {
                setLoading(false);
                toast.error("Network error. Please log in again.");
                setTimeout(() => {
                navigate('/professional/login');
                }, 2000);
              }
            };

  // ---------- Effects ----------
  useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

async function fetchBlocks() {
  setLoadingBlocks(true);
  try {
    const res = await axios.get(baseUrl + "/fetch-blocks", { withCredentials: true });
    const data = res.data;

    // normalize shape if needed (support _id or id)
    const normalized = (data || []).map((b) => ({
      id: b._id || b.id,
      title: b.name || b.title || "",
      action: b.action || b.url || "",
      type: b.type || "link",
      image: b.image,
      raw: b,
    }));

    setBlocks(
      normalized.sort((a, b) => {
        // if backend returns `order` inside raw, use it
        const ao = a.raw?.order ?? 0;
        const bo = b.raw?.order ?? 0;
        return ao - bo;
      })
    );
  } catch (err) {
    console.error("fetchBlocks error:", err);
    // try to show a useful message if available
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load blocks";
    setApiSnack({ open: true, message: msg });
  } finally {
    setLoadingBlocks(false);
  }
}


  // ---------- Handlers ----------
  function handleAvatarClick() {
    fileInputRef.current?.click();
  }
  function handleFileChange(e) {
    // handle avatar update if needed
  }

  function openCustomize() {
    setTempLink(userDetails.handleUserName);
    setCustomizeOpen(true);
  }
  function saveCustomize() {
    setLink(userDetails.handleUserName);
    setCustomizeOpen(false);
  }

  function openAdd() {
    setNewBlockName("");
    setNewBlockAction("");
    setTab("link");
    setAddOpen(true);
  }



async function saveAdd() {
  if (!newBlockName.trim()) return;
  setSavingBlock(true);

  const payload = {
    name: newBlockName.trim(),
    action: newBlockAction.trim(),
    type: tab === "video" ? "video" : "link",
  };

  try {
    const res = await axios.post(baseUrl + "/save-blocks", payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    const saved = res.data;

    const normalized = {
      id: saved._id || saved.id || `temp-${Date.now()}`,
      title: saved.name || payload.name,
      action: saved.action || payload.action,
      type: saved.type || payload.type,
      image: saved.image,
      raw: saved,
    };

    setBlocks((s) => [...s, normalized]);
    setAddOpen(false);
    setApiSnack({ open: true, message: "Block added" });
  } catch (err) {
    console.error("saveAdd error:", err);
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Could not save block";
    setApiSnack({ open: true, message: msg });
  } finally {
    setSavingBlock(false);
  }
}


  async function deleteBlock(id) {
    // optimistic UI: mark deleting
    setDeletingId(id);
    try {
      const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setBlocks((s) => s.filter((b) => b.id !== id));
      setApiSnack({ open: true, message: "Block deleted" });
    } catch (err) {
      console.error(err);
      setApiSnack({ open: true, message: "Failed to delete" });
    } finally {
      setDeletingId(null);
    }
  }

  // Drag & Drop (native) — UI-only; persist order later as you wish
  function onDragStart(e, id) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {}
  }
  function onDragOver(e, overId) {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setBlocks((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((x) => x.id === draggingId);
      const to = arr.findIndex((x) => x.id === overId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }
  function onDragEnd() {
    setDraggingId(null);
  }

  // ---------- Preview rendering helpers ----------
  function renderPreviewBlock(b) {
    if (b.type === "link" || b.type === "cta") {
      return (
        <Paper
          key={b.id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 2,
            color: "#0f1724",
            boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3, md: 3 } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                bgcolor: "#F0F0F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <LinkIcon sx={{ fontSize: 16 }} />
            </Box>

            <Box>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500 }}>{b.title}</Typography>
              <Typography sx={{ opacity: 0.75, fontFamily: "Inter", fontSize: "10px", fontWeight: 400, mt: 0.5 }}>
                {b.action || ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
          </Box>
        </Paper>
      );
    }

    if (b.type === "product") {
      const hasImage = !!b.image;
      const isStringImage = hasImage && typeof b.image === "string";

      return (
        <Paper
          key={b.id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 2,
            color: "#0f1724",
            boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3, md: 3 } }}>
            {isStringImage ? (
              <Box
                component="img"
                src={b.image}
                alt={b.title || "product image"}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  objectFit: "cover",
                  display: "block",
                  flexShrink: 0,
                }}
              />
            ) : hasImage && React.isValidElement(b.image) ? (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {b.image}
              </Box>
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  bgcolor: "#e9e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" sx={{ color: "#6b21a8", fontWeight: 700 }}>
                  IMG
                </Typography>
              </Box>
            )}

            <Box>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500 }}>{b.title}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
          </Box>
        </Paper>
      );
    }

    if (b.type === "video") {
      return (
        <Paper
          key={b.id}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 2,
            color: "#0f1724",
            boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3, md: 3 } }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                bgcolor: "#F0F0F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <MovieIcon sx={{ fontSize: 16 }} />
            </Box>

            <Box>
              <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500 }}>{b.title}</Typography>
              <Typography sx={{ opacity: 0.75, fontFamily: "Inter", fontSize: "10px", fontWeight: 400, mt: 0.5 }}>
                {b.action || ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }} />
          </Box>
        </Paper>
      );
    }

    // fallback
    return (
      <Paper key={b.id} sx={{ p: 1.5 }}>
        <Typography>{b.title}</Typography>
      </Paper>
    );
  }

  // ---------- copy to clipboard ----------
  async function copyToClipboard() {
    const text = userDetails.handleUserName+'.myhandle.in' || "";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopySnackOpen(true);
    } catch (err) {
      setCopySnackOpen(true);
      console.error("Copy failed", err);
    }
  }

  // ---------- YouTube preview helper (unchanged) ----------
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

  const renderYouTubePreview = (url) => {
    const id = getYouTubeId(url);
    if (!id) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Paste a YouTube URL (e.g. https://youtu.be/xxxx or https://www.youtube.com/watch?v=xxxx) to preview it here.
          </Typography>
          {url && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, wordBreak: "break-all" }}>
              {url}
            </Typography>
          )}
        </Box>
      );
    }

    const src = `https://www.youtube.com/embed/${id}`;
    return (
      <Box sx={{ position: "relative", pt: "56.25%" }}>
        <iframe
          title="youtube-preview"
          src={src}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 0, sm: 1, md: 1 } }}>
      {/* ROW 1: FULL WIDTH HEADER */}
      <Grid container spacing={2} sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexDirection: { xs: "column", sm: "row" },
              background: "#FFFFFF",
            }}
          >
            {/* Avatar + edit */}
            <Box
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              sx={{
                position: "relative",
                width: 66,
                height: 66,
                flexShrink: 0,
              }}
            >
              <Avatar
                src={avatarUrl || ""}
                sx={{
                  width: 66,
                  height: 66,
                  bgcolor: avatarUrl ? "transparent" : "primary.main",
                  cursor: "pointer",
                  border: "4px solid rgba(0,0,0,0.04)",
                }}
                onClick={handleAvatarClick}
              >
                {!avatarUrl && name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </Avatar>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </Box>

            {/* Name + role */}
            <Box sx={{ flex: 1, width: "100%" }}>
              {!isEditingName ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography
                    sx={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 600, cursor: "pointer", wordBreak: "break-word" }}
                    onClick={() => setIsEditingName(true)}
                  >
                    {userDetails.name}
                  </Typography>
                  <IconButton size="small" onClick={() => setIsEditingName(true)} aria-label="edit-name">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
                  <TextField
                    size="small"
                    value={userDetails.name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingName(false);
                    }}
                    inputProps={{ maxLength: 60 }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton color="primary" onClick={() => setIsEditingName(false)} aria-label="save-name">
                    <SaveIcon />
                  </IconButton>
                </Box>
              )}

           
            </Box>

            {/* URL + actions: stack on mobile */}
            <Box
              sx={{
                minWidth: { xs: "100%", sm: 320 },
                textAlign: "right",
                mt: { xs: 1.5, sm: 0 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  mt: 1,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <HandleBtn title="Customize Link" onClick={openCustomize}>
                    <LinkIcon style={{ fontSize: 18, cursor: "pointer" }} />
                    <Typography sx={{ fontFamily: "Inter", fontSize: 14, fontWeight: 500, wordBreak: "break-all", color: "#000000" }}>
                      {userDetails.handleUserName+'.myhandle.in'}
                    </Typography>
                  </HandleBtn>
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <ShareUrlBtn onClick={copyToClipboard} aria-label="copy-link">
                    <ShareIcon style={{ fontSize: 16 }} />
                    Share
                  </ShareUrlBtn>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ROW 2: LEFT = Blocks, RIGHT = Preview */}
      <Grid container spacing={2}>
        {/* LEFT: Blocks editor */}
        <Grid item xs={12} md={7}>

          <Paper sx={{ p: { xs: 1, sm: 3, md: 3 }, mt: 1.5 }}>

{/* --- Social picker + saved socials --- */}
<Box sx={{ mb: 2 }}>
  <Typography variant="subtitle1" sx={{ mb: 2 }}>Social accounts</Typography>

<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
  {availablePlatforms.length === 0 ? (
    <Typography variant="caption" color="text.secondary">
      You've added all available platforms.
    </Typography>
  ) : (
    availablePlatforms.map(({ key, label, Icon }) => {
      const selected = selectedPlatform === key;
      return (
        <Box
          key={key}
          onClick={() => { setSelectedPlatform(selected ? null : key); setSocialUrl(""); }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            border: selected ? `1px solid ${theme.palette.primary.main}` : "1px solid rgba(0,0,0,0.06)",
            bgcolor: selected ? "background.paper" : "transparent",
            // remove mr:1 because gap already gives horizontal spacing
            // optional minHeight to keep rows aligned:
            minHeight: 36,
          }}
        >
          <Icon sx={{ fontSize: 20, color: selected ? theme.palette.primary.main : "text.secondary" }} />
          <Typography sx={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 600 }}>{label}</Typography>
        </Box>
      );
    })
  )}
</Box>



  {/* selected platform => show url field + save */}
  {selectedPlatform && (
    <Paper sx={{ p: 1, mb: 1, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder={`Enter ${selectedPlatform} URL`}
          value={socialUrl}
          onChange={(e) => setSocialUrl(e.target.value)}
        />
        <PrimaryBtn
          onClick={saveSocial}
          disabled={addingSocial}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {addingSocial ? <CircularProgress size={18} /> : <SaveIcon />}
          <span style={{ marginLeft: 8 }}>{addingSocial ? "Saving..." : "Save"}</span>
        </PrimaryBtn>
      </Stack>
      {socialApiMsg && <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{socialApiMsg}</Typography>}
    </Paper>
  )}

  {/* existing socials list */}
  <Stack spacing={1}>
    {loadingSocials ? (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>
    ) : socials.length === 0 ? (
      <Typography variant="caption" color="text.secondary">No socials saved yet — pick one above to add.</Typography>
    ) : (
      socials.map((s) => {
        const Plat = PLATFORMS.find((p) => p.key === s.platform)?.Icon || LinkIcon;
        return (
          <Paper key={s._id || s.id || s.url} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Plat sx={{ fontSize: 18 }} />
              <Box>
                <Typography
  variant="body2"
  sx={{ fontFamily: "Inter", fontWeight: 500, textTransform: "capitalize" }}
>
  {s.platform}
</Typography>

                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{s.url}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton onClick={() => window.open(s.url, "_blank")} size="small" title="Open">
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => deleteSocial(s._id || s.id)} size="small" title="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        );
      })
    )}
  </Stack>
</Box>
{/* --- end social picker --- */}
</Paper>

      
          <Paper sx={{ p: { xs: 1, sm: 3, md: 3 }, mt: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
              <Typography variant="subtitle1">Block List</Typography>
              <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                <AddPill onClick={openAdd}>
                  <AddIcon />
                  Add New Blocks
                </AddPill>
              </Box>
            </Box>

            <Stack spacing={1}>
              {loadingBlocks ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                blocks.map((b) => (
                  <Paper
                    key={b.id}
                    variant="outlined"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.25,
                      cursor: "grab",
                      bgcolor: b.id === draggingId ? "action.selected" : "background.paper",
                    }}
                    draggable
                    onDragStart={(e) => onDragStart(e, b.id)}
                    onDragOver={(e) => onDragOver(e, b.id)}
                    onDragEnd={onDragEnd}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                      <DragIndicatorIcon fontSize="small" color="action" />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{b.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.action || "no action"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 8,
                          borderRadius: 8,
                        }}
                        title="Delete block"
                        disabled={deletingId === b.id}
                      >
                        {deletingId === b.id ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                      </button>
                    </Box>
                  </Paper>
                ))
              )}

              {!loadingBlocks && blocks.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No blocks yet — click "Add New Blocks".
                </Typography>
              )}
            </Stack>
          </Paper>

        </Grid>

        {/* RIGHT: Preview */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              width: { xs: "100%", sm: "85%", md: "85%" },
              margin: "0 auto",
              borderRadius: { xs: 6, sm: 12 },
              border: { xs: "8px solid rgba(240,240,245,0.95)", sm: "10px solid rgba(240,240,245,0.9)" },
              boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
              overflow: "hidden",
              bgcolor: "#f8fafc",
            }}
          >
            {/* purple top banner */}
            <Box sx={{ height: { xs: 72, sm: 96 }, background: "linear-gradient(90deg,#4c1d95,#7c3aed)" }} />

            {/* white card area */}
            <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: "center", position: "relative" }}>
              {/* avatar overlapping */}
              <Avatar
                src={avatarUrl || ""}
                sx={{
                  width: { xs: 72, sm: 86 },
                  height: { xs: 72, sm: 86 },
                  position: "absolute",
                  top: { xs: -36, sm: -46 },
                  left: "50%",
                  transform: "translateX(-50%)",
                  border: "4px solid #fff",
                  boxShadow: "0 8px 30px rgba(124,58,237,0.18)",
                  bgcolor: avatarUrl ? "transparent" : "#6d28d9",
                  fontSize: { xs: 18, sm: 20 },
                }}
              >
                {!avatarUrl && name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </Avatar>

              <Box sx={{ mt: { xs: 3.5, sm: 4 } }}>
                <Typography sx={{ fontFamily : 'Inter', fontWeight: 600, fontSize: { xs: 16, sm: 18 } }}>
                  {userDetails.name}
                </Typography>

               
              {/* social icons / preview */}
<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
  {loadingSocials ? (
    // Optional: show a small loader while socials are being fetched
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CircularProgress size={20} />
      <Typography variant="caption" color="text.secondary">Loading socials…</Typography>
    </Box>
  ) : socials && socials.length > 0 ? (
    <Box sx={{ display: "flex", gap: 1.25 }}>
   {socials.map((s) => {
  const key = (s.platform || "").toLowerCase();

  // platform -> icon component (same as you already had)
  const IconComp =
    key === "youtube" ? YouTubeIcon :
    key === "twitter" ? TwitterIcon :
    key === "whatsapp" ? WhatsAppIcon :
    key === "instagram" ? InstagramIcon :
    key === "linkedin" ? LinkedInIcon :
    LinkIcon; // fallback

  // brand color map (feel free to tweak)
  const BRAND = {
    youtube: "#FF0000",
    twitter: "#1DA1F2",
    whatsapp: "#25D366",
    instagram: "#E1306C",
    linkedin: "#0077B5",
    default: "#6366f1",
  };

  const color = BRAND[key] || BRAND.default;
  const bg = alpha(color, 0.03);    // subtle background
  const hoverBg = alpha(color, 0.18); // hover background

  return (
    <Tooltip key={s._id || s.url} title={key.charAt(0).toUpperCase() + key.slice(1)} arrow>
      <IconButton
        onClick={() => window.open(s.url, "_blank")}
        sx={{
          bgcolor: bg,
          borderRadius: 1,
          width: 30,
          height: 30,
          "&:hover": { bgcolor: hoverBg },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`open ${key}`}
        size="small"
      >
        <IconComp sx={{ fontSize: 26, color: color }} />
      </IconButton>
    </Tooltip>
  );
})}

    </Box>
  ) : (
    // Placeholder when no socials available
    <Paper
      elevation={0}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 2,
        border: "1px dashed rgba(15, 23, 42, 0.06)",
        bgcolor: "transparent",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Social accounts will appear here when you add them.
      </Typography>
    </Paper>
  )}
</Box>


              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* blocks area */}
              <Stack spacing={1.25} sx={{ mt: 1, mb: 1 }}>
                {loadingBlocks ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  blocks.map((b) => renderPreviewBlock(b))
                )}
              </Stack>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {link}
                </Typography>
              </Box>

               <Typography sx={{ fontFamily : 'Inter', fontWeight: 400, color: 'grey', fontSize: { xs: 12, sm: 12 }, mb: 1 }}>
                  {userDetails.handleUserName+'.myhandle.in'}
                </Typography>

            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Customize URL Dialog */}
      <Dialog open={customizeOpen} onClose={() => setCustomizeOpen(false)}>
        <DialogTitle>Customize Url</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Custom link"
            margin="dense"
            value={userDetails.handleUserName+'.myhandle.in'}
            onChange={(e) => setTempLink(e.target.value)}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
                  <LinkIcon />
                </span>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setCustomizeOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <PrimaryBtn onClick={saveCustomize}>Save</PrimaryBtn>
        </DialogActions>
      </Dialog>

      <Snackbar open={copySnackOpen} autoHideDuration={1800} onClose={() => setCopySnackOpen(false)} message="Link copied to clipboard" />
      <Snackbar open={apiSnack.open} autoHideDuration={2000} onClose={() => setApiSnack({ open: false, message: "" })} message={apiSnack.message} />

      {/* Add Block Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Block</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Rounded tabs */}
          <Box
            sx={{
              bgcolor: (t) => (t.palette.mode === "dark" ? "#0b1220" : "#f5f7fb"),
              p: 0.5,
              borderRadius: 3,
              mb: 2,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 40,
                "& .MuiTabs-flexContainer": { gap: 0.5 },
              }}
            >
              {[
                { label: "Link", value: "link" },
                { label: "Video", value: "video" },
                { label: "Product", value: "product" },
                { label: "Store", value: "store" },
              ].map((t) => (
                <Tab
                  key={t.value}
                  label={t.label}
                  value={t.value}
                  sx={{
                    minHeight: 36,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    mx: 0.25,
                    "&.Mui-selected": {
                      bgcolor: "background.paper",
                      boxShadow: 1,
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* LINK TAB CONTENT */}
          {tab === "link" && (
            <Box>
              <Stack spacing={1.5}>
                <TextField fullWidth label="Name" margin="dense" value={newBlockName} onChange={(e) => setNewBlockName?.(e.target.value)} />
                <TextField
                  fullWidth
                  label="URL"
                  placeholder="https://example.com"
                  type="url"
                  margin="dense"
                  value={newBlockAction}
                  onChange={(e) => setNewBlockAction?.(e.target.value)}
                />
              </Stack>

              <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
                Preview
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  p: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => (t.palette.mode === "dark" ? "#101826" : "#eef2ff"),
                    }}
                  >
                    <LinkIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {newBlockName || "Link title"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                      {newBlockAction || "https://your-link.com"}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label="open">
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* VIDEO TAB (YouTube-only) */}
          {tab === "video" && (
            <Box>
              <Stack spacing={1.5}>
                <TextField fullWidth label="Video Name" margin="dense" value={newBlockName} onChange={(e) => setNewBlockName?.(e.target.value)} />
                <TextField
                  fullWidth
                  label="Video URL"
                  placeholder="https://youtu.be/xxxx or https://www.youtube.com/watch?v=xxxx"
                  margin="dense"
                  value={newBlockAction}
                  onChange={(e) => setNewBlockAction?.(e.target.value)}
                />
              </Stack>

              <Typography variant="overline" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
                Preview
              </Typography>

              <Paper elevation={0} sx={{ borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}`, mt: 1 }}>
                {renderYouTubePreview(newBlockAction)}

                <Divider sx={{ my: 1 }} />

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: (t) => (t.palette.mode === "dark" ? "#101826" : "#eef2ff"),
                    }}
                  >
                    <MovieIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {newBlockName || "Video title"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                      {newBlockAction || "Paste a YouTube URL"}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label="open">
                    <ChevronRightRoundedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* Placeholders for future tabs */}
          {tab !== "link" && tab !== "video" && (
            <Box sx={{ mt: 1.5 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  The <b>{tab}</b> tab UI will go here. Tell me what fields you need and the preview style, and I'll wire it up.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ gap: 1, p: 2 }}>
          <button
            onClick={() => setAddOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cancel
          </button>

          <PrimaryBtn onClick={saveAdd} disabled={savingBlock}>
            {savingBlock ? <CircularProgress size={18} /> : <SaveIcon />}
            <span style={{ marginLeft: 6 }}>{savingBlock ? "Saving..." : "Save"}</span>
          </PrimaryBtn>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
