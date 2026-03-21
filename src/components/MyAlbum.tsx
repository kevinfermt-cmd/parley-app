import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase"; 
import { collection, onSnapshot } from "firebase/firestore"; 
import { BookOpen, Layers, Lock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
// IMPORTAMOS EL DICCIONARIO
import { ALL_CATALOGS, CURRENT_ALBUM_ID } from "../data/albumCatalog";

export default function MyAlbum() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // AHORA EL ESTADO ES LA PÁGINA (Índice numérico)
  const [currentPage, setCurrentPage] = useState(0);

  // Extraemos datos del diccionario
  const currentSeasonInfo = ALL_CATALOGS[CURRENT_ALBUM_ID].info;
  const currentCatalog = ALL_CATALOGS[CURRENT_ALBUM_ID].cards;
  
  // EQUIPOS (Sin la opción "Todos", puro álbum real)
  const TEAMS = Array.from(new Set(currentCatalog.map((card: any) => card.team)));

  const getCardStyle = (rarity: string) => {
    if (rarity === "Legendary") return "from-yellow-600 to-yellow-900 border-yellow-500 shadow-yellow-900/50";
    if (rarity === "Epic") return "from-purple-600 to-purple-900 border-purple-500 shadow-purple-900/50";
    return "from-blue-600 to-blue-900 border-blue-500 shadow-blue-900/50";
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const inventoryRef = collection(db, "users", currentUser.uid, "albums", CURRENT_ALBUM_ID, "inventory");

    const unsubscribe = onSnapshot(inventoryRef, (querySnapshot) => {
      const myCards: any[] = [];
      querySnapshot.forEach((doc) => {
        myCards.push(doc.data());
      });
      setInventory(myCards);
      setIsLoading(false);
    }, (error) => {
      console.error("Error escuchando el álbum:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // PROGRESO GLOBAL
  const unlockedCount = inventory.length; 
  const totalCards = currentCatalog.length;
  const globalProgress = Math.round((unlockedCount / totalCards) * 100) || 0;

  // LÓGICA DE PÁGINAS (Libro)
  const currentTeam = TEAMS[currentPage];
  const displayedCatalog = currentCatalog.filter((c: any) => c.team === currentTeam);
  
  // Progreso ESPECÍFICO de la página actual
  const teamTotalCards = displayedCatalog.length;
  const teamUnlockedCards = displayedCatalog.filter(cat => inventory.some(inv => inv.cardId === cat.id)).length;

  const handleNextPage = () => {
    if (currentPage < TEAMS.length - 1) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="max-w-4xl mx-auto mt-4">
      
      {/* HEADER: PROGRESO GLOBAL DEL LIBRO */}
      <div className="bg-gray-900 rounded-t-3xl p-4 md:p-6 border border-gray-800 border-b-0">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" /> Mi Colección
            </h2>
            <p className="text-gray-400 text-xs md:text-sm font-bold mt-1">{currentSeasonInfo.name}</p>
          </div>
          <div className="text-right">
            <span className="text-xl md:text-2xl font-black text-white">{globalProgress}%</span>
            <span className="text-gray-500 font-bold text-xs md:text-sm block">Completado</span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
          <div className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-1000" style={{ width: `${globalProgress}%` }}></div>
        </div>
      </div>

      {/* EL ÁLBUM FÍSICO (Simulación de Páginas) */}
      <div className="bg-gray-950 rounded-b-3xl border border-gray-800 shadow-2xl overflow-hidden relative">
        
        {/* Sombra interna para simular el lomo del libro */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10"></div>

        {/* CONTROLES DE PÁGINA */}
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between p-3 md:p-4 sticky top-0 z-20">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 0}
            className="p-2 bg-gray-950 rounded-full border border-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="text-center">
            <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-widest drop-shadow-md">
              {currentTeam}
            </h3>
            <p className="text-[10px] md:text-xs text-cyan-400 font-bold tracking-widest uppercase mt-0.5">
              Cromos: {teamUnlockedCards} / {teamTotalCards}
            </p>
          </div>

          <button 
            onClick={handleNextPage} 
            disabled={currentPage === TEAMS.length - 1}
            className="p-2 bg-gray-950 rounded-full border border-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition shadow-lg"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* GRID DE CARTAS (La Hoja) */}
        <div className="p-4 md:p-8 min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full py-20">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-4 relative z-0">
              {displayedCatalog.map((catalogCard: any) => {
                const ownedCard = inventory.find(invCard => invCard.cardId === catalogCard.id);
                const isUnlocked = !!ownedCard;

                return (
                  <div key={catalogCard.id} className="relative group animate-in fade-in zoom-in duration-300">
                    {isUnlocked ? (
                      /* CARTA DESBLOQUEADA */
                      <div className={`relative bg-gradient-to-br p-1.5 md:p-3 rounded-xl md:rounded-2xl border md:border-2 shadow-lg flex flex-col justify-between aspect-[3/4] transition-all hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer ${getCardStyle(catalogCard.rarity)}`}>
                        {ownedCard.quantity > 1 && (
                          <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-600 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border-2 border-gray-900 shadow-md flex items-center gap-0.5 z-10">
                            <Layers className="w-2 h-2 md:w-3 md:h-3" /> <span className="mt-px">x{ownedCard.quantity - 1}</span>
                          </div>
                        )}
                        <div className="text-center mt-0.5 md:mt-1">
                          <span className="text-[6px] md:text-[9px] uppercase tracking-widest font-black text-white/70 block mb-0.5 md:mb-1">
                            {catalogCard.rarity}
                          </span>
                        </div>
                        <div className="text-center mb-0.5 md:mb-1 w-full overflow-hidden">
                          <h3 className="font-black text-white text-[8px] md:text-sm leading-tight drop-shadow-md truncate px-0.5">{catalogCard.name}</h3>
                          <p className="text-white/80 text-[6px] md:text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate px-0.5">{catalogCard.team}</p>
                        </div>
                        <CheckCircle2 className="absolute top-1 left-1 md:top-2 md:left-2 w-3 h-3 md:w-4 md:h-4 text-white/50" />
                      </div>
                    ) : (
                      /* HUECO VACÍO (Estilo Panini) */
                      <div className="relative bg-black/40 p-1.5 md:p-3 rounded-xl md:rounded-2xl border md:border-2 border-dashed border-gray-700 flex flex-col items-center justify-center aspect-[3/4] transition-all">
                        <Lock className="w-3 h-3 md:w-6 md:h-6 text-gray-600 mb-1 md:mb-2 opacity-50" />
                        <p className="text-gray-500 font-black text-[8px] md:text-xs text-center uppercase leading-tight truncate w-full px-1">{catalogCard.name}</p>
                        
                        {/* Número del cromo grande en el fondo */}
                        <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 text-xs md:text-2xl font-black text-gray-800/60 italic">
                          #{catalogCard.id.split('_')[1].substring(0,3).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA DEL LIBRO */}
        <div className="bg-gray-900 border-t border-gray-800 p-2 text-center text-[10px] font-bold text-gray-500 tracking-widest uppercase">
          Página {currentPage + 1} de {TEAMS.length}
        </div>

      </div>
    </div>
  );
}