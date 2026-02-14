// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Pega AQUI TU CONFIGURACIÓN (lo que copiaste de la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyCEtIVVgRZdZsV3z6uCsadst9fefSJznUg", // TUS DATOS REALES AQUI
  authDomain: "futbolsocialapp-b1353.firebaseapp.com",
  projectId: "futbolsocialapp-b1353",
  storageBucket: "futbolsocialapp-b1353.firebasestorage.app",
  messagingSenderId: "1045114777823",
  appId: "1:1045114777823:web:5547caaaf267f1ff2d396a"
};

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos y la autenticación para usarlas luego
export const db = getFirestore(app);
export const auth = getAuth(app);