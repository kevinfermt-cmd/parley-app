import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase"; 
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Sparkles, PackageOpen, CheckCircle2, Gift, Clock, AlertTriangle } from "lucide-react";
// IMPORTAMOS EL DICCIONARIO
import { ALL_CATALOGS, CURRENT_ALBUM_ID } from "../data/albumCatalog";

export default function PackOpener() {
  const [isOpening, setIsOpening] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [obtainedCards, setObtainedCards] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  
  const [packsCount, setPacksCount] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Extraemos las cartas del diccionario
  const currentCatalog = ALL_CATALOGS[CURRENT_ALBUM_ID].cards;

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      setUserId(currentUser.uid);
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setPacksCount(data.commonPacks || 0);

        const today = new Date().toISOString().split('T')[0];
        if (data.lastDailyClaim !== today) {
          setCanClaimDaily(true);
        } else {
          setCanClaimDaily(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleClaimDaily = async () => {
    if (!userId || !canClaimDaily) return;
    setIsClaiming(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
        commonPacks: increment(1),
        lastDailyClaim: today
      });

      setPacksCount(prev => prev + 1);
      setCanClaimDaily(false);
      setStatusMsg("¡Has reclamado tu sobre diario!");
    } catch (error) {
      console.error("Error al reclamar:", error);
      setStatusMsg("Error al reclamar la recompensa.");
    } finally {
      setIsClaiming(false);
    }
  };

  const drawRandomCards = () => {
    const pulled = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * currentCatalog.length);
      pulled.push(currentCatalog[randomIndex]);
    }
    return pulled;
  };

  const handleOpenPack = async () => {
    if (!userId || packsCount <= 0) return;
    
    setIsOpening(true);
    setObtainedCards([]);
    setStatusMsg("Abriendo sobre...");

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { commonPacks: increment(-1) });
      setPacksCount(prev => prev - 1);

      const newCards = drawRandomCards();
      
      for (const card of newCards) {
        const cardRef = doc(db, "users", userId, "albums", CURRENT_ALBUM_ID, "inventory", card.id);
        const cardSnap = await getDoc(cardRef);

        if (cardSnap.exists()) {
          await updateDoc(cardRef, { quantity: increment(1) });
        } else {
          await setDoc(cardRef, {
            cardId: card.id,
            name: card.name,
            team: card.team,
            rarity: card.rarity,
            quantity: 1,
            acquiredAt: new Date().toISOString()
          });
        }
      }

      setObtainedCards(newCards);
      setStatusMsg("¡Cartas añadidas a tu colección!");

    } catch (error) {
      console.error("Error guardando cartas:", error);
      setStatusMsg("Hubo un error al guardar en la base de datos.");
    } finally {
      setIsOpening(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    if (rarity === "Legendary") return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
    if (rarity === "Epic") return "text-purple-400 border-purple-400/50 bg-purple-400/10";
    return "text-blue-400 border-blue-400/50 bg-blue-400/10";
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl text-center">
      <div className="flex justify-between items-center bg-gray-950 p-4 rounded-2xl border border-gray-800 mb-6">
        <div className="text-left">
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Tus Sobres</p>
          <p className="text-2xl font-black text-white">{packsCount} <span className="text-sm text-cyan-500">Comunes</span></p>
        </div>
        <PackageOpen className={`w-10 h-10 ${packsCount > 0 ? 'text-cyan-400' : 'text-gray-700'}`} />
      </div>

      {canClaimDaily ? (
        <button 
          onClick={handleClaimDaily}
          disabled={isClaiming}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 mb-4 animate-bounce"
        >
          {isClaiming ? "Reclamando..." : <><Gift className="w-5 h-5" /> RECLAMAR SOBRE DIARIO</>}
        </button>
      ) : (
        <div className="w-full bg-gray-800/50 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4 cursor-not-allowed">
          <Clock className="w-4 h-4" /> Vuelve mañana por otro sobre
        </div>
      )}

      <button 
        onClick={handleOpenPack}
        disabled={isOpening || packsCount <= 0}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:hover:scale-100 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 mb-6"
      >
        {isOpening ? "Abriendo..." : <><Sparkles className="w-5 h-5" /> ABRIR 1 SOBRE</>}
      </button>

      {packsCount <= 0 && !canClaimDaily && (
        <p className="text-xs font-bold text-gray-500 flex items-center justify-center gap-1 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-500" /> No tienes sobres. Interactúa para ganar más.
        </p>
      )}

      {obtainedCards.length > 0 && (
        <div className="space-y-3 animate-in fade-in zoom-in duration-500 pt-4 border-t border-gray-800">
          <h3 className="text-white font-bold flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" /> ¡Nuevas Cartas!
          </h3>
          {obtainedCards.map((card, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${getRarityColor(card.rarity)}`}>
              <div className="text-left">
                <p className="font-black text-lg leading-tight">{card.name}</p>
                <p className="text-xs opacity-70 font-bold">{card.team}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest font-black block border-b border-current pb-1 mb-1">{card.rarity}</span>
                <CheckCircle2 className="w-5 h-5 inline-block" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}