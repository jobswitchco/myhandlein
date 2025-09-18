import Navbar from './Navbar';
import Footer from './Footer';
import { Box, Typography, useMediaQuery } from '@mui/material';

function PrivacyPolicy() {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <header>
        <title>Privacy Policy | PostLn</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </header>

      <Navbar />
      <Box sx={{ px: isMobile ? 3 : 10, py: isMobile ? 5 : 10, mt: 8 }}>
        <Typography variant={isMobile ? 'h4' : 'h3'} gutterBottom fontWeight={600}>
          Privacy Policy
        </Typography>

        <Typography variant="body1" gutterBottom>
          Last updated on Aug 2nd, 2025
        </Typography>

        <Typography variant="body1" paragraph>
          At PostLn, your privacy isn't just protected — it's respected. We collect only what we need to provide you with an exceptional AI-powered content experience. Any personal information shared with us is handled with care and used strictly within the scope of this policy.
        </Typography>

        <Typography variant="body1" paragraph>
          PostLn (operated by Linck One Enterprises) may revise this policy periodically. We recommend revisiting this page to stay informed of any changes.
        </Typography>

        <Typography variant="h5" gutterBottom fontWeight={600}>What We Collect</Typography>
        <ul>
          <li>Name and email address</li>
          <li>Account credentials and authentication details</li>
          <li>Usage data (e.g., rewrite activity, topic preferences)</li>
          <li>Device and browser metadata for performance and debugging</li>
          <li>Other information relevant to improving user experience</li>
        </ul>

        <Typography variant="h5" gutterBottom fontWeight={600}>How We Use the Information</Typography>
        <ul>
          <li>To generate LinkedIn posts aligned to your tone and style</li>
          <li>To offer trending content suggestions based on preferences</li>
          <li>To maintain rewrite credit usage and billing accuracy</li>
          <li>To communicate important updates, improvements, or offers</li>
          <li>To analyze platform usage and improve performance</li>
          <li>To personalize your experience and style profile</li>
        </ul>

        <Typography variant="h5" gutterBottom fontWeight={600}>Data Security</Typography>
        <Typography variant="body1" paragraph>
          We take strong precautions to protect your data. This includes secure HTTPS communication, encryption of sensitive fields, access controls, and regular vulnerability scans. We do not store your LinkedIn credentials unless explicitly authorized for auto-posting.
        </Typography>

        <Typography variant="h5" gutterBottom fontWeight={600}>Cookies & Tracking</Typography>
        <Typography variant="body1" paragraph>
          Cookies help enhance your experience by storing session preferences and tracking usage anonymously. We use cookies solely to improve product performance and user flow. No sensitive data is stored or tracked without your consent.
        </Typography>

        <ul>
          <li>We use cookies to remember preferences and sessions</li>
          <li>We use analytics tools to understand feature usage</li>
          <li>No cookies grant access to your personal data or files</li>
        </ul>

        <Typography variant="body1" paragraph>
          You may choose to disable cookies through your browser settings, though this may limit some functionality.
        </Typography>

        <Typography variant="h5" gutterBottom fontWeight={600}>Managing Your Personal Data</Typography>
        <ul>
          <li>You can control what data you share with us via settings or support requests</li>
          <li>You can request deletion of your data or account at any time</li>
          <li>We never sell or rent your data to third parties</li>
          <li>We may send occasional product or feature updates — you may opt out anytime</li>
        </ul>

        <Typography variant="body1" paragraph>
          For any privacy-related concerns or data requests, contact us at{' '}
          <a href="mailto:support@postln.ai">support@postln.com</a>. We'll respond within 3 business days.
        </Typography>
      </Box>
      <Footer />
    </>
  );
}

export default PrivacyPolicy;
