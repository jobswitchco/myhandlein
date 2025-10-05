// Onboarding.js
import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Paper,
  Avatar,
  useMediaQuery,
  IconButton,
  Stack,
  Grow
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // steps
  const steps = 2;
  const [step, setStep] = useState(0);
  const progressPercents = [16, 66];

  // username + goal
  const [username, setUsername] = useState("");
  const [goal, setGoal] = useState("");

  // API base
  const apiBase = "/api/usersOn";

  // saving flag for final submit
  const [isSaving, setIsSaving] = useState(false);

  // ===== Availability state (same model as your Hero) =====
  // idle | checking | available | taken | invalid | error
  const [availability, setAvailability] = useState("idle");
  const [availMsg, setAvailMsg] = useState("");
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // username validation + sanitization
  // allow: a-z 0-9 . _ - , 3–20 chars; must start/end with alnum
  const sanitizeUsername = (raw) =>
    raw.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 20);

  const usernameIsValid =
    /^[a-z0-9](?:[a-z0-9._-]{1,18}[a-z0-9])$/.test(username) && username.length >= 3;

  // inline icons (SVG) for status
  const Spinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Loading">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" fill="none" stroke="currentColor" strokeWidth="3">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
  const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  const WarnIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
  const ErrorIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const StatusIcon = () => {
    if (availability === "checking") return <Spinner />;
    if (availability === "available") return <CheckIcon fontSize="small" />;
    if (availability === "taken") return <CrossIcon />;
    if (availability === "invalid") return <WarnIcon />;
    if (availability === "error") return <ErrorIcon />;
    return null;
  };

  // debounced availability check
  useEffect(() => {
    // clear when empty
    if (!username) {
      setAvailability("idle");
      setAvailMsg("");
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // invalid -> no network call
    if (!usernameIsValid) {
      setAvailability("invalid");
      setAvailMsg(
        "3–20 chars. Only letters, numbers, dot, underscore, hyphen. Must start/end with a letter or number."
      );
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // valid -> check
    setAvailability("checking");
    setAvailMsg("Checking…");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Adjust to your backend route (body key "username")
        const res = await axios.post(
          `${apiBase}/subdomain/check`,
          { subdomain : username },
          { signal: controller.signal }
        );

        const available = !!res?.data?.available;
        if (available) {
          setAvailability("available");
          setAvailMsg(`${username}.myhandle.in is available!`);
        } else {
          setAvailability("taken");
          setAvailMsg(`${username}.myhandle.in is taken.`);
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === "CanceledError" || err?.name === "AbortError") {
          return; // ignored—new keystrokes
        }
        setAvailability("error");
        setAvailMsg("Couldn’t check right now. Please try again.");
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Navigation handlers =====
  const handleNext = async () => {
    // Step 0 -> Step 1
    if (step === 0) {
      if (!username || !usernameIsValid || availability !== "available") {
        alert("Please choose a valid, available username to continue.");
        return;
      }
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 1 -> submit
    if (!username || !usernameIsValid || availability !== "available") {
      alert("Username must be valid and available.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        handleUserName: username.trim().toLowerCase(),
        goal: goal || null
      };

      const res = await axios.post(`${apiBase}/save-username`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      });

      const data = res.data || {};
      if (data.success) {
        navigate("/professional/user/bio");
      } else {
        alert(data.message || "Could not save username. Please try again.");
      }
    } catch (err) {
      console.error("Save username error:", err);
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // CTA (unchanged)
  const CTA = ({ children, ...props }) => (
    <Button
      fullWidth
      variant="contained"
      disableElevation
      sx={{
        py: 1.5,
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 700,
        boxShadow: "0 10px 30px rgba(99, 102, 241, 0.18)",
        background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
        "&:hover": { filter: "brightness(0.98)" }
      }}
      {...props}
    >
      {children}
    </Button>
  );

  const GoalCard = ({ title, desc, color, active, onClick, iconText }) => (
    <Paper
      onClick={onClick}
      elevation={active ? 8 : 1}
      sx={{
        cursor: "pointer",
        display: "flex",
        alignItems: "stretch",
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 220ms ease, box-shadow 220ms ease",
        transform: active ? "scale(1.02)" : "none",
        border: active ? `2px solid ${theme.palette.primary.main}` : "1px solid rgba(0,0,0,0.06)"
      }}
    >
      <Box sx={{ flex: 1, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {desc}
            </Typography>
          </Box>
          {active && (
            <Avatar sx={{ bgcolor: "white", color: theme.palette.primary.main, boxShadow: 1 }}>
              <CheckIcon />
            </Avatar>
          )}
        </Stack>
      </Box>
      <Box
        sx={{
          width: 86,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          minWidth: 86
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "rgba(255,255,255,0.85)",
            color: "#111",
            fontWeight: 800,
            transform: "rotate(-8deg)"
          }}
        >
          {iconText}
        </Avatar>
      </Box>
    </Paper>
  );

  // status color mapping for helper text row
  const statusColor =
    availability === "available"
      ? "success.main"
      : availability === "taken"
      ? "error.main"
      : availability === "invalid"
      ? "warning.main"
      : availability === "error"
      ? "secondary.main"
      : "text.secondary";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 8 } }}>
      <Grid container spacing={4} alignItems="stretch">
        {/* LEFT: form */}
        <Grid item xs={12} md={6}>
          {/* slim progress bar */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box
              sx={{
                width: isMobile ? 140 : 300,
                height: 8,
                borderRadius: 8,
                background: "rgba(0,0,0,0.06)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressPercents[step]}%`,
                  transition: "width 420ms cubic-bezier(.2,.9,.25,1)",
                  background: "linear-gradient(90deg,#ff2d95,#a78bfa)"
                }}
              />
            </Box>
          </Box>

          {/* card area */}
          <Box
            sx={{
              background: "transparent",
              borderRadius: 3,
              px: { xs: 2, md: 0 },
              mt: "10vh",
              display: "flex",
              alignItems: "center"
            }}
          >
            {/* Step 0 */}
            <Grow in={step === 0}>
              <Box sx={{ display: step === 0 ? "block" : "none" }}>
                <Typography
                  sx={{
                    fontFamily: "Inter",
                    fontSize: { xs: 24, md: 40 },
                    lineHeight: 1.02,
                    fontWeight: 800,
                    mb: 1
                  }}
                >
                  Welcome to myHandle!
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 4 }}>
                  Choose your Linktree username. You can always change it later.
                </Typography>

                <TextField
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                  placeholder="username"
                  inputProps={{ maxLength: 20, "aria-describedby": "username-status" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>
                            .myhandle.in
                          </Typography>
                          {/* inline spinner/icon inside the input */}
                          <Box
                            aria-hidden
                            sx={{
                              width: 18,
                              height: 18,
                              display: availability === "idle" ? "none" : "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color:
                                availability === "available"
                                  ? "success.main"
                                  : availability === "taken"
                                  ? "error.main"
                                  : availability === "invalid"
                                  ? "warning.main"
                                  : availability === "error"
                                  ? "secondary.main"
                                  : "text.secondary"
                            }}
                          >
                            <StatusIcon />
                          </Box>
                        </Stack>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 6,
                      background: "#f6f7fb",
                      py: 1.25,
                      fontWeight: 700
                    },
                    mb: 1
                  }}
                />

                {/* Status / helper row (below the field) */}
                <Stack id="username-status" direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  {/* left gutter icon for accessibility parity */}
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: statusColor
                    }}
                  >
                    <StatusIcon />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: statusColor
                    }}
                  >
                    {username
                      ? availability === "idle"
                        ? ""
                        : availMsg
                      : "Enter a username to continue"}
                  </Typography>
                </Stack>


                <Box sx={{ mt: 4 }}>
                  <CTA
                    onClick={handleNext}
                    disabled={!username || !usernameIsValid || availability !== "available"}
                  >
                    Continue
                  </CTA>
                </Box>
              </Box>
            </Grow>

            {/* Step 1 */}
            <Grow in={step === 1}>
              <Box sx={{ display: step === 1 ? "block" : "none" }}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
                  <IconButton onClick={handleBack} sx={{ border: "1px solid #CBDCEB", borderRadius: 1 }}>
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ fontFamily: "Inter", fontSize: { xs: 18, md: 36 }, fontWeight: 900 }}>
                    Which best describes your goal for using Linktree?
                  </Typography>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  This helps us personalize your experience.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <GoalCard
                      title="Creator"
                      desc="Build my following and explore ways to monetize my audience."
                      color="linear-gradient(180deg,#ff8bd0,#ff5ea6)"
                      iconText="C"
                      active={goal === "Creator"}
                      onClick={() => setGoal("Creator")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <GoalCard
                      title="Business"
                      desc="Grow my business and reach more customers."
                      color="linear-gradient(180deg,#7c3aed,#5b21b6)"
                      iconText="B"
                      active={goal === "Business"}
                      onClick={() => setGoal("Business")}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <CTA onClick={handleNext} disabled={!goal || isSaving}>
                    {isSaving ? "Saving…" : "Continue"}
                  </CTA>
                </Box>
              </Box>
            </Grow>
          </Box>
        </Grid>

        {/* RIGHT: decorative hero (desktop only) */}
        {!isMobile && (
          <Grid item md={6} sx={{ display: { xs: "none", md: "block" } }}>
            <Box
              sx={{
                height: "100%",
                minHeight: 380,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Box
                sx={{
                  width: "94%",
                  height: 340,
                  borderRadius: 4,
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.95) 0%, rgba(124,58,237,0.95) 100%)",
                  boxShadow: "0 30px 90px rgba(99,102,241,0.28)",
                  transform: "rotate(-6deg)",
                  position: "absolute",
                  right: -20,
                  top: 10,
                  overflow: "hidden",
                  p: 3,
                  color: "white"
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 64, height: 64, border: "3px solid rgba(255,255,255,0.12)" }}>
                    A
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Super Wintendo</Typography>
                    <Typography variant="caption">Streaming every Tuesday</Typography>
                  </Box>
                </Stack>

                <Stack spacing={1} sx={{ mt: 6, width: "62%" }}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.95 }}>Watch now on Twitch</Paper>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.9 }}>Join my Discord</Paper>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.85 }}>Playlists</Paper>
                </Stack>

                <Box
                  sx={{
                    width: 220,
                    height: 120,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.9)",
                    color: "#111",
                    position: "absolute",
                    left: -20,
                    bottom: -18,
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    boxShadow: "0 14px 40px rgba(0,0,0,0.18)"
                  }}
                >
                  <Avatar sx={{ width: 64, height: 64, mr: 2 }}>B</Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      New episode out
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      3:21
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
