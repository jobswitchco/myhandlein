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
  Dialog,
  AppBar,
  Toolbar,
  Button,
  Slide,
  Tabs,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import WestOutlinedIcon from "@mui/icons-material/WestOutlined";

axios.defaults.withCredentials = true;
const API_BASE = "/api/usersOn";

function truncate(str, max = 40) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// Read category from backend-provided string; fall back to populated object if present.
function getCategoryName(p) {
  return p?.category || p?.productCategory?.name || "Other";
}

// Transition component defined outside to prevent recreation
const Transition = (props) => <Slide direction="up" {...props} />;

export default function ProductGallery() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dynamic tabs
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const searchRef = useRef(null);
  const debounceMs = 400;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const openDigitalDetails = (p) => {
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

    setDetailProduct(p || null);
    setDetailOpen(true);
  };

  const closeDigitalDetails = () => {
    setDetailOpen(false);
    setDetailProduct(null);
  };

  const formatPrice = (val, currency = "INR") => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(num);
    } catch {
      return `₹${num.toFixed(2)}`;
    }
  };

  // subdomain
  const subdomainRef = useRef("");
  const [subdomainForUI, setSubdomainForUI] = useState("");

  // axios cancel + duplicate-request guard
  const cancelTokenRef = useRef(null);
  const lastParamsRef = useRef(null);

  // thumb cache
  const thumbCache = useRef(new Map());
  
  function useAffiliateThumb(p) {
    const [src, setSrc] = useState(() => {
      const initial = p.imageUrl || p.image || p.thumbnail || null;
      return initial && initial.startsWith("http://")
        ? initial.replace(/^http:\/\//, "https://")
        : initial;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      let cancelled = false;
      if (src || !p?.link) return;

      const cached = thumbCache.current.get(p.link);
      if (cached) {
        setSrc(cached);
        return;
      }

      (async () => {
        try {
          setLoading(true);
          const { data } = await axios.post(`${API_BASE}/url-metadata`, { url: p.link }, { timeout: 8000 });
          const img = data?.image || null;
          if (!cancelled && img) {
            const httpsImg = img.startsWith("http://") ? img.replace(/^http:\/\//, "https://") : img;
            thumbCache.current.set(p.link, httpsImg);
            setSrc(httpsImg);
          }
        } catch {
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [p?.link, src]);

    return { src, loading, setSrc };
  }

  // compute subdomain once
  useEffect(() => {
    let computed = "";
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("subdomain")?.trim();
      if (q) {
        computed = q;
      } else {
        const host = window.location?.hostname || "";
        const firstLabel = host.split(".")[0] || "";
        const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
        computed = firstLabel && firstLabel !== "localhost" && !isIP ? firstLabel : "";
      }
    } catch {
      computed = "";
    }
    subdomainRef.current = computed;
    setSubdomainForUI(computed || "");
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to merge categories from a fetched list
  const upsertCategoriesFromList = useCallback((list) => {
    const found = new Set(list.map(getCategoryName).filter(Boolean));
    setCategories((prev) => {
      const merged = ["All", ...prev.filter((c) => c !== "All"), ...Array.from(found)];
      // de-dupe while preserving order of first appearance
      const seen = new Set();
      return merged.filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
    });
  }, []);

  // fetch
  const fetchProducts = useCallback(
    async (pageNo = 1, pageSize = 10, q = "", sd = undefined, category = "All") => {
      const subdomainToSend = (sd === undefined ? subdomainRef.current : sd) || "";

      const params = {
        page: pageNo,
        limit: pageSize,
        ...(subdomainToSend ? { subdomain: subdomainToSend } : {}),
        ...(q ? { q } : {}),
        ...(category && category !== "All" ? { category } : {}),
      };

      const paramsKey = JSON.stringify(params);
      if (lastParamsRef.current === paramsKey) return;
      lastParamsRef.current = paramsKey;

      setLoading(true);
      try {
        if (cancelTokenRef.current) {
          try {
            cancelTokenRef.current.cancel?.("canceled by new request");
          } catch {}
        }
        cancelTokenRef.current = axios.CancelToken.source();

        const res = await axios.get(`${API_BASE}/fetch-influencer-products`, {
          params,
          cancelToken: cancelTokenRef.current.token,
          timeout: 10000,
        });

        const list = res.data?.data || [];
        setProducts(list);
        setTotal(res.data?.total ?? list.length ?? 0);

        // derive/merge categories from the returned items
        upsertCategoriesFromList(list);

        // ensure selected category exists (e.g., after search changing dataset)
        setSelectedCategory((curr) => (curr && (curr === "All" || list.some((p) => getCategoryName(p) === curr)) ? curr : "All"));
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) {
          console.warn("Fetch canceled:", err.message || err);
        } else {
          console.error("Fetch products error:", err);
          lastParamsRef.current = null;
          setProducts([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [upsertCategoriesFromList]
  );

  // refetch on page/limit change
  useEffect(() => {
    if (!subdomainRef.current) {
      console.log("No valid subdomain found, skipping fetch");
      return;
    }
    const params = {
      page,
      limit,
      ...(subdomainRef.current ? { subdomain: subdomainRef.current } : {}),
      ...(searchTerm ? { q: searchTerm.trim() } : {}),
      ...(selectedCategory && selectedCategory !== "All" ? { category: selectedCategory } : {}),
    };
    const key = JSON.stringify(params);
    if (lastParamsRef.current === key) return;

    fetchProducts(page, limit, searchTerm.trim(), subdomainRef.current, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // debounce search + category
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else if (subdomainRef.current) {
        fetchProducts(1, limit, searchTerm.trim(), subdomainRef.current, selectedCategory);
      }
    }, debounceMs);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  // helpers
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
        if (newWin) try { newWin.focus(); } catch {}
      } catch {}
    }

    // fire-and-forget analytics
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
    const { src, loading, setSrc } = useAffiliateThumb(p);
    const CARD_HEIGHT = { xs: 220, sm: 260 };

    return (
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 6px 18px rgba(2,6,23,0.08)",
          height: CARD_HEIGHT,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CardActionArea
          component="div"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if ((p?.type || "").toLowerCase() === "digital") {
              openDigitalDetails(p);
            } else {
              openProduct(p);
            }
          }}
          sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%" }}
        >
          <Box sx={{ width: "100%", flex: "8 0 0", position: "relative" }}>
            {src ? (
              <CardMedia
                component="img"
                image={src}
                alt={p.title || "product"}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                onError={() => setSrc("")}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : loading ? (
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} />
              </Box>
            ) : (
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No image</Typography>
              </Box>
            )}
          </Box>

          <CardContent
            sx={{
              px: 2,
              py: 1,
              flex: "2 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontFamily: "Inter",
                fontSize: { xs: 14, sm: 15 },
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
              title={p.title}
            >
              {truncate(p.title, 30)}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || products.length || 0) / limit));

  // Fallback client-side filtering (server also filters when tab != All)
  const visibleProducts =
    selectedCategory === "All" ? products : products.filter((p) => getCategoryName(p) === selectedCategory);

  return (
    <>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={handleBack}>
            <WestOutlinedIcon sx={{ color: "#334443" }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 600, fontFamily: "Inter", fontSize: "20px", color: "#334443" }}>
              Products
            </Typography>
          </Box>
        </Stack>

        {/* Search */}
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

        {/* Category Tabs */}
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, v) => {
              setSelectedCategory(v);
              if (page !== 1) setPage(1);
              else if (subdomainRef.current) {
                fetchProducts(1, limit, searchTerm.trim(), subdomainRef.current, v);
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            textColor="secondary"
            indicatorColor="secondary"
            sx={{ minHeight: 44 }}
          >
            {categories.map((c) => (
              <Tab key={c} value={c} label={c} sx={{ textTransform: "none", fontWeight: 600, minHeight: 44 }} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 2, borderRadius: 1 }}>
          {loading ? (
            <Box sx={{ py: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : visibleProducts.length === 0 ? (
            <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">No products found</Typography>
              {searchTerm ? (
                <Typography color="text.secondary">Try a different search term.</Typography>
              ) : (
                <Typography color="text.secondary">Click + Add Product to upload one.</Typography>
              )}
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {visibleProducts.map((p) => (
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
      </Box>

      {/* Full-screen dialog for digital products */}
      <Dialog 
        fullScreen 
        open={detailOpen} 
        onClose={closeDigitalDetails} 
        TransitionComponent={Transition}
        keepMounted={false}
        disablePortal={false}
        sx={{ zIndex: 1300 }}
      >
        <AppBar 
          elevation={0} 
          sx={{ 
            position: "relative", 
            bgcolor: "white", 
            color: "inherit", 
            borderBottom: "1px solid #eee" 
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={closeDigitalDetails} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 1, flex: 1, fontWeight: 600 }}>
              {detailProduct?.title || "Product"}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
          {detailProduct && (
            <Grid container spacing={3}>
              {/* Image */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 320,
                    bgcolor: "#fafafa",
                  }}
                >
                  {detailProduct?.imageUrl ? (
                    <Box
                      component="img"
                      src={
                        detailProduct.imageUrl.startsWith("http://")
                          ? detailProduct.imageUrl.replace(/^http:\/\//, "https://")
                          : detailProduct.imageUrl
                      }
                      alt={detailProduct?.title || "product"}
                      referrerPolicy="no-referrer"
                      style={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain" }}
                    />
                  ) : (
                    <Typography color="text.secondary">No image</Typography>
                  )}
                </Box>
              </Grid>

              {/* Details */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {detailProduct?.title || "-"}
                  </Typography>

                  {detailProduct?.description ? (
                    <Typography sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
                      {detailProduct.description}
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">No description</Typography>
                  )}

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatPrice(detailProduct?.price, detailProduct?.currency || "INR") || ""}
                    </Typography>
                  </Stack>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => {
                        console.log("Buy Now clicked for", detailProduct?._id || detailProduct?.id);
                      }}
                    >
                      Buy Now
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Box>
      </Dialog>
    </>
  );
}