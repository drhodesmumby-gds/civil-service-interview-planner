declare global {
  interface Window {
    umami?: {
      track: (eventName: string | ((props: any) => any), eventData?: Record<string, any>) => void;
    };
  }
}

export const initAnalytics = () => {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js';
  
  if (!websiteId) {
    console.log('Analytics disabled: VITE_UMAMI_WEBSITE_ID not set');
    return;
  }

  // Prevent multiple injections
  if (document.querySelector('script[data-website-id]')) {
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = scriptUrl;
  script.setAttribute('data-website-id', websiteId);
  document.head.appendChild(script);
};

export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.umami) {
    // We track the view as a custom event, guaranteeing no PII is sent in the URL
    window.umami.track(`View: ${pageName}`);
  }
};

export const trackEvent = (eventName: string, eventData?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, eventData);
  }
};
