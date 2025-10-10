// components/DashboardAnalytics.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";
import { useNavigate } from "react-router-dom";


export default function DashboardAnalytics({
  apiBase = "/api",
  barColors = { city: "#4F46E5", region: "#10B981" },
  fontSize = 12,
  showLegend = false,
  tooltipFormatter,
  cardSx,
  showBarLabels = true,
}) {
  const [duration, setDuration] = useState("28d");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: {
      totalViews: 0,
      totalClicks: 0,
      totalSubscribers: 0,
      totalDMs: 0,
    },
    cities: [],  // [{ city, visitors }]
    regions: [], // [{ region, visitors }]
  });

  const { startDate, endDate } = useMemo(() => {
    const end = dayjs().endOf("day");
    let start;
    if (duration === "today") start = dayjs().startOf("day");
    else if (duration === "7d") start = end.subtract(6, "day").startOf("day");
    else start = end.subtract(27, "day").startOf("day"); // default 28d
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [duration]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.post(
          `${apiBase}/usersOn/dashboard-analytics`,
          { startDate, endDate },
          { withCredentials: true }
        );
        if (!ignore) setData(res.data || {});
      } catch (e) {
        console.error(e);
        if (!ignore)
          setError(e?.response?.data?.message || "Failed to load analytics");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [apiBase, startDate, endDate]);

  const numberFmt = (v) => Intl.NumberFormat().format(v ?? 0);
  const defaultTooltipFormatter = (value, name) => [numberFmt(value), name];

  // transform for charts
  const cityData = useMemo(
    () =>
      (data?.cities || []).map((c) => ({
        name: c.city || "Unknown",
        Visitors: c.visitors || 0,
      })),
    [data]
  );

  const regionData = useMemo(
    () =>
      (data?.regions || []).map((r) => ({
        name: r.region || "Unknown",
        Visitors: r.visitors || 0,
      })),
    [data]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Dashboard Analytics</Typography>
        <ToggleButtonGroup
          value={duration}
          exclusive
          onChange={(_, val) => val && setDuration(val)}
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="7d">Last 7 days</ToggleButton>
          <ToggleButton value="28d">Last 28 days</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/page/analytics')}>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>Total Views (Visitors)</Typography>
              <Typography variant="h4" fontWeight={800}>
                {loading ? "—" : numberFmt(data?.summary?.totalViews)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Bio link visitors</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 3, ...cardSx, cursor: 'pointer'}} onClick={()=> navigate('/professional/my/block/analytics')}>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>Total Link/Block Clicks</Typography>
              <Typography variant="h4" fontWeight={800}>
                {loading ? "—" : numberFmt(data?.summary?.totalClicks)}
              </Typography>
              <Typography variant="body2" color="text.secondary">All block clicks</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 3, ...cardSx, cursor: 'pointer' }} onClick={()=> navigate('/professional/newsletter/emails')}>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>Total Subscribers</Typography>
              <Typography variant="h4" fontWeight={800}>
                {loading ? "—" : numberFmt(data?.summary?.totalSubscribers)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Newsletter emails</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/inbox')}>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>Total DM's</Typography>
              <Typography variant="h4" fontWeight={800}>
                {loading ? "—" : numberFmt(data?.summary?.totalDMs)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Messages received</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ py: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !error && (
        <>
          {/* Top 10 Cities */}
          <Card elevation={3} sx={{ borderRadius: 3, height: 460, mb: 2, ...cardSx }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Top 10 Cities by Visitors
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={cityData}
                  layout="vertical"
                  margin={{ top: 8, right: 32, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize }} domain={[0, "dataMax"]} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize }} />
                  <Tooltip formatter={tooltipFormatter || defaultTooltipFormatter} />
                  {showLegend && <Legend />}
                  <Bar dataKey="Visitors" fill={barColors.city} radius={[4, 4, 4, 4]}>
                    {showBarLabels && (
                      <LabelList dataKey="Visitors" position="right" formatter={numberFmt} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 10 Regions */}
          <Card elevation={3} sx={{ borderRadius: 3, height: 460, ...cardSx }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Top 10 States/Regions by Visitors
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={regionData} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize }} />
                  <Tooltip formatter={tooltipFormatter || defaultTooltipFormatter} />
                  {showLegend && <Legend />}
                  <Bar dataKey="Visitors" fill={barColors.region} radius={[4, 4, 0, 0]}>
                    {showBarLabels && (
                      <LabelList dataKey="Visitors" position="top" formatter={numberFmt} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && error && (
        <Card sx={{ mt: 2, borderRadius: 3 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
