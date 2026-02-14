// app/page.js
"use client";
import { useState, useEffect } from "react";
import { auth } from "../src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AuthButton from "../src/components/AuthButton";
import CreatePost from "../src/components/CreatePost";
import PostList from "../src/components/PostList";
import LiveSection from "../src/components/LiveSection"; 
import AdminMatchForm from "../src/components/AdminMatchForm";
import BottomNav from "../src/components/BottomNav"; 

export default function Home() {
  // Quitamos <any> para evitar errores si el archivo es .js puro
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed"); 
  
  // RECUERDA: Pon tu email real aquí para que funcione el panel
  const isAdmin = user?.email === "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    // CAMBIO 1: Fondo principal 'bg-gray-950' (Casi negro) y texto 'text-gray-200'
    <main className="min-h-screen bg-gray-950 text-gray-200 font-sans pb-24">
      
      {/* Navbar Superior */}
      {/* CAMBIO 2: bg-gray-900 (Gris oscuro), borde gray-800 */}
      <nav className="flex justify-between items-center bg-gray-900 p-4 sticky top-0 z-20 border-b border-gray-800 shadow-md">
        <h1 className="text-xl font-black text-white tracking-tighter italic">
            PARLEY<span className="text-cyan-400">APP</span> {/* Acento Celeste */}
        </h1>
        <div>
            <AuthButton />
        </div>
      </nav>

      {isAdmin && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
            <AdminMatchForm />
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- CONTENIDO --- */}
        {activeTab === "feed" ? (
            // === VISTA DEL FEED ===
            <>
                {user ? (
                  <CreatePost user={user} />
                ) : (
                  // Banner de Bienvenida Estilo Neón
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-cyan-900/50 text-white p-6 rounded-xl text-center mb-8 shadow-lg mx-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500 blur-[50px] opacity-10"></div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">¡Únete a la Hinchada!</h2>
                    <p className="text-gray-400 text-sm relative z-10">Regístrate para ver las fijas y compartir tus jugadas.</p>
                  </div>
                )}

                <div className="space-y-4">
                    {user ? (
                        <PostList user={user} />
                    ) : (
                        // Estado Bloqueado Oscuro
                        <div className="bg-gray-900 p-12 rounded-xl text-center border-2 border-dashed border-gray-800">
                            <span className="text-4xl block mb-2 opacity-50">🔒</span>
                            <p className="text-gray-500 font-medium">Contenido exclusivo para miembros</p>
                        </div>
                    )}
                </div>
            </>
        ) : (
            // === VISTA EN VIVO ===
            <div className="animate-in fade-in zoom-in duration-300">
                <LiveSection />
            </div>
        )}

      </div>

      {/* --- MENU INFERIOR FIJO --- */}
      {/* Nota: BottomNav necesitará sus propios cambios de color internos */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
      />

    </main>
  );
}