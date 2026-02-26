// app/page.js
"use client";
import { useState, useEffect } from "react";
import { auth } from "../src/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Componentes Core
import AuthButton from "../src/components/AuthButton";
import CreatePost from "../src/components/CreatePost";
import PostList from "../src/components/PostList";
import LiveSection from "../src/components/LiveSection"; 
import Explore from "../src/components/Explore"; 
import AdminMatchForm from "../src/components/AdminMatchForm";
import BottomNav from "../src/components/BottomNav"; 
import SmartFloatingButton from "../src/components/SmartFloatingButton"; 

export default function Home() {
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState("feed"); 
  const [feedFilter, setFeedFilter] = useState("general"); 
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  
  // ESTADO PARA EL MENÚ LATERAL (DRAWER)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // LA SOLUCIÓN AL ERROR DE VERCEL AQUÍ (Uso de ?.)
  const isAdmin = user?.email === "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSmartRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
      if(confirm("¿Seguro que quieres cerrar sesión?")) {
        await signOut(auth);
        setIsMenuOpen(false);
        window.location.reload(); 
      }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 font-sans pb-24">
      
      {/* ================= NAVBAR SUPERIOR (STICKY FUNCIONANDO) ================= */}
      <nav className="flex justify-between items-center bg-gray-900/90 backdrop-blur-md p-4 sticky top-0 z-40 border-b border-gray-800 shadow-md h-16">
        <h1 className="text-xl font-black text-white tracking-tighter italic">
            Social<span className="text-cyan-400">Bet</span>
        </h1>
        
        {/* BOTÓN PERFIL / MENÚ */}
        <div>
            {!user ? (
                <AuthButton />
            ) : (
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition text-gray-300 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            )}
        </div>
      </nav>

      {/* ================= MENÚ LATERAL DESLIZANTE (DRAWER) ================= */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsMenuOpen(false)}
              ></div>

              <div className="relative w-4/5 max-w-sm bg-gray-900 h-full shadow-2xl border-l border-gray-800 flex flex-col animate-in slide-in-from-right duration-300">
                  
                  <div className="p-4 flex justify-end">
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-6">
                      
                      {user && (
                          <div className="flex flex-col items-center mb-6">
                              <img src={user.photoURL} className="w-20 h-20 rounded-full border-4 border-gray-800 shadow-lg mb-3" />
                              <h2 className="font-bold text-xl text-white text-center">{user.displayName}</h2>
                              <p className="text-cyan-500 text-sm font-bold bg-cyan-900/30 px-3 py-1 rounded-full mt-1 border border-cyan-800">
                                 Miembro de la Hinchada
                              </p>
                          </div>
                      )}

                      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <h3 className="font-bold text-gray-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                              ℹ️ Sobre SocialBet
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                              Somos la primera red social dedicada exclusivamente a pronósticos deportivos. 
                              Conecta con tipsters, valida tus jugadas y sube en el ranking mundial.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-2 font-mono">v1.0.2 Beta</p>
                      </div>

                      <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 p-4 rounded-xl border border-cyan-700/50 shadow-lg">
                          <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                              ☕ Apoya el Proyecto
                          </h3>
                          <p className="text-xs text-cyan-100 mb-3 leading-relaxed">
                              Este sitio se mantiene gracias a desarrolladores independientes. Si te gusta la herramienta, invítanos un café.
                          </p>
                          <a 
                            href="https://paypal.me/TU_USUARIO_AQUI" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full bg-white text-cyan-900 font-bold text-center py-2.5 rounded-lg text-sm hover:bg-gray-200 transition shadow-md"
                          >
                              Donar con PayPal
                          </a>
                      </div>

                      <div className="pt-4">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold hover:bg-red-900/40 transition border border-red-900/30"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                              </svg>
                              Cerrar Sesión
                          </button>
                      </div>
                      
                      <div className="h-10"></div>
                  </div>
              </div>
          </div>
      )}

      {/* --- PANEL DE ADMINISTRADOR --- */}
      {isAdmin && (
        <div className="max-w-2xl mx-auto mt-4 px-4 animate-in slide-in-from-top duration-500">
            <AdminMatchForm />
        </div>
      )}

      {/* ================= CONTENEDOR INTELIGENTE ================= */}
      <div className={`mx-auto p-4 transition-all duration-500 ease-in-out ${
          activeTab === "live" 
            ? "max-w-[1800px] w-full md:px-8" // Pantalla completa para TV
            : "max-w-2xl" // Estrecho para el Feed
      }`}>
        
        {/* ================= SECCIÓN: MURO (FEED) ================= */}
        <div className={activeTab === "feed" ? "block" : "hidden"}>
            
            {user ? (
              <CreatePost user={user} />
            ) : (
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 text-white p-6 rounded-2xl text-center mb-8 shadow-xl mx-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px]"></div>
                <h2 className="text-2xl font-black mb-2 relative z-10 italic">¡ÚNETE A LA ÉLITE!</h2>
                <p className="text-gray-400 text-sm relative z-10">Mira los parleys de los mejores tipsters en tiempo real.</p>
              </div>
            )}

            {user && (
                <div className="flex gap-6 mb-6 px-2 border-b border-gray-900 sticky top-16 z-30 bg-gray-950/95 backdrop-blur-sm pt-2 transition-all">
                    <button 
                        onClick={() => setFeedFilter("general")} 
                        className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "general" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        Para ti
                    </button>
                    <button 
                        onClick={() => setFeedFilter("following")} 
                        className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "following" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        Siguiendo
                    </button>
                    <button 
                        onClick={() => setFeedFilter("trending")} 
                        className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "trending" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        Tendencias 🔥
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {user ? (
                    <>
                        <div className={feedFilter === "general" ? "block animate-in fade-in slide-in-from-bottom-4" : "hidden"}>
                            <PostList user={user} mode="general" refreshTrigger={refreshTrigger} />
                        </div>
                        <div className={feedFilter === "following" ? "block animate-in fade-in slide-in-from-bottom-4" : "hidden"}>
                            <PostList user={user} mode="following" refreshTrigger={refreshTrigger} />
                        </div>
                        <div className={feedFilter === "trending" ? "block animate-in fade-in slide-in-from-bottom-4" : "hidden"}>
                            <PostList user={user} mode="trending" refreshTrigger={refreshTrigger} />
                        </div>
                    </>
                ) : (
                    <div className="bg-gray-900/50 p-16 rounded-3xl text-center border border-gray-800 border-dashed">
                        <span className="text-5xl block mb-4 opacity-20 grayscale">🏆</span>
                        <p className="text-gray-500 font-bold uppercase tracking-tighter">Inicia sesión para desbloquear el feed</p>
                    </div>
                )}
            </div>
        </div>

        {/* ================= SECCIÓN: EXPLORAR & RANKING ================= */}
        <div className={activeTab === "explore" ? "block animate-in fade-in duration-300" : "hidden"}>
            <Explore />
        </div>
        
        {/* ================= SECCIÓN: EN VIVO (MATCHES) ================= */}
        <div className={activeTab === "live" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
            <LiveSection />
        </div>

      </div>

      {/* --- ELEMENTOS FLOTANTES --- */}
      {activeTab === "feed" && user && (
          <SmartFloatingButton onRefresh={handleSmartRefresh} />
      )}

      {/* --- NAVEGACIÓN INFERIOR --- */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
      />

    </main>
  );
}