import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";  // ✅ ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyChvHowklN9mcr1ACcxLE4OjxINES8vCsg",
  authDomain: "dare-devil-98e0a.firebaseapp.com",
  projectId: "dare-devil-98e0a",
  storageBucket: "dare-devil-98e0a.firebasestorage.app",
  messagingSenderId: "172409735257",
  appId: "1:172409735257:web:c011de52ed97ede2af8948",
  measurementId: "G-W9L5VDHWVS"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);