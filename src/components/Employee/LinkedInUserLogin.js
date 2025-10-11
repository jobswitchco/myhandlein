import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  Divider,
  Link as MLink,
  CircularProgress
} from "@mui/material";
import { login } from "../../store/professionalSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useGoogleLogin } from "@react-oauth/google";
import GmailIcon from "../../images/google.png";
import wallBack from "../../images/4159942_89781.jpg";

/**
 * Influencer-focused auth screen
 * - Polished hero on the left (desktop) + glass card on the right
 * - Single prominent Google button
 * - Preserves your original login flow and redirects
 */
export default function WaitlistSignup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = "/api/usersOn";
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Lock body scroll while mounted (fullscreen background)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Verify existing session and redirect if valid
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });
        if (res.data.valid) {
          navigate("/professional/dashboard/analytics");
        }
      } catch (error) {
        // ignore -> show login
      }
    };
    verifyToken();
  }, []);

  const handleLoginSuccess = async (email_gm, firstName, lastName, picture) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        baseUrl + "/user-login-gmail",
        { email: email_gm, firstName, lastName, picture },
        { withCredentials: true }
      );

      const data = res?.data || {};
      if (data.success && data.wasNew) {
        dispatch(login({ user_email: data.user.user_email, user_id: data.user.user_id }));
        navigate("/creator/onboarding");
      } else if (data.success && !data.wasNew) {
        dispatch(login({ user_email: data.user.user_email, user_id: data.user.user_id }));
        navigate("/professional/dashboard/analytics");
      } else {
        toast.error("Something went wrong. Please login again.");
        setTimeout(() => navigate("/professional/login"), 1200);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setTimeout(() => navigate("/professional/login"), 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse?.access_token;
        if (!accessToken) {
          toast.error("Google sign-in did not return an access token. Please try again.");
          return;
        }
        const profileRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: false,
          timeout: 8000
        });
        const { email: gmEmail, given_name, family_name, picture } = profileRes.data || {};
        handleLoginSuccess(gmEmail, given_name, family_name, picture);
      } catch (err) {
        toast.error("Google sign-in failed. Please try again.");
      }
    },
    onError: () => {
      toast.error("Google sign-in failed. Please try again.");
    }
  });

  const GoogleButton = (
    <Button
      onClick={() => loginWithGoogle()}
      fullWidth
      disabled={isLoading}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        py: 1.5,
        gap: 1.5,
        fontWeight: 600,
        fontSize: 16,
        background: "#246be9",
        color: "#fff",
        "&:hover": { background: "#1c54b3" },
        boxShadow: "0 8px 20px rgba(36,107,233,0.35)"
      }}
    >
      <Box component="img" src={GmailIcon} alt="Google" sx={{ width: 24, height: 24, bgcolor: "#fff", p: 0.5, borderRadius: 1 }} />
     <Typography sx={{ fontFamily : 'Inter', fontSize : isSmallScreen ? '15px' : '18px'}}>
      {isLoading ? "Signing you in…" : "Continue with Google"}

     </Typography>
      {isLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
    </Button>
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
        minHeight: "100dvh",
        backgroundImage: `linear-gradient( to bottom right, rgba(5,11,40,0.65), rgba(5,11,40,0.35) ), url(${wallBack})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left hero (hidden on small) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          px: 8,
          color: "#fff",
        }}
      >
        <Box maxWidth={560}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                bgcolor: "rgba(255,255,255,0.15)",
                borderRadius: 2,
                backdropFilter: "blur(4px)",
              }}
            />
            <Typography variant="h6" sx={{ letterSpacing: 1, fontWeight: 700 }}>myhandle.in</Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1, mb: 2, fontFamily : 'Inter' }}>
            The fastest way for creators to manage brand deals.
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 4, fontFamily : 'Inter' }}>
            Join top influencers who streamline pitches, inbox, and payments in one place.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ opacity: 0.9 }}>
            <Stack>
              <Typography variant="h4" fontWeight={800}>10k+</Typography>
              <Typography variant="body2">Link in Bio Pages</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
            <Stack>
              <Typography variant="h4" fontWeight={800}>4.9★</Typography>
              <Typography variant="body2">Creator satisfaction</Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Right auth card */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2.5, md: 6 }, height : '100vh' }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 4,
            px: { xs: 4, md: 6 },
            py: { xs: 4, md: 6 },
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            display : 'flex',
            justifyContent : 'center'
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.6, fontFamily : 'Inter', fontSize : isSmallScreen ? '10px' : '16px' }}>
                Influencer Access
              </Typography>
              <Typography variant="h4" sx={{fontFamily : 'Inter', fontSize : isSmallScreen ? '22px' : '36px', fontWeight: 700, mt: 0.5, mb: 3 }}>
                Sign in or create your account
              </Typography>
            
            </Box>

            {GoogleButton}

            <Divider>or</Divider>

            {/* Optional: placeholders for future email/password flow */}
            <Button
              variant="outlined"
              fullWidth
              disabled
              sx={{ textTransform: "none", borderRadius: 2, py: 1.3 }}
            >
              Email sign-in (coming soon)
            </Button>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                By continuing you agree to our {" "}
                <MLink href="https://myhandle.in/terms" underline="hover">Terms</MLink> & {" "}
                <MLink href="https://myhandle.in/privacy-policy" underline="hover">Privacy Policy</MLink>.
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <ToastContainer autoClose={2000} />
    </Box>
  );
}
