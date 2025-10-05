import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Stack,
  Grid,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardOutlinedIcon from '@mui/icons-material/ArrowOutwardOutlined';
import { useNavigate } from 'react-router-dom';


/**
 * WhatsAppProblemSolveCard_modern_withChat.jsx
 * Adds interactive preview: clicking "Open" expands the selected message into a chat-like view inside the phone mock.
 * Designer tweak: left-side mini-composer demonstrates that you can reply directly from the dashboard.
 */

export default function WhatsAppProblemSolveCard_modern() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [openMessage, setOpenMessage] = useState(null);
  const [miniReply, setMiniReply] = useState('');
  const navigate = useNavigate();


  // sample alerts that power the preview (kept here so left-side composer can open the same message)
  const alerts = [
    { id: 1, title: 'New lead', subtitle: 'Ankit — pricing', body: 'Hi, I would like to know more about your pricing options.', time: '10:42 AM' },
    { id: 2, title: 'Feature vote', subtitle: '25 votes', body: 'Users are asking for dark mode support.', time: '9:58 AM' },
    { id: 3, title: 'Critical bug', subtitle: 'Payments failing for 3 users', body: 'Multiple users report payment failures. Needs urgent attention.', time: '8:12 AM', severity: true },
  ];

  const openFirst = () => setOpenMessage(alerts[0]);
  const close = () => setOpenMessage(null);

  const handleMiniReply = () => {
    // open the first message and include the mini-reply so ChatView can render it as a sent bubble
    const base = alerts[0];
    setOpenMessage({ ...base, sentReply: miniReply || 'Thanks — I can share pricing.' });
    setMiniReply('');
  };

  return (
    
    <>
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', px: { xs: 2, md: 6 }, background : '#7A1CAC' }}>
      <Card
        elevation={0}
        sx={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: '#7A1CAC',
          px: { xs: 2, md: 6 },
          py: { xs: 3, md: 4 },
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Left: copy */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', textTransform: 'none', borderRadius: 2.5, px: 3.25, py: 1.05, background: 'linear-gradient(90deg,#25D366,#128C7E)', maxWidth : isSm ? '100%' : 'fit-content' }}>

                  <WhatsAppIcon sx={{ fontSize : '46px', color: '#F8FAFC'}}/>

                  <Typography  sx={{ fontFamily: 'Inter', fontSize : isSm ? '22px' : '28px', fontWeight: 700, letterSpacing: '-0.02em', color: '#37353E' }}>
                    WhatsApp Alerts
                  </Typography>
                </Box>

                <Box sx={{ paddingTop: 3}}>
                 <Typography
  sx={{
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.05,
    color: '#37353E',
  }}
>
  See what matters —{' '}
  <Box
    component="span"
    sx={{
      position: 'relative',
      display: 'inline-block',
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        bottom: -6, // distance below text
        width: '100%',
        height: 5, // thickness of underline
        background: 'linear-gradient(90deg,#25D366,#128C7E)', // custom underline color
        borderRadius: 0,
      },
    }}
  >
    instantly
  </Box>.
</Typography>
<Typography
  sx={{
    fontFamily: 'Inter',
    fontSize: 15,
    mt: 1,
    color: 'text.secondary',
    maxWidth: 640,
  }}
>
  We detect high-signal events (leads, crashes, feature votes) and push crisp WhatsApp alerts that you can action in seconds.{' '}
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      fontWeight: 600,
      color: '#128C7E',
      mt: 1
    }}
  >
    Replies can be sent directly from WhatsApp for these alerts.
  </Box>
</Typography>

                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1 }}>
            
                <Button onClick={()=> navigate('/join-waitlist')} variant="contained" endIcon={<ArrowOutwardOutlinedIcon />} sx={{ fontFamily : 'Inter', textTransform: 'none', borderRadius: 6, px: 3.25, py: 1.05, fontWeight: 600, background: 'linear-gradient(90deg,#25D366,#128C7E)' }}>
                  Get Early Access
                  </Button>

                </Box>

               
              </Stack>
            </Grid>

            {/* Right: modern phone preview */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: isSm ? '100%' : '75%', borderRadius: 3, p: 2, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', boxShadow: '0 18px 40px rgba(2,6,23,0.12)' }}>
                  <Box sx={{ width: '100%', height: 460, borderRadius: 2, bgcolor: 'background.default', p: 2, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ width: 64, height: 6, borderRadius: 6, bgcolor: 'divider', mx: 'auto', mb: 1 }} />

                    {/* List view or chat view depending on `openMessage` */}
                    {!openMessage ? (
                      <Stack spacing={1.25} sx={{ mt: 1, flexGrow: 1 }}>
                        {alerts.map((a, i) => (
                          <PreviewAlert key={a.id} title={a.title} subtitle={a.subtitle} severity={a.severity} accent={i === 0} onOpen={() => setOpenMessage(a)} />
                        ))}
                      </Stack>
                    ) : (
                      <ChatView message={openMessage} onBack={close} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <style>{`@keyframes popIn { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } } .preview-alert { animation: popIn 420ms cubic-bezier(.2,.85,.3,1) both }`}</style>
    </Box>
    </>
  );
}

function PreviewAlert({ title, subtitle, severity = false, accent = false, onOpen }) {
  return (
    <Box className="preview-alert" sx={{ display: 'flex', gap: 1.25, alignItems: 'center', p: 1.15, borderRadius: 2, bgcolor: accent ? 'rgba(6,182,212,0.06)' : severity ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.02)', transition: 'transform 180ms ease', '&:hover': { transform: 'translateY(-4px)' } }} onClick={onOpen}>
      <Box sx={{ width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: severity ? 'rgba(239,68,68,0.12)' : 'rgba(6,182,212,0.12)' }}>
        <WhatsAppIcon sx={{ color: severity ? '#ef4444' : '#06b6d4' }} />
      </Box>

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography sx={{ fontFamily : 'Inter', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
      </Box>

      <Button size="small" variant="contained" onClick={onOpen} sx={{ textTransform: 'none', px: 1.25, py: 0.5, borderRadius: 1, background : '#72BF78' }}>Open</Button>
    </Box>
  );
}

function ChatView({ message, onBack }) {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 34, height: 34 }}>
            <WhatsAppIcon sx={{ color: '#06b6d4' }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{message.title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{message.subtitle} • {message.time || 'now'}</Typography>
          </Box>
          <Button onClick={onBack} size="small" sx={{ ml: 'auto', textTransform: 'none' }} startIcon={<CloseIcon />}>Close</Button>
        </Box>

        <Box sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, p: 1, maxWidth: '80%' }}>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>{message.body}</Typography>
        </Box>

        {/* if a sentReply exists (from mini composer), render it as outgoing bubble */}
        {message.sentReply && (
          <Box sx={{ alignSelf: 'flex-end', mt: 1 }}>
            <Box sx={{ bgcolor: 'rgba(6,182,212,0.12)', borderRadius: 2, p: 1, maxWidth: '80%' }}>
              <Typography variant="body2" sx={{ color: 'text.primary' }}>{message.sentReply}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'right', mt: 0.5 }}>{message.time || 'now'}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 1, color: 'text.secondary' }}>Type a message…</Box>
        <Button variant="contained" size="small" sx={{ textTransform: 'none' }}>Send</Button>
      </Box>
    </Box>
  );
}

WhatsAppProblemSolveCard_modern.propTypes = { logoSrc: PropTypes.string, onPrimaryCTA: PropTypes.func, onSecondaryCTA: PropTypes.func };
PreviewAlert.propTypes = { title: PropTypes.string, subtitle: PropTypes.string, severity: PropTypes.bool, accent: PropTypes.bool, onOpen: PropTypes.func };
ChatView.propTypes = { message: PropTypes.object, onBack: PropTypes.func };
