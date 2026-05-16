"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "../src/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Home, BookImage, Shield, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

// Componentes Core de SocialBet
import AuthButton from "../src/components/AuthButton";
import LiveSection from "../src/components/LiveSection"; 
import AdminMatchForm from "../src/components/AdminMatchForm";

// Componentes de Pro Duels (Colección)
import AlbumSection from "../src/components/AlbumSection";

// (Nota: Se ocultaron los componentes de Feed y Explore para mantener el minimalismo de 3 secciones)
// import CreatePost from "../src/components/CreatePost";
// import PostList from "../src/components/PostList";
// import Explore from "../src/components/Explore"; 
// import SmartFloatingButton from "../src/components/SmartFloatingButton"; 

export default function AppShell() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); 
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pestañas (Por defecto arranca en 'live')
  const [activeTab, setActiveTab] = useState<'live' | 'juegos'>('live');
  
  // Referencia para controlar el Scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [clubName, setClubName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAdmin = user && user.email === "kevinfer.mt@gmail.com"; 

  // --- LÓGICA DEL SCROLL INTELIGENTE ---
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

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
    <main className="h-[100dvh] w-full bg-gray-950 text-gray-200 font-sans flex flex-col overflow-hidden relative">
      
            {/* NAVBAR SUPERIOR FIJO - ESTILO LIQUID GLASS */}
      <nav className="shrink-0 flex justify-between items-center bg-black/20 backdrop-blur-2xl px-5 py-3 z-40 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] h-16">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white uppercase">
            SOCIAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-sm">BET</span>
        </h1>
        <div>
            {!user ? (
                <AuthButton />
            ) : (
                <button 
                  onClick={() => setIsMenuOpen(true)} 
                  className="p-0.5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                    <img 
                      src={profile?.photoURL || user.photoURL} 
                      alt="Perfil" 
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-black" 
                    />
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
                              Somos la primera red social dedicada exclusivamente a pronósticos deportivos y colección de cromos.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-2 font-mono">v2.1 UI Apple</p>
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
        
        {/* Agregamos pb-32 para que el contenido no quede oculto detrás de la barra flotante */}
        <div className={`mx-auto p-4 transition-all duration-500 ease-in-out pb-32 ${
          activeTab === "live" ? "max-w-[1800px] w-full md:px-8" : "max-w-2xl" 
        }`}>

          {/* --- PESTAÑA 1: EN VIVO --- */}
          <div className={activeTab === "live" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
              {isAdmin && (
                <div className="max-w-2xl mx-auto mb-8 px-4 animate-in slide-in-from-top duration-500">
                    <AdminMatchForm />
                </div>
              )}
              <LiveSection />
          </div>

          {/* --- PESTAÑA 2: ÁLBUM Y SOBRES --- */}
          <div className={activeTab === "juegos" ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
            <div className="p-4 pt-6">
              <AlbumSection />
            </div>
          </div>

        </div>
      </div>

      {/* --- BOTTOM NAVIGATION: ESTILO APPLE FLOATING DOCK --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 z-50 flex justify-between items-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        
        {/* Botón: Directo */}
        <button 
          onClick={() => setActiveTab('live')} 
          className={`relative flex flex-col items-center justify-center w-[30%] h-14 rounded-full transition-all duration-300 active:scale-95 ${
            activeTab === 'live' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <Activity className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'live' ? 'text-indigo-400' : 'text-gray-400'}`} />
          <span className={`text-[10px] font-bold mt-1 tracking-wide transition-colors duration-300 ${activeTab === 'live' ? 'text-white' : 'text-gray-500'}`}>
            Directo
          </span>
        </button>

        {/* Botón: Álbum */}
        <button 
          onClick={() => setActiveTab('juegos')} 
          className={`relative flex flex-col items-center justify-center w-[30%] h-14 rounded-full transition-all duration-300 active:scale-95 ${
            activeTab === 'juegos' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <BookImage className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'juegos' ? 'text-cyan-400' : 'text-gray-400'}`} />
          <span className={`text-[10px] font-bold mt-1 tracking-wide transition-colors duration-300 ${activeTab === 'juegos' ? 'text-white' : 'text-gray-500'}`}>
            Álbum
          </span>
        </button>

        {/* Botón: Perfil / Club */}
        <button 
          onClick={() => {
            if (profile?.uid) router.push(`/profile/${profile.uid}`);
            else if (user?.uid) router.push(`/profile/${user.uid}`);
          }} 
          className="relative flex flex-col items-center justify-center w-[30%] h-14 rounded-full transition-all duration-300 hover:bg-white/5 active:scale-95"
        >
          <Shield className="w-6 h-6 text-gray-400 transition-colors duration-300 group-hover:text-yellow-400" />
          <span className="text-[10px] font-bold mt-1 tracking-wide text-gray-500 transition-colors duration-300">
            Club
          </span>
        </button>

      </div>
    </main>
  );
}
