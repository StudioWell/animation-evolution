/**
 * Firebase settings for the public (GitHub Pages / Next.js) version of the
 * site: Google sign-in, community video submissions and the owner's review.
 *
 * The web config below is public by design — it only names the Firebase
 * project. What visitors may read or write is enforced by the security rules
 * deployed to that project (see firebase/firestore.rules), not by this file.
 *
 * Leave FIREBASE_CONFIG as null to switch the feature off: the site then works
 * as a read-only library and explains that publishing isn't available.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export const FIREBASE_CONFIG: FirebaseWebConfig | null = {
  apiKey: "AIzaSyAfKYyvAUeP2QQDy9PQitR8pWDIl-06J7c",
  authDomain: "animation-evolution.firebaseapp.com",
  projectId: "animation-evolution",
  storageBucket: "animation-evolution.firebasestorage.app",
  messagingSenderId: "397113057108",
  appId: "1:397113057108:web:43f61b8d1950b68ea532c1",
};

/**
 * Video file uploads use Cloud Storage for Firebase, which needs the project
 * on the Blaze plan. Off: people submit YouTube or Vimeo links instead.
 */
export const FIREBASE_UPLOADS = false;

/**
 * SHA-256 of the site owner's Google email, lower-case. Only the owner sees
 * the review button; the security rules are what actually limit approving
 * and publishing to that account.
 */
export const OWNER_EMAIL_SHA256 = "df527e2e85a5b3f551bde9b4bfbb07abab8e2be329fefc661f0e5d8ca37b7cd2";

/** Firebase's own CDN for the modular web SDK (pinned version). */
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/11.9.0";

export function firebaseConfigured(config: FirebaseWebConfig | null = FIREBASE_CONFIG): config is FirebaseWebConfig {
  return Boolean(
    config &&
      /^[A-Za-z0-9_-]{20,60}$/.test(config.apiKey) &&
      /^[a-z0-9-]{4,40}$/.test(config.projectId) &&
      /^[a-z0-9.-]+\.(firebaseapp\.com|web\.app)$|^[a-z0-9.-]+$/.test(config.authDomain) &&
      config.appId.length > 5,
  );
}
