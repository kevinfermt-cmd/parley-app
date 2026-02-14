// src/components/SmartFloatingButton.js
"use client";
import { useState, useEffect } from "react";

export default function SmartFloatingButton({ onRefresh }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Si bajamos más de 300px, mostramos la flecha. Si no, mostramos refresh.
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    if (showScrollTop) {
      // Acción: Subir
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Acción: Refrescar
      triggerRefresh();
    }
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    // Ejecutamos la función de recarga que nos pasa el padre
    if (onRefresh) onRefresh();
    
    // Animación falsa de carga de 1 segundo para feedback visual
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-20 right-4 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-cyan-500/30
        ${showScrollTop 
            ? "bg-gray-800 text-cyan-400" // Modo Subir: Oscuro
            : "bg-cyan-500 text-white"    // Modo Refresh: Brillante
        }
      `}
    >
      {showScrollTop ? (
        // Icono Flecha Arriba
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 animate-bounce">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      ) : (
        // Icono Refresh (Gira si está cargando)
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      )}
    </button>
  );
}