import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const pricingData = {
  monthly: {
    starter: 9.99,
    pro: 39.99,
  },
  yearly: {
    starter: 9.99,
    pro: 29.99,
  },
};

const features = [
  { label: 'Real-time Trending Topics', starter: true, pro: true },
  { label: 'Unlimited Keywords', starter: true, pro: true },
  { label: 'Calendar View', starter: true, pro: true },
  { label: 'Scheduled Image Posts', starter: true, pro: true },
  { label: 'Save Drafts', starter: true, pro: true },
  { label: 'Rollover unused credits', starter: false, pro: true },
  { label: 'Priority Support', starter: false, pro: true },
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleBillingChange = (_, newBilling) => {
    if (newBilling !== null) setBilling(newBilling);
  };

  // Helper to split into whole + cents (always 2 decimals)
  const getPriceParts = (value) => {
    const [whole, cents] = Number(value).toFixed(2).split('.');
    return { whole, cents };
  };

  return (
    <>
      <Navbar />
      <Box sx={{ py: 10, px: isMobile ? 2 : 8 }}>
        <Typography variant="h3" fontWeight={500} textAlign="center" mb={2}>
          Choose Your Plan
        </Typography>

      <Box textAlign="center" mb={6}>
          <ToggleButtonGroup
            value={billing}
            exclusive
            onChange={handleBillingChange}
            sx={{
              borderRadius: 6,
              p: 1,
            }}
          >
            <ToggleButton
              value="monthly"
              sx={{
                px: 3,
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: 4,
                background: billing === 'monthly'
                  ? 'linear-gradient(to right, #000000, #8b5cf6)'
                  : 'transparent',
                color: billing === 'monthly' ? '#ffffff' : '#1e293b',
                '&:hover': {
                  background:
                    billing === 'monthly'
                      ? 'linear-gradient(to right, #000000, #8b5cf6)'
                      : '#e0e7ff',
                  color: '#ffffff',
                },
              }}
            >
              Monthly
            </ToggleButton>

            <ToggleButton
              value="yearly"
              sx={{
                px: 3,
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: 4,
                background: billing === 'yearly'
                  ? 'linear-gradient(to right, #000000, #8b5cf6)'
                  : 'transparent',
                color: billing === 'yearly' ? '#ffffff' : '#1e293b',
                '&:hover': {
                  background:
                    billing === 'yearly'
                      ? 'linear-gradient(to right, #000000, #8b5cf6)'
                      : '#e0e7ff',
                  color: '#ffffff',
                },
              }}
            >
              Annually [4 months free]
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {['starter', 'pro'].map((plan) => {
            const price = pricingData[billing][plan];
            const { whole, cents } = getPriceParts(price);
            const isPro = plan === 'pro';
            const fgColor = isPro ? '#FFFFFF' : '#000000';
            const subColor = isPro ? '#E5E7EB' : 'grey';

            return (
              <Grid item xs={12} md={5} key={plan}>
                <Card
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    boxShadow: 3,
                    background: isPro
                      ? 'linear-gradient(to right, #000000, #8b5cf6)'
                      : '#fff',
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      mb={1}
                      color={isPro ? '#FFFFFF' : 'text.primary'}
                    >
                      {plan === 'starter' ? 'Starter' : 'Pro'}
                    </Typography>

                    {/* Price with .99 in top-right */}
                    <Stack
                      direction="row"
                      alignItems="flex-end"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', lineHeight: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: { xs: '18px', md: '20px' },
                            fontWeight: 500,
                            color: fgColor,
                            mr: 0.5,
                            lineHeight: 1,
                          }}
                        >
                          $
                        </Typography>

                        <Box sx={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: { xs: '40px', md: '48px' },
                              fontWeight: 600,
                              color: fgColor,
                              lineHeight: 1,
                            }}
                          >
                            {whole}
                          </Typography>
                          <Typography
                            sx={{
                              position: 'absolute',
                              top: { xs: '-6px', md: '-8px' },
                              right: { xs: '-18px', md: '-20px' },
                              fontFamily: 'Inter',
                              fontSize: { xs: '13px', md: '14px' },
                              fontWeight: 600,
                              color: fgColor,
                              lineHeight: 1,
                            }}
                          >
                            .{cents}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        mb={0.5}
                        sx={{
                          fontFamily: 'Inter',
                          color: subColor,
                          fontSize: { xs: '12px', md: '14px' },
                        }}
                      >
                        per month
                      </Typography>
                    </Stack>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        background: !isPro
                          ? 'linear-gradient(to right, #000000, #8b5cf6)'
                          : 'linear-gradient(to right, #FFFFFF, #000000)',
                        color: '#fff',
                        fontWeight: 500,
                        borderRadius: 2,
                        textTransform: 'none',
                        mb: 3,
                        '&:hover': { backgroundColor: '#6d28d9' },
                      }}
                      onClick={() => (window.location.href = '/signup')}
                    >
                      {plan === 'starter' ? 'Start with Starter' : 'Go Pro'}
                    </Button>

                    {/* Features List */}
                    <Box component="ul" sx={{ pl: 0, mb: 0, listStyle: 'none' }}>
                      {/* AI Rewrite Credits */}
                      <Box component="li" display="flex" alignItems="center" mb={1}>
                        <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
                        <Typography
                          variant="body2"
                          sx={{ color: fgColor }}
                        >
                          {plan === 'starter'
                            ? '30 AI Rewrite Credits/month'
                            : '100 AI Rewrite Credits/month'}
                        </Typography>
                      </Box>

                      {/* Scheduled Posts Limit */}
                      <Box component="li" display="flex" alignItems="center" mb={1}>
                        <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
                        <Typography
                          variant="body2"
                          sx={{ color: fgColor }}
                        >
                          {plan === 'starter'
                            ? '15 Scheduled Posts/month'
                            : '30 Scheduled Posts/month'}
                        </Typography>
                      </Box>

                      {/* Remaining Features */}
                      {features.map((feat, i) => {
                        const available = feat[plan];
                        return (
                          <Box key={i} component="li" display="flex" alignItems="center" mb={1}>
                            {available ? (
                              <CheckCircleIcon sx={{ color: '#10b981', mr: 1 }} />
                            ) : (
                              <CancelIcon sx={{ color: '#ef4444', mr: 1 }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: isPro
                                  ? available ? '#ffffff' : '#d1d5db'
                                  : available ? '#000000' : '#9ca3af',
                              }}
                            >
                              {feat.label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      <Footer />
    </>
  );
}
