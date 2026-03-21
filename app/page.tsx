"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../src/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Home, BookImage, Users, Search, Shield, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

// Componentes Core de SocialBet
import AuthButton from "../src/components/AuthButton";
import CreatePost from "../src/components/CreatePost";
import PostList from "../src/components/PostList";
import LiveSection from "../src/components/LiveSection"; 
import Explore from "../src/components/Explore"; 
import AdminMatchForm from "../src/components/AdminMatchForm";
import SmartFloatingButton from "../src/components/SmartFloatingButton"; 

// Componentes de Pro Duels (Colección)
import AlbumSection from "../src/components/AlbumSection";

export default function AppShell() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); 
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pestañas
  const [activeTab, setActiveTab] = useState<'feed' | 'live' | 'juegos' | 'explore'>('feed');
  
  // Referencia para controlar el Scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Filtros del Feed
  const [feedFilter, setFeedFilter] = useState("general"); 
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const [clubName, setClubName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAdmin = user && user.email === "kevinfer.mt@gmail.com"; 

  // --- LÓGICA DEL SCROLL INTELIGENTE ---
  useEffect(() => {
    // Si cambiamos de pestaña y NO es el feed, hacemos scroll arriba suavemente
    if (activeTab !== 'feed' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  const handleSmartRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile({ uid: currentUser.uid, ...docSnap.data() });
        } else {
          setOwnerName(currentUser.displayName || "");
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
      if(confirm("¿Seguro que quieres cerrar sesión?")) {
        await signOut(auth);
        setIsMenuOpen(false);
        window.location.reload(); 
      }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clubName || !ownerName || !username) return;
    
    setIsRegistering(true);
    setErrorMsg("");
    
    try {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formattedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrorMsg(`El usuario ${formattedUsername} ya está en uso. ¡Elige otro!`);
        setIsRegistering(false);
        return; 
      }
      
      const newProfile = {
        uid: user.uid,
        clubName: clubName,
        ownerName: ownerName,
        username: formattedUsername,
        searchKey: formattedUsername.toLowerCase(),
        photoURL: "https://ui-avatars.com/api/?name=" + clubName.charAt(0) + "&background=06b6d4&color=fff&size=128", 
        coins: 1000,
        createdAt: new Date().toISOString(),
        followers: []
      };

      await setDoc(doc(db, "users", user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Error al crear club:", error);
      setErrorMsg("Hubo un error al registrar el club. Intenta de nuevo.");
    }
    setIsRegistering(false);
  };

  if (isLoading) return <div className="h-[100dvh] bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (user && !profile) {
    return (
      <div className="h-[100dvh] bg-gray-950 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl z-10">
          <h2 className="text-white text-2xl font-black mb-1 text-center tracking-wider">CREA TU PERFIL</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Únete a SocialBet y funda tu club.</p>
          
          <form onSubmit={handleCreateClub} className="flex flex-col gap-4">
            {errorMsg && <div className="bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold p-3 rounded-lg text-center">{errorMsg}</div>}
            <div>
              <label className="text-cyan-400 text-xs font-bold mb-1 block">NOMBRE DEL CLUB / EQUIPO</label>
              <input type="text" placeholder="Ej: SD Perla del Pacífico" value={clubName} onChange={(e) => setClubName(e.target.value)} required maxLength={20} className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors font-bold" />
            </div>
            <div>
              <label className="text-cyan-400 text-xs font-bold mb-1 block">TU NOMBRE</label>
              <input type="text" placeholder="Ej: Kevin Murillo" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required maxLength={20} className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors font-bold" />
            </div>
            <div>
              <label className="text-cyan-400 text-xs font-bold mb-1 block">NOMBRE DE USUARIO</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-black">@</span>
                <input type="text" placeholder="Kevin" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} required maxLength={15} className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors font-bold" />
              </div>
            </div>
            <button type="submit" disabled={isRegistering} className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black py-4 rounded-xl mt-4 transition-transform active:scale-95 flex justify-center items-center">
              {isRegistering ? <div className="w-6 h-6 border-4 border-gray-950 border-t-transparent rounded-full animate-spin"></div> : 'ENTRAR A SOCIALBET'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] w-full bg-gray-950 text-gray-200 font-sans flex flex-col overflow-hidden">
      
      {/* NAVBAR SUPERIOR FIJO */}
      <nav className="shrink-0 flex justify-between items-center bg-gray-900/90 backdrop-blur-md p-4 z-40 border-b border-gray-800 shadow-md h-16">
        <h1 className="text-xl font-black text-white tracking-tighter italic">
            Social<span className="text-cyan-400">Bet</span>
        </h1>
        <div>
            {!user ? (
                <AuthButton />
            ) : (
                <button onClick={() => setIsMenuOpen(true)} className="p-1 rounded-full border-2 border-gray-700 hover:border-cyan-500 transition active:scale-95">
                    <img src={profile?.photoURL || user.photoURL} alt="Perfil" className="w-8 h-8 rounded-full" />
                </button>
            )}
        </div>
      </nav>

      {/* MENÚ LATERAL DESLIZANTE */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}></div>
              <div className="relative w-4/5 max-w-sm bg-gray-900 h-full shadow-2xl border-l border-gray-800 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-4 flex justify-end">
                      <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-6">
                      {profile && (
                          <div className="flex flex-col items-center mb-6">
                              <img src={profile.photoURL} className="w-20 h-20 rounded-full border-4 border-gray-800 shadow-lg mb-3 object-cover" />
                              <h2 className="font-bold text-xl text-white text-center">
                                {profile.displayName || profile.clubName || profile.username}
                              </h2>
                              <p className="text-cyan-500 text-sm font-bold bg-cyan-900/30 px-3 py-1 rounded-full mt-1 border border-cyan-800">
                                @{profile.username?.replace(/^@/, '')}
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
                          <p className="text-[10px] text-gray-500 mt-2 font-mono">v2.0 Beta</p>
                      </div>

                      <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 p-4 rounded-xl border border-cyan-700/50 shadow-lg">
                          <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                              ☕ Apoya el Proyecto
                          </h3>
                          <p className="text-xs text-cyan-100 mb-3 leading-relaxed">
                              Este sitio se mantiene gracias a desarrolladores independientes. Si te gusta la herramienta, invítanos un café.
                          </p>
                          <a href="https://paypal.me/doath" target="_blank" rel="noopener noreferrer" className="block w-full bg-white text-cyan-900 font-bold text-center py-2.5 rounded-lg text-sm hover:bg-gray-200 transition shadow-md">
                              Donar con PayPal
                          </a>
                      </div>

                      <div className="pt-4">
                          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold hover:bg-red-900/40 transition border border-red-900/30">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                              Cerrar Sesión
                          </button>
                      </div>
                      <div className="h-10"></div>
                  </div>
              </div>
          </div>
      )}

      {/* ÁREA DE CONTENIDO (CON SCROLL INTERNO Y REF) */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative scroll-smooth">
        
        <div className={`mx-auto p-4 transition-all duration-500 ease-in-out pb-20 ${
          activeTab === "live" ? "max-w-[1800px] w-full md:px-8" : "max-w-2xl" 
        }`}>
          
          {/* --- PESTAÑA 1: FEED (MURO SOCIAL) --- */}
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
                  <div className="flex gap-6 mb-6 px-2 border-b border-gray-900 sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm pt-2 transition-all">
                      <button onClick={() => setFeedFilter("general")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "general" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Para ti</button>
                      <button onClick={() => setFeedFilter("following")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${feedFilter === "following" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Siguiendo</button>
                      <button onClick={() => setFeedFilter("trending")} className={`pb-3 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${feedFilter === "trending" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>Tendencias <Flame className="w-3 h-3" /></button>
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

          {/* --- PESTAÑA 2: EN VIVO --- */}
          <div className={activeTab === "live" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
              {isAdmin && (
                <div className="max-w-2xl mx-auto mb-8 px-4 animate-in slide-in-from-top duration-500">
                    <AdminMatchForm />
                </div>
              )}
              <LiveSection />
          </div>

          {/* --- PESTAÑA 3: ÁLBUM Y SOBRES --- */}
          <div className={activeTab === "juegos" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
            <div className="p-4 pt-6">
              <AlbumSection />
            </div>
          </div>

          {/* --- PESTAÑA 4: EXPLORAR / RANKINGS --- */}
          <div className={activeTab === "explore" ? "block animate-in fade-in duration-300" : "hidden"}>
              <Explore />
          </div>

        </div>
      </div>

      {/* --- ELEMENTOS FLOTANTES --- */}
      {activeTab === "feed" && user && (
          <SmartFloatingButton onRefresh={handleSmartRefresh} />
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="shrink-0 bg-gray-900 border-t border-gray-800 px-2 sm:px-6 py-3 pb-safe z-40 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <NavButton icon={<Users />} label="Social" isActive={activeTab === 'feed'} onClick={() => setActiveTab('feed')} activeColor="text-cyan-400" />
        <NavButton icon={<Home />} label="Directo" isActive={activeTab === 'live'} onClick={() => setActiveTab('live')} activeColor="text-indigo-400" />
        <NavButton icon={<BookImage />} label="Álbum" isActive={activeTab === 'juegos'} onClick={() => setActiveTab('juegos')} activeColor="text-green-500" />
        <NavButton icon={<Search />} label="Explorar" isActive={activeTab === 'explore'} onClick={() => setActiveTab('explore')} activeColor="text-yellow-400" />
        
        {/* Botón Central: Club */}
        <button 
          onClick={() => {
            if (profile?.uid) router.push(`/profile/${profile.uid}`);
            else if (user?.uid) router.push(`/profile/${user.uid}`);
          }} 
          className="flex flex-col items-center gap-1 transition-all flex-1 text-gray-500 hover:text-white"
        >
          <div className="transition-transform duration-200 scale-95 hover:scale-105 bg-gray-800 p-1.5 rounded-full border border-gray-700">
            <Shield className="w-5 h-5 text-gray-300" />
          </div>
          <span className="text-[9px] font-bold tracking-wider">Club</span>
        </button>

      </div>
    </main>
  );
}

function NavButton({ icon, label, isActive, onClick, activeColor = "text-cyan-400" }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? activeColor : 'text-gray-500 hover:text-gray-300'}`}>
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-95'}`}>{icon}</div>
      <span className="text-[9px] font-bold tracking-wider">{label}</span>
    </button>
  );
}