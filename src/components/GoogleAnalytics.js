// components/GoogleAnalytics.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-18HEN1B98V', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

export default GoogleAnalytics;