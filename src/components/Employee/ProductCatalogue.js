// Store.js
import React, { useEffect, useState } from "react";
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
  FormControlLabel, // <-- added
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import format from "date-fns/format";

axios.defaults.withCredentials = true; // apply globally for this file

const API_BASE = "/api/usersOn";

export default function Store() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0); // zero-based for TablePagination
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

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const MAX_LINK_LEN = 30;
  function truncate(str, max = MAX_LINK_LEN) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "..." : str;
  }

  useEffect(() => {
    fetchProducts(page + 1, limit); // backend expects 1-based page
    fetchStoreStatus(); // fetch initial store enabled status
    // eslint-disable-next-line
  }, [page, limit]);

  async function fetchStoreStatus() {
    try {
      // If you already have an endpoint to get status, adjust path accordingly.
      const res = await axios.get(`${API_BASE}/store-status`, { withCredentials: true });
      // Expect { enabled: true/false }
      if (res?.data?.enabled !== undefined) setStoreEnabled(Boolean(res.data.enabled));
    } catch (err) {
      // If /store-status is not available, silently ignore. You can remove this catch or show a toast.
      console.warn("Could not fetch store status (expected GET /store-status).", err);
    }
  }

  async function toggleStoreEnabled(nextValue) {
    // optimistic UI
    const previous = storeEnabled;
    setStoreEnabled(nextValue);
    setToggling(true);

    try {
      // backend router expected: POST /enable-store
      // sending { enabled: true/false } in body
      await axios.post(
        `${API_BASE}/enable-store`,
        { enabled: nextValue },
        { withCredentials: true }
      );
      // success — nothing else required, state already updated
    } catch (err) {
      console.error("Error toggling store enable:", err);
      // revert optimistic update
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
        withCredentials: true,
      });
      // Expect { data: [...], total: N }
      setProducts(res.data.data || []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error("Fetch user products error:", err);
      // optionally show toast
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setIsEditing(false);
    setEditingProductId(null);
    setTitle("");
    setLink("");
    setFile(null);
    setPreviewUrl(null);
    setDialogOpen(true);
  }

  function openEditDialog(product) {
    setIsEditing(true);
    setEditingProductId(product._id);
    setTitle(product.title || "");
    setLink(product.link || "");
    setPreviewUrl(product.imageUrl || null);
    setFile(null); // if user wants to change image, they can
    setDialogOpen(true);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleSave() {
    if (!title || !link) {
      alert("Please add title and link.");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("link", link);
      if (file) form.append("image", file);

      if (isEditing && editingProductId) {
        // If editing, backend accepts POST /edit-product/:id or PUT
        await axios.post(`${API_BASE}/edit-product/${editingProductId}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_BASE}/upload-product`, form, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      }

      // On success, refresh current page
      await fetchProducts(page + 1, limit);
      setDialogOpen(false);
    } catch (err) {
      console.error("Save product error:", err);
      alert("Error saving product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_BASE}/delete-product/${id}`, { withCredentials: true });
      // refresh list (if last item on page deleted, backend should handle)
      fetchProducts(page + 1, limit);
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Error deleting product.");
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const rows = parseInt(event.target.value, 10);
    setLimit(rows);
    setPage(0);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Store - Products</Typography>

        {/* Right side controls: Enable Store toggle + Add Product */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* ENABLE STORE TOGGLE */}
          <FormControlLabel
            control={
              <Switch
                checked={storeEnabled}
                onChange={(e) => toggleStoreEnabled(e.target.checked)}
                disabled={toggling}
                inputProps={{ "aria-label": "Enable Store" }}
              />
            }
            label={toggling ? "Updating..." : "Enable Store"}
          />

          {/* ADD PRODUCT BUTTON */}
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
                  <TableCell>Link</TableCell> {/* new column */}
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
                    <TableRow key={p._id}>
                      <TableCell>{page * limit + idx + 1}</TableCell>
                      <TableCell>
                        {displayDate ? format(new Date(displayDate), "yyyy-MM-dd HH:mm") : "-"}
                      </TableCell>
                      <TableCell>
                        <Avatar variant="rounded" src={p.imageUrl} alt={p.title} sx={{ width: 64, height: 64 }} />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body1">{truncate(p.title)}</Typography>
                      </TableCell>

                      <TableCell>
                        {p.link ? (
                          <Tooltip title={p.link}>
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none", color: "inherit", wordBreak: "break-all" }}
                            >
                              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                {truncate(p.link)}
                              </Typography>
                            </a>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <IconButton onClick={() => openEditDialog(p)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(p._id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
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
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Product Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField
              label="Product Purchase Link (https://...)"
              fullWidth
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                Upload Image
                <input hidden accept="image/*" type="file" onChange={handleFileChange} />
              </Button>

              {previewUrl && <Avatar variant="rounded" src={previewUrl} alt="preview" sx={{ width: 80, height: 80 }} />}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              If you don't upload an image while editing, existing image will remain.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
