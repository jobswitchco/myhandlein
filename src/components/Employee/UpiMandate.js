// UpiMandate.modern.jsx — prefill user details via backend
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Divider,
  Stack,
  Button,
  Chip,
  Tooltip,
  InputAdornment,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LockIcon from "@mui/icons-material/Lock";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CircularProgress from "@mui/material/CircularProgress";

const RZP_KEY_ID = "rzp_test_RQQNAOcO5ejHLL";

export default function UpiMandateModern() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [vpa, setVpa] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const PLAN_ID = "plan_RQQY0Mz6TlIOIj";
  const baseUrl = "/api/usersOn";

  // --- Load Razorpay script once ---
  useEffect(() => {
    const id = "razorpay-checkout";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onerror = () => {
      setSnack({ open: true, severity: "error", message: "Failed to load Razorpay. Please check your connection." });
    };
    document.body.appendChild(s);
  }, []);

  // --- Prefill user profile from backend ---
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/details-for-mandate`, { withCredentials: true });
        if (!active) return;
        setName(data?.name || "");
        setEmail(data?.email || "");
        setPhone(data?.phone || "");
        // vpa intentionally not prefilled unless you store it
      } catch (err) {
        console.error("Prefill failed", err);
        setSnack({ open: true, severity: "warning", message: err?.response?.data?.error || "Couldn't prefill profile. You can type it manually." });
      } finally {
        if (active) setPrefillLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // --- simple validators ---
  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const phoneValid = useMemo(() => /^\d{10}$/.test((phone || "").trim()), [phone]);
  const nameValid = useMemo(() => name.trim().length >= 2, [name]);
  const vpaValid = useMemo(() => vpa === "" || /^[A-Za-z0-9_.-]+@[A-Za-z]{2,}$/.test(vpa), [vpa]);

  const formValid = nameValid && emailValid && phoneValid && vpaValid;

  const createSubscription = async () => {
    if (!formValid) {
      setSnack({ open: true, severity: "warning", message: "Please fix the highlighted fields." });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        baseUrl + "/create-subscription",
        { plan_id: PLAN_ID },
        { withCredentials: true }
      );

      const data = res.data;
      if (!data?.subscription_id) throw new Error(data?.error || "Failed to create subscription.");
      launchCheckout(data.subscription_id);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", message: e?.message || "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const launchCheckout = (subscription_id) => {
    if (!window.Razorpay) {
      setSnack({ open: true, severity: "error", message: "Razorpay script not ready yet. Please try again." });
      return;
    }

    const rzp = new window.Razorpay({
      key: RZP_KEY_ID,
      name: "MyHandle",
      description: "₹99 Monthly — starts after 7 days",
      subscription_id,
      recurring: 1,
      method: { upi: true },
      prefill: { name, email, contact: phone, upi_vpa: vpa || undefined },
      notes: { plan: "MyHandle 99 Subscription" },
      theme: { color: "#111827" },
      handler: async function (resp) {
        try {
          await axios.post(
            baseUrl + "/subscription/verify",
            {
              payment_id: resp.razorpay_payment_id,
              subscription_id: resp.razorpay_subscription_id,
              signature: resp.razorpay_signature,
            },
            { withCredentials: true }
          );
          window.location.href = "/professional/dashboard/analytics";
        } catch (err) {
          console.error(err);
          const msg = err?.response?.data?.error || "Payment verification failed. Please try again.";
          setSnack({ open: true, severity: "error", message: msg });
        }
      },
      modal: { ondismiss: () => console.log("Checkout closed") },
    });

    rzp.open();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 3 },
        background: `radial-gradient(1200px 600px at 10% 0%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 60%),\n                     radial-gradient(900px 500px at 90% 20%, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 60%),\n                     linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.9)}, ${theme.palette.background.default})`,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 4,
          backdropFilter: "blur(10px)",
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.15)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          overflow: "hidden",
          opacity: prefillLoading ? 0.7 : 1,
        }}
      >
        <CardHeader
          title={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography sx={{ fontFamily : 'Inter', fontSize : isMobile ? '22px' : '26px', fontWeight : 700, pb: 0.5}}>
                7-Day Free Start
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Approve a one‑time UPI mandate. We DON'T charge now, We charge only after 7th day • Cancel Anytime.
            </Typography>
          }
          sx={{ p: { xs: 2.5, sm: 3 } }}
        />

        <CardContent sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 1 } }}>
          <Stack spacing={1}>
        
            <Stack direction="row" spacing={1.5} alignItems="center" pb={2}>
              <Tooltip title="Razorpay secure" placement="top" arrow>
                <Chip icon={<VerifiedUserIcon sx={{fontSize : '18px', bg: '#4C763B'}}/>} label="Secure • Razorpay" variant="outlined"  />
              </Tooltip>
              <Tooltip title="Your data is encrypted" placement="top" arrow>
                <Chip icon={<LockIcon sx={{fontSize : '18px'}}/>} label="256‑bit encryption" variant="outlined" />
              </Tooltip>
            </Stack>


            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              error={!nameValid && name !== ""}
              helperText={!nameValid && name !== "" ? "Enter at least 2 characters" : " "}
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><PersonIcon /></InputAdornment>
              )}}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              error={!emailValid && email !== ""}
              helperText={!emailValid && email !== "" ? "Enter a valid email" : " "}
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><EmailIcon /></InputAdornment>
              )}}
            />

            <TextField
              label="Phone (10‑digit)"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              fullWidth
              error={!phoneValid && phone !== ""}
              helperText={!phoneValid && phone !== "" ? "Enter a 10‑digit mobile number" : " "}
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><PhoneIphoneIcon /></InputAdornment>
              )}}
            />

            <Box sx={{ position: "relative" }}>
              <Button
                size="large"
                variant="contained"
                onClick={createSubscription}
                disabled={loading || !formValid}
                fullWidth
                sx={{ py: 1.5, borderRadius: 3, textTransform: "none", fontSize: "1rem", fontWeight: 700, boxShadow: "none" }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <CircularProgress size={22} thickness={5} />
                    <span>Preparing checkout…</span>
                  </Stack>
                ) : (
                  "Approve UPI Mandate"
                )}
              </Button>
            </Box>


            <Divider />

            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">What happens next?</Typography>
              <Typography variant="body2" color="text.secondary">
                • You authorize a recurring UPI mandate of ₹99/month. • No charge today. • Cancel anytime.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>

        {isMobile && (<Box sx={{ height: 68 }} />)}
      </Card>

      {isMobile && (
        <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0, p: 1.5, backgroundColor: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(10px)", borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <Button variant="contained" size="large" fullWidth disabled={loading || !formValid} onClick={createSubscription} sx={{ borderRadius: 3, fontWeight: 800 }}>
            {loading ? "Preparing…" : "Approve UPI Mandate"}
          </Button>
        </Box>
      )}

      <Snackbar autoHideDuration={5000} open={snack.open} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert elevation={3} onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}






