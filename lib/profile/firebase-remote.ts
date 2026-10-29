import { firebase, firestoreDb } from "@/lib/firebase/client";
import { parseProfile, type ProfileData } from "@/lib/profile/storage";

/**
 * On the public site, a Google-signed-in visitor's profile (name, photo, saved
 * videos) is also kept in Firestore at users/<uid>, readable and writable only
 * by that account (see firebase/firestore.rules), so it follows them across devices.
 */
export const firebaseRemote = {
  async load(uid: string): Promise<ProfileData | null> {
    const fb = await firebase();
    if (!fb) return null;
    try {
      const snap = await firestoreDb(fb).doc(`users/${uid}`).get();
      return snap.exists ? parseProfile(snap.data()) : null;
    } catch {
      return null;
    }
  },
  async save(uid: string, profile: ProfileData): Promise<boolean> {
    const fb = await firebase();
    if (!fb) return false;
    try {
      await firestoreDb(fb).doc(`users/${uid}`).set({ ...profile });
      return true;
    } catch {
      return false;
    }
  },
};
