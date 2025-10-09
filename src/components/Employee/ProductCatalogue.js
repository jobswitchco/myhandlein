
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
  Avatar,
  Typography,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import format from "date-fns/format";

axios.defaults.withCredentials = true; // apply globally for this file

const API_BASE = "/api/usersOn";

function AffiliateThumb({ product }) {
  const [src, setSrc] = React.useState(product?.imageUrl || null);
  const [error, setError] = React.useState(false);
  const key = product?.imageUrl || product?.link || product?._id;

  React.useEffect(() => {
    let cancelled = false;

    // If we already have an image or it's not affiliate, do nothing
    if (product?.imageUrl || product?.type === "digital" || !product?.link) return;

    // Fetch thumbnail from backend metadata once per product/link
    (async () => {
      try {
        const { data } = await axios.post(`${API_BASE}/url-metadata`, { url: product.link });
        const img = data?.image || null;
        if (!cancelled && img) setSrc(img.startsWith("http://") ? img.replace(/^http:\/\//, "https://") : img);
      } catch {
        // ignore; fallback avatar will show
      }
    })();

    return () => { cancelled = true; };
  }, [key]); // re-run if link/image changes

  // Render
  if (!src || error) {
    // fallback initials (like your NU)
    return (
      <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: "#f4f4f5", fontSize: 12 }}>
        {product?.title ? product.title.slice(0, 2).toUpperCase() : "NA"}
      </Avatar>
    );
  }

  return (
    <Avatar
      variant="rounded"
      src={src}
      alt={product?.title}
      sx={{ width: 64, height: 64 }}
      imgProps={{
        onError: () => setError(true),
        referrerPolicy: "no-referrer", // helps when hosts block referrers
      }}
    />
  );
}


function a11yProps(index) {
  return { id: `add-prod-tab-${index}`, "aria-controls": `add-prod-tabpanel-${index}` };
}

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`add-prod-tabpanel-${index}`}
      aria-labelledby={`add-prod-tab-${index}`}
      style={{ marginTop: 8 }}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

export default function Store() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Store enabled toggle state
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Form shared
  const [activeTab, setActiveTab] = useState(0); // 0 = Affiliate Link, 1 = Digital Product

  // Affiliate Link form
  const [affTitle, setAffTitle] = useState("");
  const [affUrl, setAffUrl] = useState("");
  const [affCategory, setAffCategory] = useState(null); // { _id, name }
  const [affThumb, setAffThumb] = useState(null); // thumbnail from url-metadata
  const [metaLoading, setMetaLoading] = useState(false);

  // Digital Product form
  const [digCategory, setDigCategory] = useState(null);
  const [digName, setDigName] = useState("");
  const [digDesc, setDigDesc] = useState("");
  const [digPrice, setDigPrice] = useState("");
  const [digFile, setDigFile] = useState(null);
  const [digPreview, setDigPreview] = useState(null);

  // Categories
  const [catOptions, setCatOptions] = useState([]); // [{_id, name}]
  const [catLoading, setCatLoading] = useState(false);
  const catSearchRef = useRef("");
  const catDebounce = useRef();

  const [catQuery, setCatQuery] = useState("");

  const MAX_LINK_LEN = 30;
  function truncate(str, max = MAX_LINK_LEN) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "..." : str;
  }

  useEffect(() => {
    fetchProducts(page + 1, limit);
    fetchStoreStatus();
    // pre-load some categories
    fetchCategories("");
    // eslint-disable-next-line
  }, [page, limit]);

  async function fetchStoreStatus() {
    try {
      const res = await axios.get(`${API_BASE}/store-status`);
      if (res?.data?.enabled !== undefined) setStoreEnabled(Boolean(res.data.enabled));
    } catch (err) {
      console.warn("Could not fetch store status (expected GET /store-status).", err);
    }
  }

  async function toggleStoreEnabled(nextValue) {
    const previous = storeEnabled;
    setStoreEnabled(nextValue);
    setToggling(true);
    try {
      await axios.post(`${API_BASE}/enable-store`, { enabled: nextValue });
    } catch (err) {
      console.error("Error toggling store enable:", err);
      setStoreEnabled(previous);
      alert("Failed to update store status. Please try again.");
    } finally {
      setToggling(false);
    }
  }

  async function fetchProducts(pageNo = 1, pageSize = 10) {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/fet-user-products`, {
        params: { page: pageNo, limit: pageSize },
      });
      setProducts(res.data.data || []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error("Fetch user products error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Categories -----------
  async function fetchCategories(search) {
    setCatLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/product-categories`, { params: { search } });
      setCatOptions(res?.data?.data || []);
    } catch (e) {
      console.error("fetchCategories error", e);
    } finally {
      setCatLoading(false);
    }
  }

  function handleCatSearch(inputValue) {
    catSearchRef.current = inputValue;
    clearTimeout(catDebounce.current);
    catDebounce.current = setTimeout(() => fetchCategories(inputValue), 350);
  }

  async function handleAddCategoryIfNeeded(label) {
    // Called when user presses Enter on a non-existing category or clicks "+ Add \"xyz\""
    try {
      const res = await axios.post(`${API_BASE}/product-categories`, { name: label });
      const newCat = res?.data?.category;
      if (newCat) {
        // update options and set in whichever tab is active
        setCatOptions((prev) => [newCat, ...prev]);
        if (activeTab === 0) setAffCategory(newCat);
        else setDigCategory(newCat);
      }
    } catch (e) {
      console.error("add category error", e);
      alert(e?.response?.data?.message || "Failed to add category");
    }
  }

  // ---------- Affiliate: URL metadata ----------
  const urlDebounce = useRef();
  useEffect(() => {
    if (!affUrl) {
      setAffThumb(null);
      return;
    }
    clearTimeout(urlDebounce.current);
    urlDebounce.current = setTimeout(async () => {
      try {
        setMetaLoading(true);
        const res = await axios.post(`${API_BASE}/url-metadata`, { url: affUrl });
        const { title, image, description } = res?.data || {};
        if (!affTitle && title) setAffTitle(title);
        setAffThumb(image || null);
      } catch (e) {
        // ignore errors but clear thumb
        setAffThumb(null);
      } finally {
        setMetaLoading(false);
      }
    }, 500);
  }, [affUrl]);

  // ---------- Image upload (Digital Product) ----------
  function handleDigFileChange(e) {
    const f = e.target.files?.[0];
    setDigFile(f || null);
    setDigPreview(f ? URL.createObjectURL(f) : null);
  }

  function openAddDialog() {
    setIsEditing(false);
    setEditingProductId(null);
    setActiveTab(0);

    // reset affiliate fields
    setAffTitle("");
    setAffUrl("");
    setAffCategory(null);
    setAffThumb(null);

    // reset digital fields
    setDigCategory(null);
    setDigName("");
    setDigDesc("");
    setDigPrice("");
    setDigFile(null);
    setDigPreview(null);

    setDialogOpen(true);
  }

  function openEditDialog(product) {
    // For simplicity, treat everything as Affiliate when editing existing schema
    setIsEditing(true);
    setEditingProductId(product._id);

    const isDigital = product.type === "digital";
    setActiveTab(isDigital ? 1 : 0);

    if (isDigital) {
      setDigName(product.title || "");
      setDigDesc(product.description || "");
      setDigPrice(product.price ?? "");
      setDigCategory(product.category || null);
      setDigFile(null);
      setDigPreview(product.imageUrl || null);

      // clear affiliate fields
      setAffTitle("");
      setAffUrl(product.link || "");
      setAffCategory(product.category || null);
      setAffThumb(product.imageUrl || null);
    } else {
      setAffTitle(product.title || "");
      setAffUrl(product.link || "");
      setAffCategory(product.category || null);
      setAffThumb(product.imageUrl || null);

      // clear digital fields
      setDigName("");
      setDigDesc("");
      setDigPrice("");
      setDigCategory(null);
      setDigFile(null);
      setDigPreview(null);
    }

    setDialogOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_BASE}/delete-product/${id}`);
      fetchProducts(page + 1, limit);
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Error deleting product.");
    }
  }

  const [saving, setSaving] = useState(false);

  

 async function handleSave() {
  setSaving(true);
  try {
    if (activeTab === 0) {
      // Affiliate Link
      if (!affTitle || !affUrl) {
        alert("Please enter Product Title and a valid URL.");
        setSaving(false);
        return;
      }
      const payload = new FormData();
      payload.append("type", "affiliate");
      payload.append("title", affTitle);
      payload.append("link", affUrl);
      if (affCategory?._id) payload.append("category_id", affCategory._id);
      if (affCategory?.name) payload.append("category_name", affCategory.name);
      if (affThumb) payload.append("imageUrlFromMeta", affThumb);

      if (isEditing && editingProductId) {
        await axios.post(`${API_BASE}/edit-product/${editingProductId}`, payload);
      } else {
        // ✅ fixed backtick/quote here
        await axios.post(`${API_BASE}/upload-product`, payload);
      }
    } else {
      // Digital Product
      if (!digName) {
        alert("Please enter Product Name.");
        setSaving(false);
        return;
      }
      const payload = new FormData();
      payload.append("type", "digital");
      payload.append("title", digName);
      payload.append("description", digDesc || "");
      if (digPrice !== "") payload.append("price", String(digPrice));
      if (digCategory?._id) payload.append("category_id", digCategory._id);
      if (digCategory?.name) payload.append("category_name", digCategory.name);
      if (digFile) payload.append("image", digFile);

      if (isEditing && editingProductId) {
        await axios.post(`${API_BASE}/edit-product/${editingProductId}`, payload);
      } else {
        await axios.post(`${API_BASE}/upload-product`, payload);
      }
    }

    await fetchProducts(page + 1, limit);
    setDialogOpen(false);
  } catch (err) {
    console.error("Save product error:", err);
    alert(err?.response?.data?.message || "Error saving product.");
  } finally {
    setSaving(false);
  }
}

const handleChangePage = (_, newPage) => setPage(newPage);

const handleChangeRowsPerPage = (event) => {
  const rows = parseInt(event.target.value, 10);
  setLimit(rows);
  setPage(0);
};



// debounce fetch still OK
function handleCatSearch(inputValue) {
  setCatQuery(inputValue);                 // <-- add this
  catSearchRef.current = inputValue;
  clearTimeout(catDebounce.current);
  catDebounce.current = setTimeout(() => fetchCategories(inputValue), 350);
}

// options with "+ Add"
const categoryOptionLabel = (opt) => (typeof opt === "string" ? opt : opt?.name || "");

const catOptionsWithAdd = useMemo(() => {
  const q = (catQuery || "").trim();      // <-- use state, not ref
  const exists = catOptions.some((c) => c.name?.toLowerCase() === q.toLowerCase());
  return q && !exists
    ? [{ _id: "__add__", name: `+ Add "${q}"` }, ...catOptions]
    : catOptions;
}, [catOptions, catQuery]);                // <-- include catQuery



  function renderCategoryAutocomplete(value, onChange) {
    return (
    <Autocomplete
  options={catOptionsWithAdd}
  loading={catLoading}
  value={value}
  onChange={(_, newVal) => {
    if (newVal?._id === "__add__") {
      const label = (catQuery || "").trim();
      if (label) handleAddCategoryIfNeeded(label);
      return;
    }
    onChange(newVal);
  }}
  onInputChange={(_, newInput) => handleCatSearch(newInput)} // updates catQuery + debounced fetch
  getOptionLabel={categoryOptionLabel}
  isOptionEqualToValue={(o, v) => o._id === v?._id}
  renderInput={(params) => <TextField {...params} label="Category" placeholder="Search or add" />}
/>

    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Store - Products</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch checked={storeEnabled} onChange={(e) => toggleStoreEnabled(e.target.checked)} disabled={toggling} />}
            label={toggling ? "Updating..." : "Enable Store"}
          />

          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            + Add Product
          </Button>
        </Stack>
      </Stack>

      <Paper>
        <TableContainer>
          {loading ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Uploaded Date</TableCell>
                  <TableCell>Product Image</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}

                {products.map((p, idx) => {
                  const displayDate = p.createdAt || p.created_at;
                  return (
                    <TableRow key={p._id} hover>
                      <TableCell>{page * limit + idx + 1}</TableCell>
                      <TableCell>{displayDate ? format(new Date(displayDate), "yyyy-MM-dd HH:mm") : "-"}</TableCell>
                     <TableCell>
                    {p.type === "affiliate"
                      ? <AffiliateThumb product={p} />
                      : <Avatar variant="rounded" src={p.imageUrl || undefined} alt={p.title} sx={{ width: 64, height: 64 }} />
                    }
                  </TableCell>

                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body1">{truncate(p.title)}</Typography>
                          {p.type && (
                            <Typography variant="caption" color="text.secondary">
                              {p.type === "digital" ? "Digital" : "Affiliate"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {p.link ? (
                          <Tooltip title={p.link}>
                            <a href={p.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", wordBreak: "break-all" }}>
                              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                {truncate(p.link)}
                              </Typography>
                            </a>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => openEditDialog(p)} size="small"><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDelete(p._id)} size="small" color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* Dialog for Add / Edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 1 }}>
            <Tab label="Affiliate Link" {...a11yProps(0)} />
            <Tab label="Digital Product" {...a11yProps(1)} />
          </Tabs>
          <Divider />

          {/* Affiliate Link Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {renderCategoryAutocomplete(affCategory, setAffCategory)}
              <TextField label="Product Title" fullWidth value={affTitle} onChange={(e) => setAffTitle(e.target.value)} />
              <TextField label="Product URL (https://...)" fullWidth value={affUrl} onChange={(e) => setAffUrl(e.target.value)} />

              <Stack direction="row" spacing={2} alignItems="center">
                {metaLoading && <CircularProgress size={22} />}
                {(affThumb || metaLoading) && (
                  <Avatar variant="rounded" src={affThumb || undefined} alt="preview" sx={{ width: 80, height: 80 }} />
                )}
                {!affThumb && !metaLoading && (
                  <Typography variant="caption" color="text.secondary">
                    Paste a product URL to auto-load the thumbnail.
                  </Typography>
                )}
              </Stack>
            </Stack>
          </TabPanel>

          {/* Digital Product Tab */}
          <TabPanel value={activeTab} index={1}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {renderCategoryAutocomplete(digCategory, setDigCategory)}
              <TextField label="Product Name" fullWidth value={digName} onChange={(e) => setDigName(e.target.value)} />
              <TextField label="Description" fullWidth multiline minRows={3} value={digDesc} onChange={(e) => setDigDesc(e.target.value)} />

              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload Image
                  <input hidden accept="image/*" type="file" onChange={handleDigFileChange} />
                </Button>
                {digPreview && <Avatar variant="rounded" src={digPreview} alt="preview" sx={{ width: 80, height: 80 }} />}
              </Stack>

              <TextField label="Price" type="number" inputProps={{ step: "0.01", min: 0 }} value={digPrice} onChange={(e) => setDigPrice(e.target.value)} />
            </Stack>
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


