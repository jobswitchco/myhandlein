// components/DashboardAnalytics.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  FormControl,
InputLabel,
Select,
MenuItem,
useTheme,
useMediaQuery,
Stack
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
import EmojiPeopleOutlinedIcon from '@mui/icons-material/EmojiPeopleOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';


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

  const theme = useTheme();
const isXs = useMediaQuery(theme.breakpoints.down("sm")); // <600px
const isSm = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600–900px

// Y-axis label area scales with screen size
const yAxisWidth = isXs ? 80 : isSm ? 120 : 160;


  const DURATION_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "28d", label: "Last 28 days" },
];


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
    <Box sx={{ p: { xs: 0, md: 1 }, maxWidth: 1400, mx: "auto", my: 2 }}>
    
    <Grid container alignItems="center" sx={{ mb: 2 }}>
  <Grid size={{ xs: 6, sm: 6, md: 6 }}>
    <Typography
      sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: { xs: 16, sm: 16, md: 22 } }}
    >
      Dashboard Analytics
    </Typography>
  </Grid>

  <Grid
    size={{ xs: 6, sm: 6, md: 6 }}
    sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, mt: { xs: 1, md: 0 } }}
  >
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="duration-label" sx={{ fontFamily: "Inter" }}>Range</InputLabel>
      <Select
        labelId="duration-label"
        id="duration-select"
        value={duration}
        label="Range"
        onChange={(e) => setDuration(e.target.value)}
        disabled={loading}
        sx={{ fontFamily: "Inter", fontSize: { xs: 14, sm: 14, md: 12 } }}
      >
        {DURATION_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: "Inter" }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>
</Grid>


      <Grid container spacing={2} sx={{ mb: 2}}>

        <Grid size={{ xs: 6, sm: 6, md : 3}}>
          <Card elevation={3} sx={{background : '#16C47F', borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/page/analytics')}>
            <CardContent>
              <Stack sx={{ display : 'flex', flexDirection : 'row', justifyContent : 'space-between', mb: 2}}>
                <EmojiPeopleOutlinedIcon sx={{ color: '#D9EAFD'}}/>
                <ShowChartOutlinedIcon sx={{ color: '#D9EAFD'}}/>
              </Stack>
              <Typography sx={{fontFamily: 'Inter', fontSize : { xs: 14, md: 14}, mb: 0.5, color: '#FFFFFF', pl: 1 }}>Bio Page Visitors</Typography>
              <Typography sx={{ fontFamily : 'Inter', fontSize : {xs : 18, md: 32}, fontWeight : 700, color: '#FFFFFF', pl: 1}}>
                {loading ? "—" : numberFmt(data?.summary?.totalViews)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

         <Grid size={{ xs: 6, sm: 6, md : 3}}>
          <Card elevation={3} sx={{background : '#1055C9', borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/page/analytics')}>
            <CardContent>
              <Stack sx={{ display : 'flex', flexDirection : 'row', justifyContent : 'space-between', mb: 2}}>
                <ViewAgendaOutlinedIcon sx={{ color: '#D9EAFD'}}/>
                <DoneAllOutlinedIcon sx={{ color: '#D9EAFD'}}/>
              </Stack>
              <Typography sx={{fontFamily: 'Inter', fontSize : { xs: 14, md: 14}, mb: 0.5, color: '#FFFFFF', pl: 1 }}>Block Clicks</Typography>
              <Typography sx={{ fontFamily : 'Inter', fontSize : {xs : 18, md: 32}, fontWeight : 700, color: '#FFFFFF', pl: 1}}>
                {loading ? "—" : numberFmt(data?.summary?.totalClicks)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

           <Grid size={{ xs: 6, sm: 6, md : 3}}>
          <Card elevation={3} sx={{background : '#FE7743', borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/page/analytics')}>
            <CardContent>
              <Stack sx={{ display : 'flex', flexDirection : 'row', justifyContent : 'space-between', mb: 2}}>
                <FeedOutlinedIcon sx={{ color: '#D9EAFD'}}/>
                <SupervisorAccountOutlinedIcon sx={{ color: '#D9EAFD'}}/>
              </Stack>
              <Typography sx={{fontFamily: 'Inter', fontSize : { xs: 14, md: 14}, mb: 0.5, color: '#FFFFFF', pl: 1 }}>Newsletter Subs</Typography>
              <Typography sx={{ fontFamily : 'Inter', fontSize : {xs : 18, md: 32}, fontWeight : 700, color: '#FFFFFF', pl: 1}}>
                {loading ? "—" : numberFmt(data?.summary?.totalSubscribers)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>


  <Grid size={{ xs: 6, sm: 6, md : 3}}>
          <Card elevation={3} sx={{background : '#640D5F', borderRadius: 3, ...cardSx, cursor : 'pointer' }} onClick={()=> navigate('/professional/my/page/analytics')}>
            <CardContent>
              <Stack sx={{ display : 'flex', flexDirection : 'row', justifyContent : 'space-between', mb: 2}}>
                <MessageOutlinedIcon sx={{ color: '#D9EAFD'}}/>
                <ReplyOutlinedIcon sx={{ color: '#D9EAFD'}}/>
              </Stack>
              <Typography sx={{fontFamily: 'Inter', fontSize : { xs: 14, md: 14}, mb: 0.5, color: '#FFFFFF', pl: 1 }}>Direct Messages</Typography>
              <Typography sx={{ fontFamily : 'Inter', fontSize : {xs : 18, md: 32}, fontWeight : 700, color: '#FFFFFF', pl: 1}}>
                {loading ? "—" : numberFmt(data?.summary?.totalDMs)}
              </Typography>
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
            <CardContent sx={{ height: "100%", width: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Top 10 Cities by Visitors
              </Typography>
              <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={360}>
  <BarChart
    data={cityData}
    layout="vertical"
    margin={{
      top: 8,
      right: 16,
      left: isXs ? 0 : 8, // reduce left margin on small screens
      bottom: 8,
    }}
    barCategoryGap={isXs ? 10 : 20}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis type="number" tick={{ fontSize }} domain={[0, "dataMax"]} tickMargin={4} />
    <YAxis
      dataKey="name"
      type="category"
      width={yAxisWidth}             // 👈 responsive
      tick={{ fontSize }}
      tickMargin={4}
      // optional: truncate very long labels on small screens
      tickFormatter={(v) => (isXs && String(v).length > 12 ? `${String(v).slice(0, 12)}…` : v)}
    />
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
               <BarChart
                  data={regionData}
                  margin={{ top: 8, right: 16, left: isXs ? 0 : 8, bottom: 32 }}
                  barCategoryGap={isXs ? 8 : 16}
                >
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
