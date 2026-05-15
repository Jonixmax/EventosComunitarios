
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCGzZHVwZsdRMxunR7S5HvFBeunnJiBf7U",
  authDomain: "eventos-comunitarios-c49b1.firebaseapp.com",
  projectId: "eventos-comunitarios-c49b1",
  storageBucket: "eventos-comunitarios-c49b1.firebasestorage.app",
  messagingSenderId: "856721282484",
  appId: "1:856721282484:web:f7f6210faedb8ca90fcee1",
  measurementId: "G-ZJHPBJJWQP"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };