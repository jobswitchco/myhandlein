import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/myhandle_logo.svg";

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [visible, setVisible] = useState(true); // navbar visible or hidden (for scroll)
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const ticking = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();


  // media query used in JS so all styles are inline (no external CSS)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handle = () => setIsMobile(mq.matches);
    handle();
    mq.addEventListener?.("change", handle);
    return () => mq.removeEventListener?.("change", handle);
  }, []);

  // Scroll handler: hide on scroll down, show on scroll up
  useEffect(() => {
    const threshold = 10; // minimum px change to consider
    const rafCb = () => {
      const currentY = window.scrollY;
      const lastY = lastScrollY.current;
      const delta = currentY - lastY;

      // If near top, always show
      if (currentY < 60) {
        setVisible(true);
      } else if (Math.abs(delta) > threshold) {
        // scroll down -> hide, scroll up -> show
        if (delta > 0) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      }
      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(rafCb);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  const featuresRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (featuresRef.current && !featuresRef.current.contains(e.target)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  // --- Inline styles ---
const headerStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",

  /* 👇 Matches hero gradient + grid tone */
    background:
        "radial-gradient(1200px 600px at 15% 20%, #C7C8CC, transparent 100%)," +
        "radial-gradient(1000px 600px at 40% 80%, #FCF8F8, transparent 65%)",
  
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  padding: "0px 15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 200,
  boxSizing: "border-box",

  /* Soft separation without a hard line */
  borderBottom: "1px solid rgba(0,0,0,0.04)",

  /* hide/show transition */
  transform: visible ? "translateY(0)" : "translateY(-120%)",
  transition: "transform 240ms cubic-bezier(.2,.9,.2,1)",
  pointerEvents: visible ? "auto" : "none",
};


  const leftStyle = {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
    minWidth: 0,
  };

  const centerWrapStyle = {
    display: isMobile ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "1 1 auto",
    pointerEvents: "auto",
  };

  const navListStyle = {
    display: "flex",
    gap: 18,
    alignItems: "center",
    justifyContent: "center",
  };

  const navItemStyle = {
    fontSize: "1rem",
    color: "#0f1724",
    textDecoration: "none",
    cursor: "pointer",
    padding: "8px 6px",
    borderRadius: 8,
    background: "transparent",
    lineHeight: 1,
    fontWeight: 400
  };

  const arrowStyle = (open) => ({
    display: "inline-block",
    transition: "transform 170ms ease",
    transform: open ? "rotate(180deg) translateY(1px)" : "rotate(0deg)",
    width: 14,
    height: 14,
  });


  const rightStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: '10%',
  };


    const startBtnStyle = {
    appearance: "none",
    border: "none",
    height: isMobile ? "52px" : "46px",
    width: "100%",
    padding: "0 28px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "8px",
    cursor: "pointer",
    background: "#37353E",
    color: "#FFFFFF",
    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    alignSelf: isMobile ? "stretch" : "auto"

  };

  const leftSignInBtnStyle = {
    appearance: "none",
    border: "none",
    height: isMobile ? "52px" : "46px",
    width: "100%",
    padding: "0 56px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "8px",
    cursor: "pointer",
    background: "none",
    border: "1px solid #37353E",
    color: "#37353E",
    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    alignSelf: isMobile ? "stretch" : "auto"

  };


const mobileMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  borderTop: "1px solid rgba(15,23,42,0.04)",
  boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  padding: 12,
  display: mobileOpen ? "block" : "none",
  zIndex: 80,
  overflow: "hidden", // 👈 IMPORTANT for gradients
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};


  const mobileLinkStyle = {
    padding: "12px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textDecoration: "none",
    color: "#0f1724",
    borderRadius: 8,
    fontSize : "1rem",
    fontWeight: 600

  };

  // simple inline icons
  const IconBuild = (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="#0f1724" strokeWidth="1.2" />
      <path d="M7 13h10M7 9h10" stroke="#0f1724" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const IconReddit = (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2c.7 0 1.3.6 1.3 1.3S12.7 4.6 12 4.6 10.7 4 10.7 3.3 11.3 2 12 2z" fill="#0f1724" />
      <path d="M22 12a9.9 9.9 0 11-20 0 9.9 9.9 0 0120 0z" fill="none" stroke="#0f1724" strokeWidth="1.2" />
      <path d="M7.5 14c0 1.8 3 3.3 4.5 3.3S16.5 15.8 16.5 14" stroke="#0f1724" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );

  const IconApp = (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="#0f1724" strokeWidth="1.2" />
      <path d="M8 8l8 8M16 8L8 16" stroke="#0f1724" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const IconBoilerplate = (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="#0f1724" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );

  const submenu = [
    { key: "buildhub", title: "BuildHub AI", desc: "Build & Scale Your SaaS with One Platform", icon: IconBuild, to: "/buildhub" },
    { key: "reddit", title: "Reddit AI Agent", desc: "AI-powered Reddit content analysis tool", icon: IconReddit, to: "/reddit-agent" },
    { key: "appstore", title: "App Store Analysis", desc: "Uncover mobile app market opportunities", icon: IconApp, to: "/app-store" },
    { key: "starter", title: "Micro SaaS Boilerplate", desc: "Complete production-ready starter template", icon: IconBoilerplate, to: "/starter" },
  ];

  return (
    <header style={headerStyle}>
      {/* LEFT: Logo */}
      {/* ===== Navbar Background Layer ===== */}
<div
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  }}
>
  {/* Instagram-style gradient wash */}
  <div
    style={{
      position: "absolute",
       background:'#C7C8CC'
    }}
  />

  {/* Very subtle grid hint */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px",
      opacity: 0.35,
    }}
  />
</div>

    <Link
  to="/"
  style={leftStyle}
  onClick={(e) => {
    if (mobileOpen) setMobileOpen(false);

    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    e.preventDefault();
    navigate("/");

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  }}
>
  <img
    src={logo}
    alt="MyHandle Logo"
    width="140"
    height="60"
    loading="eager"
    decoding="async"
    style={{ display: "block" }}
  />
</Link>



      {/* CENTER: main nav (centered on large screens) */}
      <div style={centerWrapStyle}>
        <nav aria-label="Primary" style={navListStyle}>
          {/* <div
            ref={featuresRef}
            style={featuresBtnStyle}
            onMouseEnter={() => !isMobile && setFeaturesOpen(true)}
            onMouseLeave={() => !isMobile && setFeaturesOpen(false)}
          >
            <a
              href="#features"
              onClick={(e) => {
                if (isMobile) {
                  e.preventDefault();
                  setFeaturesOpen((s) => !s);
                }
              }}
              style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}
              aria-haspopup="true"
              aria-expanded={featuresOpen}
            >
              <span style={{ lineHeight: 1, fontSize: "1rem", fontWeight: 600 }}>Features</span>
              <span style={arrowStyle(featuresOpen)} aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="#0f1724" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>

            {!isMobile && featuresOpen && (
              <div role="menu" aria-label="Features submenu" style={dropdownStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {submenu.map((s) => (
                    <Link key={s.key} to={s.to} style={dropdownItemStyle}>
                      <div style={{ width: 36, height: 36 }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={itemTitleStyle}>{s.title}</div>
                        <div style={itemDescStyle}>{s.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div> */}

          {/* <Link to="/pricing" style={navItemStyle}>Pricing</Link>
          <Link to="/trust-center" style={navItemStyle}>Trust Center</Link>
         */}
        </nav>
      </div>

      {/* RIGHT: Join Waitlist (desktop only) and mobile hamburger */}
    <div style={rightStyle}>

  {/* Try for Free — desktop only */}
  {!isMobile && (
    <button
      style={leftSignInBtnStyle}
      onClick={() => navigate("/professional/login")}
    >
      Sign In
    </button>
  )}

  {/* hamburger visible only on mobile */}
  <button
    onClick={() => setMobileOpen((s) => !s)}
    aria-label="Toggle menu"
    aria-expanded={mobileOpen}
    style={{
      marginLeft: 6,
      border: "none",
      background: "transparent",
      padding: 8,
      display: isMobile ? "inline-flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      borderRadius: 8,
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="#0f1724"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>

</div>


    {/* MOBILE MENU */}
{/* MOBILE MENU */}
{isMobile && (
  <div style={mobileMenuStyle}>

    {/* 🌈 Background layers */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* Instagram-style gradient wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:"#C7C8CC"
                 }}
      />

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          opacity: 0.25,
        }}
      />
    </div>

    {/* 🔗 Menu content */}
    <div
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Link to="/pricing" style={mobileLinkStyle}>
        Pricing
      </Link>

      <Link to="/trust-center" style={mobileLinkStyle}>
        Trust Center
      </Link>

      <Link
        to="/professional/login"
        style={{
          ...mobileLinkStyle,
          fontWeight: 600,
          border: "1px solid rgba(15,23,42,0.08)",
          background: "#37353E",
          color: "#FFFFFF",
          boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
          justifyContent: "center",
          maxWidth: "80%",
        }}
        onClick={() => setMobileOpen(false)}
      >
        Sign In
      </Link>
    </div>
  </div>
)}


    </header>
  );
}
