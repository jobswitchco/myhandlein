import React, { useEffect, useState } from "react";
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

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import IndiaFlag from "../../images/flag.png";

export default function PublicProfile({ handle, initialProfile = null }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [currentFormBlock, setCurrentFormBlock] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [snack, setSnack] = useState({ open: false, message: "" });

  useEffect(() => {
    if (!handle) return;
    if (profile) return;

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get('/api/usersOnprofile', {
          params: { handle },
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
  }, [handle]);

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
      const res = await axios.post('/api/usersOn/submit-form', payload, { withCredentials: false });
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: "pointer"
        }} onClick={() => openFormDialog(b)}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#10b981", 0.06), color: "#10b981", flexShrink: 0 }}>
              <AddIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
          boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: url ? "pointer" : "default"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#6366f1", 0.06), color: "#6366f1", flexShrink: 0 }}>
              <LinkIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ display: "flex", overflow: "hidden", minWidth: 0 }}>
              <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton aria-label="open" onClick={() => url && window.open(url, "_blank")} sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha("#6d28d9", 0.06), color: "#6d28d9", "&:hover": { bgcolor: alpha("#6d28d9", 0.14) } }} size="small">
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
        <Paper key={b._id || url || title} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 10px 30px rgba(2,6,23,0.12)", cursor: url ? "pointer" : "default" }} onClick={() => url && window.open(url, "_blank")}>
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

    return (
      <Paper key={b._id || url || title} elevation={0} sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: "#fff",
        boxShadow: "0 10px 30px rgba(2,6,23,0.12)"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: alpha("#6366f1", 0.06), color: "#6366f1", flexShrink: 0 }}>
            <LinkIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14 }}>{title}</Typography>
        </Box>

        <IconButton aria-label="open" onClick={() => url && window.open(url, "_blank")} sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha("#6d28d9", 0.06), color: "#6d28d9", "&:hover": { bgcolor: alpha("#6d28d9", 0.14) } }} size="small">
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
    <Grid container justifyContent="center">
      <Grid item xs={12} md={4}>
        <Box sx={{
          width: { xs: "100%", sm: "85%", md: "85%" },
          margin: "0 auto",
          border: { xs: "8px solid rgba(240,240,245,0.95)", sm: "10px solid rgba(240,240,245,0.9)" },
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
          overflow: "hidden",
          bgcolor: "#37353E",
        }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, textAlign: "left" }}>
            {/* header: left 50% single large image, right 50% two stacked images */}
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box
                  component="img"
                  src={leftImage || avatarUrl || ""}
                  alt="header-left"
                  sx={{
                    width: "100%",
                    height: { xs: 160, sm: 220 },
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 1,
                    backgroundColor: leftImage ? "transparent" : "#444",
                  }}
                />
              </Grid>

              <Grid item xs={6} container direction="column" spacing={1}>
                <Grid item sx={{ flex: 1 }}>
                  <Box
                    component="img"
                    src={rightTopImage || avatarUrl || ""}
                    alt="header-right-top"
                    sx={{
                      width: "100%",
                      height: { xs: 76, sm: 108 },
                      objectFit: "cover",
                      display: "block",
                      borderRadius: 1,
                      backgroundColor: rightTopImage ? "transparent" : "#444",
                    }}
                  />
                </Grid>
                <Grid item sx={{ flex: 1 }}>
                  <Box
                    component="img"
                    src={rightBottomImage || avatarUrl || ""}
                    alt="header-right-bottom"
                    sx={{
                      width: "100%",
                      height: { xs: 76, sm: 108 },
                      objectFit: "cover",
                      display: "block",
                      borderRadius: 1,
                      backgroundColor: rightBottomImage ? "transparent" : "#444",
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Box sx={{ height: 1, bgcolor: "rgba(255,255,255,0.06)", mt: 1 }} />

            {/* Name + socials row (no avatar) */}
            <Grid container alignItems="center" spacing={1} sx={{ mt: 1 }}>
              {/* Left: name */}
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <Typography sx={{ color: "#FFFFFF", fontFamily: "Inter", fontWeight: 600, fontSize: { xs: 16, sm: 18 } }}>
                    {name}
                  </Typography>
                </Box>
              </Grid>

              {/* Right: social icons */}
              <Grid item xs={6}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75 }}>
                  {socials && socials.length > 0 ? (
                    socials.map((s) => {
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

                      const url = s.url || s.link || s.href || "";

                      return (
                        <Tooltip key={s._id || url} title={(key && key.charAt(0).toUpperCase() + key.slice(1)) || "Link"} arrow>
                          <IconButton onClick={() => url && window.open(url, "_blank")} sx={{
                            bgcolor: bg, borderRadius: 1, width: 36, height: 36, "&:hover": { bgcolor: hoverBg },
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }} aria-label={`open ${key}`} size="small">
                            <IconComp sx={{ fontSize: 20, color: color }} />
                          </IconButton>
                        </Tooltip>
                      );
                    })
                  ) : (
                    <Paper elevation={0} sx={{ px: 2, py: 1, borderRadius: 2, border: "1px dashed rgba(255,255,255,0.06)", bgcolor: "transparent" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                        Social accounts will appear here when you add them.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>

              {/* Intro: full width below the row */}
              <Grid item xs={12}>
                {userDetails.intro ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter", fontWeight: 400, fontSize: 13, mt: 0.5, textAlign: "left" }}>
                    {userDetails.intro}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.06)" }} />

            {/* blocks area */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
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

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ open: false, message: "" })} message={snack.message} />
    </Grid>
  );
}
