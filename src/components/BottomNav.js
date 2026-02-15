// src/components/BottomNav.js
import Link from "next/link";

export default function BottomNav({ activeTab, setActiveTab, user }) {
  return (
    // ESTILO IOS DARK: Fondo casi negro pero transparente + Blur
    <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-md border-t border-gray-800 px-6 py-3 flex justify-around items-center z-50 shadow-lg pb-safe">
      
      {/* 🏠 BOTÓN HOME (FEED) */}
      <button 
        onClick={() => setActiveTab("feed")}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === "feed" ? "text-cyan-400 scale-110" : "text-gray-500 hover:text-gray-300"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
        <span className="text-[10px] font-bold tracking-wide">Inicio</span>
      </button>

      {/* 🔍 BOTÓN EXPLORAR */}
      <button 
        onClick={() => setActiveTab("explore")}
        className={`flex flex-col items-center gap-1 transition ${activeTab === "explore" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold">Explorar</span>
      </button>
      
      {/* 🔴 BOTÓN EN VIVO */}
      <button 
        onClick={() => setActiveTab("live")}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === "live" ? "text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-gray-500 hover:text-gray-300"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
        </svg>
        <span className="text-[10px] font-bold tracking-wide">En Vivo</span>
      </button>

      {/* 👤 BOTÓN PERFIL */}
      {user ? (
        <Link href={`/profile/${user.uid}`} className="flex flex-col items-center gap-1 text-gray-500 hover:text-cyan-400 transition group">
            <div className="relative">
                <img 
                    src={user.photoURL} 
                    alt="Yo" 
                    className="w-7 h-7 rounded-full border-2 border-gray-700 group-hover:border-cyan-400 object-cover transition"
                />
                {/* Puntito verde de online */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
            </div>
            <span className="text-[10px] font-bold group-hover:text-cyan-400 transition">Perfil</span>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-1 text-gray-600 opacity-50 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold">Perfil</span>
        </div>
      )}

    </div>
  );
}