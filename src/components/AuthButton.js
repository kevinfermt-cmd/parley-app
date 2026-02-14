// src/components/AuthButton.js
"use client"; // Esto es obligatorio en Next.js para cosas interactivas

import { useState, useEffect } from "react";
import { auth } from "../lib/firebase"; // Asegúrate que esta ruta sea correcta
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState(null);

  // Este "efecto" vigila si alguien entra o sale
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Función para iniciar sesión
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al entrar:", error);
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    await signOut(auth);
  };

  // Si hay usuario, mostramos su foto y botón de salir
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <img 
          src={user.photoURL} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full border-2 border-green-500"
        />
        <div className="text-sm">
            <p className="font-bold">{user.displayName}</p>
            <button 
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Cerrar Sesión
            </button>
        </div>
      </div>
    );
  }

  // Si NO hay usuario, mostramos botón de entrar
  return (
    <button
      onClick={handleLogin}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      Entrar con Google
    </button>
  );
}