// src/lib/firebaseAuth.ts

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase"; // Usa a instância já inicializada

// Agora sim, usa o mesmo app do firebase.ts
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut, onAuthStateChanged };