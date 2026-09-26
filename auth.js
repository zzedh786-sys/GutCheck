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
  let saveTimer = null;

  function renderMessage(text, isError) {
    overlay.innerHTML = `<p class="${isError ? '' : 'muted'}" style="${isError ? 'color:var(--red)' : ''};max-width:340px;text-align:center">${isError ? '' : '<span class="spinner" aria-hidden="true"></span>'}${esc(text)}</p>`;
  }

  const AUTH_ERR = {
    'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
    'auth/invalid-email': 'That doesn’t look like a valid email address.',
    'auth/weak-password': 'Use at least 6 characters.',
    'auth/wrong-password': 'Wrong password.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email yet. Try creating one.',
    'auth/popup-closed-by-user': 'Sign-in was closed before it finished.',
    'auth/network-request-failed': 'Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  };
  const authErrMsg = (err) => (err && AUTH_ERR[err.code]) || 'Something went wrong. Try again.';

  function renderAuthForm(err) {
    overlay.innerHTML = `<div class="panel lift sec" style="max-width:380px;width:100%">
      <div class="brand" style="justify-content:center;margin-bottom:2px"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h15a5 5 0 0 1 0 10H11a4 4 0 0 0 0 8h15"/></svg>Gutwise</div>
      <h1 style="text-align:center;font-size:1.3rem">${mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
      <p class="sub" style="text-align:center">${mode === 'signup' ? 'Your entries sync to this account, so you can pick up on any device.' : 'Sign in to load your gut health data.'}</p>
      ${err ? `<p class="small" style="color:var(--red);text-align:center">${esc(err)}</p>` : ''}
      <form id="authForm" class="sec" novalidate>
        <label class="f" for="authEmail">Email<input id="authEmail" type="email" autocomplete="email" required></label>
        <label class="f" for="authPass">Password<input id="authPass" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required></label>
        <button class="btn" type="submit" id="authSubmitBtn">${mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      </form>
      <button class="btn ghost" type="button" id="googleSignInBtn">Continue with Google</button>
      <button class="btn ghost small" type="button" id="toggleAuthMode" style="align-self:center">${mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
    </div>`;

    overlay.querySelector('#toggleAuthMode').onclick = () => { mode = mode === 'signup' ? 'signin' : 'signup'; renderAuthForm(); };

    overlay.querySelector('#authForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = overlay.querySelector('#authEmail').value.trim();
      const pass = overlay.querySelector('#authPass').value;
      const btn = overlay.querySelector('#authSubmitBtn');
      btn.disabled = true;
      try {
        if (mode === 'signup') await fbAuth.createUserWithEmailAndPassword(email, pass);
        else await fbAuth.signInWithEmailAndPassword(email, pass);
        // onAuthStateChanged below takes it from here
      } catch (err) {
        renderAuthForm(authErrMsg(err));
      }
    };

    overlay.querySelector('#googleSignInBtn').onclick = async () => {
      try {
        await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
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
