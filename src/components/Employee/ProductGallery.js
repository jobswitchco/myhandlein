// ProductGallery.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WestOutlinedIcon from "@mui/icons-material/WestOutlined";

axios.defaults.withCredentials = true;
const API_BASE = "/api/usersOn";

function truncate(str, max = 40) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export default function ProductGallery() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);
  const debounceMs = 400;

  // store computed subdomain in a ref so it doesn't trigger rerenders
  const subdomainRef = useRef("");
  const [subdomainForUI, setSubdomainForUI] = useState(""); // optional, for debugging display

  // cancel token ref for axios cancelation
  const cancelTokenRef = useRef(null);

  // store last request params so we can avoid duplicate requests
  const lastParamsRef = useRef(null);

  // ---------- compute subdomain once on mount ----------
  useEffect(() => {
    let computed = "";
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("subdomain")?.trim();
      if (q) {
        computed = q;
      } else {
        const host = window.location?.hostname || "";
        // fallback: pick first label, but ignore 'localhost' and direct IPs
        const firstLabel = host.split(".")[0] || "";
        const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
        if (firstLabel && firstLabel !== "localhost" && !isIP) {
          computed = firstLabel;
        } else {
          computed = ""; // treat localhost/IP as no subdomain
        }
      }
    } catch (err) {
      console.warn("subdomain extraction error", err);
      computed = "";
    }

    subdomainRef.current = computed;
    setSubdomainForUI(computed || "");
    // initial page 1 (ensures the page effect triggers once if we have subdomain)
    setPage(1);
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- fetchProducts (explicit args; uses subdomainRef when sd omitted) ----------
  const fetchProducts = useCallback(async (pageNo = 1, pageSize = 10, q = "", sd = undefined) => {
    const subdomainToSend = (sd === undefined ? subdomainRef.current : sd) || "";

    const params = {
      page: pageNo,
      limit: pageSize,
      ...(subdomainToSend ? { subdomain: subdomainToSend } : {}),
      ...(q ? { q } : {}),
    };

    // avoid duplicate requests if params identical to last successful/attempted request
    const paramsKey = JSON.stringify(params);
    if (lastParamsRef.current === paramsKey) {
      // already requested these exact params — skip
      // console.debug("Skipping duplicate fetch for params:", params);
      return;
    }

    // mark as last params (so other concurrent triggers will skip until this resolves)
    lastParamsRef.current = paramsKey;

    setLoading(true);

    try {
      if (cancelTokenRef.current) {
        try { cancelTokenRef.current.cancel?.("canceled by new request"); } catch (_) {}
      }
      cancelTokenRef.current = axios.CancelToken.source();

      console.log("Requesting fetch-influencer-products with params:", params);
      const res = await axios.get(`${API_BASE}/fetch-influencer-products`, {
        params,
        cancelToken: cancelTokenRef.current.token,
        timeout: 10000,
      });

      setProducts(res.data.data || []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) {
        // request canceled — do not clear lastParamsRef so a retrigger can proceed
        console.warn("Fetch canceled:", err.message || err);
      } else {
        console.error("Fetch products error:", err);
        // on error we should clear lastParamsRef so retry is possible
        lastParamsRef.current = null;
        setProducts([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- effect: fetch when page or limit changes ----------
  useEffect(() => {
    // if there is no subdomain, don't fetch — prevents accidental localhost=firstLabel usage
    // If you want to fetch global products when subdomain is empty, remove this guard.
    if (!subdomainRef.current) {
      console.log("No valid subdomain found, skipping fetch");
      return;
    }

    // Build paramsKey and compare — this prevents accidental repeated fetches
    const params = {
      page,
      limit,
      ...(subdomainRef.current ? { subdomain: subdomainRef.current } : {}),
      ...(searchTerm ? { q: searchTerm.trim() } : {}),
    };
    const key = JSON.stringify(params);
    if (lastParamsRef.current === key) {
      // identical to last request, skip
      return;
    }

    fetchProducts(page, limit, searchTerm.trim(), subdomainRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // ---------- debounce searchTerm ----------
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);

    searchRef.current = setTimeout(() => {
      // if not on page 1, set page to 1; page effect will run fetch
      if (page !== 1) {
        setPage(1);
      } else {
        // already on page 1 -> call fetch directly (but fetchProducts will skip if params same)
        if (subdomainRef.current) {
          fetchProducts(1, limit, searchTerm.trim(), subdomainRef.current);
        }
      }
    }, debounceMs);

    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ---------- helpers ----------
  function normalizeUrl(url) {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function openProduct(p) {
    const raw = p.link || p.url || p.action || "";
    if (!raw) return;
    const url = normalizeUrl(raw);
    if (!url) return;

    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try {
        const newWin = window.open(url, "_blank", "noopener,noreferrer");
        if (newWin) try { newWin.focus(); } catch (_) {}
      } catch {}
    }

    // analytics (fire-and-forget)
    const apiEndpoint = `${API_BASE}/product-click-analytics`;
    const linkKey = p._id || p.id || p.document_id || null;
    const payload = {
      link_key: linkKey ? String(linkKey) : undefined,
      block_name: p.title || p.name || undefined,
    };
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const queued = navigator.sendBeacon(apiEndpoint, blob);
        if (!queued) axios.post(apiEndpoint, payload).catch(() => {});
      } else {
        axios.post(apiEndpoint, payload).catch(() => {});
      }
    } catch {
      axios.post(apiEndpoint, payload).catch(() => {});
    }
  }

  function handleBack() {
    try {
      const nav = (window && window.__REACT_ROUTER_NAVIGATE) || null;
      if (nav && typeof nav === "function") {
        nav(-1);
        return;
      }
    } catch {}
    if (window && window.history && window.history.length > 1) window.history.back();
    else window.location.href = "/";
  }

  function ProductCard({ p }) {
    const img = p.imageUrl || p.image || p.thumbnail || "";
    const CARD_HEIGHT = { xs: 220, sm: 260 };

    return (
      <Card sx={{ borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.08)", height: CARD_HEIGHT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <CardActionArea
          component="div"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openProduct(p);
          }}
          sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%" }}
        >
          <Box sx={{ width: "100%", flex: "8 0 0", position: "relative" }}>
            {img ? (
              <CardMedia component="img" image={img} alt={p.title || "product"} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No image</Typography>
              </Box>
            )}
          </Box>

          <CardContent sx={{ px: 2, py: 1, flex: "2 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography sx={{ fontWeight: 600, fontFamily: "Inter", fontSize: { xs: 14, sm: 15 }, overflow: "hidden", textOverflow: "ellipsis", flex: 1 }} title={p.title}>
              {truncate(p.title, 30)}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || products.length || 0) / limit));

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={handleBack}>
          <WestOutlinedIcon sx={{ color: "#334443" }} />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 600, fontFamily: "Inter", fontSize: "20px", color: "#334443" }}>Products</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 1 }}>
        <Paper sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, borderRadius: 1 }}>
          <TextField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product..."
            variant="standard"
            fullWidth
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { px: 1 },
            }}
          />
        </Paper>
      </Box>

      <Box sx={{ p: 2, borderRadius: 1 }}>
        {loading ? (
          <Box sx={{ py: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">No products found</Typography>
            {searchTerm ? <Typography color="text.secondary">Try a different search term.</Typography> : <Typography color="text.secondary">Click + Add Product to upload one.</Typography>}
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {products.map((p) => (
                <Grid key={p._id || p.id} item xs={6} sm={4} md={3}>
                  <ProductCard p={p} />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="secondary"
                shape="rounded"
              />
            </Box>
          </>
        )}
      </Box>

      {/* optional debug - show resolved subdomain */}
      {/* <Box sx={{ mt: 2 }}>
        <Typography variant="caption">subdomain: {subdomainForUI || "(none)"}</Typography>
      </Box> */}
    </Box>
  );
}
