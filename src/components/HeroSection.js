import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import avatar1 from "../images/IMG_8696.jpeg";
import avatar2 from "../images/IMG_8697.jpeg";
import avatar3 from "../images/IMG_8699.jpeg";
import avatar4 from "../images/IMG_8698.jpeg";

export default function Hero({}) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:600px)").matches
  );
  const [animateIn, setAnimateIn] = useState(false);


  
const getCardAnimation = (index, existingTransform) => {
  const delay = index * 150; // Stagger entrance
  const bounceDelay = index * 0.3; // Stagger continuous bounce
  
  return {
    // Entrance animation
    opacity: animateIn ? 1 : 0,
    transform: animateIn 
      ? existingTransform || ''
      : `${existingTransform || ''} translateY(60px) scale(0.8)`,
    transition: `
      opacity 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms,
      transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms
    `,
    // Continuous bounce animation
    animation: animateIn ? `cardBounce 3s ease-in-out ${bounceDelay}s infinite` : 'none',
  };
};

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
    fontWeight: 600,
    marginBottom: 10,
    color: "#334155",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",

  };

  const tagStyle = (color) => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
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

const testimonials = [

  {
    id: 1,
    name: "Harshalifts",
    role: "Online Fitness Coach",
    avatar: avatar4,
    text: "I used to spend hours replying to Instagram DMs daily. Now I only talk to serious leads that come straight to my WhatsApp inbox.",
    rating: 5,
    clientsGained: "+89 clients"
  },

  {
    id: 2,
    name: "Siddarth4real",
    role: "Fitness Coach & Athlete",
    avatar: avatar1,
    text: "MyHandle helps me convert more Instagram DMs into paying clients every single month. Game-changer for my coaching business.",
    rating: 5,
    clientsGained: "+127 clients"
  },
  {
    id: 3,
    name: "FitKalyan",
    role: "Powerlifting Athlete",
    avatar: avatar3,
    text: "I was completely tired of managing DMs all day. Now I’m closing three times more clients with a fraction of the effort.",
    rating: 5,
    clientsGained: "+156 clients"
  }
];


const TestimonialCompactCarousel = ({ isMobile = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next testimonial
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    } else if (isRightSwipe) {
      // Swipe right - previous testimonial
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div
      style={{
        marginTop: isMobile ? "6vh" : "12vh",
        marginBottom: isMobile ? "4vh" : "8vh",
        width: "100%",
        maxWidth: isMobile ? "100%" : "600px",
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "8px", 
        marginBottom: "16px",
        justifyContent: isMobile ? "center" : "flex-start"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "2px" 
        }}>
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{ fontSize: "14px", color: "#FFB800" }}>⭐</span>
          ))}
        </div>
        <span style={{ 
          fontSize: "14px", 
          fontWeight: 600, 
          color: "#1F2937" 
        }}>
          Trusted by 2635+ coaches
        </span>
      </div>

      {/* Testimonial Card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #F3F4F6",
          position: "relative",
          overflow: "hidden",
          minHeight: isMobile ? "180px" : "200px",
          display: "flex",
          flexDirection: "column",
          cursor: isMobile ? "grab" : "default",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #FF6B35 0%, #F7931E 50%, #FDB913 100%)",
          }}
        />

        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
          {/* Avatar */}
          <img
            src={currentTestimonial.avatar}
            alt={currentTestimonial.name}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: "2px solid #F3F4F6",
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: isMobile ? "140px" : "60px" }}>
            <p
              style={{
                fontSize: isMobile ? "14px" : "15px",
                lineHeight: 1.6,
                color: "#374151",
                margin: "0 0 12px 0",
                fontStyle: "italic",
                minHeight: isMobile ? "80px" : "90px",
                textAlign: 'left'
              }}
            >
              "{currentTestimonial.text}"
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1F2937", textAlign: 'left' }}>
              {currentTestimonial.name}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", textAlign: 'left' }}>
              {currentTestimonial.role}
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
            }}
          >
            {currentTestimonial.clientsGained}
          </div>
        </div>

        {/* Dots indicator */}
        <div style={{ display: "flex", gap: "6px", marginTop: "16px", justifyContent: "center" }}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: currentIndex === index ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                background: currentIndex === index 
                  ? "linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)"
                  : "#D1D5DB",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};




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


  const noCardTextStyle = {
  marginTop: "10px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#4B5563", // subtle gray
  textAlign: "center",
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
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid #F0F0F0",
    marginLeft: index === 0 ? 0 : -10,
    position: "relative",
    zIndex: 4 - index
  });

const happyUsersTextStyle = {
  fontSize: isMobile ? "12px" : "15px",
  fontWeight: 600,
  color: "#1B211A",
  whiteSpace: "nowrap",
};


  // === CTA row with subdomain input + button (no external CSS)
  const ctaRowStyle = {
    width: isMobile ? "100%" : "100%",
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
    width: isMobile? "100%" : "50%",
    padding: "0 28px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "8px",
    cursor: "pointer",
    background: "#000000",
    color: "#FFFFFF",
    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    alignSelf: isMobile ? "stretch" : "auto"

  };



     const startBtnHoverStyle = isHovered
    ? { transform: "translateY(-1px)", boxShadow: "0 10px 18px rgba(0,0,0,0.16)" }
    : {};



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
    2635+ Fitness Creators
  </span>
</div>


          {/* Desktop headline */}
        <h1 style={{ ...headlineStyle, display: isMobile ? "none" : "block" }}>
  Convert{" "}
  <span style={highlightPill}>Instagram DMs</span>{" "}
  into Clients.
</h1>


          {/* Mobile headline */}
        <h1
  style={{ ...mobileHeadlineStyle, display: isMobile ? "block" : "none", margin: 0 }}
>
  Convert{" "}
  <span style={highlightPill}>Instagram DMs</span>{" "}
  into Clients.
</h1>


         <p style={subStyle}>
  High-intent DMs are identified and serious leads are sent to your WhatsApp instantly —so you close more clients without DM fatigue.
</p>



          {/* Subdomain input + CTA */}
      <div
  style={{
    ...ctaRowStyle,
    flexDirection: "column",
    alignItems: "flex-start", // 👈 button stays left
  }}
>
  {/* Button wrapper defines the centering width */}
  <div style={{ width: startBtnStyle.width || "80%" }}>
    <button
      onClick={() => navigate("/professional/login")}
      style={{ ...startBtnStyle, ...startBtnHoverStyle, width: "100%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Get 10 Leads for free"
    >
      Get 10 Leads for free →
    </button>

    {/* Centered under button */}
    <div style={noCardTextStyle}>
      No credit card required
    </div>

  </div>

</div>




   <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>

<TestimonialCompactCarousel isMobile={isMobile} />

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
