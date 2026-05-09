import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import firebaseConfig from '../../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from './errors';

export async function createManagedUser(email: string, pass: string, name: string, role: string, cityId: string) {
  let secondaryApp;
  try {
    secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth');
  } catch (e) {
    secondaryApp = getApp('SecondaryAuth');
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const user = userCredential.user;

    // Create profile in main DB
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      userId: user.uid,
      name: name,
      email: email,
      role: role,
      cityId: cityId,
      hasCompletedOnboarding: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`));

    // Sign out from secondary app to keep it clean
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return user.uid;
  } catch (error) {
    if (secondaryApp) await deleteApp(secondaryApp).catch(() => {});
    throw error;
  }
}
