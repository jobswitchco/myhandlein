// Onboarding.js
import React, { useState } from "react";
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
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



export default function Onboarding() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const steps = 2;
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [goal, setGoal] = useState("");
  const apiBase = "http://localhost:8001/usersOn";
  const [isSaving, setIsSaving] = useState(false);
  const progressPercents = [16, 66];
  const usernameIsValid = /^[a-zA-Z0-9._-]{3,30}$/.test(username);



  const handleNext = async () => {
    // Step 0 -> Step 1 flow unchanged
    if (step === 0) {
      if (!usernameIsValid) {
        alert("Please enter a valid username (3-30 chars: letters, numbers, . _ - )");
        return;
      }
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 1 -> submit username to backend
    // keep guard
    if (!usernameIsValid) {
      alert("Invalid username.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        handleUserName: username.trim().toLowerCase(),
        goal: goal || null,
      };

      // Adjust path if your backend expects different route
      const res = await axios.post(`${apiBase}/save-username`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      const data = res.data || {};
      if (data.success) {
        // redirect to the page you want on success
        navigate("/professional/user/bio");
      } else {
        // show friendly message — server may send reason in data.message
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

  // CTA component already forwards props, so disable will work
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

          {/* selected check */}
          {active && (
            <Avatar sx={{ bgcolor: "white", color: theme.palette.primary.main, boxShadow: 1 }}>
              <CheckIcon />
            </Avatar>
          )}
        </Stack>
      </Box>

      {/* colorful tile at right */}
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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 8 } }}>
      <Grid container spacing={4} alignItems="stretch">
        {/* LEFT: form */}
        <Grid item xs={12} md={6}>
          {/* slim progress bar centered */}
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

          {/* content area card */}
          <Box
            sx={{
              background: "transparent",
              borderRadius: 3,
              px: { xs: 2, md: 0 },
              mt: '10vh',
              display : 'flex',
              alignItems : 'center'
            }}
          >
            {/* Step 0 */}
            <Grow in={step === 0}>
              <Box sx={{ display: step === 0 ? "block" : "none" }}>
                <Typography
                  sx={{
                    fontFamily : 'Inter',
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
  onChange={(e) => setUsername(e.target.value.trim().toLowerCase())} // 👈 force lowercase
  placeholder="username"
  InputLabelProps={{ shrink: true }}
  inputProps={{ maxLength: 20 }}   // 👈 max 20 characters
  InputProps={{
    endAdornment: (
      <InputAdornment position="start">
        <Typography
          sx={{ fontSize: "1rem", fontWeight: 700, color: "text.primary" }}
        >
          .myhandle.in
        </Typography>
      </InputAdornment>
    ),
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
      background: "#f6f7fb",
      py: 1.25,
      fontWeight: 700,
    },
    mb: 3,
  }}
/>





             <Typography
  variant="caption"
  sx={{
    fontSize: "0.9rem",        // 👈 custom size
    fontWeight: 600,           // 👈 bold
    mt: 1,                     // 👈 margin-top
    color: username
      ? usernameIsValid
        ? "success.main"
        : "error.main"
      : "text.secondary",
  }}
>
  {username
    ? usernameIsValid
      ? (
        <>
          Your link:{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
            {username}.myhandle.in
          </Box>
        </>
      )
      : "Invalid username (3–30 chars: letters, numbers, ., _, -)"
    : "Enter a username to continue"}
</Typography>


                <Box sx={{ mt: 4 }}>
                  <CTA onClick={handleNext} disabled={!username || !usernameIsValid}>
                    Continue
                  </CTA>
                </Box>
              </Box>
            </Grow>

            {/* Step 1 */}
            <Grow in={step === 1}>
              <Box sx={{ display: step === 1 ? "block" : "none" }}>
                <Box sx={{ display: "flex", flexDirection : 'row', gap: 2, mb: 2 }}>
                  <IconButton onClick={handleBack} sx={{ border: '1px solid #CBDCEB', borderRadius : 1}}>
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{fontFamily : 'Inter', fontSize : {xs: 18, md: 36}, fontWeight: 900 }}>
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
                  <CTA onClick={handleNext} disabled={!goal}>
                    Continue
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
              {/* purple tilted card */}
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

                {/* faux buttons */}
                <Stack spacing={1} sx={{ mt: 6, width: "62%" }}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.95 }}>Watch now on Twitch</Paper>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.9 }}>Join my Discord</Paper>
                  <Paper sx={{ p: 1.25, borderRadius: 3, opacity: 0.85 }}>Playlists</Paper>
                </Stack>

                {/* small media card */}
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
