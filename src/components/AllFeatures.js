import { Box, Grid, Typography } from "@mui/material";
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import NextPlanOutlinedIcon from '@mui/icons-material/NextPlanOutlined';
import EqualizerOutlinedIcon from '@mui/icons-material/EqualizerOutlined';
import PolylineOutlinedIcon from '@mui/icons-material/PolylineOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined';

const features = [
  {
    title: "Post Auto DM",
    description:
      "Automatically reply to Instagram Post comments with a DM.",
    icon: <DynamicFeedOutlinedIcon />,
    gradient: "linear-gradient(135deg, #F472B6, #FB7185)",
  },
  {
    title: "Reels AutoDM",
    description:
      "Automatically reply to Instagram Reel comments with a DM.",
    icon: <MovieCreationOutlinedIcon />,
    gradient: "linear-gradient(135deg, #A78BFA, #F472B6)",
  },
  {
    title: "Story AutoDM",
    description:
      "Automatically respond to stories replies with a DM.",
    icon: <ReplayOutlinedIcon />,
    gradient: "linear-gradient(135deg, #34D399, #6EE7B7)",
  },
  {
    title: "Next Post",
    description:
      "Plan and draft your next linked post in advance.",
    icon: <NextPlanOutlinedIcon />,
    gradient: "linear-gradient(135deg, #FBBF24, #FB923C)",
  },
   {
    title: "Click Analytics",
    description:
      "Track link click analytics on DMs sent.",
    icon: <EqualizerOutlinedIcon />,
    gradient: "linear-gradient(135deg, #FA5C5C, #FD8A6B)",
  },
  {
    title: "Flow Automation",
    description:
      "Schedule a sequence of DMs after engagement.",
    icon: <PolylineOutlinedIcon />,
    gradient: "linear-gradient(135deg, #FF0000, #FFA240)",
  },
   {
    title: "Comment Auto-Reply",
    description:
      "Automatically reply to comments with a comment once a DM has been sent.",
    icon: <ForumOutlinedIcon />,
    gradient: "linear-gradient(135deg, #B8DB80, #26CCC2)",
  },

  {
    title: "White Label",
    description:
      "Remove MyHandle branding from DMs sent.",
    icon: <LabelOutlinedIcon />,
    gradient: "linear-gradient(135deg, #1B211A, #434E78)",
  },
   {
    title: "Increased DM send Limit",
    description:
      "Send up to 25,00,000 DMs per month.",
    icon: <SendOutlinedIcon />,
    gradient: "linear-gradient(135deg, #7132CA, #C47BE4)",
  },
   {
    title: "Inbox Automation",
    description:
      "Automatically reply to Inbox messages as per flow has been set.",
    icon: <InboxOutlinedIcon />,
    gradient: "linear-gradient(135deg, #DC0000, #FF3838)",
  },
   {
    title: "Lead Detection",
    description:
      "Automatically categorize the DMs and find leads faster.",
    icon: <EmojiObjectsOutlinedIcon />,
    gradient: "linear-gradient(135deg, #F875AA, #BF124D)",
  },
   {
    title: "DM Queue",
    description:
      "Never miss sending a DM with our smart queue system.",
    icon: <AirOutlinedIcon />,
    gradient: "linear-gradient(135deg, #FFC4C4, #FFD3D5)",
  },

   {
    title: "Smart Reply Mode",
    description:
      "When your Reels are blowing up, our smart reply mode handles it, no need to slowdown.",
    icon: <AutoAwesomeOutlinedIcon />,
    gradient: "linear-gradient(135deg, #92487A, #E49BA6)",
  },

   {
    title: "File Uploads/Downloads",
    description:
      "You can upload as many as PDFs and users can download unlimited.",
    icon: <UploadFileOutlinedIcon />,
    gradient: "linear-gradient(135deg, #0046FF, #001BB7)",
  },

   {
    title: "Bio Page Analytics",
    description:
      "Advanced Link-in-bio analytics to understand how it works.",
    icon: <FileOpenOutlinedIcon />,
    gradient: "linear-gradient(135deg, #9E1C60, #811844)",
  },
  {
    title: "Geographical Information",
    description:
      "Get bio page user's geographical information to understand your user base.",
    icon: <PublicOutlinedIcon />,
    gradient: "linear-gradient(135deg, #F25912, #561530)",
  },

  {
    title: "Newsletter",
    description:
      "Collect users email address for your Newsletter.",
    icon: <ListAltOutlinedIcon />,
    gradient: "linear-gradient(135deg, #D97D55, #134686)",
  },
  {
    title: "1:1 Booking",
    description:
      "Users can book your 1:1 Consultations for Free.",
    icon: <PeopleAltOutlinedIcon />,
    gradient: "linear-gradient(135deg, #67C090, #DDF4E7)",
  },
];

export default function AllFeatures() {
  return (
    <Box
      sx={{
        background:
          "linear-gradient(180deg, #020617 0%, #020617 40%, #0F172A 100%)",
        py: { xs: 8, sm: 10, md: 14 },
        px: { xs: 2, sm: 3, md: 6 },
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* SECTION HEADER */}
      <Box textAlign="center" maxWidth={780} mx="auto" mb={{ xs: 7, md: 10 }}>
        <Typography
          sx={{
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            letterSpacing: "0.22em",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "#A5B4FC",
            fontFamily: "Inter",
          }}
        >
          Powerful Featues
        </Typography>

        <Typography
          sx={{
            mt: 2,
            fontSize: {
              xs: "clamp(1.9rem, 7vw, 2.4rem)",
              sm: "clamp(2.2rem, 6vw, 2.8rem)",
              md: "clamp(2.6rem, 4.5vw, 3.2rem)",
            },
            fontWeight: { xs: 700, sm: 800, md: 900 },
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            fontFamily: "Inter",
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #A5B4FC 45%, #6EE7B7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Everything you need to turn engagement into action
        </Typography>

        <Typography
          sx={{
            mt: 3,
            fontSize: {
              xs: "0.95rem",
              sm: "1.05rem",
              md: "1.15rem",
            },
            fontWeight: { xs: 400, md: 500 },
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.78)",
            fontFamily: "Inter",
          }}
        >
          Automate conversations, respond instantly, and stay consistent —
          without sounding robotic or losing control.
        </Typography>
      </Box>

      {/* FEATURE GRID */}
      <Grid
        container
        spacing={{ xs: 3, md: 4 }}
        maxWidth={1200}
        mx="auto"
      >
        {features.map((feature, index) => (
          <Grid size={{ xs: 12, md: 6, lg: 4}} key={index}>
            <Box
              sx={{
                position: "relative",
                height: "100%",
                borderRadius: 4,
                p: { xs: 3, sm: 3.5, md: 4 },
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                overflow: "hidden",
                transition: "all 0.35s ease",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
                },
              }}
            >
              {/* GLOW */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: feature.gradient,
                  opacity: 0.14,
                  filter: "blur(70px)",
                }}
              />

              {/* ICON */}
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: feature.gradient,
                  color: "#FFFFFF",
                  mb: 3,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                }}
              >
                {feature.icon}
              </Box>

              {/* TITLE */}
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.1rem",
                    sm: "1.1rem",
                    md: "1.3rem",
                  },
                  fontWeight: { xs: 600, sm: 700, md: 800 },
                  mb: 1.2,
                  color: "#FFFFFF",
                  fontFamily: "Inter",
                }}
              >
                {feature.title}
              </Typography>

              {/* DESCRIPTION */}
              <Typography
                sx={{
                  fontSize: {
                    xs: "0.92rem",
                    sm: "0.95rem",
                    md: "1rem",
                  },
                  fontWeight: { xs: 400, md: 500 },
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.78)",
                  fontFamily: "Inter",
                }}
              >
                {feature.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
