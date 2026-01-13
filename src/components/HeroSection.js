import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import metaIcon from "../images/meta.png"
import avatar1 from "../images/IMG_8696.jpeg";
import avatar2 from "../images/IMG_8697.jpeg";
import avatar3 from "../images/IMG_8699.jpeg";
import avatar4 from "../images/IMG_8698.jpeg";

export default function Hero({
  heroImage = "https://storage.googleapis.com/myhandlewebbucket/landingpage_imgs/Hero_Img.png"
}) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const [availability, setAvailability] = useState("idle");



  // Track small-screen (<=600px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:600px)").matches
  );



const SmartInboxCard = ({ isMobile }) => {
  // Fixed, intentional mobile scramble (no randomness)
  const mobileTransforms = [
    { x: 0,  y: 0,  r: -1 },
    { x: 6,  y: -10, r: 1 },
    { x: -6, y: -20, r: -1.5 },
    { x: 4,  y: -30, r: 1.2 },
  ];

  const baseCardStyle = {
    position: isMobile ? "relative" : "absolute",
    width: isMobile ? "92%" : 320,
    padding: "16px 18px",
    borderRadius: 20,
    background: "#FFFFFF",
    color: "#0b1220",
    boxShadow: "0 18px 50px rgba(0,0,0,0.14)",
    transition: "transform 0.35s ease, opacity 0.35s ease",
    willChange: "transform",
  };

  const nameStyle = {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 4,
  };

  const messageStyle = {
    fontSize: 14,
    marginBottom: 10,
    color: "#334155",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const tagStyle = (color) => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color,
    background: `${color}22`,
    border: `1px solid ${color}55`,
  });

  const applyMobileScramble = (index) => {
    if (!isMobile) return {};
    const t = mobileTransforms[index] || {};
    return {
      transform: `translate(${t.x || 0}px, ${t.y || 0}px) rotate(${t.r || 0}deg)`,
      zIndex: 10 - index,
      opacity: 1 - index * 0.06,
    };
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 600,
        height: isMobile ? "auto" : 520,
        display: "flex",
        flexDirection: isMobile ? "column" : "block",
        gap: isMobile ? 28 : 0,
        paddingTop: isMobile ? 12 : 0,
      }}
    >
      {/* Sarah */}
      <div
        style={{
          ...baseCardStyle,
          top: 0,
          right: 0,
          transform: isMobile ? undefined : "rotate(10deg)",
          zIndex: 4,
          ...applyMobileScramble(0),
        //  ...getCardAnimation(0, isMobile ? applyMobileScramble(0).transform : "rotate(10deg)"),

        }}
      >
        <div style={nameStyle}>Susmitha.</div>
        <div style={messageStyle}>
          Do you offer 1-on-1 online fitness coaching?
        </div>
        <span style={tagStyle("#10B981")}>High intent</span>
      </div>

      {/* Mike */}
      <div
        style={{
          ...baseCardStyle,
          top: isMobile ? 0 : 130,
          left: isMobile ? "10%" : "30%",
          transform: isMobile
            ? undefined
            : "translateX(-50%) rotate(-2deg)",
          zIndex: 3,
          ...applyMobileScramble(1),
            // ...getCardAnimation(1, isMobile ? applyMobileScramble(1).transform : "translateX(-50%) rotate(-2deg)"),

        }}
      >
        <div style={nameStyle}>Ajay Krishna</div>
        <div style={messageStyle}>
         Charges for weight loss coaching?
        </div>
        <span style={tagStyle("#22C55E")}>Potential client</span>
      </div>

      {/* Lisa */}
      <div
        style={{
          ...baseCardStyle,
          top: isMobile ? 0 : "80%",
          left: isMobile ? 0 : 20,
          transform: isMobile ? undefined : "rotate(-6deg)",
          zIndex: 2,
          ...applyMobileScramble(2),
        //  ...getCardAnimation(2, isMobile ? applyMobileScramble(2).transform : "rotate(-6deg)"),

        }}
      >
        <div style={nameStyle}>Lavannya__</div>
        <div style={messageStyle}>
          Post delivery, I’ve gained a lot of weight and I’m struggling to lose it.
        </div>
        <span style={tagStyle("#F59E0B")}>Follow up</span>
      </div>

      {/* John */}
      <div
        style={{
          ...baseCardStyle,
          bottom: isMobile ? 0 : 130,
          right: isMobile ? -12 : 0,
          transform: isMobile ? undefined : "rotate(4deg)",
          zIndex: 1,
          opacity: isMobile ? undefined : 0.95,
          ...applyMobileScramble(3),
          //  ...getCardAnimation(3, isMobile ? applyMobileScramble(3).transform : "rotate(4deg)"),  // ← PASS TRANSFORM

        }}
      >
        <div style={nameStyle}>Varun_Red</div>
        <div style={messageStyle}>Good fitness content, keep it up!</div>
        <span style={tagStyle("#64748B")}>Low priority</span>
      </div>
    </div>
  );
};

const [animateIn, setAnimateIn] = useState(false);

useEffect(() => {
  const t = setTimeout(() => setAnimateIn(true), 50);
  return () => clearTimeout(t);
}, []);

useEffect(() => {
  // Inject keyframes into document
  if (typeof document === 'undefined') return;
  
  const styleId = 'card-bounce-keyframes';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes cardBounce {
      0%, 100% { 
        transform: translateY(0) scale(1);
      }
      50% { 
        transform: translateY(-12px) scale(1.02);
      }
    }
  `;
  document.head.appendChild(style);
  
  return () => {
    const el = document.getElementById(styleId);
    if (el) el.remove();
  };
}, []);




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


const containerStyle = {
  minHeight: "100vh",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(120px, 10vh, 160px) clamp(16px, 8vw, 86px) clamp(24px, 8vh, 120px)",
  boxSizing: "border-box",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  color: "#0b1220",
  overflow: "hidden",
};



const layoutStyle = {
  width: "100%",
  position: "relative",
  zIndex: 2, // 👈 keeps content above grid
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
  justifyContent: "space-between",
  gap: isMobile ? "24px" : "72px",
};



const leftColStyle = {
  flex: isMobile ? "0 1 auto" : "1 1 50%",
  display: "flex",
  flexDirection: "column",
  alignItems: isMobile ? "flex-start" : "flex-start",
  textAlign: isMobile ? "center" : "left",
  minWidth: 0,
  width: "100%", // ✅ ADD THIS - ensures full width control
  padding: isMobile ? "0 2px" : "0", // ✅ ADD THIS - applies padding to entire left column
};


const rightColStyle = {
  flex: isMobile ? "0 1 auto" : "1 1 50%",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  minWidth: 0,
};


const highlightPill = {
  display: "inline-block",
  padding: "0.08em 0.35em",
  fontWeight: 800,
background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 35%, #8134AF 70%, #515BD4 100%)",
color: "#F8FAFC",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};




const subStyle = {
  fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
  lineHeight: 1.5,
  color: "#222831",
  margin: "0 0 clamp(18px, 2.5vw, 24px) 0",
  marginTop: "1rem",
  marginBottom: "2.5rem",
  textAlign: "left",
  fontWeight: 500

};



  const headlineStyle = {
    fontSize: "clamp(2rem, 4vw, 3.5rem)",
    fontWeight: 800,
    margin: "0 0 clamp(12px, 2vw, 16px) 0",
    fontFamily: "-apple-system, BlinkMacSystemFont, Inter, 'Helvetica Neue', Arial",
    textAlign: 'left',
    lineHeight: 1.25,
    color:'#1B211A'
  };

  const mobileHeadlineStyle = {
    ...headlineStyle,
    fontSize: "clamp(2.3rem, 4vw, 3.5rem)",

  };

  const happyUsersRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "2%",
};

const avatarStackStyle = {
  display: "flex",
  alignItems: "center",
};

const avatarStyle = (index) => ({
  width: isMobile ? 28 : 30,
  height: isMobile ? 28 : 30,
  borderRadius: "50%",
  objectFit: "cover",
  marginLeft: index === 0 ? 0 : -12, // 👈 overlap
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
});

const happyUsersTextStyle = {
  fontSize: isMobile ? "12px" : "15px",
  fontWeight: 600,
  color: "#1B211A",
  whiteSpace: "nowrap",
};


  // === CTA row with subdomain input + button (no external CSS)
  const ctaRowStyle = {
    width: isMobile ? "100%" : "75%",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? "12px" : "8px",
    justifyContent: isMobile ? "center" : "flex-start",
    alignItems: "stretch",
    marginTop: "clamp(8px, 2vw, 16px)",

  };


  const startBtnStyle = {
    appearance: "none",
    border: "none",
    height: isMobile ? "52px" : "52px",
    width: isMobile? "100%" : "80%",
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


     const startBtnHoverStyle = isHovered
    ? { transform: "translateY(-1px)", boxShadow: "0 10px 18px rgba(0,0,0,0.16)" }
    : {};


  // Add this new component after your existing icon components (CheckIcon, CrossIcon, etc.)
const MetaVerifiedBlock = () => {
  const metaBlockStyle = {
    display: "flex",
    alignItems: "center",
    gap: isMobile ? "12px" : "16px",
    padding: isMobile ? "14px 16px" : "16px 20px",
    // background: "linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)",
    // border: "1px solid #C8E6C9",
    // borderRadius: "12px",
    marginTop: "12px",
    marginBottom: isMobile ? '66px' : "0px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    maxWidth: isMobile ? "100%" : "580px"
  };

  const metaIconStyle = {
    width: isMobile ? "36px" : "46px",
    height: isMobile ? "36px" : "46px",
    objectFit: "contain",
    flexShrink: 0
  };

  const leftSectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
    textAlign: "left"
  };

  const textColumnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  };

  const metaTextStyle = {
    fontSize: isMobile ? "18px" : "36px",
    fontWeight: 600,
    color: "#000000",
    lineHeight: 1.2
  };

  const techProviderStyle = {
    fontSize: isMobile ? "14px" : "18px",
    fontWeight: 500,
    color: "#44444E",
    lineHeight: 1.2
  };

  const dividerStyle = {
    width: "1px",
    height: isMobile ? "36px" : "40px",
    background: "linear-gradient(to bottom, transparent, #C8E6C9 20%, #C8E6C9 80%, transparent)",
    flexShrink: 0
  };

  const descriptionStyle = {
    fontSize: isMobile ? "14px" : "15px",
    fontWeight: 500,
    color: "#44444E",
    lineHeight: 1.4,
    flex: 1,
    marginTop: '12px',
    textAlign: "left"

  };

  return (
    <div style={metaBlockStyle}>
      {/* Left: Icon + Meta Text */}
      <div style={leftSectionStyle}>
        <img 
          src={metaIcon}
          alt="Meta" 
          style={metaIconStyle}
        />
        <div style={textColumnStyle}>
          <span style={metaTextStyle}>Meta</span>
          <span style={techProviderStyle}>Tech Provider</span>
        </div>
      </div>

      {/* Divider */}
      <div style={dividerStyle}></div>

      {/* Right: Description */}
      <p style={descriptionStyle}>
        MyHandle has been verified by Meta.
      </p>
    </div>
  );
};


  return (
    <section style={containerStyle} aria-label="Hero">

{/* ===== Gradient + Graph Sheet Background ===== */}
<div
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  }}
>
  {/* 1️⃣ Instagram-style gradient wash */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(1200px 600px at 15% 20%, #C7C8CC, transparent 100%)," +
        "radial-gradient(1000px 600px at 40% 80%, #FCF8F8, transparent 65%)",
    }}
  />

  {/* 2️⃣ Fine grid */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(
          to right,
          rgba(0,0,0,0.14) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          rgba(0,0,0,0.14) 1px,
          transparent 1px
        )
      `,
      backgroundSize: "48px 48px",
      opacity: 0.2,
    }}
  />

  {/* 3️⃣ Bold grid (every few cells) */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(
          to right,
          rgba(0,0,0,0.22) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          rgba(0,0,0,0.22) 1px,
          transparent 1px
        )
      `,
      backgroundSize: "240px 240px",
      opacity: 0.1,
    }}
  />


</div>





      <div style={layoutStyle}>
        {/* LEFT: Content */}
        <div style={leftColStyle}>

          {/* Happy Users */}
<div style={happyUsersRowStyle}>
  <div style={avatarStackStyle}>
    <img src={avatar1} alt="User 1" style={avatarStyle(0)} />
    <img src={avatar2} alt="User 2" style={avatarStyle(1)} />
    <img src={avatar3} alt="User 3" style={avatarStyle(2)} />
    <img src={avatar4} alt="User 4" style={avatarStyle(3)} />
  </div>

  <span style={happyUsersTextStyle}>
    12,635 Happy Creators
  </span>
</div>


          {/* Desktop headline */}
        <h1 style={{ ...headlineStyle, display: isMobile ? "none" : "block" }}>
  Convert{" "}
  <span style={highlightPill}>Instagram DMs</span>{" "}
  into Paying Fitness Clients.
</h1>


          {/* Mobile headline */}
        <h1
  style={{ ...mobileHeadlineStyle, display: isMobile ? "block" : "none", margin: 0 }}
>
  Convert{" "}
  <span style={highlightPill}>Instagram DMs</span>{" "}
  into Paying Fitness Clients.
</h1>


         <p style={subStyle}>
  Stop chasing messages. Get serious leads sent to your WhatsApp —instantly.
</p>



          {/* Subdomain input + CTA */}
          <div style={ctaRowStyle}>

              <button
            onClick={()=> navigate('/professional/login')}
              style={{ ...startBtnStyle, ...startBtnHoverStyle }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label="Try for free"
              disabled={availability === "checking"}
            >
              Try for free →
            </button>

          </div>


   <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>

  <MetaVerifiedBlock />
</div>
</div>




     {/* RIGHT: Video */}
<div style={rightColStyle}>
  <SmartInboxCard isMobile={isMobile} />
</div>




      </div>
    </section>
  )
}
