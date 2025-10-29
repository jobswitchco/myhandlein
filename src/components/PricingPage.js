// PricingPage.js
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  useMediaQuery,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';

// NEW icon imports for features
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContactsRoundedIcon from '@mui/icons-material/ContactsRounded';
import QuickreplyRoundedIcon from '@mui/icons-material/QuickreplyRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import HttpsRoundedIcon from '@mui/icons-material/HttpsRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';

const PLAN = {
  price: 399,
  label: 'Monthly',
  subLabel: 'Billed monthly',
  cta: 'Start for ₹399',
  note: '7 days free trial'
};

// Core myHandle features — short, scannable, influencer-friendly
const features = [
  'Unlimited links',
  'Unlimited Contacts',
  'Unlimited Automated Instagram replies',
  'Unlimited Automated Instagram DMs',
  'Social icons, videos & embeds',
  'Advanced Analytics: Visitors, Views, CTR, Top links, Referrers, City & State',
  'Collect & manage your subscribers',
  'Custom subdomain (yourname.myhandle.in)',
  'UPI/Razorpay payments (Sell digital items)',
  'English + Hindi support',
  'Fast, secure hosting with SSL',
  'Simple editor • drag & reorder links',
  'Priority support (24–48 business hours)'
];

// Map each feature string to a specific icon
const featureIcons = {
  'Unlimited Links': LinkRoundedIcon,
  'Unlimited Contacts': ContactsRoundedIcon,
  'Unlimited Automated Instagram replies': QuickreplyRoundedIcon,
  'Unlimited Automated Instagram DMs': SendRoundedIcon,
  'Social icons, videos & embeds': ShareRoundedIcon,
  'Advanced Analytics: Visitors, Views, CTR, Top links, Referrers, City & State': InsightsRoundedIcon,
  'Collect & manage your subscribers': GroupAddRoundedIcon,
  'Custom subdomain (yourname.myhandle.in)': LanguageRoundedIcon,
  'UPI/Razorpay payments (sell digital items)': PaymentsRoundedIcon,
  'English + Hindi support': TranslateRoundedIcon,
  'Fast, secure hosting with SSL': HttpsRoundedIcon,
  'Simple editor • drag & reorder links': DragIndicatorRoundedIcon,
  'Priority support (24–48 business hours)': SupportAgentRoundedIcon
};

export default function PricingPage() {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>

      <header>
        <title>Pricing and Packages | MyHandle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Checkout the prices and rates for MyHandle." />
      </header>


      <Navbar />

      {/* Background */}
      <Box
        sx={{
          minHeight: '100vh',
          mt: 4,
          background:
            'radial-gradient(1200px 600px at 20% -10%, #ede9fe 0%, rgba(237,233,254,0) 50%), radial-gradient(900px 500px at 120% 10%, #f0f9ff 0%, rgba(240,249,255,0) 55%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
        }}
      >
        <Box sx={{ py: 8, px: isMobile ? 2 : 6 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip
              icon={<VerifiedRoundedIcon />}
              label="Made in India • Priced for India"
              color="default"
              sx={{
                mb: 2,
                bgcolor: '#eef2ff',
                borderRadius: 2,
                fontWeight: 700,
                fontFamily: 'Inter'
              }}
            />

            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontSize: isMobile ? 24 : 40,
                lineHeight: 1.1
              }}
            >
              One simple plan. Everything you need.
            </Typography>

            {/* Trust row */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Chip
                icon={<ShieldRoundedIcon />}
                label="Secure SSL"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <Chip
                icon={<SpeedRoundedIcon />}
                label="Fast CDN"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <Chip
                icon={<BoltRoundedIcon />}
                label="UPI/Razorpay"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          </Box>

          {/* Pricing Card */}
          <Grid container justifyContent="center">
            <Grid size={{ xs: 12, sm: 12, md: 5, lg: 5}}>
              <Card
                elevation={0}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.06)',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.85) 100%)',
                  backdropFilter: 'blur(6px)',
                  boxShadow:
                    '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(17,24,39,0.06)'
                }}
              >
                <CardContent sx={{ p: isMobile ? 3 : 5 }}>
                  {/* Top row */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                      mb: 2
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          letterSpacing: '-0.01em',
                          fontFamily: 'Inter',
                          fontSize: isMobile ? 18 : 26,
                          fontWeight: 700
                        }}
                      >
                        {PLAN.label} Plan
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {PLAN.subLabel}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                      <Typography
                        sx={{
                          letterSpacing: '-0.01em',
                          fontFamily: 'Inter',
                          fontSize: isMobile ? 22 : 36,
                          fontWeight: 800
                        }}
                      >
                        ₹{PLAN.price}
                        <Typography
                          component="span"
                          color="text.secondary"
                          sx={{ ml: 0.5, fontSize: isMobile ? 12 : 14, fontWeight: 500 }}
                        >
                          /month
                        </Typography>
                      </Typography>
                      <Typography color="text.secondary">
                        {PLAN.note}
                      </Typography>
                    </Box>
                  </Box>

                  {/* CTA */}
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    endIcon={<StarRoundedIcon />}
                    sx={{
                      mt: 1,
                      mb: 3,
                      py: 1.4,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      background:
                        'linear-gradient(90deg, #111827 0%, #4f46e5 50%, #7c3aed 100%)',
                      boxShadow: '0 6px 20px rgba(79,70,229,0.35)',
                      '&:hover': { opacity: 0.95 }
                    }}
                    onClick={() => (window.location.href = '/professional/login')}
                  >
                    {PLAN.cta}
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* Features — always one per row */}
                  <Stack spacing={1.25}>
                    {features.map((text, i) => {
                      const Icon = featureIcons[text] || CheckCircleIcon;
                      return (
                        <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                          <Icon
                            fontSize="small"
                            sx={{ color: '#7c3aed', mt: '2px', flexShrink: 0 }}
                          />
                          <Typography
                            sx={{ color: '#111827', fontFamily: 'Inter', fontSize : isMobile ? '16px' : '16px' }}
                          >
                            {text}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>

                  {/* Guarantee strip */}
                  <Box
                    sx={{
                      mt: 2.5,
                      p: 1.5,
                      bgcolor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#065f46' }}>
                      7-day no-questions-asked refund. Cancel anytime from your dashboard{' '}
                      Read our{' '}
                      <a
                        href="/refund-cancellation-policy"
                        style={{ color: '#065f46', fontWeight: 600 }}
                      >
                        Refund Policy
                      </a>
                      .
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Mobile sticky CTA (appears only on very small screens) */}
      {/* {isMobile && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1.5,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.8)',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            zIndex: 10
          }}
        >
          <Button
            fullWidth
            size="large"
            variant="contained"
            endIcon={<StarRoundedIcon />}
            sx={{
              py: 1.2,
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: 'Inter',
              fontWeight: 700,
              background:
                'linear-gradient(90deg, #111827 0%, #4f46e5 50%, #7c3aed 100%)'
            }}
            onClick={() => (window.location.href = '/professional/login')}
          >
            Start for ₹399
          </Button>
        </Box>
      )} */}

      <Footer />
    </>
  );
}
