// services/authService.ts
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  signInWithCredential,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export class AuthService {
  // Sign in anonymously
  static async signInAnonymous(): Promise<User> {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Create initial user document
      await this.createUserDocument(user.uid);

      return user;
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      throw new Error('Failed to sign in: ' + error.message);
    }
  }

  // Sign in with email
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      return user;
    } catch (error: any) {
      console.error('Email sign in error:', error);
      throw new Error('Failed to sign in: ' + error.message);
    }
  }
  // Create initial user document in Firestore
  static async createUserDocument(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    // Only create if doesn't exist
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: userId,
        isAnonymous: true,
        createdAt: serverTimestamp(),

        // Initial stats
        totalXP: 0,
        level: 1,
        title: 'Wanderer',
        titleEmoji: '🌱',

        // Initial streaks
        streak: 0,

        // Initial shields
        shields: [],

        // Initial badges
        badges: [],

        // Settings
        settings: {
          screenTimeGoal: 2, // hours
          notifications: true,
          dailyCheckIn: true,
        },

        // Initial stats
        stats: {
          totalSessions: 0,
          totalMinutes: 0,
          sessionsToday: 0,
          longestSession: 0,
          maxSessionsPerDay: 0,
          totalResists: 0,
          questsCompleted: 0,
          dailyQuestStreak: 0,
          phoneFreeMeals: 0,
          phoneFreeSocial: 0,
          phoneFreeOutdoor: 0,
          sleepStreak: 0,
          perfectDays: 0,
          comebackStreaks: 0,
          maxQuestsPerDay: 0,
          lateNightFreeStreak: 0,
          appsDeleted: 0,
          communityHelps: 0,
        },

        // Empty history arrays
        xpHistory: [],
        levelHistory: [],
        unlockedRewards: [],
      });
    }
  }

  // Convert anonymous account to permanent (optional feature)
  static async linkWithEmail(email: string, password: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);

      // Update user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          email,
          isAnonymous: false,
          linkedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Account linked successfully');
    } catch (error: any) {
      console.error('Link account error:', error);
      throw new Error('Failed to link account: ' + error.message);
    }
  }

  // Get current user data
  static async getCurrentUserData(): Promise<any> {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }

    return null;
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out: ' + error.message);
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  static async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    const userId = user.uid;

    try {
      console.log('[AuthService] Starting account deletion for user:', userId);

      // Step 1: Delete all user sessions
      await this.deleteUserSessions(userId);

      // Step 2: Delete all XP transactions
      await this.deleteUserXPTransactions(userId);

      // Step 3: Delete all badge events
      await this.deleteUserBadgeEvents(userId);

      // Step 4: Delete user quests (if they exist as subcollection)
      await this.deleteUserQuests(userId);

      // Step 5: Delete the main user document
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log('[AuthService] User document deleted');

      // Step 6: Delete Firebase Auth account
      await deleteUser(user);
      console.log('[AuthService] Firebase Auth account deleted');

      console.log('[AuthService] Account deletion completed successfully');
    } catch (error: any) {
      console.error('[AuthService] Error deleting account:', error);

      // Provide more specific error messages
      if (error.code === 'auth/requires-recent-login') {
        throw new Error(
          'For security reasons, please sign out and sign back in before deleting your account.'
        );
      }

      throw new Error(error.message || 'Failed to delete account');
    }
  }

  /**
   * Delete all sessions for a user
   */
  private static async deleteUserSessions(userId: string): Promise<void> {
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[AuthService] No sessions to delete');
        return;
      }

      // Use batch delete for efficiency (max 500 operations per batch)
      const batch = writeBatch(db);
      let operationCount = 0;
      const batches: any[] = [batch];

      snapshot.forEach((doc) => {
        if (operationCount >= 500) {
          batches.push(writeBatch(db));
          operationCount = 0;
        }
        batches[batches.length - 1].delete(doc.ref);
        operationCount++;
      });

      // Commit all batches
      await Promise.all(batches.map((b) => b.commit()));
      console.log(`[AuthService] Deleted ${snapshot.size} sessions`);
    } catch (error) {
      console.error('[AuthService] Error deleting sessions:', error);
      throw error;
    }
  }

  /**
   * Delete all XP transactions for a user
   */
  private static async deleteUserXPTransactions(userId: string): Promise<void> {
    try {
      const transactionsRef = collection(db, 'xpTransactions');
      const q = query(transactionsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[AuthService] No XP transactions to delete');
        return;
      }

      const batch = writeBatch(db);
      let operationCount = 0;
      const batches: any[] = [batch];

      snapshot.forEach((doc) => {
        if (operationCount >= 500) {
          batches.push(writeBatch(db));
          operationCount = 0;
        }
        batches[batches.length - 1].delete(doc.ref);
        operationCount++;
      });

      await Promise.all(batches.map((b) => b.commit()));
      console.log(`[AuthService] Deleted ${snapshot.size} XP transactions`);
    } catch (error) {
      console.error('[AuthService] Error deleting XP transactions:', error);
      throw error;
    }
  }

  /**
   * Delete all badge events for a user
   */
  private static async deleteUserBadgeEvents(userId: string): Promise<void> {
    try {
      const badgeEventsRef = collection(db, 'badgeEvents');
      const q = query(badgeEventsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[AuthService] No badge events to delete');
        return;
      }

      const batch = writeBatch(db);
      let operationCount = 0;
      const batches: any[] = [batch];

      snapshot.forEach((doc) => {
        if (operationCount >= 500) {
          batches.push(writeBatch(db));
          operationCount = 0;
        }
        batches[batches.length - 1].delete(doc.ref);
        operationCount++;
      });

      await Promise.all(batches.map((b) => b.commit()));
      console.log(`[AuthService] Deleted ${snapshot.size} badge events`);
    } catch (error) {
      console.error('[AuthService] Error deleting badge events:', error);
      throw error;
    }
  }

  /**
   * Delete all quests for a user (if stored as subcollection)
   */
  private static async deleteUserQuests(userId: string): Promise<void> {
    try {
      const questsRef = collection(db, 'users', userId, 'quests');
      const snapshot = await getDocs(questsRef);

      if (snapshot.empty) {
        console.log('[AuthService] No quests to delete');
        return;
      }

      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`[AuthService] Deleted ${snapshot.size} quests`);
    } catch (error) {
      console.error('[AuthService] Error deleting quests:', error);
      // Don't throw - quests might not exist for all users
    }
  }
}
