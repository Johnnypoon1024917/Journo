/**
 * Cookie debugging utilities
 */

export function logAllCookies() {
  console.log('🍪 All cookies:', document.cookie);
  
  const cookies = document.cookie.split(';').map(c => c.trim());
  console.log('🍪 Parsed cookies:', cookies);
  
  const hasRefreshToken = cookies.some(c => c.startsWith('refreshToken='));
  console.log('🍪 Has refreshToken:', hasRefreshToken);
  
  return { cookies, hasRefreshToken };
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function watchCookies(interval = 1000) {
  let lastCookies = document.cookie;
  
  const intervalId = setInterval(() => {
    const currentCookies = document.cookie;
    if (currentCookies !== lastCookies) {
      console.log('🍪 Cookies changed!');
      console.log('   Before:', lastCookies);
      console.log('   After:', currentCookies);
      logAllCookies();
      lastCookies = currentCookies;
    }
  }, interval);
  
  console.log('👀 Watching cookies... (call stopWatching() to stop)');
  
  return () => {
    clearInterval(intervalId);
    console.log('👀 Stopped watching cookies');
  };
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).cookieDebug = {
    logAllCookies,
    getCookie,
    watchCookies,
  };
}
