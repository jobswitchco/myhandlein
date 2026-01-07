import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet";
import Navbar from "../components/Navbar";
import HeroSection from "./HeroSection";
import FAQSection from "./FAQSection";
import redditLogo from "../images/redditIcon.png"
import linkedinLogo from "../images/linkedin-logo.png"
import twitterLogo from "../images/twitter.png"
import facebookLogo from "../images/facebook.png"
import ThreeBlockPage from "./ThreeBlockPage.js";
import AllFeatures1 from "./AllFeatures1.js";
import AllFeatures2 from "./AllFeatures2.js";
import AllFeatures from "./AllFeatures.js";

// Lazy-loaded components
const Footer = lazy(() => import("../components/Footer"));
const BannerLandpage = lazy(() => import("./BannerLandPage"));

export default function LandingPage() {
  return (
    <>
  <Helmet>
  <title>Turn Instagram DMs into Paying Fitness Clients</title>
  <meta
    name="description"
    content="Auto comment replies, safe DM automation, and a smart lead detection engine —built for fitness creators."
  />
  <link rel="canonical" href="https://myhandle.in/" />

</Helmet>

      <Navbar />
<HeroSection logos={{ reddit: redditLogo, linkedin: linkedinLogo, twitter: twitterLogo, facebook: facebookLogo }} />
      <ThreeBlockPage />

      {/* Lazy-loaded below pages */}
      <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      {/* <AllFeatures1 /> */}
      {/* <AllFeatures2 /> */}
      <AllFeatures/>
      <FAQSection />

        <BannerLandpage />
        <Footer />
      </Suspense>
    </>
  );
}

