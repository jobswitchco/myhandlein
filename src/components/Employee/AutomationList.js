import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DEFAULT_THUMB =
  "https://scontent.cdninstagram.com/v/t51.71878-15/528294137_2435563896900811_8510108908453796097_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ccb=1-7&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiRkVFRC5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=y-SfwckxgvMQ7kNvwGlV92m&_nc_oc=AdnWXaJvWSyyOZ-9sP7Yx3cs0CfwqGZzus0I6u6yjMrlEVazb7PH9TM9CMb0F-mz7WiqyMZh9KfID7_gbEqLkLdq&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=AEQ6tj4EAAAA&_nc_gid=hl7Q0_qCJIeZbyfXu7S2gg&oh=00_Afd-Pm3x0KeJgqDGQMDmQPBccSIS13pjwKII1rM7-Xn5Sw&oe=68F765E1";

function EmptyState({ onCreate }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2.5,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.default",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "action.hover",
        }}
      >
        <InfoOutlinedIcon fontSize="large" />
      </Box>

      <Stack spacing={0.5}>
        <Typography
          sx={{ fontFamily: "Inter", fontSize: 20, fontWeight: 600, letterSpacing: 0.2 }}
        >
          Create your first automation
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: 520, mx: "auto" }}
        >
          You don’t have any automations yet. Set up your first one to auto-DM,
          track status, and manage everything from one place.
        </Typography>
      </Stack>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{ textTransform: "none", borderRadius: 2, px: 2.5 }}
      >
        New Automation
      </Button>
    </Box>
  );
}

export default function AutomationList() {
  const navigate = useNavigate();
  const baseUrl = "/api/usersOn";

  // table state
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // server pagination state
  const [page, setPage] = useState(0); // 0-indexed for DataGrid
  const [pageSize, setPageSize] = useState(10);

  const fetchPage = async (pageArg = page, limitArg = pageSize) => {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(
        `${baseUrl}/automations?page=${pageArg + 1}&limit=${limitArg}`,
        { withCredentials: true }
      );
      const {
        items = [],
        total = 0,
        page: serverPage = 1,
        limit = limitArg,
      } = res.data || {};

      const startIndex = (serverPage - 1) * limit;
      const withSno = items.map((it, idx) => ({
        id: it._id || it.postId || `${it.thumbnail}-${idx}`,
        ...it,
        sno: startIndex + idx + 1,
      }));

      setRows(withSno);
      setRowCount(total);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const columns = useMemo(
    () => [
      {
        field: "sno",
        headerName: "S.No",
        width: 90,
        sortable: false,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "thumbnail",
        headerName: "Thumbnail",
        width: 110,
        sortable: false,
        renderCell: (params) => (
          <Avatar
            variant="rounded"
            src={params.value }
            alt={params.row.caption || "thumbnail"}
            sx={{ width: 72, height: 72 }}
          />
        ),
      },
      {
        field: "caption",
        headerName: "Caption",
        flex: 1,
        minWidth: 250,
        sortable: false,
        renderCell: ({ value }) => {
          const full = (value || "").trim();
          const text = full.length > 100 ? `${full.slice(0, 100)}…` : full;

          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%", width: "100%" }}>
              <Typography variant="body2" noWrap title={full} sx={{ maxWidth: "100%" }}>
                {text || "—"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (params) => (
          <Chip
            size="small"
            label={String(params.value || "").toUpperCase()}
            color={params.value === "active" ? "success" : "default"}
            variant="outlined"
          />
        ),
      },
      {
        field: "details",
        headerName: "Details",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const id = params.row?.postId;
          const handleClick = (e) => {
            e.stopPropagation();
            if (id) navigate(`/professional/automation/details/${encodeURIComponent(id)}`);
          };
          return (
            <Button
              size="small"
              variant="outlined"
              onClick={handleClick}
              disabled={!id}
              sx={{ textTransform: "none", borderRadius: 2, px: 1.5 }}
            >
              Details
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  if (err) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{err}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography
          sx={{ fontFamily: "Inter", fontSize: "20px", fontWeight: 600, letterSpacing: 0.2 }}
        >
          Automation Section
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => navigate("/professional/fetch_media")}
          sx={{ fontFamily: "Inter", fontSize: "15px", fontWeight: 500, textTransform: "none" }}
        >
          New Automation
        </Button>
      </Stack>

      <div style={{ width: "100%" }}>
        {loading && rows.length === 0 ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : !loading && rowCount === 0 ? (
          <EmptyState onCreate={() => navigate("/professional/fetch_media")} />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            paginationMode="server"
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            rowCount={rowCount}
            rowsPerPageOptions={[5, 10, 25, 50]}
            autoHeight
            loading={loading}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": { fontWeight: 700 },
              "& .MuiDataGrid-cell": { alignItems: "center" },
            }}
          />
        )}
      </div>
    </Box>
  );
}
