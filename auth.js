// Sign-in gate + Firestore sync.
//
// The rest of the app already works fully offline, straight from
// localStorage (see state.js). This file adds an account on top: when
// Firebase is configured, it shows a sign-in page before the app, then
// keeps `S` (the app's whole data object) mirrored to a Firestore document
// at users/{uid} so the same account sees the same data on any device.
//
// If firebase-config.js still has its placeholder values, this gate is
// skipped entirely and the app behaves exactly as it did with no account
// system at all.
(function () {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;

  const configured =
    typeof firebaseConfig !== 'undefined' &&
    firebaseConfig &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.indexOf('PASTE_') !== 0;

  if (!configured) {
    overlay.remove();
    return;
  }
  if (typeof firebase === 'undefined') {
    renderMessage('The sign-in service didn’t load. Check your connection, then reload.', true);
    return;
  }

  firebase.initializeApp(firebaseConfig);
  const fbAuth = firebase.auth();
  const fbDb = firebase.firestore();
  try { fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}

  let mode = 'signin';
  let lastEmail = '';
  let saveTimer = null;

  function renderMessage(text, isError) {
    overlay.innerHTML = `<p class="${isError ? '' : 'muted'}" style="${isError ? 'color:var(--red)' : ''};max-width:340px;text-align:center">${isError ? '' : '<span class="spinner" aria-hidden="true"></span>'}${esc(text)}</p>`;
  }

  const AUTH_ERR = {
    'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
    'auth/invalid-email': 'That doesn’t look like a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'Use at least 6 characters.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email yet. Try creating one.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'That email is already registered another way. Sign in with your password instead.',
    'auth/network-request-failed': 'Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/unauthorized-domain': 'This website address isn’t approved for sign-in yet. Add it under Authentication → Settings → Authorized domains in Firebase.',
    'auth/operation-not-allowed': 'This sign-in method isn’t turned on in Firebase yet.',
  };
  const authErrMsg = (err) => (err && AUTH_ERR[err.code]) || 'Something went wrong. Try again.';

  const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

  overlay.style.overflowY = 'auto';

  function renderAuthForm(err, note) {
    const up = mode === 'signup';
    overlay.innerHTML = `<div class="authcard panel lift sec">
      <div class="authmark" aria-hidden="true"><svg viewBox="180 160 664 640" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M262 770 V330 A100 100 0 0 1 362 230" stroke="#3FC378" stroke-width="110"/><path d="M340 230 H684" stroke="#F2B134" stroke-width="110"/><path d="M662 230 A100 100 0 0 1 779 330 V600 C779 690 720 720 650 720" stroke="#E5574F" stroke-width="110"/><path d="M410 385 H615 A42 42 0 0 1 615 470 H410 A42 42 0 0 0 410 555 H615 A42 42 0 0 1 615 640 H470" stroke="currentColor" stroke-width="46"/></g></svg></div>
      <header class="sec" style="text-align:center;gap:4px">
        <h1 style="font-size:1.5rem">${up ? 'Create your account' : 'Welcome to Gutlight'}</h1>
        <p class="sub" style="margin-inline:auto">${up ? 'Save your gut health data to an account and pick it up on any device.' : 'Sign in to track your gut health and sync across devices.'}</p>
      </header>
      <div class="seg" role="tablist" aria-label="Sign in or create account">
        <button type="button" role="tab" aria-selected="${!up}" id="tabSignin">Sign in</button>
        <button type="button" role="tab" aria-selected="${up}" id="tabSignup">Create account</button>
      </div>
      <button class="gbtn" type="button" id="googleSignInBtn">${GOOGLE_G}<span>${up ? 'Sign up with Google' : 'Continue with Google'}</span></button>
      <div class="divider"><span>or use your email</span></div>
      <div role="alert" aria-live="polite">${err ? `<p class="autherr">${esc(err)}</p>` : ''}${note ? `<p class="authok">${esc(note)}</p>` : ''}</div>
      <form id="authForm" class="sec" novalidate>
        <label class="f" for="authEmail">Email<input id="authEmail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="${esc(lastEmail)}" required></label>
        <label class="f" for="authPass">Password
          <span class="pwrow"><input id="authPass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 6 characters' : 'Your password'}" minlength="6" required><button type="button" id="togglePw" class="pwtoggle" aria-label="Show password" aria-pressed="false">${EYE}</button></span>
        </label>
        <button class="btn" type="submit" id="authSubmitBtn" style="padding-block:12px">${up ? 'Create account' : 'Sign in'}</button>
      </form>
      ${up ? '' : '<button class="linkbtn" type="button" id="forgotBtn">Forgot your password?</button>'}
      <p class="small muted" style="text-align:center">Gutlight is a self-tracking aid, not medical advice.</p>
    </div>`;

    const $o = (s) => overlay.querySelector(s);
    const keepEmail = () => { lastEmail = $o('#authEmail').value.trim(); };
    $o('#tabSignin').onclick = () => { keepEmail(); mode = 'signin'; renderAuthForm(); };
    $o('#tabSignup').onclick = () => { keepEmail(); mode = 'signup'; renderAuthForm(); };
    $o('#togglePw').onclick = () => {
      const i = $o('#authPass'), show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      $o('#togglePw').setAttribute('aria-pressed', String(show));
      $o('#togglePw').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    };

    $o('#authForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = $o('#authEmail').value.trim();
      lastEmail = email;
      const pass = $o('#authPass').value;
      if (!email) return renderAuthForm('Enter your email address.');
      if (!pass) return renderAuthForm('Enter your password.');
      const btn = $o('#authSubmitBtn');
      btn.disabled = true;
      btn.textContent = up ? 'Creating account…' : 'Signing in…';
      try {
        if (up) await fbAuth.createUserWithEmailAndPassword(email, pass);
        else await fbAuth.signInWithEmailAndPassword(email, pass);
        // onAuthStateChanged below takes it from here
      } catch (err) {
        renderAuthForm(authErrMsg(err));
      }
    };

    $o('#googleSignInBtn').onclick = async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const btn = $o('#googleSignInBtn');
      btn.disabled = true;
      try {
        await fbAuth.signInWithPopup(provider);
      } catch (err) {
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) {
          try { await fbAuth.signInWithRedirect(provider); return; } catch (e2) { err = e2; }
        }
        renderAuthForm(authErrMsg(err));
      }
    };

    const forgot = $o('#forgotBtn');
    if (forgot) forgot.onclick = async () => {
      const email = $o('#authEmail').value.trim();
      lastEmail = email;
      if (!email) return renderAuthForm('Type your email above first, then tap “Forgot your password?”.');
      try {
        await fbAuth.sendPasswordResetEmail(email);
        renderAuthForm(null, 'If an account exists for ' + email + ', a reset link is on its way.');
      } catch (err) {
        renderAuthForm(authErrMsg(err));
      }
    };
  }

  function sanitizeForFirestore(s) {
    const c = JSON.parse(JSON.stringify(s));
    if (Array.isArray(c.meals)) c.meals.forEach((m) => { delete m.img; }); // photos stay local-only (Firestore's 1MB doc limit)
    return c;
  }

  function wireCloudSync(uid) {
    const ref = fbDb.collection('users').doc(uid);
    _cloudSync = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        ref.set(sanitizeForFirestore(S)).catch((err) => {
          if (typeof toast === 'function') toast('Could not sync to your account: ' + (err && err.message ? err.message : 'try again later'));
        });
      }, 1200);
    };
  }

  function showSignOut(show) {
    const btn = document.getElementById('signOutBtn');
    if (!btn) return;
    btn.hidden = !show;
    btn.onclick = () => { _cloudSync = null; fbAuth.signOut(); };
  }

  renderMessage('Checking your session…');

  fbAuth.onAuthStateChanged(async (user) => {
    if (!user) {
      _cloudSync = null;
      showSignOut(false);
      renderAuthForm();
      return;
    }
    renderMessage('Loading your data…');
    try {
      const ref = fbDb.collection('users').doc(user.uid);
      const snap = await ref.get();
      if (snap.exists) {
        const remote = snap.data() || {};
        ['meals', 'sym', 'breath', 'meds', 'recipes'].forEach((k) => { if (Array.isArray(remote[k])) S[k] = remote[k]; });
        if (typeof remote.demo === 'boolean') S.demo = remote.demo;
        S.seeded = true;
        save();
      } else {
        await ref.set(sanitizeForFirestore(S)); // first sign-in on this account: upload whatever's local (demo data, if nothing's been logged yet)
      }
      wireCloudSync(user.uid);
      showSignOut(true);
      if (typeof render === 'function') render();
      overlay.remove();
    } catch (err) {
      renderAuthForm('Could not load your data. Check your connection and try again.');
    }
  });
})();
