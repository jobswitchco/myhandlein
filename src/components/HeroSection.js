import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';


export default function Hero({
  logos = {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();


  // Track small-screen for accessibility (so we can set aria-hidden properly)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:600px)").matches
  );

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

  // === Highlight sizing tokens (strings so we can reuse in calc())
  const padX = "clamp(0.05em, 1.4vw, 0.05em)";         // horizontal padding for highlight
  const highlightHeight = "clamp(0.42em, 1.8vw, 0.42em)"; // blue bar height
  const highlightRadius = "0px";
  const highlightColor = "linear-gradient(120deg, #FFFFFF 0%, #8b5cf6 80%, #8b5cf6 100%)";
  // This controls where the bar starts vertically relative to the text box.
  // "75%" means the top of the bar sits at 75% down the line box (i.e. lower than center).
  const barOffset = "65%";

  // Inline style objects (kept largely as you provided)
  const containerStyle = {
    minHeight: "68vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding:
      "clamp(20vh, 12vw, 28vh) clamp(16px, 5vw, 24px) clamp(14vh, 12vw, 18vh) clamp(16px, 5vw, 24px)",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0b1220",
    textAlign: "center"
  };

  const contentStyle = {
    maxWidth: 980,
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  };

  const subStyle = {
    fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
    lineHeight: 1.6,
    color: "#374151",
    margin: "0 0 clamp(18px, 2.5vw, 32px) 0",
    maxWidth: 760,
    textAlign: "center",
    marginTop: "1rem"
  };

  const headlineStyle = {
    fontSize: "clamp(2.6rem, 5vw, 4rem)",
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 clamp(12px, 2vw, 24px) 0"
  };

  // Slightly tighter mobile font (optional)
  const mobileHeadlineStyle = {
    ...headlineStyle,
    fontSize: "clamp(2rem, 7vw, 3rem)" // tune if you want it smaller on tiny screens
  };

  const ctaRowStyle = {
    display: "flex",
    gap: "clamp(8px, 2vw, 16px)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "clamp(8px, 2vw, 16px)"
  };

  const joinBtnStyle = {
    appearance: "none",
    border: "none",
    padding: "clamp(10px, 2vw, 12px) clamp(32px, 4vw, 44px)",
    fontSize: "clamp(0.9rem, 1vw, 1.1rem)",
    fontWeight: 600,
    borderRadius: "clamp(22px, 2vw, 32px)",
    cursor: "pointer",
    background: isHovered ? "linear-gradient(90deg, #FDFAF6 0%, #8b5cf6 40%, #000000 100%)":"linear-gradient(90deg, #000000 0%, #8b5cf6 40%, #F1EAFF 100%)",
    color: "#FFFFFF",
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5em"
  };

  const socialRowStyle = {
    display: "flex",
    gap: "clamp(10px, 2vw, 18px)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "clamp(20px, 4vw, 32px)"
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

  const logoImgStyle = {
    width: "75%",
    height: "75%",
    objectFit: "contain",
    display: "block"
  };

  const captionStyle = {
    marginTop: "clamp(14px, 3vw, 24px)",
    fontSize: "clamp(0.75rem, 1.5vw, 0.9rem)",
    color: "#6b7280"
  };

  const renderLogo = (src, alt) => {
    const fallback = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    const imageSrc = src || fallback;
    return <img src={imageSrc} alt={alt} style={logoImgStyle} />;
  };

  // === Inline highlight builder: returns a React node with
  // wrapper (inline-block, relative) -> bg bar (absolute) -> text (relative, zIndex 1)
  const Highlight = ({ children }) => {
    // wrapper style
    const wrapperStyle = {
      position: "relative",
      display: "inline-block",
      paddingLeft: padX,
      paddingRight: padX,
      zIndex: 0,
      // slight extra line-height so the lowered bar has room without clipping
      lineHeight: 1.15
    };

    // background bar style (absolute element)
    const bgStyle = {
      content: '""',
      position: "absolute",
      left: `calc(-1 * ${padX})`,   // extend left
      right: `calc(-1 * ${padX})`,  // extend right
      top: barOffset,               // <-- moved down to start lower
      transform: "translateY(0)",   // no upward translate so bar's top sits at barOffset
      height: highlightHeight,
      background: highlightColor,
      borderRadius: highlightRadius,
      zIndex: 0,
      pointerEvents: "none"
    };

    // text style (on top)
    const textStyle = {
      position: "relative",
      zIndex: 1,
      whiteSpace: "nowrap" // keep the word together — remove this if you want it to wrap
    };

    return (
      <span style={wrapperStyle} aria-hidden={false}>
        <span style={bgStyle} aria-hidden="true" />
        <span style={textStyle}>{children}</span>
      </span>
    );
  };

  return (
    <section style={containerStyle} aria-label="Hero">
      <div style={contentStyle}>
        {/* Desktop variant (single line) using inline display toggle */}
        <h1
          style={{
            ...headlineStyle,
            display: isMobile ? "none" : "block"
          }}
          aria-hidden={isMobile}
        >
          {"The "}
          <Highlight>Growth</Highlight>
          {" Platform for Solo Founders."}
        </h1>

        {/* Mobile variant (three stacked lines) */}
        <h1
          style={{
            ...mobileHeadlineStyle,
            display: isMobile ? "block" : "none",
            margin: 0 // we'll control spacing with spans
          }}
          aria-hidden={!isMobile}
        >

          <span style={{ display: "block", lineHeight: 1.5 }}>
            The <Highlight>Growth</Highlight> Platform
          </span>

          <span style={{ display: "block", lineHeight: 1.5 }}>
            for Solo Founders.
          </span>
        </h1>

        <p style={subStyle}>
          Collect real insights, test ideas, and grow your startup with feedback that truly matters across Reddit, LinkedIn, and Twitter.
        </p>

        <div style={ctaRowStyle}>
          <button
            onClick={()=> navigate('/join-waitlist')}
            style={joinBtnStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span>Get Early Access</span>
            <span>&#8599;</span>
          </button>
        </div>

        <div style={socialRowStyle} aria-hidden>
          <span style={iconWrapStyle} title="Apple">
            {renderLogo(logos.reddit, "Apple logo")}
          </span>

          <span style={iconWrapStyle} title="LinkedIn">
            {renderLogo(logos.linkedin, "LinkedIn logo")}
          </span>

          <span style={iconWrapStyle} title="Twitter">
            {renderLogo(logos.twitter, "Twitter logo")}
          </span>

          <span style={iconWrapStyle} title="Facebook">
            {renderLogo(logos.facebook, "Facebook logo")}
          </span>
        </div>

        <div style={captionStyle}>Trusted by founders and product teams</div>
      </div>
    </section>
  );
}
