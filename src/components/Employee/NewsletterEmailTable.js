// components/NewsletterEmailsTable.js
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";

// 📊 Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const API_BASE = "/api/usersOn";

// 🎨 Distinct bar colors (cycled if >10)
const BAR_COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#3B82F6", // blue
  "#A855F7", // purple
  "#14B8A6", // teal
  "#EAB308", // yellow
  "#F97316", // orange
  "#10B981", // emerald
];

export default function NewsletterEmailsTable({ blockId = null }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ totalSubscribers: 0, last7Days: 0, last28Days: 0 });
  const [page, setPage] = useState(0); // zero-based for MUI
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Chart data
  const [topCities, setTopCities] = useState([]);   // [{ name, count }]
  const [topRegions, setTopRegions] = useState([]); // [{ name, count }]

  const pageForApi = useMemo(() => page + 1, [page]); // API expects 1-based

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.post(
          `${API_BASE}/newsletter-list-emails`,
          { page: pageForApi, limit, blockId },
          { withCredentials: true }
        );

        if (!cancelled) {
          setRows(res.data.rows || []);
          setStats(res.data.stats || { totalSubscribers: 0, last7Days: 0, last28Days: 0 });
          setTotal(res.data.total || 0);

          // Clamp to top-10 in UI even if backend sends more
          const cities = (res.data.topCities || [])
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, 10);
          const regions = (res.data.topRegions || [])
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, 10);

          setTopCities(cities);
          setTopRegions(regions);
        }
      } catch (e) {
        console.error("Fetch emails failed:", e);
        if (!cancelled) {
          setRows([]);
          setStats({ totalSubscribers: 0, last7Days: 0, last28Days: 0 });
          setTotal(0);
          setTopCities([]);
          setTopRegions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [pageForApi, limit, blockId]);

  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4}}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Subscribers
              </Typography>
              <Typography variant="h4">{stats.totalSubscribers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4}}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Last 7 days
              </Typography>
              <Typography variant="h4">{stats.last7Days}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4}}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Last 28 days
              </Typography>
              <Typography variant="h4">{stats.last28Days}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper elevation={0} variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>Email Address</TableCell>
                <TableCell>Subscribed Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Loading...</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary">
                      No subscribers found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const serial = page * limit + idx + 1;
                  const dateStr = r.subscribed_at
                    ? new Date(r.subscribed_at).toLocaleString()
                    : "-";
                  return (
                    <TableRow key={`${r.email}-${serial}`}>
                      <TableCell>{serial}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{dateStr}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50]}
          count={total}
          rowsPerPage={limit}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Charts Section */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />

        {/* Top 10 Cities - Horizontal bars (full width) */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Top 10 Cities
            </Typography>
            <Box sx={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <BarChart
                  data={topCities}
                  layout="vertical" // horizontal bars
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {topCities.map((_, index) => (
                      <Cell
                        key={`city-cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Top 10 States/Regions - Vertical bars (full width) */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Top 10 States
            </Typography>
            <Box sx={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart
                  data={topRegions}
                  margin={{ top: 8, right: 16, left: 8, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={50}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {topRegions.map((_, index) => (
                      <Cell
                        key={`region-cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
