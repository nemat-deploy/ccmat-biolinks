// src/types/firebase.d.ts
import { User } from "firebase/auth";

// Extendendo tipos existentes
declare module "firebase/auth" {
  interface User {
    role?: 'admin' | 'user'; // Exemplo de campo customizado
    customClaims?: Record<string, any>;
  }
}

// Para campos adicionais no Firestore
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
};

declare module "firebase/firestore" {
  interface DocumentData {
    createdAt?: FirestoreTimestamp | Date;
    updatedAt?: FirestoreTimestamp | Date;
  }
}
