// FAQSection.js
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Box,
    useMediaQuery,
  useTheme
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";

const faqs = [
  {
    question: "How do I know my account won’t get banned?",
    answer: `
We never post blindly. Every generated post is shown to you first → you approve/edit before scheduling.

- We follow subreddit-specific rules (titles, flairs, link policies, word bans) via a rules engine.  
- If a subreddit requires karma, account age, or post history, we check your account before posting.  
- Posts are rate-limited per Reddit’s API guidelines to avoid spam flags.  
- If Reddit blocks a post, we don’t retry aggressively — we respect limits.  

🛡️ Your account is as safe as if you were posting manually — except we prevent mistakes that usually get founders flagged.
    `,
  },
  {
    question: "How do I control tone?",
    answer: `
After AI generates a draft, you see it in an editor. You can rewrite parts, change voice, or inject personal tone before scheduling.

- You can set a **tone profile** (casual, professional, storytelling) once, and we’ll match that style for future posts.  

 🎙️ AI helps you draft faster, but you always stay in control of your voice.
    `,
  },
  {
    question: "What about credibility?",
    answer: `
We analyze comments in real-time with sentiment + category tagging:  

- Supportive validation  
- Critical feedback  
- Feature requests  
- Troll/noise  

Dashboard shows **% supportive vs. critical** + highlights insightful feedback.  
You can export top constructive comments into a report to share with co-founders/investors.  

Turn Reddit feedback into **actionable validation data** instead of raw noise.
    `,
  },
  {
    question: "Why should I use your tool instead of posting manually?",
    answer: `
**Key advantages:**  
- Rule Compliance Engine: Never waste time writing a post that mods remove.  
- Best Time Slotting: We track when subreddits are most active → higher reach.  
- Multi-Subreddit Scheduling: Distribute ideas across multiple communities automatically.  
- Comment Analytics: No need to dig through 200 comments — we summarize insights for you.  
- History Tracking: All validation attempts stored in one dashboard.  

Manual posting takes 10 minutes, but serious validation takes hours. We save you **both** 🎉.
    `,
  },
  {
    question: "How do you handle different subreddit rules?",
    answer: `
Each subreddit has a **rule template**:  

- Allowed post types (text, link, images)  
- Flair required or not  
- Self-promo restrictions  
- Title formatting rules  

Our AI generates subreddit-specific variations automatically.  
If a subreddit disallows links, we suggest text-only for that one.  

✔️ Every subreddit is different — we make sure you never break local rules.
    `,
  },
  {
    question: "How do you ensure feedback isn’t just vanity metrics?",
    answer: `
We highlight **comment categories**:  

- “I’d use this now” (strong validation)  
- “Cool idea but…” (conditional validation)  
- “Not for me” (rejection)  

You get a **Validation Score** that weighs constructive feedback more than vanity upvotes.  

🏃 Stop chasing karma — start measuring real validation.
    `,
  },
];

// 🔄 Custom Expand Icon with rotation
const ExpandIcon = styled((props) => <ExpandMoreIcon {...props} />)(
  ({ theme, expand }) => ({
    transform: expand ? "rotate(180deg)" : "rotate(0deg)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  })
);

// 🎨 Background colors array
const bgColors = [
  "#ECFAE5",
  "#FFDCDC",
  "#e0f7fa",
  "#D2E0FB",
  "#E4D8DC",
  "#F9F9F9",
];

const FAQSection = () => {
  const [expanded, setExpanded] = React.useState(false);
   const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm")); 

  const handleChange = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box textAlign="center" mb={4}>
        <Typography gutterBottom sx={{ fontFamily : 'Inter', fontSize : isMobile ? '22px' : '32px', fontWeight : 600}}>
          Frequently Asked Questions
        </Typography>
        <Typography color="text.secondary" sx={{ fontFamily : 'Inter', fontSize : isMobile ? '14px' : '15px', fontWeight : 400}}>
          Everything you need to know before using the platform
        </Typography>
      </Box>

      {faqs.map((faq, index) => (
        <Accordion
          key={index}
          expanded={expanded === index}
          onChange={handleChange(index)}
          disableGutters
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: 2,
            backgroundColor: bgColors[index % bgColors.length],
            "&:before": { display: "none" }, // 🔥 removes the horizontal line
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandIcon expand={expanded === index ? 1 : 0} />}
            aria-controls={`faq-content-${index}`}
            id={`faq-header-${index}`}
          >
            <Typography sx={{ fontFamily : 'Inter', fontSize : '16px', fontWeight : 500}}>
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
 <Typography
  sx={{ whiteSpace: "pre-line", fontFamily : 'Inter', fontSize : '14px', fontWeight : 400 }}
  dangerouslySetInnerHTML={{
    __html: faq.answer
      // Convert **bold** → <strong>
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Convert "- text" → bullet points
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      // Wrap consecutive <li>…</li> in <ul>…</ul>
      .replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")
  }}
/>


              {/* {faq.answer}
            </Typography> */}
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
};

export default FAQSection;
