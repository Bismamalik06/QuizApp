import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDGOIJ6_viZIJYo1uScyT6mq4TgEKTsYO8",
  authDomain: "quizapp-ef372.firebaseapp.com",
  databaseURL: "https://quizapp-ef372-default-rtdb.firebaseio.com",
  projectId: "quizapp-ef372",
  storageBucket: "quizapp-ef372.firebasestorage.app",
  messagingSenderId: "202091517138",
  appId: "1:202091517138:web:3478f2aeb127cf1273c90b",
};

const app = initializeApp(firebaseConfig);

// 🔥 ONLY database export (NO analytics)
export const db = getDatabase(app);
