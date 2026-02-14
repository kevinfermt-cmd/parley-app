// src/components/BottomNav.js
import Link from "next/link";

export default function BottomNav({ activeTab, setActiveTab, user }) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* 🏠 BOTÓN HOME (FEED) */}
      <button 
        onClick={() => setActiveTab("feed")}
        className={`flex flex-col items-center gap-1 transition ${activeTab === "feed" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
      >
        {/* Icono de Casa SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
        <span className="text-[10px] font-bold">Inicio</span>
      </button>

      {/* 🔴 BOTÓN EN VIVO */}
      <button 
        onClick={() => setActiveTab("live")}
        className={`flex flex-col items-center gap-1 transition ${activeTab === "live" ? "text-red-600" : "text-gray-400 hover:text-gray-600"}`}
      >
        {/* Icono de TV/Play SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
        </svg>
        <span className="text-[10px] font-bold">En Vivo</span>
      </button>

      {/* 👤 BOTÓN PERFIL */}
      {user ? (
        <Link href={`/profile/${user.uid}`} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition">
            {/* Si tiene foto, la mostramos con un borde bonito */}
            <img 
                src={user.photoURL} 
                alt="Yo" 
                className="w-7 h-7 rounded-full border border-gray-300 object-cover"
            />
            <span className="text-[10px] font-bold">Perfil</span>
        </Link>
      ) : (
        // Si no está logueado, mostramos icono genérico que no hace nada (o podrías hacer que abra el login)
        <div className="flex flex-col items-center gap-1 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold">Perfil</span>
        </div>
      )}

    </div>
  );
}