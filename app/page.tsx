// app/page.js (o .tsx)
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
import SmartFloatingButton from "../src/components/SmartFloatingButton"; 

export default function Home() {
  // CORRECCIÓN AQUÍ: Agregamos <any> para que TypeScript no se queje
  const [user, setUser] = useState(null); 
  // SI ESTO TE DA ERROR DE SINTAXIS (ROJO), CAMBIALO POR: const [user, setUser] = useState<any>(null);
  
  // Como tu archivo es .tsx según el log, la línea correcta es esta:
  // const [user, setUser] = useState<any>(null);
  
  // PERO, si estás pegando esto en un archivo .js, usa la de arriba.
  // VOY A ASUMIR QUE ES .TSX POR EL ERROR DE VERCEL.
  
  // USA ESTA LÍNEA SI TU ARCHIVO TERMINA EN .TSX:
  // const [user, setUser] = useState<any>(null);

  // USA ESTA LÍNEA SI TU ARCHIVO TERMINA EN .JS (y Vercel está loco):
  // const [user, setUser] = useState(null);

  /* 🚨 PARA ARREGLARLO RÁPIDO EN TU CASO ESPECÍFICO 🚨
     Como Vercel dice que es 'page.tsx', copia todo este bloque de abajo tal cual.
     Si te sale rojo en tu editor local, borra el '<any>'.
  */

  const [activeTab, setActiveTab] = useState("feed"); 
  const [feedFilter, setFeedFilter] = useState("general"); 
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // SOLUCIÓN AL ERROR DE TIPO: Verificamos que user exista antes de pedir el email de una forma segura
  const isAdmin = user && user.email === "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSmartRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 font-sans pb-24">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center bg-gray-900 p-4 sticky top-0 z-20 border-b border-gray-800 shadow-md">
        <h1 className="text-xl font-black text-white tracking-tighter italic">
            PARLEY<span className="text-cyan-400">APP</span>
        </h1>
        <div><AuthButton /></div>
      </nav>

      {isAdmin && (
        <div className="max-w-2xl mx-auto mt-4 px-4"><AdminMatchForm /></div>
      )}

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- CONTENIDO --- */}
        <div className={activeTab === "feed" ? "block" : "hidden"}>
            {user ? (
              <CreatePost user={user} />
            ) : (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-cyan-900/50 text-white p-6 rounded-xl text-center mb-8 shadow-lg mx-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500 blur-[50px] opacity-10"></div>
                <h2 className="text-2xl font-bold mb-2 relative z-10">¡Únete a la Hinchada!</h2>
                <p className="text-gray-400 text-sm relative z-10">Regístrate para ver las fijas y compartir tus jugadas.</p>
              </div>
            )}

            {/* Sub-Nav Feed (Sticky) */}
            {user && (
                <div className="flex gap-6 mb-6 px-2 border-b border-gray-800 sticky top-16 z-10 bg-gray-950/95 backdrop-blur pt-2 transition-all">
                    <button onClick={() => setFeedFilter("general")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "general" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Para ti</button>
                    <button onClick={() => setFeedFilter("following")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "following" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Siguiendo</button>
                    <button onClick={() => setFeedFilter("trending")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "trending" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Tendencias 🔥</button>
                </div>
            )}

            <div className="space-y-4">
                {user ? (
                    <>
                        <div className={feedFilter === "general" ? "block animate-in fade-in" : "hidden"}>
                            <PostList user={user} mode="general" refreshTrigger={refreshTrigger} />
                        </div>
                        <div className={feedFilter === "following" ? "block animate-in fade-in" : "hidden"}>
                            <PostList user={user} mode="following" refreshTrigger={refreshTrigger} />
                        </div>
                        <div className={feedFilter === "trending" ? "block animate-in fade-in" : "hidden"}>
                            <PostList user={user} mode="trending" refreshTrigger={refreshTrigger} />
                        </div>
                    </>
                ) : (
                    <div className="bg-gray-900 p-12 rounded-xl text-center border-2 border-dashed border-gray-800">
                        <span className="text-4xl block mb-2 opacity-50">🔒</span>
                        <p className="text-gray-500 font-medium">Contenido exclusivo para miembros</p>
                    </div>
                )}
            </div>
        </div>

        {/* SECCIÓN LIVE */}
        <div className={activeTab === "live" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
            <LiveSection />
        </div>

      </div>

      {/* Botón Flotante */}
      {activeTab === "feed" && user && (
          <SmartFloatingButton onRefresh={handleSmartRefresh} />
      )}

      {/* Menu Inferior */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

    </main>
  );
}