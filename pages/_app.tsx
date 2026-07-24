import '@/styles/globals.css'
import { PlasmicRootProvider } from '@plasmicapp/react-web'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Amplify } from 'aws-amplify'
import { PlasmicSplitsAppProvider } from '@/components/PlasmicExperimentTracking'
// import { generateClient } from 'aws-amplify/api';

// Load the correct Amplify config based on environment
const appEnvForConfig = process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'development' ? 'dev' : 'prod')
const isMainEnv = appEnvForConfig === 'prod'

// Import both configs
import configMain from '../src/amplifyconfiguration.main.json'
import configDev from '../src/amplifyconfiguration.dev.json'

// Use the appropriate config based on environment
const config = isMainEnv ? configMain : configDev

Amplify.configure(config, { ssr: true })

// TypeScript declaration for GTM dataLayer and tracking
declare global {
  interface Window {
    dataLayer: any[]
    hypernovaTracking?: {
      trackPage: () => void
    }
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Detect environment based on Next.js environment variables
  // Use NEXT_PUBLIC_APP_ENV if set, otherwise use NODE_ENV
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'development' ? 'dev' : 'prod')
  const trackingDebugEnabled =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_GA4_LOCALHOST === 'true'

  // Handle UTM tracking on client-side route changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRouteChange = (url: string) => {
      if (trackingDebugEnabled) {
        try {
          // eslint-disable-next-line no-console
          console.log('[tracking] routeChangeComplete:', url)
        } catch {}
      }
      window.hypernovaTracking?.trackPage()
      if (trackingDebugEnabled) {
        try {
          const last = window.dataLayer?.[window.dataLayer.length - 1]
          // eslint-disable-next-line no-console
          console.log('[tracking] after trackPage, last dataLayer item:', last)
        } catch {}
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router, trackingDebugEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const scrollToTop = () => {
      // Don't scroll to top if there's a hash in the URL (hash navigation should handle scrolling)
      if (window.location.hash) {
        return
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement?.scrollTo?.(0, 0)
      document.body?.scrollTo?.(0, 0)
    }

    const handleRouteChange = (url: string) => {
      // Don't scroll to top if the URL contains a hash
      if (url.includes('#')) {
        return
      }
      scrollToTop()
      requestAnimationFrame(scrollToTop)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Don't scroll to top if there's a hash in the URL
    if (window.location.hash) {
      return
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement?.scrollTo?.(0, 0)
      document.body?.scrollTo?.(0, 0)
    }

    const raf = requestAnimationFrame(() => {
      scrollToTop()
      requestAnimationFrame(scrollToTop)
    })

    return () => cancelAnimationFrame(raf)
  }, [router.asPath])

  return (
    <PlasmicRootProvider Head={Head} Link={Link}>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover' />
        {/* Deterministic astronaut experiment assignment BEFORE first paint (no SSR, no visible switching). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // Canonical variant key (no "hn" prefix)
  var cookieName = 'astronaut_variant';
  // Backward-compat read (if an older cookie exists, migrate it once).
  var legacyCookieName = 'hn_astronaut_variant';
  var expKey = 'exp.fH5Jvnc4c1dd';
  var sliceThree = '5ivzdi3d83j1';
  var sliceStatic = 'X-qBEXP-D1en';
  var maxAge = 60 * 60 * 24 * 90; // 90 days

  function getCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\\]\\\\/+^]/g, '\\\\$&') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function setCookie(name, value, maxAgeSeconds) {
    try {
      var parts = [name + '=' + encodeURIComponent(value), 'Path=/', 'Max-Age=' + String(maxAgeSeconds), 'SameSite=Lax'];
      if (location && location.protocol === 'https:') parts.push('Secure');
      document.cookie = parts.join('; ');
    } catch (e) {}
  }

  var v = getCookie(cookieName);
  if (v !== 'threejs' && v !== 'static') {
    var legacy = getCookie(legacyCookieName);
    if (legacy === 'threejs' || legacy === 'static') {
      v = legacy;
      setCookie(cookieName, v, maxAge);
    }
  }
  if (v !== 'threejs' && v !== 'static') {
    v = (Math.random() < 0.5) ? 'threejs' : 'static';
    setCookie(cookieName, v, maxAge);
  }

  // Gate visuals via CSS before first paint.
  try { document.documentElement.setAttribute('data-astronaut-variant', v); } catch (e) {}
  // Allow React to read synchronously on client.
  try { window.__ASTRONAUT_VARIANT__ = v; } catch (e) {}
  // Make the assignment available to GTM/GA4 immediately (no event).
  // This ensures the first pageview + early interactions can be attributed to the right variant.
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      astronaut_variant: v,
      experiment_name: 'astronaut_hero',
    });
  } catch (e) {}
  // Persist in the same storage Plasmic splits read from (so tracking stays consistent).
  try {
    var slice = (v === 'threejs') ? sliceThree : sliceStatic;
    localStorage.setItem('plasmic_split_known:' + expKey, slice);
  } catch (e) {}
})();
            `,
          }}
        />
        {/* Open Graph Meta Tags */}
        <meta property='og:title' content='Hypernova Inc - Build with Proven Teams' />
        <meta
          property='og:description'
          content='Accelerate your project with senior developers and proven teams. Get a custom estimate today!'
        />
        <meta property='og:image' content='/og-image.png' />
        <meta property='og:url' content='https://hypernova.inc' />
        <meta property='og:type' content='website' />
        {/* Twitter Card Meta Tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Hypernova Inc - Build with Proven Teams' />
        <meta
          name='twitter:description'
          content='Accelerate your project with senior developers and proven teams. Get a custom estimate today!'
        />
        <meta name='twitter:image' content='/og-image.png' />
        {/* Expose app env for debugging/legacy access; tracking scripts below embed `appEnv` directly to avoid race conditions. */}
        <script dangerouslySetInnerHTML={{ __html: `window.__NEXT_APP_ENV__ = "${appEnv}";` }} />
        {trackingDebugEnabled && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__HN_TRACKING_DEBUG__ = ${JSON.stringify({
                nodeEnv: process.env.NODE_ENV,
                appEnv,
                gtm: {
                  id: process.env.NEXT_PUBLIC_GTM_ID || null,
                  hasAuthParams: !!process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS,
                  authParamsHasPreview: !!process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS?.includes('gtm_preview='),
                  authParamsHasCookiesWin: !!process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS?.includes('gtm_cookies_win='),
                },
                ga: {
                  id: process.env.NEXT_PUBLIC_GA_ID || null,
                },
              })};`,
            }}
          />
        )}
        {/* UTM Tracking & dataLayer Initialization - Must run before GTM */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Resolve environment deterministically from build-time Next env.
  // IMPORTANT: Don't rely on other inline scripts ordering; this value is embedded directly.
  var env = "${appEnv}";
  
  // Push env to dataLayer immediately (GTM needs this)
window.dataLayer.push({
  env: env,
  app_env: env
});  
  // Generate tracking_id (UUID-like)
  function generateTrackingId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Get URL parameters
  function getUrlParam(name) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  // Create hypernovaTracking object with trackPage method
  window.hypernovaTracking = {
    trackPage: function() {
      // Get UTMs from URL
      var utmSource = getUrlParam('utm_source');
      var utmMedium = getUrlParam('utm_medium');
      var utmCampaign = getUrlParam('utm_campaign');
      var utmContent = getUrlParam('utm_content');
      var utmTerm = getUrlParam('utm_term');
      
      var hasUtms = !!(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);
      var storageKey = 'hypernova_tracking';
      var expirationMinutes = 30;
      var now = Date.now();
      
      var trackingData = null;
      var shouldStore = false;
      
      // Check if URL has UTMs
      if (hasUtms) {
        // URL has UTMs - generate new tracking_id and store
        var trackingId = generateTrackingId();
        trackingData = {
          tracking_id: trackingId,
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          utm_content: utmContent || null,
          utm_term: utmTerm || null,
          expires_at: now + (expirationMinutes * 60 * 1000)
        };
        shouldStore = true;
      } else {
        // No UTMs in URL - check localStorage
        try {
          var stored = localStorage.getItem(storageKey);
          if (stored) {
            var parsed = JSON.parse(stored);
            // Check if expired
            if (parsed.expires_at && parsed.expires_at > now) {
              // Valid storage exists - reuse it
              trackingData = parsed;
            } else {
              // Expired - generate new with null UTMs
              trackingData = {
                tracking_id: generateTrackingId(),
                utm_source: null,
                utm_medium: null,
                utm_campaign: null,
                utm_content: null,
                utm_term: null,
                expires_at: now + (expirationMinutes * 60 * 1000)
              };
              shouldStore = true;
            }
          } else {
            // No storage - generate new with null UTMs
            trackingData = {
              tracking_id: generateTrackingId(),
              utm_source: null,
              utm_medium: null,
              utm_campaign: null,
              utm_content: null,
              utm_term: null,
              expires_at: now + (expirationMinutes * 60 * 1000)
            };
            shouldStore = true;
          }
        } catch (e) {
          // localStorage error - generate new
          trackingData = {
            tracking_id: generateTrackingId(),
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            utm_term: null,
            expires_at: now + (expirationMinutes * 60 * 1000)
          };
          shouldStore = true;
        }
      }
      
      // Store if needed
      if (shouldStore && trackingData) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(trackingData));
        } catch (e) {
          // localStorage write failed, continue anyway
        }
      }
      
      // Push page_info event to dataLayer with env
      if (trackingData) {
        window.dataLayer.push({
          event: 'page_info',
          env: env,
          app_env: env,
          tracking_id: trackingData.tracking_id,
          utm_source: trackingData.utm_source,
          utm_medium: trackingData.utm_medium,
          utm_campaign: trackingData.utm_campaign,
          utm_content: trackingData.utm_content,
          utm_term: trackingData.utm_term,
          page_path: window.location.pathname + window.location.search,
          page_url: window.location.href,
          page_title: document.title || ''
        });
      }
    }
  };

  // Initial load: ensure tracking data exists (tracking_id + UTMs), but DO NOT emit
  // a page_info event here. GTM already has its own pageview lifecycle; emitting a
  // second "page view like" event on load can cause duplicate GA4 hits.
  try {
    var storageKey = 'hypernova_tracking';
    var expirationMinutes = 30;
    var now = Date.now();
    var stored = localStorage.getItem(storageKey);
    var parsed = stored ? JSON.parse(stored) : null;
    var hasValidStored = parsed && parsed.expires_at && parsed.expires_at > now;
    if (!hasValidStored) {
      var utmSource0 = getUrlParam('utm_source');
      var utmMedium0 = getUrlParam('utm_medium');
      var utmCampaign0 = getUrlParam('utm_campaign');
      var utmContent0 = getUrlParam('utm_content');
      var utmTerm0 = getUrlParam('utm_term');
      var trackingData0 = {
        tracking_id: generateTrackingId(),
        utm_source: utmSource0 || null,
        utm_medium: utmMedium0 || null,
        utm_campaign: utmCampaign0 || null,
        utm_content: utmContent0 || null,
        utm_term: utmTerm0 || null,
        expires_at: now + (expirationMinutes * 60 * 1000)
      };
      localStorage.setItem(storageKey, JSON.stringify(trackingData0));
      // Push as context only (no event) so variables are available if needed.
      window.dataLayer.push({
        env: env,
        app_env: env,
        tracking_id: trackingData0.tracking_id,
        utm_source: trackingData0.utm_source,
        utm_medium: trackingData0.utm_medium,
        utm_campaign: trackingData0.utm_campaign,
        utm_content: trackingData0.utm_content,
        utm_term: trackingData0.utm_term
      });
    }
  } catch (e) {}
})();
              `,
          }}></script>
        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: (() => {
                const gtmId = process.env.NEXT_PUBLIC_GTM_ID || ''
                const gtmAuthParams = process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS
                  ? '&' + process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS
                  : ''
                const debug = trackingDebugEnabled
                return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl+'${gtmAuthParams}';
${debug ? "try{console.log('[GTM] injecting', j.src);}catch(e){};j.onload=function(){try{console.log('[GTM] loaded', j.src);}catch(e){}};j.onerror=function(e){try{console.warn('[GTM] failed to load', j.src, e);}catch(_e){}};" : ''}
f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`
              })(),
            }}></script>
        )}
        {/* End Google Tag Manager */}
        {/* LinkedIn Insight Tag */}
        {process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID && (
          <script
            type='text/javascript'
            dangerouslySetInnerHTML={{
              __html: `
_linkedin_partner_id = "${process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              `,
            }}
          />
        )}
        <script
          type='text/javascript'
          dangerouslySetInnerHTML={{
            __html: `
(function(l) {
  var hasDebug = !!window.__HN_TRACKING_DEBUG__;
  if (hasDebug) {
    try { console.log('[LI] bootstrap, existing lintrk:', typeof l); } catch (e) {}
  }

  if (!l || typeof l !== 'function') {
    // Resolve environment deterministically from build-time Next env.
    var env = "${appEnv}";
    
    // Define lintrk using LinkedIn's recommended queue format.
    // This ensures insight.min.js can replay queued events (including conversions).
    window.lintrk = function() {
      window.lintrk.q = window.lintrk.q || [];
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'track' && args[1] && typeof args[1] === 'object') {
        // Only attach env to non-conversion events to avoid breaking LinkedIn's expected payload shape.
        // Conversion events are expected to be exactly: { conversion_id: <number> }.
        if (!('conversion_id' in args[1])) {
          args[1].env = env;
        }
      }
      window.lintrk.q.push(args);
    };
    window.lintrk.q = window.lintrk.q || [];

    if (hasDebug) {
      try { console.log('[LI] lintrk defined, env=', env); } catch (e) {}
    }
  }
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";
  b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  if (hasDebug) {
    b.onload = function() {
      try { console.log('[LI] insight.min.js loaded'); } catch (e) {}
    };
    b.onerror = function(e) {
      try { console.warn('[LI] insight.min.js failed to load', e); } catch (_e) {}
    };
  }
  s.parentNode.insertBefore(b, s);
})(window.lintrk);
              `,
          }}
        />
        {/* End LinkedIn Insight Tag */}
        {/* Facebook Pixel */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        {/* Facebook Pixel (noscript) */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <noscript>
            <img
              height='1'
              width='1'
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
              alt='fb-pixel'
            />
          </noscript>
        )}
        {/* Twitter Pixel */}
        {process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},
                s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',
                a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
                twq('init','${process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID}');
                twq('track','PageView');
              `,
            }}
          />
        )}
        {/* Twitter Pixel (noscript) */}
        {process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID && (
          <noscript>
            <img
              height='1'
              width='1'
              style={{ display: 'none' }}
              src={`https://analytics.twitter.com/i/adsct?txn_id=${process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID}&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0`}
              alt='twitter-pixel'
            />
          </noscript>
        )}
      </Head>
      {/* Google Tag Manager (noscript) */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}${
              process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS ? '&' + process.env.NEXT_PUBLIC_GTM_AUTH_PARAMS : ''
            }`}
            height='0'
            width='0'
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      )}
      {/* End Google Tag Manager (noscript) */}
      {/* LinkedIn Insight Tag (noscript) */}
      {process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID && (
        <noscript>
          <img
            height='1'
            width='1'
            style={{ display: 'none' }}
            alt=''
            src={`https://px.ads.linkedin.com/collect/?pid=${process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID}&fmt=gif`}
          />
        </noscript>
      )}
      {/* End LinkedIn Insight Tag (noscript) */}
      <PlasmicSplitsAppProvider initialKnownValues={(pageProps as any)?.plasmicSplitKnownValues}>
        <Component {...pageProps} />
      </PlasmicSplitsAppProvider>
    </PlasmicRootProvider>
  )
}
