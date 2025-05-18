import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// credenciais Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // deixe aqui se for usar no futuro
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// inicializando o app Firebase
const app = initializeApp(firebaseConfig);

// inicializando serviços
const db = getFirestore(app);

export { app, db };
