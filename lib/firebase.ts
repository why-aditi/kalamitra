import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if needed client-side

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7TnGJLI8l6YvXThsEVoVUprpnVuUKJyw",
  authDomain: "meesho-d4bdc.firebaseapp.com",
  projectId: "meesho-d4bdc",
  storageBucket: "meesho-d4bdc.appspot.com", // Corrected to match Firebase format
  messagingSenderId: "549776032156",
  appId: "1:549776032156:web:f8c62511062b3e82c9c859",
  measurementId: "G-J284REYSDL"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app); // Uncomment if needed, wrap in useEffect for client-side

export const auth = getAuth(app);
export const db = getFirestore(app);