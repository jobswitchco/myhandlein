import { Grid, Typography, IconButton, Box, Divider } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";

export default function Footer() {
  return (
    <Box
      sx={{
        backgroundColor: "#121212",
        color: "#fff",
        paddingY: 5,
        paddingX: 2,
      }}
    >
      <Grid container spacing={4} justifyContent="center">
        {/* Company Section */}
        <Grid item xs={12} sm={4} md={3}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              letterSpacing: "1px",
              color: "#f2f2f2",
              marginBottom: 2,
            }}
          >
            Company
          </Typography>
        

        
{/* 
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/pricing" style={linkStyle}>
              Pricing
            </a>
          </Typography> */}
           
            <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/trust-center" style={linkStyle}>
              Trust Center
            </a>
          </Typography>

            <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/disclosure-policy" style={linkStyle}>
              Disclosure Policy
            </a>
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/about-us" style={linkStyle}>
              About Us
            </a>
          </Typography>
{/* 
             <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/contact" style={linkStyle}>
             Contact Us
            </a>
          </Typography> */}
          
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/sitemap.xml" style={linkStyle}>
              Sitemap
            </a>
          </Typography>
        </Grid>

        {/* Useful Links Section */}
        <Grid item xs={12} sm={4} md={3}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              letterSpacing: "1px",
              color: "#f2f2f2",
              marginBottom: 2,
            }}
          >
            Useful
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/linkedin-text-formatter" target="_blank" rel="noopener noreferrer" style={linkStyle}>
               Linkedin Text Formatter [Free]
            </a>
          </Typography>
            <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/google-api-disclosure" style={linkStyle}>
               Google API Disclosure
            </a>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/terms" style={linkStyle}>
              Terms & Conditions
            </a>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/privacy-policy" style={linkStyle}>
              Privacy Policy
            </a>
          </Typography>

             {/* <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/cancellation-refund-policy" style={linkStyle}>
              Cancellation & Refund
            </a>
          </Typography> */}

          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 1,
              transition: "color 0.3s",
              "&:hover": { color: "#f2f2f2" },
            }}
          >
            <a href="/security" style={linkStyle}>
              Security
            </a>
          </Typography>
        </Grid>

        {/* Social Media Section */}
        <Grid item xs={12} sm={4} md={3}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              letterSpacing: "1px",
              color: "#f2f2f2",
              marginBottom: 2,
            }}
          >
            Follow Us
          </Typography>
          <Box display="flex" justifyContent="flex-start" gap={2}>
           
            <IconButton
              href="https://www.linkedin.com/company/postln"
              target="_blank"
              color="inherit"
              sx={{ "&:hover": { color: "#E4405F" } }}
              aria-label="Visit our LinkedIn page"
            >
              <LinkedInIcon sx={{ fontSize: 34 }} />
            </IconButton>
            <IconButton
              href="https://x.com/ibhaskarsriram"
              target="_blank"
              color="inherit"
              sx={{ "&:hover": { color: "#1DA1F2" } }}
              aria-label="Visit our Twitter page"
            >
              <TwitterIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Footer Divider */}
      <Divider sx={{ my: 4, backgroundColor: "#444" }} />

      <Box textAlign="center" sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: "#B9B4C7" }}>
          &copy; betaFounder.co 2025
        </Typography>
      </Box>
    </Box>
  );
}

// Styles for links
const linkStyle = {
  textDecoration: "none",
  color: "#ccc",
  transition: "color 0.3s ease",
};

