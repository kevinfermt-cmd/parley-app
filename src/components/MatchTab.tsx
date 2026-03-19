import { useState, useEffect } from "react";
import { Swords, Trophy, Users, Zap, X, Shield } from "lucide-react";
import { io, Socket } from "socket.io-client";
import GameBoard from "./GameBoard";

export default function MatchTab({ profile }: { profile: any }) {
  const [matchState, setMatchState] = useState<'menu' | 'searching' | 'found' | 'playing'>('menu');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchData, setMatchData] = useState<{ room: string, team: 'player' | 'rival', opponentName: string } | null>(null);

  // Limpiar el socket si el componente se desmonta
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  const startMatchmaking = () => {
    setMatchState('searching');
    
    // Conectamos al servidor local
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Le enviamos el nombre del club como 'username' para que el rival lo vea
    newSocket.emit('find_match', { username: profile.clubName });

    // Escuchamos cuando el servidor nos empareja
    newSocket.on('match_found', (data) => {
      setMatchData(data);
      setMatchState('found'); // Mostramos la pantalla de VS

      // Después de 3 segundos de pantalla épica de VS, entramos a la cancha
      setTimeout(() => {
        setMatchState('playing');
      }, 3000);
    });
  };

  const cancelMatchmaking = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setMatchState('menu');
  };

  // --- 1. PANTALLA DE MENÚ DE MODOS ---
  if (matchState === 'menu') {
    return (
      <div className="animate-fade-in pb-20">
        <h2 className="text-2xl font-black mb-6 tracking-widest text-white">MODOS DE JUEGO</h2>
        
        <div className="flex flex-col gap-4">
          {/* Tarjeta: Partido Amistoso (Activa) */}
          <div 
            onClick={startMatchmaking}
            className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 shadow-[0_8px_30px_rgba(34,197,94,0.3)] cursor-pointer transform transition-transform active:scale-95 hover:scale-[1.02]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-2xl font-black text-white drop-shadow-md mb-1">PARTIDO AMISTOSO</h3>
                <p className="text-green-100 text-sm font-semibold">Juega sin perder puntos.</p>
              </div>
              <Swords className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Tarjeta: Divisiones (Ranked) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl p-6 shadow-lg opacity-90">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black opacity-20 transform rotate-45 translate-x-10 -translate-y-10"></div>
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-xl font-black text-white drop-shadow-md mb-1">DIVISIONES</h3>
                <p className="text-indigo-200 text-sm font-semibold">Sube en el ranking global.</p>
              </div>
              <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
            </div>
          </div>

          {/* Fila para Amigos y Eventos */}
          <div className="flex gap-4">
            <div className="flex-1 relative overflow-hidden bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-lg opacity-80">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="text-lg font-black text-white">AMIGOS</h3>
              <p className="text-neutral-400 text-xs font-semibold">Salas privadas</p>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-lg opacity-80">
              <Zap className="w-8 h-8 text-orange-400 mb-2" />
              <h3 className="text-lg font-black text-white">EVENTOS</h3>
              <p className="text-neutral-400 text-xs font-semibold">Torneos cortos</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. PANTALLA BUSCANDO RIVAL ---
  if (matchState === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center pb-20">
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          {/* Animación de radar */}
          <div className="absolute inset-0 bg-green-500 opacity-20 rounded-full animate-ping"></div>
          <div className="absolute inset-2 bg-green-500 opacity-40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <img src={profile.photoURL} alt="Tu Escudo" className="w-16 h-16 rounded-full border-2 border-white relative z-10 shadow-xl" />
        </div>
        
        <h2 className="text-2xl font-black mb-2 text-white tracking-widest animate-pulse">BUSCANDO RIVAL...</h2>
        <p className="text-neutral-400 font-semibold mb-10">Preparando el terreno de juego</p>

        <button 
          onClick={cancelMatchmaking}
          className="bg-neutral-800 border border-neutral-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 hover:bg-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" /> CANCELAR
        </button>
      </div>
    );
  }

  // --- 3. PANTALLA DE VS (MATCH FOUND) ---
  if (matchState === 'found' && matchData) {
    return (
      <div className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
        {/* Fondo diagonal dividido */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-indigo-900 transform -skew-y-6 origin-top-left scale-110"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-red-900 transform -skew-y-6 origin-bottom-right scale-110"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full px-6">
          <h2 className="text-green-400 font-black text-xl mb-8 tracking-widest drop-shadow-lg animate-bounce">¡PARTIDA ENCONTRADA!</h2>
          
          <div className="flex justify-between items-center w-full max-w-sm">
            {/* TÚ */}
            <div className="flex flex-col items-center animate-slide-in-left">
              <img src={profile.photoURL} alt="Tú" className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.8)] bg-white mb-3" />
              <span className="text-white font-black text-lg text-center leading-tight">{profile.clubName}</span>
              <span className="text-indigo-400 font-bold text-xs">DIVISIÓN 10</span>
            </div>

            {/* VS */}
            <div className="flex-shrink-0 mx-4 z-20">
              <span className="text-white font-black text-4xl italic drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">VS</span>
            </div>

            {/* RIVAL */}
            <div className="flex flex-col items-center animate-slide-in-right">
              {/* Usamos un avatar genérico rojo para el rival por ahora */}
              <div className="w-24 h-24 rounded-full border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] bg-neutral-800 flex items-center justify-center mb-3">
                <Shield className="w-12 h-12 text-red-500" />
              </div>
              <span className="text-white font-black text-lg text-center leading-tight">{matchData.opponentName}</span>
              <span className="text-red-400 font-bold text-xs">DIVISIÓN 10</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. LA CANCHA (FULL SCREEN) ---
  if (matchState === 'playing' && socket && matchData) {
    return (
      // Este div envuelve el GameBoard y se posiciona FIXED ocupando toda la pantalla,
      // tapando la barra superior e inferior del AppShell.
      <div className="fixed inset-0 z-[100] bg-neutral-950">
        <GameBoard 
          socket={socket} 
          room={matchData.room} 
          myTeam={matchData.team} 
          opponentName={matchData.opponentName} 
        />
      </div>
    );
  }

  return null;
}