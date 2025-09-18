import Navbar from './Navbar';
import Footer from './Footer';
import { Box, Typography, useMediaQuery } from '@mui/material';

const TermsConditions = () => {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>

<header>
        <title>Terms & Conditions | PostLn</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </header>


      <Navbar />

      <Box sx={{ padding: isMobile ? 2 : 6, mt: 10, px: isMobile ? 2 : 12 }}>
        <Typography variant="h3" sx={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 600, mb: 4 }}>
          Terms & Conditions
        </Typography>

        <Typography variant="body1" sx={{ fontSize: isMobile ? '16px' : '18px', lineHeight: 1.8 }}>
          <strong>Last updated:</strong> Aug 3rd, 2025
          <br /><br />
          By accessing or using the PostLn platform ("Website"), owned and operated by Linck One Enterprises ("we," "us," or "our"), you agree to comply with and be bound by the following terms and conditions of use. These terms, together with our Privacy Policy and any other relevant documents, govern your relationship with us in relation to this website.
          <br /><br />
          The term "you" refers to the user or viewer of our website. If you do not agree to these terms, please do not use the Website.
        </Typography>

        <Box mt={6}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Usage Terms
          </Typography>
          <ul>
            <li>The content on this website is for general information and use only. It may change without notice.</li>
            <li>We and any third parties do not guarantee the accuracy, completeness, or suitability of the information provided. We disclaim liability for inaccuracies or errors.</li>
            <li>Your use of any information or tools on this platform is entirely at your own risk. It is your responsibility to ensure that it meets your specific requirements.</li>
            <li>Unauthorized use of this platform may give rise to a claim for damages and/or constitute a criminal offense.</li>
          </ul>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Intellectual Property
          </Typography>
          <ul>
            <li>This website contains material owned or licensed by us, including but not limited to layout, design, graphics, and branding. Reproduction is strictly prohibited unless otherwise stated.</li>
            <li>All trademarks not owned by us that appear on the site are acknowledged accordingly.</li>
          </ul>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            External Links & Third Parties
          </Typography>
          <ul>
            <li>This website may contain links to other websites for your convenience. These links do not signify our endorsement of the content.</li>
            <li>You may not create a link to this website without prior written consent from Linck One Enterprises.</li>
          </ul>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Legal Jurisdiction
          </Typography>
          <ul>
            <li>Your use of this website and any disputes arising are subject to the laws of India.</li>
          </ul>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Payment Authorization
          </Typography>
          <ul>
            <li>We are not liable for transaction declines caused by cardholders exceeding limits as per agreements with our acquiring bank.</li>
          </ul>
        </Box>
      </Box>

      <Footer />
    </>
  );
};

export default TermsConditions;