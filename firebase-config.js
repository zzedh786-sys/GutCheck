// Firebase project config.
//
// Get these values from: Firebase Console (console.firebase.google.com)
// -> your project -> the gear icon -> Project settings -> General ->
// "Your apps" -> the web app (</>) -> SDK setup and configuration.
//
// These values are NOT secret -- they're meant to be public in client-side
// code. What actually protects your data is the Firestore security rules
// you set in the console (see README.md), not hiding this file.
//
// Until you paste in real values below, the app runs locally only, with no
// sign-in gate, exactly as it did before.
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};
