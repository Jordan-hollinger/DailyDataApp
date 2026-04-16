const auth = (() => {
  const TOKEN_KEY  = 'dailylog_gtoken';
  const EXPIRY_KEY = 'dailylog_gtoken_expiry';
  const SCOPE      = 'https://www.googleapis.com/auth/spreadsheets';

  let tokenClient = null;

  function getStoredToken() {
    const token  = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0');
    return (token && Date.now() < expiry) ? token : null;
  }

  function storeToken(token, expiresIn) {
    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, Date.now() + (expiresIn - 120) * 1000);
  }

  function waitForGIS(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) { resolve(); return; }
      const start = Date.now();
      const timer = setInterval(() => {
        if (window.google?.accounts?.oauth2) { clearInterval(timer); resolve(); }
        else if (Date.now() - start > timeout) {
          clearInterval(timer);
          reject(new Error('Google sign-in library failed to load.'));
        }
      }, 100);
    });
  }

  async function setupTokenClient() {
    await waitForGIS();
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: () => {}, // replaced per-request
    });
  }

  function requestToken(prompt) {
    return new Promise((resolve, reject) => {
      tokenClient.callback = (resp) => {
        if (resp.error) { reject(resp); return; }
        storeToken(resp.access_token, resp.expires_in);
        resolve(resp.access_token);
      };
      tokenClient.requestAccessToken({ prompt });
    });
  }

  return {
    clearToken() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    },

    getToken() {
      return getStoredToken();
    },

    async init() {
      if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        document.getElementById('setupMsg').style.display = 'block';
        document.getElementById('signInBtn').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        return;
      }

      const stored = getStoredToken();
      if (stored) {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        window.dispatchEvent(new CustomEvent('authReady', { detail: { token: stored } }));
        return;
      }

      await setupTokenClient();
      document.getElementById('authScreen').style.display = 'flex';
    },

    async signIn() {
      if (!tokenClient) await setupTokenClient();
      try {
        const token = await requestToken('select_account');
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        window.dispatchEvent(new CustomEvent('authReady', { detail: { token } }));
      } catch (err) {
        console.error('Sign-in failed', err);
        document.getElementById('signInError').style.display = 'block';
      }
    },

    signOut() {
      const token = getStoredToken();
      if (token && window.google?.accounts?.oauth2) {
        google.accounts.oauth2.revoke(token, () => {});
      }
      this.clearToken();
      document.getElementById('authScreen').style.display = 'flex';
      window.dispatchEvent(new CustomEvent('authSignedOut'));
    },
  };
})();
