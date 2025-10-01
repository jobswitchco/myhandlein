// components/BlocksAnalytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Grid, MenuItem, Select, InputLabel, FormControl,
  Typography, Stack, ButtonGroup, Button
} from "@mui/material";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, Cell
} from "recharts";

axios.defaults.withCredentials = true;

const MetricCard = ({ label, value }) => (
  <Card sx={{ borderRadius: 3 }}>
    <CardContent>
      <Typography variant="overline" sx={{ opacity: 0.7 }}>{label}</Typography>
      <Typography variant="h5" fontWeight={700}>{(value ?? 0).toLocaleString()}</Typography>
    </CardContent>
  </Card>
);

// helper: get [start, end) ISO strings for local (IST) days
const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

// Build ranges in local time (IST). end is exclusive.
const makeRange = (key) => {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of local today
  const startOfToday = local; // 00:00 local
  const startOfTomorrow = new Date(local);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  if (key === "today") {
    return { startDate: toISO(startOfToday), endDate: toISO(startOfTomorrow) };
  }
  if (key === "7") {
    const start = new Date(startOfTomorrow);
    start.setDate(start.getDate() - 7);
    return { startDate: toISO(start), endDate: toISO(startOfTomorrow) };
  }
  if (key === "28") {
    const start = new Date(startOfTomorrow);
    start.setDate(start.getDate() - 28);
    return { startDate: toISO(start), endDate: toISO(startOfTomorrow) };
  }
  // default fallback
  return { startDate: toISO(startOfToday), endDate: toISO(startOfTomorrow) };
};

const COLORS = [
  "#6366F1", "#F43F5E", "#10B981", "#F59E0B", "#3B82F6",
  "#EC4899", "#22D3EE", "#84CC16", "#A855F7", "#FB7185"
];

export default function BlocksAnalytics() {
  const [options, setOptions] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(""); // default: empty, we’ll set to first block
  const [rangeKey, setRangeKey] = useState("7"); // "today" | "7" | "28"
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    perBlock: [],
    totals: { clicks: 0, visitors: 0 },
    topCities: [],
    topStates: [],
  });

  const apiBase = "/api/usersOn";

  // Load dropdown options (ordered) and default to first block
  useEffect(() => {
    (async () => {
      const res = await axios.get(apiBase + "/blocks/options", { withCredentials: true });
      const list = res.data.blocks || [];
      setOptions(list);
      if (list.length > 0) {
        setSelectedBlockId(list[0]._id); // default to first by order
      }
    })();
  }, []);

  const fetchAnalytics = async (blockId, key) => {
    setLoading(true);
    try {
      const { startDate, endDate } = makeRange(key);
      const body = {
        blockId: blockId || undefined,
        startDate,
        endDate,
      };
      const res = await axios.post(apiBase + "/analytics/blocks", body, { withCredentials: true });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever block or range changes
  useEffect(() => {
    if (!selectedBlockId) return;
    fetchAnalytics(selectedBlockId, rangeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId, rangeKey]);

  // If you still want the order-wise mini table when "All" is chosen, keep this.
  const perBlockOrdered = useMemo(
    () => (data.perBlock || []).slice().sort((a, b) => a.order - b.order),
    [data.perBlock]
  );

  return (
    <Stack spacing={3}>
      {/* Top controls row */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="block-select-label">Select Block</InputLabel>
            <Select
              labelId="block-select-label"
              label="Select Block"
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
            >
              {/* If you want "All" back, uncomment below:
              <MenuItem value="ALL">All Blocks (ordered)</MenuItem>
              */}
              {options.map((b) => (
                <MenuItem key={b._id} value={b._id}>
                  #{b.order} — {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Quick ranges on the RIGHT */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={() => setRangeKey("today")}
                variant={rangeKey === "today" ? "contained" : "outlined"}
              >
                Today
              </Button>
              <Button
                onClick={() => setRangeKey("7")}
                variant={rangeKey === "7" ? "contained" : "outlined"}
              >
                Last 7 days
              </Button>
              <Button
                onClick={() => setRangeKey("28")}
                variant={rangeKey === "28" ? "contained" : "outlined"}
              >
                Last 28 days
              </Button>
            </ButtonGroup>
          </Box>
        </Grid>
      </Grid>

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <MetricCard label="Visitors" value={data?.totals?.visitors || 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard label="Views" value={data?.totals?.clicks || 0} />
        </Grid>
      </Grid>

      {/* OPTIONAL: show per-block summary if you later bring back "All" view */}
      {perBlockOrdered?.length > 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Blocks (order-wise)
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>Name</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>Views</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>Visitors</Typography>
              {perBlockOrdered.map((b) => (
                <React.Fragment key={b._id}>
                  <Typography>#{b.order} — {b.name}</Typography>
                  <Typography align="right">{b.clicks}</Typography>
                  <Typography align="right">{b.visitors}</Typography>
                </React.Fragment>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Top Cities */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Top 10 Cities by Views
          </Typography>
          <Box sx={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart
                data={[...(data.topCities || [])]}
                layout="vertical"
                margin={{ top: 16, right: 24, left: 24, bottom: 8 }}
              >
                <CartesianGrid horizontal />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="count">
                  <LabelList dataKey="count" position="right" />
                  {(data.topCities || []).map((_, idx) => (
                    <Cell key={`city-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Top States */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Top 10 States/Regions by Views
          </Typography>
          <Box sx={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart
                data={[...(data.topStates || [])]}
                layout="vertical"
                margin={{ top: 16, right: 24, left: 24, bottom: 8 }}
              >
                <CartesianGrid horizontal />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={160} />
                <Tooltip />
                <Bar dataKey="count">
                  <LabelList dataKey="count" position="right" />
                  {(data.topStates || []).map((_, idx) => (
                    <Cell key={`state-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
