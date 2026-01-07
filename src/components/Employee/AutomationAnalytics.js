// InstagramAnalytics.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  MenuItem,
  Select,
  TextField,
  Button,
  Divider,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  DateRange,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  Send,
  Reply,
  TouchApp,
  People,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useNavigate } from "react-router-dom";


const RANGE_OPTIONS = {
  7: "Last 7 Days",
  28: "Last 28 Days",
  90: "Last 90 Days",
  custom: "Custom Range",
};

const GRADIENT_COLORS = [
  { start: "#4D2B8C", end: "#764ba2" },
  { start: "#9E2A3A", end: "#f5576c" },
  { start: "#4988C4", end: "#00F7FF" },
  { start: "#0D4715", end: "#38f9d7" },
  { start: "#fa709a", end: "#fee140" },
];

export default function AutomationAnalytics() {
  const [range, setRange] = useState(7);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [automationLoading, setAutomationLoading] = useState(false);
  const navigate = useNavigate();
  

  const api = useMemo(() =>
    axios.create({
      baseURL: "/api/usersOn",
      withCredentials: true,
    }), []
  );

  const fetchAnalytics = async (payload) => {
    try {
      setLoading(true);
      const res = await api.post("/automation-analytics", payload);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };



  const fetchAutomationPerformance = async (payload) => {
    try {
      setAutomationLoading(true);
      const res = await api.post("/automation-performance", payload);
      setAutomationData(res.data);
    } catch (error) {
      console.error("Failed to fetch automation performance:", error);
    } finally {
      setAutomationLoading(false);
    }
  };

   function formatNumber(input, { digits = 1 } = {}) {
    if (input == null || isNaN(input)) return "0";
    const sign = input < 0 ? "-" : "";
    let n = Math.abs(Number(input));

    const units = ["", "k", "m", "b", "t"];
    let u = 0;
    while (n >= 1000 && u < units.length - 1) {
      n /= 1000;
      u++;
    }
    const useDecimals = u > 0 && n < 100;
    const fixed = useDecimals ? n.toFixed(digits) : Math.round(n).toString();
    const trimmed = fixed.replace(/\.0+$|(\.\d*[1-9])0+$/g, "$1");
    return sign + trimmed + units[u];
  }

      const fetchIgConnectionStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/instagram-status");
      if(!res.data.instagramConnected){
        navigate('/professional/automations');

      }
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIgConnectionStatus();
  }, []);

   useEffect(() => {
    if (range === "custom") return;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (range - 1));
    const payload = { startDate: start, endDate: end };
    
    // Fetch both in parallel
    fetchAnalytics(payload);
    fetchAutomationPerformance(payload);
  }, [range]);

  const handleCustomRange = () => {
    if (startDate && endDate) {
      const payload = { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate) 
      };
      fetchAnalytics(payload);
      fetchAutomationPerformance(payload);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.95)", boxShadow: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            {new Date(payload[0].payload.date).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#FF0087'}}>
            DMs Sent: {payload[0].value}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography sx={{ 
            fontFamily: 'Inter',
            fontSize: '28px',
            fontWeight: 700,
            background: "linear-gradient(135deg, #001BB7 0%, #667eea 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Analytics Dashboard
          </Typography>
          <Typography sx={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 400,}} color="text.secondary">
            Automation performance & growth insights
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DateRange sx={{ color: "#667eea" }} />
          <Select 
            size="small" 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {Object.entries(RANGE_OPTIONS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </Select>

          {range === "custom" && (
            <>
              <TextField
                type="date"
                size="small"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                type="date"
                size="small"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button 
                variant="contained" 
                onClick={handleCustomRange}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #66348d 100%)",
                  }
                }}
              >
                Apply
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Metrics Cards */}
      {data && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        
          <MetricCard 
            title="Replies Sent" 
            value={data.summary.totalRepliesSent} 
            delta={data.comparison.totalRepliesSent}
            icon={<Reply />}
            gradient={GRADIENT_COLORS[0]}
          />

            <MetricCard 
            title="DMs Sent" 
            value={formatNumber(data.summary.totalDmsSent)} 
            delta={data.comparison.totalDmsSent}
            icon={<Send />}
            gradient={GRADIENT_COLORS[1]}
          />

          <MetricCard 
            title="Clicks" 
            value={data.summary.totalClicks} 
            delta={data.comparison.totalClicks}
            icon={<TouchApp />}
            gradient={GRADIENT_COLORS[3]}
          />

          
          <MetricCard 
            title="CTR" 
            value={`${data.summary.ctr}%`} 
            delta={data.comparison.ctr}
            icon={<TrendingUp />}
            gradient={GRADIENT_COLORS[2]}
          />


        </Stack>
      )}

      {/* Chart */}
      <Card 
        sx={{ 
          mb: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          borderRadius: 3,
          overflow: "hidden"
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3} sx={{
            background: "linear-gradient(135deg, #FA5C5C 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            DMs Sent – Daily Trend
          </Typography>
          {data ? (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart 
                data={data.chartData || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorDm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD41D" stopOpacity={1} />
                    <stop offset="95%" stopColor="#F5F2F2" stopOpacity={1} />
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="dmsSent" 
                  stroke="#FF0087" 
                  strokeWidth={2}
                  fill="url(#colorDm)"
                  filter="url(#shadow)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton variant="rectangular" width="100%" height={360} />
          )}
        </CardContent>
      </Card>

      {/* Automation Performance Table */}
      <Card sx={{ 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        borderRadius: 3,
        overflow: "hidden"
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Top Automation Performance
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {automationLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={50} />
                <Typography variant="body2" color="text.secondary">
                  Loading automation performance...
                </Typography>
              </Stack>
            </Box>
          ) : automationData && automationData.automationBreakdown.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                    <TableCell sx={{ fontWeight: 700 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Post</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Caption</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Replies</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>DMs</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Clicks</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>CTR %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {automationData.automationBreakdown.map((row, i) => (
                    <TableRow 
                      key={row.automationId}
                      sx={{ 
                        "&:hover": { bgcolor: "#f8f9fa" },
                        transition: "background-color 0.2s"
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={i + 1} 
                          size="small"
                          sx={{ 
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${GRADIENT_COLORS[i % 5].start}, ${GRADIENT_COLORS[i % 5].end})`,
                            color: "#fff"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.thumbnail ? (
                          <Avatar 
                            variant="rounded" 
                            src={row.thumbnail}
                            sx={{ width: 56, height: 56, boxShadow: 2 }}
                          />
                        ) : (
                          <Chip 
                            label="AutoDM" 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {row.caption || <em style={{ color: "#999" }}>No caption</em>}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.repliesSent} 
                          size="small"
                          sx={{ bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.totalDms} 
                          size="small"
                          sx={{ bgcolor: "#f3e5f5", color: "#9c27b0", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.totalClicks} 
                          size="small"
                          sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${row.ctr}%`}
                          size="small"
                          sx={{ 
                            bgcolor: row.ctr > 50 ? "#e8f5e9" : "#fff3e0",
                            color: row.ctr > 50 ? "#2e7d32" : "#e65100",
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <Typography variant="body2" color="text.secondary">
                No automation data available for this period
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function MetricCard({ title, value, delta, icon, gradient }) {
  const positive = delta >= 0;
  
  return (
    <Card 
      sx={{ 
        flex: 1, 
        background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.16)"
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          transform: "translate(40%, -40%)",
        }
      }}
    >
      <CardContent sx={{ position: "relative", zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontFamily: 'Inter' }}>
            {title}
          </Typography>
          <Box sx={{ opacity: 0.7 }}>
            {icon}
          </Box>
        </Stack>
        
        <Typography sx={{ fontFamily: 'Inter', fontSize: '32px', fontWeight: 700}} mb={1.5}>
          {value}
        </Typography>
        
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: positive ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)",
              borderRadius: 1,
              px: 1,
              py: 0.5,
            }}
          >
            {positive ? (
              <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
            ) : (
              <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
            )}
            <Typography sx={{ fontWeight: 600, fontFamily: 'Inter', fontSize: '12px' }}>
              {Math.abs(delta).toFixed(1)}%
            </Typography>
          </Box>
         
        </Stack>
      </CardContent>
    </Card>
  );
}