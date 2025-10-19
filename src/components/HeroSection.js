import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import hero_img from "../images/hero_img.webp";

export default function Hero({
  logos = {},
  heroImage = hero_img
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const navigate = useNavigate();

  // NEW: availability state
  // idle = nothing yet, checking = debounce in progress or request in flight
  // available / taken / invalid / error
  const [availability, setAvailability] = useState("idle");
  const [message, setMessage] = useState("");
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const baseUrl = "/api/usersOn";


  // Track small-screen (<=600px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:600px)").matches
  );

   useEffect(() => {
    if (!heroImage) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = heroImage;

    // If you have responsive variants, also set:
    // link.imageSrcset = "https://.../hero_768.webp 768w, https://.../hero_1280.webp 1280w, https://.../hero_1920.webp 1920w";
    // link.imageSizes = "(max-width: 600px) 100vw, 50vw";

    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [heroImage]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:600px)");
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // === Highlight tokens
  const padX = "clamp(0.05em, 1.4vw, 0.05em)";
  const highlightHeight = "clamp(0.42em, 1.8vw, 0.42em)";
  const highlightRadius = "0px";
  const highlightColor = "linear-gradient(120deg, #FFFFFF 0%, #DC143C 80%, #DC143C 100%)";
  const barOffset = "65%";

  // === Inline styles
  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding:"clamp(14vh, 6vw, 14vh) clamp(46px, 4vw, 46px) clamp(7vh, 4vw, 8vh) clamp(46px, 4vw, 46px)",
    boxSizing: "border-box",
    fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0b1220",
    overflowX: "hidden", 
    background: '#f5f7f8'
  };

  const layoutStyle = {
    width: "100%",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: isMobile ? "24px" : "140px"
  };

const leftColStyle = {
  flex: isMobile ? "0 1 auto" : "1 1 70%",
  display: "flex",
  flexDirection: "column",
  alignItems: isMobile ? "center" : "flex-start",
  textAlign: isMobile ? "center" : "left",
  minWidth: 0,              // ✅ allow children to shrink inside flex
};

const rightColStyle = {
  flex: isMobile ? "0 1 auto" : "1 1 30%",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: isMobile ? "center" : "flex-end",
  minWidth: 0,              // ✅
};


    const heroImgStyle = {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    objectFit: "cover"
  };

  const flagImgStyle = {
  width: "32px",
  height: "22px",
  objectFit: "cover",
  borderRadius: "2px",
  verticalAlign: "middle",
  marginLeft: "6px"
};


const subStyle = {
  fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
  lineHeight: 1.5,
  color: "#222831",
  margin: "0 0 clamp(18px, 2.5vw, 24px) 0",
  marginTop: "1rem"
};

// inline version for mobile
const subStyleDataInline = {
  display: "inline",
  fontSize: "clamp(1rem, 1.6vw, 1.25rem)",
  fontWeight: 500,
  color: "#000000",
  margin: 0
};

// block version for desktop/tablet
const subStyleDataBlock = {
  fontSize: "clamp(0.9rem, 1.6vw, 1.12rem)",
  lineHeight: 1.6,
  color: "#000000",
  maxWidth: 760,
  margin: "0 0 clamp(18px, 2.5vw, 24px) 0",
  fontWeight: 500
};



  const headlineStyle = {
    fontSize: "clamp(2.6rem, 5vw, 4rem)",
    fontWeight: 800,
    margin: "0 0 clamp(12px, 2vw, 16px) 0",
    fontFamily: "-apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial",
  };

  const mobileHeadlineStyle = {
    ...headlineStyle,
    fontSize: "clamp(2.2rem, 5vw, 4rem)",

  };

  // === CTA row with subdomain input + button (no external CSS)
  const ctaRowStyle = {
    width: "100%",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "0px" : "16px",
    justifyContent: isMobile ? "center" : "flex-start",
    alignItems: "stretch",
    marginTop: "clamp(8px, 2vw, 16px)"
  };

const inputWrapStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  background: "#FFFFFF",
  borderRadius: "14px",
  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  paddingLeft: "16px",
  paddingRight: "16px",
  height: isMobile ? "60px" : "52px",
  boxSizing: "border-box",
  width: "100%",
  maxWidth: isMobile ? "100%" : "480px",
};


  const inputStyle = {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "16px",
    fontWeight: 600,
    color: "#0b1220",
    paddingRight: "120px"
  };

  const suffixStyle = {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "15px",
    color: "#6b7280",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  };

  const startBtnStyle = {
    appearance: "none",
    border: "none",
    height: isMobile ? "60px" : "52px",
    width: "100%",
    padding: "0 28px",
    fontSize: "16px",
    fontWeight: 700,
    borderRadius: "16px",
    cursor: "pointer",
    background: "#37353E",
    color: "#FFFFFF",
    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    alignSelf: isMobile ? "stretch" : "auto"

  };

  const startBtnHoverStyle = isHovered
    ? { transform: "translateY(-1px)", boxShadow: "0 10px 18px rgba(0,0,0,0.16)" }
    : {};

  const socialRowStyle = {
    display: "flex",
    gap: "clamp(10px, 2vw, 18px)",
    justifyContent: isMobile ? "center" : "flex-start",
    alignItems: "center",
    marginTop: "clamp(16px, 3vw, 24px)"
  };

  const iconWrapStyle = {
    width: "clamp(22px, 5vw, 32px)",
    height: "clamp(22px, 5vw, 32px)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    background: "transparent",
    overflow: "hidden"
  };

  const logoImgStyle = { width: "75%", height: "75%", objectFit: "contain", display: "block" };

  const captionStyle = {
    marginTop: "clamp(12px, 2.5vw, 18px)",
    fontSize: "clamp(0.95rem, 1.8vw, 1.2rem)",
    color: "#543A14"
  };

    const highlightText = {
    color: "#B82132",
    display: "inline-flex",
     fontSize: "clamp(2.6rem, 5vw, 4rem)",
    fontWeight: 800,
    fontFamily: "-apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial",
 

  };

     const highlightTextMobile = {
    color: "#B82132",
    display: "inline-flex",
     fontSize: "clamp(2.2rem, 5vw, 4rem)",
    fontWeight: 800,
    fontFamily: "-apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial",
 

  };

  // NEW: status row styles (inline, no external CSS)
  const statusRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 24,
    paddingTop: 6,
    paddingLeft: 4,
    fontSize: 15,
    fontWeight: 500,
  marginBottom: "8px"

  };

  const statusColor =
    availability === "available"
      ? "#4C763B" // green-700
      : availability === "taken"
      ? "#b91c1c" // red-700
      : availability === "invalid"
      ? "#92400e" // amber-700
      : availability === "error"
      ? "#7c3aed" // violet-700
      : "#4C763B"; // gray-500

  const renderLogo = (src, alt) => {
    const fallback = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    const imageSrc = src || fallback;
    return <img src={imageSrc} alt={alt} style={logoImgStyle} />;
  };

   const heroWidth = 475;
  const heroHeight = 772;



  // Sanitize input to allowed subdomain chars
  const onSubdomainChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSubdomain(cleaned);
  };

  const isValidSubdomain = (s) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s) && s.length > 0;

  // NEW: debounce & availability check
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

  // NEW: tiny inline icons (SVG) so we don’t need external CSS
  const Spinner = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      style={{ display: "block" }}
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke="#4C763B" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        fill="none"
        stroke="#4C763B"
        strokeWidth="3"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="#043915"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  const WarnIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4m0 4h.01" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke="#b45309" strokeWidth="2" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#7c3aed" strokeWidth="2" />
      <path d="M12 7v6m0 4h.01" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
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
      <div style={layoutStyle}>
        {/* LEFT: Content */}
        <div style={leftColStyle}>
          {/* Desktop headline */}
          <h1
            style={{ ...headlineStyle, display: isMobile ? "none" : "block" }}
            aria-hidden={isMobile}
          >
            {"Why Pay "}
                 <div style={highlightText}>10x More</div>
            {" for Foreign Link in Bio Tools?"}
          </h1>

          {/* Mobile headline */}
          <h1
            style={{ ...mobileHeadlineStyle, display: isMobile ? "block" : "none", margin: 0 }}
            aria-hidden={!isMobile}
          >
            <span style={{ display: "block", lineHeight: 1.25 }}>
              Why Pay <div style={highlightTextMobile}>10x More</div> for Foreign Link in Bio Tools?
            </span>
          </h1>

         <p style={subStyle}>
  India's affordable link-in-bio platform for creators and businesses. Unlimited links, UPI integration, Hindi support, and analytics — all for ₹99/month.
  {isMobile ? (
    <>
      {" "}
      <span style={subStyleDataInline}>Built in India, your data stays in India.</span>
    </>
  ) : null}
</p>

{!isMobile && (
  <p style={subStyleDataBlock}>
    Built in India, your data stays in India.
  </p>
)}


          {/* Subdomain input + CTA */}
          <div style={ctaRowStyle}>
            <label
              htmlFor="subdomain"
              style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
            >
              Enter your subdomain
            </label>

            <div style={{ display: "flex", flexDirection: "column", minWidth: isMobile ? "100%" : "360px", maxWidth: "480px" }}>
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

              {/* NEW: status row */}
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
              Get started for free
            </button>
          </div>


     <div style={captionStyle}>
  Trusted by <span style={{ display : 'inline', fontWeight : 500}}>65,000+</span> Indian Influencers.</div>
</div>


        {/* RIGHT: Image */}
        <div style={rightColStyle}>
          {heroImage ? (
            <img
              src={heroImage}
              alt="Showcase of MyHandle link-in-bio on mobile and desktop"
              style={heroImgStyle}

              // ✅ Critical changes for LCP
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width={heroWidth}
              height={heroHeight}

              // If you have responsive variants, also add:
              // srcSet="https://.../hero_768.webp 768w, https://.../hero_1280.webp 1280w, https://.../hero_1920.webp 1920w"
              // sizes={isMobile ? "100vw" : "50vw"}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
