// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDGOIJ6_viZIJYo1uScyT6mq4TgEKTsYO8",
//   authDomain: "quizapp-ef372.firebaseapp.com",
//   databaseURL: "https://quizapp-ef372-default-rtdb.firebaseio.com",
//   projectId: "quizapp-ef372",
//   storageBucket: "quizapp-ef372.firebasestorage.app",
//   messagingSenderId: "202091517138",
//   appId: "1:202091517138:web:3478f2aeb127cf1273c90b",
//   measurementId: "G-EC9Y5M0K13"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// firebase.js
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
