import { COOKIE_NAME, STORAGE_KEY } from "@/lib/settings/schema";

/**
 * Runs in <head> before first paint so the saved theme, language, timestamp
 * preference and motion preference apply without a flash. Kept dependency-free
 * and tiny. It only reads our own storage keys and only writes known values.
 * It also marks the page as scripted (data-js) and hides the welcome screen when
 * it was already closed in this browser session (data-welcome).
 */
export const SETTINGS_INIT_SCRIPT = `(function(){try{var d=document.documentElement,s=null;d.setAttribute("data-js","");try{if(sessionStorage.getItem("ae:welcome")==="seen")d.setAttribute("data-welcome","seen")}catch(e){}try{s=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})}catch(e){}if(!s){var m=document.cookie.match(/(?:^|; )${COOKIE_NAME}=([^;]*)/);if(m)s=decodeURIComponent(m[1])}if(!s)return;var v=JSON.parse(s)||{};var t=v.theme;if(t==="dark"||t==="light"||t==="dark-brown"){d.setAttribute("data-theme",t);d.style.colorScheme=t==="light"?"light":"dark"}var l={en:"en",ru:"ru",ja:"ja",zh:"zh-CN"}[v.language];if(l)d.lang=l;if(v.showTimestamps===false)d.setAttribute("data-timestamps","off");if(v.reduceMotion===true)d.setAttribute("data-motion","reduced")}catch(e){}})();`;
