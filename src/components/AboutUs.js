import { Box, Typography, useMediaQuery, Grid, Card, CardContent, Avatar } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import CodeIcon from '@mui/icons-material/Code';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { Helmet } from "react-helmet";

const AboutUs = () => {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <Helmet>
        <title>About Us | FounderPage</title>
        <meta
          name="description"
          content="FounderPage helps early-stage founders validate ideas, keep visibility after launch, and turn community feedback into clear product direction."
        />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.founderpage.com/about-us" />

        {/* Open Graph */}
        <meta property="og:title" content="About Us | FounderPage" />
        <meta
          property="og:description"
          content="FounderPage is a lightweight growth platform for founders — community-backed validation, cross-platform publishing, and market signals in one workflow."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.founderpage.com/about-us" />
        <meta
          property="og:image"
          content="https://storage.googleapis.com/founderpage-assets/logo_512.png"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Us | FounderPage" />
        <meta
          name="twitter:description"
          content="Learn how FounderPage helps founders validate features, stay visible across Reddit/LinkedIn/Twitter, and surface the feedback that matters."
        />
        <meta
          name="twitter:image"
          content="https://storage.googleapis.com/founderpage-assets/logo_512.png"
        />
      </Helmet>

      <Navbar />
      <Box sx={{ padding: isMobile ? 3 : 8, mt: 10 }}>
        <Typography sx={{ fontWeight: 600, fontSize: isMobile ? '32px' : '36px', mb: 2 }}>
          About FounderPage
        </Typography>

        <Typography sx={{ fontWeight: 400, fontSize: isMobile ? '18px' : '22px', mb: 6 }}>
          FounderPage was built for the stage that comes after you ship. Most products stall post-launch because founders don’t have simple ways to validate ideas, stay visible, or capture meaningful market signals. We built a focused toolkit that turns community conversations into clear decisions — so you spend less time guessing and more time building what users actually want.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#2563eb', mb: 2 }}>
                  <CodeIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Built for Post-Launch Momentum
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Launch is only step one. FounderPage focuses on the three things that sustain growth after release: visibility, validation, and market awareness — all in one lightweight workflow for founders and small teams.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#16a34a', mb: 2 }}>
                  <EmojiObjectsIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Founder-First Product Design
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  We designed flows that remove busywork: convert a single draft into native posts for Reddit, LinkedIn and Twitter; validate features with community tests; and deliver concise insights so your next move is clear.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#ef4444', mb: 2 }}>
                  <FavoriteIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Results Over Hype
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  We prioritize outcomes founders care about: less time guessing, faster learning loops, and measurable signals that guide product decisions — not just vanity metrics.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, maxWidth: 1000 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Our Mission
          </Typography>
          <Typography sx={{ fontSize: '18px' }}>
            We believe the best products are built with customers — not in isolation. FounderPage exists to make that collaborative loop fast and reliable: test ideas with real communities, collect structured feedback, and act on signals that move the needle. <br /><br />
            Whether you're a solo founder, a two-person team, or an early startup, our goal is simple: help you find product-market fit faster and keep momentum long after launch.
          </Typography>
        </Box>

        <Box sx={{ mt: 8, maxWidth: 1000 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Our approach
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontWeight: 700 }}>Validate Before You Build</Typography>
              <Typography sx={{ color: '#374151' }}>
                Turn feature ideas into community tests and collect real responses so you know whether to build, iterate, or drop an idea.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ fontWeight: 700 }}>Stay Visible, Consistently</Typography>
              <Typography sx={{ color: '#374151' }}>
                Create once, publish everywhere. Keep your product top-of-mind with scheduled, platform-native posts that reach the right audiences.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ fontWeight: 700 }}>Insights That Lead to Action</Typography>
              <Typography sx={{ color: '#374151' }}>
                Convert scattered comments into prioritized themes and quick action items that guide your roadmap — not just noise.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default AboutUs;
