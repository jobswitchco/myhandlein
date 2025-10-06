// PricingPage.js
import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Button,
  useMediaQuery,
  Chip,
  Divider
} from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';

const plans = {
  monthly: {
    price: 99,
    label: 'Monthly',
    subLabel: 'Billed monthly',
    cta: 'Start for ₹99',
    note: '7-day refund • cancel anytime'
  },
  lifetime: {
    price: 999,
    label: 'Lifetime',
    subLabel: 'Access up to 20 years',
    cta: 'Get Lifetime for ₹999',
    note: 'One-time payment • 7-day refund'
  }
};

// Core myHandle features — short, scannable, influencer-friendly
const features = [
  'Custom subdomain (yourname.myhandle.in)',
  'Unlimited links & smart actions (WhatsApp, Call, Maps, Email, Socials)',
  'UPI/Razorpay payments (tips, donations, bookings, digital items)',
  'Analytics: Visitors vs Views, CTR, top links, referrers, device & region',
  'Quick filters: Today • Last 7 days • Last 28 days',
  'English + Hindi support',
  'Branded QR code for offline sharing',
  'Fast, secure hosting with SSL',
  'Simple editor • drag & reorder links',
  'Email support (24–48 business hours)'
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');
  const isMobile = useMediaQuery('(max-width:600px)');
  const active = useMemo(() => plans[billing], [billing]);

  return (
    <>
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
        <Box sx={{ py: 8, px: isMobile ? 2 : 6, maxWidth: 1100, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip
              icon={<VerifiedRoundedIcon />}
              label="Made in India • Priced for India"
              color="default"
              sx={{ mb: 2, bgcolor: '#eef2ff', borderRadius: 2, fontWeight: 700, fontFamily : 'Inter' }}
            />
           
          </Box>

          {/* Toggle */}
        <Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',     // ⟵ center children horizontally
    justifyContent: 'center',
    gap: 1,                   // small space between group and text
    mb: 4,
  }}
>
  <ToggleButtonGroup
    value={billing}
    exclusive
    onChange={(_, v) => v && setBilling(v)}
    aria-label="Billing period"
    sx={{
      p: 0.5,
      bgcolor: '#f4f4f5',
      borderRadius: 3,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      '& .MuiToggleButtonGroup-grouped': {
        border: 0,
        mx: 0.5,
        '&:not(:first-of-type)': { borderLeft: 0 },
      },
    }}
  >
    <ToggleButton
      value="monthly"
      sx={{
        px: 2.5,
        py: 1,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
        fontFamily : 'Inter',
        '&.Mui-selected': {
          bgcolor: '#111827',
          color: '#fff',
          '&:hover': { bgcolor: '#0f172a' },
        },
      }}
    >
      Monthly • ₹99
    </ToggleButton>
    <ToggleButton
      value="lifetime"
      sx={{
        px: 2.5,
        py: 1,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
        fontFamily : 'Inter',
        '&.Mui-selected': {
          bgcolor: '#111827',
          color: '#fff',
          '&:hover': { bgcolor: '#0f172a' },
        },
      }}
    >
      Lifetime • ₹999
    </ToggleButton>
  </ToggleButtonGroup>

  <Typography
    color="text.secondary"
    sx={{ mt: 0.5, textAlign: 'center', fontSize: 12 }}
  >
    No hidden fees. Everything you need in one plan.
  </Typography>
</Box>


          {/* Card */}
          <Grid container justifyContent="center">
            <Grid item xs={12} md={9} lg={7}>
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography sx={{ letterSpacing: '-0.01em', fontFamily : 'Inter', fontSize : isMobile ? '18px' : '26px', fontWeight : 700 }}>
                        {active.label} Plan
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1}}>{active.subLabel}</Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          letterSpacing: '-0.01em',
                          fontFamily : 'Inter', fontSize : isMobile ? '18px' : '34px', fontWeight : 700
                        }}
                      >
                        ₹{active.price}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {billing === 'monthly' ? 'per month' : 'Save ₹22,761'}
                      </Typography>
                    </Box>
                  </Box>

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
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      background:
                        'linear-gradient(90deg, #111827 0%, #4f46e5 50%, #7c3aed 100%)',
                      boxShadow: '0 6px 20px rgba(79,70,229,0.35)',
                      '&:hover': { opacity: 0.95 }
                    }}
                    onClick={() => (window.location.href = '/signup')}
                  >
                    {active.cta}
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <Grid container spacing={1.25}>
                    {features.map((text, i) => (
                      <Grid key={i} item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <CheckCircleIcon
                            fontSize="small"
                            sx={{ color: '#10b981', mt: '2px', flexShrink: 0 }}
                          />
                          <Typography variant="body2" sx={{ color: '#111827', fontFamily : 'Inter' }}>
                            {text}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Guarantee strip */}
                  <Box
                    sx={{
                      mt: 3,
                      p: 1.5,
                      bgcolor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#065f46' }}>
                      7-day no-questions-asked refund.{' '}
                      {billing === 'monthly'
                        ? 'Cancel anytime from your dashboard.'
                        : 'One-time payment covers access for up to 20 years.'}{' '}
                      Read our{' '}
                      <a href="/refund-policy" style={{ color: '#065f46', fontWeight: 600 }}>
                        Refund Policy
                      </a>
                      .
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Tiny legal */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 2 }}
              >
                Payment gateway fees (if any) are as per UPI/Razorpay. Taxes may apply. By subscribing you agree to our{' '}
                <a href="/terms" style={{ color: '#4f46e5' }}>
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy-policy" style={{ color: '#4f46e5' }}>
                  Privacy Policy
                </a>
                .
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </>
  );
}
