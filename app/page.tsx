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
import BottomNav from "../src/components/BottomNav"; // <--- IMPORTAMOS EL MENU NUEVO

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed"); // 'feed' o 'live'
  
  // RECUERDA: Pon tu email real aquí para que funcione el panel
  const isAdmin = user?.email === "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    // Agregamos 'pb-24' para que el contenido no quede tapado por el menú inferior
    <main className="min-h-screen bg-gray-100 font-sans pb-24">
      
      {/* Navbar Superior (Solo Logo y Login) */}
      <nav className="flex justify-between items-center bg-white p-4 sticky top-0 z-20 border-b border-gray-200">
        <h1 className="text-xl font-black text-blue-900 tracking-tighter italic">
            PARLEY<span className="text-green-600">APP</span>
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
        
        {/* YA NO HAY BOTONES DE TABS AQUÍ ARRIBA 🚫 */}
        
        {/* --- CONTENIDO --- */}
        {activeTab === "feed" ? (
            // === VISTA DEL FEED ===
            <>
                {user ? (
                  <CreatePost user={user} />
                ) : (
                  <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-xl text-center mb-8 shadow-lg mx-2">
                    <h2 className="text-2xl font-bold mb-2">¡Gana con la comunidad!</h2>
                    <p className="opacity-90 text-sm">Regístrate para ver las fijas y compartir tus jugadas.</p>
                  </div>
                )}

                <div className="space-y-4">
                    {user ? (
                        <PostList user={user} />
                    ) : (
                        <div className="bg-white p-12 rounded-xl text-center border-2 border-dashed border-gray-300">
                            <span className="text-4xl block mb-2">🔒</span>
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
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
      />

    </main>
  );
}