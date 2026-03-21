import { useState } from "react";
import PackOpener from "./PackOpener";
import MyAlbum from "./MyAlbum";
import { Sparkles, Package, BookImage, Trophy, Clock } from "lucide-react";
// IMPORTAMOS EL DICCIONARIO Y EL ID ACTUAL
import { ALL_CATALOGS, CURRENT_ALBUM_ID } from "../data/albumCatalog";

export default function AlbumSection() {
  const [activeTab, setActiveTab] = useState<'packs' | 'album'>('packs');
  
  // Extraemos la info de la temporada actual desde el diccionario
  const currentSeasonInfo = ALL_CATALOGS[CURRENT_ALBUM_ID].info;

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className={`bg-gradient-to-r ${currentSeasonInfo.theme} rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl mb-6 relative overflow-hidden`}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <Trophy className={`w-8 h-8 ${currentSeasonInfo.iconColor}`} />
            </div>
            <div>
              <span className="text-cyan-300 text-[10px] font-black uppercase tracking-widest bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-800/50 mb-2 inline-block">Temporada Actual</span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase italic leading-none">{currentSeasonInfo.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-xl border border-white/10 w-max">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold tracking-wider">{currentSeasonInfo.timeLeft}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-900/50 rounded-2xl mb-6 border border-gray-800">
        <button 
          onClick={() => setActiveTab('packs')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === 'packs' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Package className="w-5 h-5" /> Mis Sobres
        </button>
        <button 
          onClick={() => setActiveTab('album')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === 'album' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <BookImage className="w-5 h-5" /> Mi Álbum
        </button>
      </div>

      <div className="relative">
        {activeTab === 'packs' ? (
          <div className="animate-in slide-in-from-left-4 fade-in duration-300">
            <PackOpener />
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <MyAlbum />
          </div>
        )}
      </div>

    </div>
  );
}