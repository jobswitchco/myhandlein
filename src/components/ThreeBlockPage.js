import { useEffect, useState } from "react";

// Custom SVG Icon Component
const Icon = ({ d, size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

// Icon definitions
const icons = {
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  flash: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  instagram: ["M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", "M17.5 6.5h.01M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"],
  youtube: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02l0-6.59 5.75 3.3z",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
  qrCode: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 7h1M8 12h1M12 7h1M12 12h1M16 7h1M16 12h1M7 16h1M12 16h1M16 16h1",
  creditCard: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  barChart: "M18 20V10M12 20V4M6 20v-6",
  sparkles: "M12 2L15 8.5L22 12L15 15.5L12 22L9 15.5L2 12L9 8.5L12 2z M5 3v4M3 5h4M19 17v4M17 19h4",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const ShareIcon = (props) => <Icon d={icons.share} {...props} />;
const TrendingUp = (props) => <Icon d={icons.trendingUp} {...props} />;
const FlashOnIcon = (props) => <Icon d={icons.flash} {...props} />;
const InstagramIcon = (props) => <Icon d={icons.instagram} {...props} />;
const YouTubeIcon = (props) => <Icon d={icons.youtube} {...props} />;
const LinkedInIcon = (props) => <Icon d={icons.linkedin} {...props} />;
const QrCodeIcon = (props) => <Icon d={icons.qrCode} {...props} />;
const CreditCardIcon = (props) => <Icon d={icons.creditCard} {...props} />;
const MailIcon = (props) => <Icon d={icons.mail} {...props} />;
const LinkIcon = (props) => <Icon d={icons.link} {...props} />;
const LanguageIcon = (props) => <Icon d={icons.globe} {...props} />;
const BarChart = (props) => <Icon d={icons.barChart} {...props} />;
const Sparkles = (props) => <Icon d={icons.sparkles} {...props} />;
const ArrowForwardIcon = (props) => <Icon d={icons.arrowRight} {...props} />;
export default function ThreeBlockPage() {
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

  // Section 1: Platform Showcase with animated cards


const Section1 = () => {
  const isMobile = window.innerWidth < 768;
  
  const stats = [
    { label: "Comments Replied", value: "12.3k+", icon: TrendingUp, color: "#FF6B6B" },
    { label: "DMs Sent", value: "12.3k+", icon: MailIcon, color: "#FFB84D" },
    { label: "Link Click Rate", value: "93.6%", icon: BarChart, color: "#A78BFA" },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%)",
      padding: isMobile ? "80px 24px" : "140px 48px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        right: "15%",
        width: 500,
        height: 500,
        background: "radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        gap: isMobile ? "48px" : "80px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Left: Stats Dashboard */}
        <div
  style={{
    flex: "1 1 50%",
    width: "100%",
    order: isMobile ? 2 : 1,
  }}
>

          <div style={{
            background: "linear-gradient(145deg, rgba(42, 42, 42, 0.9) 0%, rgba(50, 50, 50, 0.85) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 24,
            padding: isMobile ? "32px 24px" : "48px 40px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              left: 40,
              background: "linear-gradient(135deg, #FF6B6B 0%, #FFB84D 100%)",
              padding: "8px 20px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              color: "#FFF",
              boxShadow: "0 8px 24px rgba(255, 107, 107, 0.4)",
            }}>
              Live Automation
            </div>

            <h3 style={{
              fontSize: isMobile ? "1.6rem" : "2.4rem",
              fontWeight: 700,
              color: "#FFF",
              marginTop: 24,
              marginBottom: 32,
              fontFamily: 'Inter'
            }}>
              Automation Performance
            </h3>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 16,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateX(8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: `${s.color}22`,
                    border: `2px solid ${s.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <s.icon size={28} color={s.color} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#FFF" }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Content */}
      <div
  style={{
    flex: "1 1 50%",
    order: isMobile ? 1 : 2,
  }}
>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 107, 107, 0.15)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            borderRadius: "100px",
            padding: "8px 20px",
            marginBottom: "24px",
          }}>
            <Sparkles size={16} color="#FF6B6B" />
            <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: "#FF6B6B" }}>Smart Reply Engine</span>
          </div>

          <h2 style={{
            fontSize: isMobile ? "clamp(2rem, 7vw, 3rem)" : "clamp(2.8rem, 5vw, 4rem)",
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 24px 0",
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFB84D 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: 'Inter'
          }}>
            Turn engagement into real clicks.
          </h2>

          <p style={{
            fontSize: isMobile ? "1.1rem" : "1.3rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 32,
            fontFamily: 'Inter'
          }}>
            Our smart engine replies to comments and DMs in a natural, human-like way—ensuring high inbox delivery and better conversations. The result? More opens, more clicks, and more clients.
          </p>

          <button
            style={{
              border: "none",
              height: 58,
              padding: "0 36px",
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 12,
              cursor: "pointer",
              background: "linear-gradient(135deg, #FF6B6B 0%, #FFB84D 100%)",
              color: "#FFF",
              boxShadow: "0 16px 40px rgba(255, 107, 107, 0.4)",
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: 'Inter'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 20px 50px rgba(255, 107, 107, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(255, 107, 107, 0.4)";
            }}
            onClick={() => window.location.href = '/professional/login'}
          >
            Try Free for 7 days
            <TrendingUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Section2 = () => {
  return (
    <div style={{
      background: "linear-gradient(180deg, #020617 0%, #0F172A 100%)",
      padding: isMobile ? "80px 24px" : "140px 48px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "10%",
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "15%",
        width: 300,
        height: 300,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(50px)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: isMobile ? "column" : "row-reverse",
        alignItems: "center",
        gap: isMobile ? 48 : 80,
        position: "relative",
        zIndex: 1,
      }}>

        {/* Left: Capacity Visualization */}
        <div
  style={{
    flex: "1 1 50%",
    width: "100%",
    order: isMobile ? 2 : 1,
  }}
>

          <div style={{
            background: "linear-gradient(145deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))",
            border: "2px solid rgba(139,92,246,0.4)",
            borderRadius: 28,
            padding: isMobile ? "40px 28px" : "56px 48px",
            boxShadow: "0 40px 100px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Glowing orb effect */}
            <div style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }} />

            {/* Main capacity display */}
            <div style={{
              textAlign: "center",
              marginBottom: 36,
              position: "relative",
            }}>
              <div style={{
                fontSize: isMobile ? "3rem" : "5rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 50%, #6366F1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: 12,
              }}>
                25,00,000
              </div>
              <div style={{
                fontSize: isMobile ? "0.9rem" : "1.35rem",
                fontWeight: 700,
                color: "#A78BFA",
                letterSpacing: "0.05em",
                // textTransform: "uppercase",
              }}>
                Auto-Replies / Month
              </div>
            </div>

            {/* Metric cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 16,
              marginTop: 32,
            }}>
              <div style={{
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 16,
                padding: "20px 24px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: isMobile ? "2rem" : "2.5rem",
                  fontWeight: 900,
                  color: "#FFF",
                  marginBottom: 4,
                }}>
                  83,333
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                }}>
                  Replies per day
                </div>
              </div>

              <div style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 16,
                padding: "20px 24px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: isMobile ? "2rem" : "2.5rem",
                  fontWeight: 900,
                  color: "#FFF",
                  marginBottom: 4,
                }}>
                  3,472
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                }}>
                  Replies per hour
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div style={{
              marginTop: 32,
              padding: "16px 24px",
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 20px rgba(16,185,129,0.8)",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#10B981",
              }}>
                Zero throttling. Ever.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div
  style={{
    flex: "1 1 50%",
    order: isMobile ? 1 : 2,
  }}
>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.4)",
            borderRadius: 100,
            padding: "10px 24px",
            marginBottom: 24,
          }}>
            <FlashOnIcon size={18} color="#A78BFA" strokeWidth={2.5} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#A78BFA" }}>
              No Bottlenecks
            </span>
          </div>

          <h2 style={{
            fontSize: isMobile ? "clamp(2rem,7vw,3rem)" : "clamp(2.8rem,5vw,4rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            lineHeight: 1.15,
            background: "linear-gradient(135deg,#FFF 0%,#C4B5FD 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Never think about limits again.
          </h2>

        

          <p style={{ 
            fontSize: isMobile ? "1.15rem" : "1.3rem", 
            lineHeight: 1.7, 
            color: "rgba(255,255,255,0.8)", 
            marginBottom: 32 
          }}>
            Most tools force you to slow down when engagement spikes. With <span style={{ fontWeight: 700, color: "#A78BFA" }}>25 lakh auto-replies per month</span>, MyHandle keeps your conversations flowing.
          </p>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "24px 28px",
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 16,
          }}>
            {[
              "Handle viral moments without breaking a sweat",
              "Scale across multiple platforms simultaneously",
              "Never miss a lead during peak engagement"
            ].map((text, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#FFF",
                }}>
                  ✓
                </div>
                <span style={{
                  fontSize: isMobile ? "0.95rem" : "1.05rem",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 500,
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// Icons
const FilterIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const CheckIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const UserIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);



const Section3 = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:900px)");
    const handler = (e) => setIsMobile(e.matches);
    handler({ matches: mq.matches });
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const conversations = [
    { 
      name: "Sarah M.", 
      message: "I'd love to book a consultation...",
      tag: "High intent",
      tagColor: "#34D399", // Bright Mint for contrast against purple
      bg: "rgba(52, 211, 153, 0.1)", 
      time: "2m ago",
      highlight: true
    },
    { 
      name: "Mike T.", 
      message: "What's your pricing for...",
      tag: "Potential",
      tagColor: "#60A5FA", // Blue
      bg: "rgba(37, 99, 235, 0.1)", 
      time: "15m ago",
      highlight: false
    },
    { 
      name: "Lisa K.", 
      message: "Thanks! Will get back to you...",
      tag: "Follow up",
      tagColor: "#FBBF24", // Amber
      bg: "rgba(245, 158, 11, 0.1)",
      time: "1h ago",
      highlight: false
    },
    { 
      name: "John D.", 
      message: "Cool content!",
      tag: "Low priority",
      tagColor: "#9CA3AF", // Gray
      bg: "rgba(107, 114, 128, 0.1)",
      time: "3h ago",
      highlight: false
    },
  ];

  return (
    <div style={{
      // OPTION: Deep Indigo Spotlight. Looks very "Tech/AI" and premium.
      background: "radial-gradient(ellipse at 50% -20%, #6B3F69 0%, #020617 80%)", // Indigo-950 to Rich Black
      padding: isMobile ? "80px 24px" : "140px 60px",
      position: "relative",
      overflow: "hidden",
    }}>
      
      {/* Subtle Grid Texture to add depth */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        opacity: 0.4,
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: isMobile ? "column-reverse" : "row",
        alignItems: "center",
        gap: isMobile ? 60 : 100,
        position: "relative",
        zIndex: 1,
      }}>

        {/* RIGHT SIDE: The Interface Visualization */}
        <div style={{ flex: "1 1 50%", width: "100%" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.03)", // Ultra dark glass
            backdropFilter: "blur(24px)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 80px -12px rgba(0, 0, 0, 0.7)", // Deep shadow
            padding: "32px",
            position: "relative",
          }}>
            
            {/* Window Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>Priority Inbox</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Sorted by buying intent</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", 
                display: "flex", alignItems: "center", justifyContent: "center", color: "#A5B4FC"
              }}>
                <FilterIcon size={18} />
              </div>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {conversations.map((conv, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: 16,
                  // Highlight logic
                  background: conv.highlight ? "rgba(49, 46, 129, 0.4)" : "transparent", // Indigo tint for highlight
                  border: conv.highlight ? "1px solid #6366F1" : "1px solid transparent", // Indigo border
                  boxShadow: conv.highlight ? "0 8px 20px -5px rgba(0,0,0,0.4)" : "none",
                  transform: conv.highlight ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.3s ease",
                  position: 'relative'
                }}>
                   {/* Avatar */}
                   <div style={{
                     width: 44, height: 44, borderRadius: "50%",
                     background: conv.bg,
                     color: conv.tagColor,
                     display: "flex", alignItems: "center", justifyContent: "center",
                     fontWeight: 700, fontSize: 16, flexShrink: 0
                   }}>
                     {conv.name.charAt(0)}
                   </div>

                   {/* Text */}
                   <div style={{ flex: 1 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                       <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: 15 }}>{conv.name}</span>
                       <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{conv.time}</span>
                     </div>
                     <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{conv.message}</div>
                     
                     <div style={{
                       display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6,
                       background: conv.bg, color: conv.tagColor, fontSize: 11, fontWeight: 700, border: `1px solid ${conv.tagColor}40`
                     }}>
                        {conv.tag}
                     </div>
                   </div>

                   {/* Checkmark for high intent */}
                   {conv.highlight && (
                     <div style={{
                       position: "absolute", top: -8, right: -8,
                       background: "#6366F1", color: "#fff",
                       width: 22, height: 22, borderRadius: "50%",
                       display: "flex", alignItems: "center", justifyContent: "center",
                       boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                     }}>
                       <CheckIcon size={12} />
                     </div>
                   )}
                </div>
              ))}
            </div>

            {/* Floating Label */}
            <div style={{
              position: "absolute", bottom: 20, right: -20,
              background: "#6366F1", color: "#fff",
              padding: "10px 20px", borderRadius: 100,
              fontSize: 13, fontWeight: 700,
              boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)",
              display: isMobile ? "none" : "block"
            }}>
              4 Leads Detected
            </div>

          </div>
        </div>

        {/* LEFT SIDE: Content */}
        <div style={{ flex: "1 1 50%" }}>
          
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100,
            background: "rgba(99, 102, 241, 0.15)", // Indigo tint
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#A5B4FC",
            fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
            marginBottom: 24
          }}>
            Clarity over Chaos
          </div>

          <h2 style={{
            fontSize: isMobile ? "2.25rem" : "3.5rem",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.1,
            marginBottom: 24,
            fontFamily: "Inter, sans-serif"
          }}>
            Stop scanning DMs.<br />
            <span style={{ 
               background: "linear-gradient(135deg, #FFF 0%, #818CF8 100%)",
               WebkitBackgroundClip: "text",
               WebkitTextFillColor: "transparent"
            }}>Start spotting clients.</span>
          </h2>

          <p style={{
            fontSize: "1.125rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 36
          }}>
            When everything lands in one noisy inbox, you waste hours guessing which conversations matter. MyHandle separates the signal from the noise automatically.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "AI categorizes every conversation instantly",
              "See buyer intent score before opening messages",
              "Prioritize high-value leads automatically"
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "rgba(99, 102, 241, 0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#A5B4FC"
                }}>
                  <CheckIcon size={14} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{text}</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};





const Section4 = () => {
  const bioStats = [
    { label: "Profile Visitors", value: "12.6k", percent: 82, color: "#F472B6" },
    { label: "Link Clicks", value: "4.3k", percent: 68, color: "#34D399" },
    { label: "Click-Through Rate", value: "34.1%", percent: 74, color: "#A78BFA" },
    { label: "Actions Taken", value: "1.8k", percent: 61, color: "#FB7185" },
  ];

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #3B0764 0%, #065F46 55%, #022C22 100%)",
        padding: isMobile ? "80px 24px 100px" : "140px 48px 160px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            gap: isMobile ? "56px" : "88px",
          }}
        >
          {/* LEFT — Smart Bio Performance Card */}
          <div style={{ flex: "1 1 50%", width: "100%" }}>
            <div
              style={{
                background:
                  "linear-gradient(160deg, rgba(236,72,153,0.15), rgba(52,211,153,0.12))",
                backdropFilter: "blur(22px)",
                border: "1px solid rgba(236,72,153,0.28)",
                borderRadius: 26,
                padding: isMobile ? "32px 24px" : "48px 42px",
                boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 30,
                }}
              >
                <FlashOnIcon size={28} color="#F9A8D4" />
                <h4
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#FBCFE8",
                  }}
                >
                  Live Link-in-Bio Performance
                </h4>
              </div>

              {bioStats.map((item, i) => (
                <div key={i} style={{ marginBottom: 26 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#FFFFFF",
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 11,
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: 100,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${item.percent}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}AA)`,
                        borderRadius: 100,
                        boxShadow: `0 0 18px ${item.color}66`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Content */}
          <div style={{ flex: "1 1 50%" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(236,72,153,0.18)",
                border: "1px solid rgba(236,72,153,0.35)",
                borderRadius: 100,
                padding: "8px 18px",
                marginBottom: 24,
              }}
            >
              <Sparkles size={16} color="#F472B6" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#FBCFE8",
                }}
              >
                Smart Link-in-Bio Engine
              </span>
            </div>

            <h2
              style={{
                fontSize: isMobile
                  ? "clamp(2rem, 7vw, 3rem)"
                  : "clamp(2.8rem, 5vw, 4rem)",
                lineHeight: 1.15,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 24px 0",
                background:
                  "linear-gradient(135deg, #FFFFFF 0%, #F9A8D4 50%, #6EE7B7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Turn your bio link into a conversion engine
            </h2>

            <p
              style={{
                fontSize: isMobile ? "1.1rem" : "1.3rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 20,
              }}
            >
              MyHandle transforms your link-in-bio from a static page into a
              smart, intent-driven landing experience that increases clicks,
              captures attention, and drives action.
            </p>

            <p
              style={{
                fontSize: isMobile ? "1.1rem" : "1.3rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 36,
              }}
            >
              Update once and let MyHandle intelligently route traffic across
              Instagram, YouTube, LinkedIn, TikTok, and future platforms —
              automatically optimized for higher click-through rates and
              conversions.
            </p>

            <button
              style={{
                border: "none",
                height: 58,
                padding: "0 38px",
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 14,
                cursor: "pointer",
                background:
                  "linear-gradient(135deg, #F472B6 0%, #34D399 100%)",
                color: "#FFFFFF",
                boxShadow: "0 18px 46px rgba(236,72,153,0.45)",
                transition: "all 0.3s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 22px 56px rgba(236,72,153,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 18px 46px rgba(236,72,153,0.45)";
              }}
              onClick={() =>
                (window.location.href = "/professional/login")
              }
            >
              Create your free bio link
              <FlashOnIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section5 = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // New Icon Paths specific for this section
  const sectionIcons = {
    eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01",
    userX: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M18 8l5 5 M23 8l-5 5"
  };

  const problems = [
    {
      title: "Invisible DMs",
      desc: "Message requests that never trigger a notification.",
      icon: sectionIcons.eyeOff,
    },
    {
      title: "Response Lag",
      desc: "Replying 4 hours later? That lead is already gone.",
      icon: sectionIcons.clock,
    },
    {
      title: "Missed Intent",
      desc: "Generic replies to 'Price please?' kill the sale.",
      icon: sectionIcons.alert,
    },
    {
      title: "Zero Follow-up",
      desc: "Manually tracking 50+ convos is impossible.",
      icon: sectionIcons.userX,
    },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, #020617 0%, #0F0505 50%, #020617 100%)",
      padding: isMobile ? "100px 24px" : "160px 48px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background Ambience: Red Warning Glow */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? 300 : 800,
        height: isMobile ? 300 : 800,
        background: "radial-gradient(circle, rgba(220, 38, 38, 0.12) 0%, transparent 60%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 100,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.1)",
            marginBottom: 32,
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", boxShadow: "0 0 10px #EF4444" }} />
            <span style={{ color: "#FCA5A5", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: 'Inter' }}>
              Critical Revenue Leak
            </span>
          </div>

          <h2 style={{
            fontSize: isMobile ? "2.5rem" : "4.5rem",
            fontWeight: 800,
            fontFamily: 'Inter',
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 24,
            color: "#FFF",
          }}>
            You’re losing clients 
            <span style={{
              background: "linear-gradient(to right, #EF4444, #F87171)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}> without realizing it.</span>
          </h2>

          <p style={{
            maxWidth: 760,
            margin: "0 auto",
            fontSize: isMobile ? "1.1rem" : "1.35rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.7)",
            fontFamily: 'Inter',
          }}>
            Most fitness creators miss <strong style={{ color: "#FFF", borderBottom: "1px dashed #F87171" }}>30–40 high-intent leads</strong> every single month.
          </p>
        </div>

        {/* The Pain Point Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 24,
          marginBottom: 64,
        }}>
          {problems.map((item, i) => (
            <div 
              key={i}
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 24,
                padding: isMobile ? "24px" : "32px",
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                e.currentTarget.style.background = "linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(255,255,255,0.01) 100%)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.background = "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                minWidth: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F87171",
              }}>
                <Icon d={item.icon} size={24} />
              </div>
              <div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#FFF",
                  marginBottom: 8,
                  fontFamily: 'Inter',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                  fontFamily: 'Inter',
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* The Solution Bridge - High Contrast Switch to Green */}
        <div style={{
          background: "linear-gradient(90deg, rgba(6, 95, 70, 0.3) 0%, rgba(4, 120, 87, 0.15) 100%)",
          border: "1px solid rgba(52, 211, 153, 0.3)",
          borderRadius: 20,
          padding: isMobile ? "24px" : "32px 48px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)"
            }}>
               {/* Checkmark Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#6EE7B7", marginBottom: 4, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                System Solution
              </div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#FFF", fontFamily: 'Inter' }}>
                MyHandle captures leads & pushes them to WhatsApp.
              </div>
            </div>
          </div>
          
          <button style={{
            background: "transparent",
            border: "1px solid rgba(52, 211, 153, 0.5)",
            color: "#34D399",
            padding: "12px 24px",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            fontFamily: 'Inter',
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.background = "rgba(52, 211, 153, 0.1)";
             e.currentTarget.style.borderColor = "#34D399";
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.background = "transparent";
             e.currentTarget.style.borderColor = "rgba(52, 211, 153, 0.5)";
          }}
          onClick={() => window.location.href = '/professional/login'}
          >
            Stop the leak &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};

const Section6 = () => {
  const steps = [
    { title: "Comment", desc: "A user engages on your post" },
    { title: "Auto DM", desc: "Instant, human-like reply is sent" },
    { title: "WhatsApp", desc: "Buyer intent is detected & pushed instantly" },
    { title: "Client", desc: "You close faster with clarity" },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, #000 0%, #000 100%)",
      padding: "140px 36px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{
          fontSize: "clamp(2.4rem,5vw,4rem)",
          fontWeight: isMobile? 800 : 800,
          fontFamily: 'Inter',
          letterSpacing: "-0.03em",
          marginBottom: 24,
          background: "linear-gradient(135deg, #FFF 0%, #34D399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: isMobile? 'left' : 'center'
        }}>
          From comment to client — automatically.
        </h2>

        <p style={{
          fontSize: "1.25rem",
          color: "rgba(255,255,255,0.8)",
          marginBottom: 72,
          textAlign: isMobile? 'left' : 'center',
          fontFamily: 'Inter'
        }}>
          A simple, proven flow used by high-converting fitness creators.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 28,
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 22,
              padding: "36px 24px",
              position: "relative",
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #34D399, #10B981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#000",
                margin: "0 auto 20px",
              }}>
                {i + 1}
              </div>

              <h4 style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#FFF",
                marginBottom: 10,
              }}>
                {step.title}
              </h4>

              <p style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 72,
          fontSize: 22,
          fontWeight: 900,
          color: "#34D399",
          fontFamily: 'Inter'
        }}>
          One client closes your subscription for months.
        </div>
      </div>
    </div>
  );
};

const Section7 = () => {
  const trustItems = [
    {
      title: "Meta Verified",
      desc: "Official APIs. Approved flows.",
      color: "#60A5FA",
      bg: "rgba(59,130,246,0.15)",
    },
    {
      title: "No Shadow Bans",
      desc: "Your reach stays protected.",
      color: "#34D399",
      bg: "rgba(16,185,129,0.15)",
    },
    {
      title: "Feels Human",
      desc: "Replies never sound automated.",
      color: "#FBBF24",
      bg: "rgba(251,191,36,0.15)",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #020617 0%, #020617 100%)",
        padding: "140px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient gradient sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.04), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        {/* Header */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 22px",
            borderRadius: 100,
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.35)",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#60A5FA",
            }}
          >
            Meta Tech Provider
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(2.4rem,5vw,3.6rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginBottom: 64,
            background: "linear-gradient(135deg, #FFF 0%, #93C5FD 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Safe by design. Invisible in action.
        </h2>

        {/* Trust Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 36,
          }}
        >
          {trustItems.map((item, i) => (
            <div
              key={i}
              style={{
                background: item.bg,
                border: `1px solid ${item.color}55`,
                borderRadius: 22,
                padding: "40px 32px",
                textAlign: "left",
                transition: "all 0.35s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = `0 20px 60px ${item.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Glow orb */}
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  background: `radial-gradient(circle, ${item.color}44, transparent 70%)`,
                  filter: "blur(30px)",
                }}
              />

              <h4
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#FFF",
                  marginBottom: 10,
                }}
              >
                {item.title}
              </h4>

              <p
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer reassurance */}
        <div
          style={{
            marginTop: 72,
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          Automation that protects your account — and your reputation.
        </div>
      </div>
    </div>
  );
};



const Section8 = () => {
  const personas = [
    {
      title: "Online Fitness Coach",
      desc: "You sell programs, transformations, or 1:1 coaching through DMs.",
    },
    {
      title: "Fitness Content Creator",
      desc: "Your posts get comments, but DMs slip through the cracks.",
    },
    {
      title: "Personal Trainer",
      desc: "You rely on Instagram to book calls and onboard new clients.",
    },
    {
      title: "Growing Influencer (15k–250k)",
      desc: "You want systems — not more manual work — to scale.",
    },
  ];

  return (
    <div
      style={{
        background: "#020617",
        padding: "150px 32px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Big statement */}
        <h2
          style={{
            fontSize: "clamp(2.8rem,6vw,4.5rem)",
            fontWeight: isMobile ? 900 : 900,
            lineHeight: 1.1,
            marginBottom: 32,
            color: "#FFFFFF",
            fontFamily: 'Inter'
          }}
        >
          This isn’t for everyone.
          <br />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            It’s built for fitness creators who want clients.
          </span>
        </h2>

        <p
          style={{
            maxWidth: 720,
            fontSize: isMobile ? "0.96rem" : "1.25rem",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 80,
            fontFamily: 'Inter'
          }}
        >
          MyHandle works best when Instagram is more than content for you.
        </p>

        {/* Persona tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 32,
          }}
        >
          {personas.map((p, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: "36px 32px",
                transition: "all 0.35s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(-6px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h4
                style={{
                  fontSize: isMobile? 20 : 22,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: 12,
                  fontFamily: 'Inter'
                }}
              >
                {p.title}
              </h4>

              <p
                style={{
                  fontSize: isMobile? 15: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: 'Inter'

                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

const Section9 = () => {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  const resources = [
    {
      title: "7-Day Fat Loss Diet Plan",
      type: "PDF",
      tag: "Diet",
      color: "#34D399",
    },
    {
      title: "High-Protein Indian Recipes",
      type: "PDF",
      tag: "Recipes",
      color: "#FBBF24",
    },
    {
      title: "Beginner Home Workout Program",
      type: "PDF",
      tag: "Workout",
      color: "#60A5FA",
    },
    {
      title: "Mobility & Recovery Guide",
      type: "PDF",
      tag: "Recovery",
      color: "#A78BFA",
    },
  ];

  const ContentBlock = () => (
    <>
      <h2
        style={{
          fontSize: isMobile
            ? "clamp(2rem, 7vw, 2.6rem)"
            : "clamp(2.8rem, 5vw, 4rem)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          marginBottom: 22,
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #34D399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "Inter",
        }}
      >
        Turn your knowledge into instant value.
      </h2>

      <p
        style={{
          fontSize: isMobile ? "1.05rem" : "1.25rem",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.85)",
          marginBottom: 28,
          maxWidth: 560,
          fontFamily: "Inter",
        }}
      >
        Share your diet plans, recipes, and workout programs to the right people —
        exactly when they ask.
      </p>

    
    </>
  );

  const CardsBlock = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 20,
      }}
    >
      {resources.map((item, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20,
            padding: isMobile ? "22px 20px" : "28px 26px",
            position: "relative",
            fontFamily: "Inter",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -18,
              right: -18,
              width: 110,
              height: 110,
              background: `radial-gradient(circle, ${item.color}55, transparent 70%)`,
              filter: "blur(28px)",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 14px",
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              color: item.color,
              background: `${item.color}22`,
              border: `1px solid ${item.color}44`,
              marginBottom: 14,
            }}
          >
            {item.tag}
          </div>

          <h4
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: "#FFFFFF",
              marginBottom: 8,
              lineHeight: 1.4,
            }}
          >
            {item.title}
          </h4>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Instant download • {item.type}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #020617 0%, #020617 100%)",
        padding: isMobile ? "96px 24px" : "160px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {isMobile ? (
          <>
            <ContentBlock />
            <CardsBlock />
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: 96,
              alignItems: "center",
            }}
          >
            <CardsBlock />
            <ContentBlock />
          </div>
        )}
      </div>
    </div>
  );
};










  return (
    <div style={{ width: "100%" }}>
      <Section5 />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section6 />
      <Section7 />
      <Section4 />
      <Section8 />
      <Section9 />
    </div>
  );
}