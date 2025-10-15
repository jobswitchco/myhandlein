import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";



export default function Hero({
  logos = {},
  heroImage = "https://storage.googleapis.com/postlnbucketcom/products/Screenshot%202025-10-06%20231051.webp"
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const navigate = useNavigate();
  const [availability, setAvailability] = useState("idle");
  const [message, setMessage] = useState("");
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const baseUrl = "/api/usersOn";


  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:768px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:768px)");
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Styles
 const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: isMobile ? "100px 20px 60px" : "100px 40px 80px",
  boxSizing: "border-box",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0a0a0a",
  position: "relative",
  overflow: "hidden",
  // Add these:
  width: "100%",
  maxWidth: "100vw", // Prevent horizontal overflow
};

  const backgroundShapeStyle = {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "60%",
    height: "60%",
    // background: "radial-gradient(circle, rgba(255,140,0,0.15) 0%, rgba(255,215,0,0.05) 50%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 0,
  };

  const backgroundShape2Style = {
    position: "absolute",
    bottom: "-15%",
    left: "-10%",
    width: "50%",
    height: "50%",
    background: "radial-gradient(circle, rgba(255,69,0,0.12) 0%, rgba(255,140,0,0.04) 50%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(50px)",
    pointerEvents: "none",
    zIndex: 0,
  };

const layoutStyle = {
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: isMobile ? "48px" : "80px",
  position: "relative",
  maxWidth: "96%",
  boxSizing: "border-box",
};

  const leftColStyle = {
    flex: isMobile ? "0 1 auto" : "1 1 70%",
    display: "flex",
    flexDirection: "column",
    alignItems: isMobile ? "center" : "flex-start",
    textAlign: isMobile ? "center" : "left",
    minWidth: 0,
  };

  const rightColStyle = {
    flex: isMobile ? "0 1 auto" : "1 1 30%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: isMobile ? "center" : "flex-end",
    minWidth: 0,
    position: "relative",
  };

  const imageContainerStyle = {
    position: "relative",
    width: isMobile ? "100%" : "100%",
    maxWidth: 480,
  };

  const imageGlowStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "110%",
    height: "110%",
    background: "radial-gradient(circle, rgba(255,140,0,0.25) 0%, transparent 70%)",
    filter: "blur(40px)",
    borderRadius: "24px",
    zIndex: 0,
    pointerEvents: "none",
  };

  const heroImgStyle = {
    width: "100%",
    height: "auto",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)",
    objectFit: "cover",
    position: "relative",
    zIndex: 1,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

 const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 500,
  lineHeight: 1,
  // Indian flag gradient (saffron, white, green)
  background: "linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
  // Navy text for contrast (Ashoka Chakra tone)
  color: "#0A1F5A",
  // Optional: thin outline for readability on white band
  textShadow: "0 0 1px rgba(0,0,0,0.15)"
};

  const headlineStyle = {
    fontSize: isMobile ? "clamp(2.2rem, 8vw, 3rem)" : "clamp(3rem, 5vw, 4rem)",
    lineHeight: 1.25,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    margin: "0 0 24px 0",
    color: '#2d2d2d',
    paddingLeft : isMobile ? '6px' : '0px',
    paddingRight : isMobile ? '6px' : '0px',
  };

  const highlightStyle = {
    position: "relative",
    display: "inline-block",
    fontWeight: 900,
    color: '#B9375D'

  };

  const subStyle = {
    fontSize: isMobile ? "1.1rem" : "1.3rem",
    lineHeight: 1.7,
    color: "#4a4a4a",
    margin: "0 0 32px 0",
    // maxWidth: 600,
    fontWeight: 400,
   paddingLeft : isMobile ? '4%' : '0px',
    paddingRight : isMobile ? '4%' : '0px',
    
    
  };

  const ctaRowStyle = {
    width: "100%",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "16px" : "16px",
    justifyContent: isMobile ? "center" : "flex-start",
    marginTop: "16px",
    paddingLeft : isMobile ? '4%' : '0px',
    paddingRight : isMobile ? '4%' : '0px',

    // maxWidth: isMobile ? "100%" : "650px",
  };

const inputWrapStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(10px)",
  borderRadius: "26px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
  paddingLeft: "20px",
  paddingRight: "20px",
  height: "56px",
  boxSizing: "border-box",
  minWidth: isMobile ? "100%" : "300px",
  maxWidth: "100%",
  transition: "box-shadow 0.3s ease, transform 0.2s ease",
  touchAction: "manipulation", // Add this
};


const inputStyle = {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "16px", // This is already correct
  fontWeight: 600,
  color: "#0a0a0a",
  paddingRight: "140px",
  // Add this to ensure no zooming:
  touchAction: "manipulation",
};


  const suffixStyle = {
    position: "absolute",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "15px",
    color: "#999",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    fontWeight: 500,
  };

  const startBtnStyle = {
    appearance: "none",
    border: "none",
    height: "56px",
    minWidth: isMobile ? "100%" : "200px",
    maxWidth: isMobile ? "100%" : "100%",
    padding: "0 28px",
    fontSize: "16px",
    fontWeight: 700,
    borderRadius: "26px",
    cursor: "pointer",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    color: "#FFFFFF",
    boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    alignSelf: isMobile ? "stretch" : "auto",
    position: "relative",
    overflow: "hidden",
  };

  const startBtnHoverStyle = isHovered
    ? { 
        transform: "translateY(-3px)", 
        boxShadow: "0 16px 32px rgba(0,0,0,0.25)",
      }
    : {};

  const captionStyle = {
    marginTop: "32px",
    fontSize: isMobile ? "1rem" : "1.1rem",
    color: "#6b4423",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: isMobile ? "center" : "flex-start",
  };

  const statusRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 24,
    paddingTop: 8,
    paddingLeft: 4,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: "0px",
  };

  const statusColor =
    availability === "available"
      ? "#16a34a"
      : availability === "taken"
      ? "#dc2626"
      : availability === "invalid"
      ? "#d97706"
      : availability === "error"
      ? "#9333ea"
      : "#6b7280";

  const onSubdomainChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(cleaned);
  };

  const isValidSubdomain = (s) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s) && s.length > 0;

  useEffect(() => {
    // reset UI if empty
    if (!subdomain) {
      setAvailability("idle");
      setMessage("");
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // invalid? show message, skip network
    if (!isValidSubdomain(subdomain)) {
      setAvailability("invalid");
      setMessage("Only letters, numbers, and hyphens. Must start/end with a letter or number.");
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    setAvailability("checking");
    setMessage("Checking…");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // cancel previous in-flight request (if any)
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Adjust the URL to your backend route
        const res = await axios.post(
          baseUrl + "/subdomain/check",
          { subdomain },
          { signal: controller.signal }
        );

        const available = !!res?.data?.available;
        if (available) {
          setAvailability("available");
          setMessage(`${subdomain}.myhandle.in is available!`);
        } else {
          setAvailability("taken");
          setMessage(`${subdomain}.myhandle.in is taken.`);
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === "CanceledError" || err?.name === "AbortError") {
          // request was aborted due to new keystrokes: ignore
          return;
        }
        setAvailability("error");
        setMessage("Couldn’t check right now. Please try again.");
      }
    }, 400); // 400ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [subdomain]);

  const Spinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ display: "block" }} aria-label="Loading">
      <circle cx="12" cy="12" r="10" fill="none" stroke={statusColor} strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" fill="none" stroke={statusColor} strokeWidth="3">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" fill="none" stroke={statusColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke={statusColor} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  const WarnIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4m0 4h.01" stroke={statusColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke={statusColor} strokeWidth="2" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke={statusColor} strokeWidth="2" />
      <path d="M12 7v6m0 4h.01" stroke={statusColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const StatusIcon = () => {
    if (availability === "checking") return <Spinner />;
    if (availability === "available") return <CheckIcon />;
    if (availability === "taken") return <CrossIcon />;
    if (availability === "invalid") return <WarnIcon />;
    if (availability === "error") return <ErrorIcon />;
    return null;
  };

  return (
    <section style={containerStyle} aria-label="Hero">
      <div style={backgroundShapeStyle} />
      <div style={backgroundShape2Style} />
      
      <div style={layoutStyle}>
    
        <div style={leftColStyle}>
       {/* <div style={badgeStyle}>Made in India</div> */}


          <h1 style={headlineStyle}>
            Why Pay <span style={highlightStyle}>10x More</span> for Foreign Link in Bio Tools?
          </h1>

          <p style={subStyle}>
            India's affordable link-in-bio platform for creators and businesses. Unlimited links, UPI integration, analytics & more —all for ₹99/month. <br />Built in India, your data stays in India.
          </p>

          <div style={ctaRowStyle}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <label htmlFor="subdomain" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Enter your subdomain
              </label>

              <div style={inputWrapStyle}>
                <input
                  id="subdomain"
                  inputMode="latin"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="Ex: mkbhd, mumbiker"
                  value={subdomain}
                  onChange={onSubdomainChange}
                  style={inputStyle}
                  aria-describedby="availability-msg"
                  aria-invalid={availability === "invalid" || availability === "taken"}
                />
                <span style={suffixStyle}>.myhandle.in</span>
              </div>

              <div id="availability-msg" style={{ ...statusRowStyle, color: statusColor }}>
                <StatusIcon />
                <span>{message}</span>
              </div>
            </div>

            <button
            onClick={()=> navigate('/professional/login')}
              style={{ ...startBtnStyle, ...startBtnHoverStyle }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label="Get started for free"
              disabled={availability === "checking"}
            >
              Get Started for Free
            </button>
          </div>

          <div style={captionStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF8C00">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Trusted by <strong>65,000+</strong> Indian Influencers
          </div>
        </div>

        <div style={rightColStyle}>
          <div style={imageContainerStyle}>
            <div style={imageGlowStyle} />
            {heroImage && (
              <img
                src={heroImage}
                alt="Showcase of MyHandle link-in-bio on mobile and desktop"
                style={heroImgStyle}
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}