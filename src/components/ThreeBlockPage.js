import { useEffect, useState } from "react";

export default function ThreeBlockPage() {
  // Track small-screen (<= 900px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:900px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:900px)");
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // ===== Global wrapper =====
  const outerWrap = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0px", // sections already include padding
  };

  // ===== Reusable styles =====
  const sectionWrap = (bg) => ({
    background: bg,
    color: "#FFFFFF",
    padding: isMobile
      ? "clamp(48px, 8vw, 72px) clamp(16px, 5vw, 56px)"
      : "clamp(72px, 8vw, 120px) clamp(32px, 7vw, 120px)",
  });

  const row = (reverse) => ({
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: isMobile ? "column" : reverse ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: isMobile ? "28px" : "48px",
  });

  const col = {
    flex: "1 1 50%",
    display: "flex",
    flexDirection: "column",
    alignItems: isMobile ? "flex-start" : "flex-start",
    textAlign: isMobile ? "left" : "left",
    minWidth: 0,
  };

  const titleStyle = {
    fontSize: isMobile ? "clamp(2rem, 7vw, 3rem)" : "clamp(2.6rem, 5vw, 4rem)",
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: 0,
  };

  const descStyle = {
    marginTop: "18px",
    fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.88)",
    maxWidth: 640,
  };

  const ctaStyle = {
    appearance: "none",
    border: "none",
    marginTop: "28px",
    height: 56,
    padding: "0 28px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 999,
    cursor: "pointer",
    background: "rgba(255,255,255,0.9)",
    color: "#111827",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  const imageWrap = {
    flex: "1 1 50%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: isMobile ? "flex-start" : "flex-end",
    minWidth: 0,
  };

  const heroImg = {
    width: "100%",
    maxWidth: 520,
    height: "auto",
    objectFit: "cover",
    borderRadius: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
  };

  // Optional: a soft floating card behind the main image to echo the Linktree look
  const floatCard = (size = 120, radius = 28, opacity = 0.22) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: radius,
    background: "rgba(255,255,255," + opacity + ")",
    filter: "blur(0.2px)",
  });

  const sections =[
    {
      bg: "#6D0011", // deep maroon
      title: "One link for every platform",
      desc:
        "Share your MyHandle across Instagram, YouTube, LinkedIn, Snapchat, and beyond. Drop it in bios, descriptions, and posts—then convert offline scans via your QR code.",
      cta: "Get started for free",
      image:
        "https://storage.googleapis.com/postlnbucketcom/products/ChatGPT%20Image%20Oct%206%2C%202025%2C%2010_05_48%20PM.png",
    },
    {
      bg: "#0F172A", // slate-950
      title: "Convert clicks into results",
      desc:
        "Accept payments, sell downloads, build your email list, and spotlight your top links—everything on one page.",
      cta: "Create your page",
      image:
        "https://storage.googleapis.com/postlnbucketcom/products/ChatGPT%20Image%20Oct%206%2C%202025%2C%2010_40_17%20PM.png",
    },
    {
      bg: "#052E2B", // deep green
      title: "Grow on every channel",
      desc:
        "Share one memorable MyHandle link across Instagram, YouTube, WhatsApp, and more. Update once—it's current everywhere.",
      cta: "Try it now",
      image:
        "https://storage.googleapis.com/postlnbucketcom/products/ChatGPT%20Image%20Oct%206%2C%202025%2C%2010_44_25%20PM.png",
    },
  ]

  return (
    <section style={outerWrap} aria-label="Share Anywhere Sections">
      {sections.slice(0, 3).map((s, i) => {
        const reverse = i % 2 === 1; // alternate layout
        return (
          <div key={i} style={sectionWrap(s.bg)}>
            <div style={row(reverse)}>
              {/* Content */}
              <div style={col}>
                <h2 style={titleStyle}>{s.title}</h2>
                <p style={descStyle}>{s.desc}</p>
                <button
                  style={ctaStyle}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {s.cta}
                </button>
              </div>

              {/* Image (with subtle decorative blocks to match vibe) */}
              <div style={imageWrap}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 560,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: isMobile ? "8px" : "12px",
                  }}
                >
                  {/* Floating soft shapes */}
                  <div style={{ ...floatCard(90, 22, 0.18), top: -16, left: -16 }} />
                  <div style={{ ...floatCard(70, 18, 0.14), bottom: -12, right: 12 }} />
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    style={heroImg}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
