"use client";
import { useState, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

const WIDTH = 360;
const HEIGHT = 640;
const PUCK_RADIUS = 18; 
const PUCK_MASS = 3; 
const BALL_RADIUS = 10;
const BALL_MASS = 1; 
const COL_DIST_PB = PUCK_RADIUS + BALL_RADIUS;

const initialPucks = [
  { id: 'p1', team: 'player', x: 180, y: 580, vx: 0, vy: 0, label: 'GK' },
  { id: 'p2', team: 'player', x: 90, y: 480, vx: 0, vy: 0, label: 'DEF' },
  { id: 'p3', team: 'player', x: 270, y: 480, vx: 0, vy: 0, label: 'DEF' },
  { id: 'p4', team: 'player', x: 100, y: 390, vx: 0, vy: 0, label: 'MID' },
  { id: 'p5', team: 'player', x: 260, y: 390, vx: 0, vy: 0, label: 'MID' },
  { id: 'p6', team: 'player', x: 180, y: 340, vx: 0, vy: 0, label: 'CR7' },
  { id: 'r1', team: 'rival', x: 180, y: 60, vx: 0, vy: 0, label: 'GK' },
  { id: 'r2', team: 'rival', x: 90, y: 160, vx: 0, vy: 0, label: 'DEF' },
  { id: 'r3', team: 'rival', x: 270, y: 160, vx: 0, vy: 0, label: 'DEF' },
  { id: 'r4', team: 'rival', x: 100, y: 250, vx: 0, vy: 0, label: 'MID' },
  { id: 'r5', team: 'rival', x: 260, y: 250, vx: 0, vy: 0, label: 'MID' },
  { id: 'r6', team: 'rival', x: 180, y: 300, vx: 0, vy: 0, label: 'FWD' },
];

interface GameBoardProps {
  socket: Socket;
  room: string;
  myTeam: 'player' | 'rival';
  opponentName: string;
}

export default function GameBoard({ socket, room, myTeam, opponentName }: GameBoardProps) {
  const [turn, setTurn] = useState<'player' | 'rival'>('player');
  const [pucksState, setPucksState] = useState(initialPucks);
  const [ballPosState, setBallPosState] = useState({ x: 180, y: 320 });
  
  const [score, setScore] = useState({ player: 0, rival: 0 });
  const scoreRef = useRef({ player: 0, rival: 0 }); 
  const [isGoalScored, setIsGoalScored] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [matchStatus, setMatchStatus] = useState<'playing' | 'ended'>('playing');

  const pucksPhys = useRef(JSON.parse(JSON.stringify(initialPucks))); 
  const ballPhys = useRef({ x: 180, y: 320, vx: 0, vy: 0 });
  
  const isSimulating = useRef(false);
  const justShot = useRef(false);
  const isGoalScoredRef = useRef(false); 

  const [aimingPuckId, setAimingPuckId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });

  const renderX = (x: number) => myTeam === 'rival' ? WIDTH - x : x;
  const renderY = (y: number) => myTeam === 'rival' ? HEIGHT - y : y;

  // --- RED ONLINE: RECIBIR SINCRONIZACIÓN ---
  useEffect(() => {
    // Recibe coordenadas exactas del rival si no es tu turno
    const handleSync = (data: any) => {
      if (turn !== myTeam || data.isTurnChange) {
        pucksPhys.current = data.pucks;
        ballPhys.current = data.ball;
        setPucksState(data.pucks);
        setBallPosState(data.ball);
        
        if (data.isTurnChange) {
          setTurn(data.turn);
          isSimulating.current = false;
        }
      }
    };

    // Recibe goles del rival
    const handleGoalEvent = (data: { scoringTeam: 'player'|'rival' }) => {
      triggerGoal(data.scoringTeam, false);
    };

    socket.on('physics_sync', handleSync);
    socket.on('goal_event', handleGoalEvent);

    return () => { 
      socket.off('physics_sync', handleSync); 
      socket.off('goal_event', handleGoalEvent);
    };
  }, [turn, myTeam, socket]);

  // Temporizador local
  useEffect(() => {
    if (matchStatus !== 'playing') return;
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setMatchStatus('ended'); isSimulating.current = true; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [matchStatus]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  // Función unificada de GOL
  const triggerGoal = (scoringTeam: 'player' | 'rival', emitToRival: boolean = true) => {
    if (isGoalScoredRef.current || matchStatus === 'ended') return;
    
    isGoalScoredRef.current = true;
    setIsGoalScored(true);
    isSimulating.current = true; 

    scoreRef.current[scoringTeam] += 1;
    setScore({ ...scoreRef.current });

    if (emitToRival) {
      socket.emit('goal_event', { room, scoringTeam });
    }

    if (scoreRef.current.player >= 3 || scoreRef.current.rival >= 3) {
      setTimeout(() => { setIsGoalScored(false); setMatchStatus('ended'); }, 2000); 
    } else {
      setTimeout(() => { resetPositions(); }, 2500);
    }
  };

  const resetPositions = () => {
    pucksPhys.current = JSON.parse(JSON.stringify(initialPucks));
    ballPhys.current = { x: 180, y: 320, vx: 0, vy: 0 };
    setPucksState(initialPucks);
    setBallPosState({ x: 180, y: 320 });
    isGoalScoredRef.current = false;
    setIsGoalScored(false);
    isSimulating.current = false;
    justShot.current = false;
  };

  const restartMatch = () => {
    scoreRef.current = { player: 0, rival: 0 };
    setScore({ player: 0, rival: 0 });
    setTimeLeft(300);
    setTurn('player');
    setMatchStatus('playing');
    resetPositions();
  };

  // --- MOTOR DE FÍSICAS (EL DICTADOR) ---
  useEffect(() => {
    const updatePhysics = () => {
      // SOLO SE EJECUTA SI ES TU TURNO (Tú mandas en la física)
      if (isGoalScoredRef.current || matchStatus === 'ended' || turn !== myTeam) return;

      let pucks = pucksPhys.current;
      let ball = ballPhys.current;
      let isAnythingMoving = false;
      const friction = 0.975;
      const wallRestitution = 0.7; 
      const shockRestitution = 0.9;

      for (let p of pucks) {
        if (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) {
          isAnythingMoving = true;
          p.x += p.vx; p.y += p.vy; p.vx *= friction; p.vy *= friction;
          if (p.x - PUCK_RADIUS < 0) { p.x = PUCK_RADIUS; p.vx = -p.vx * wallRestitution; }
          if (p.x + PUCK_RADIUS > WIDTH) { p.x = WIDTH - PUCK_RADIUS; p.vx = -p.vx * wallRestitution; }
          if (p.y - PUCK_RADIUS < 0) { p.y = PUCK_RADIUS; p.vy = -p.vy * wallRestitution; }
          if (p.y + PUCK_RADIUS > HEIGHT) { p.y = HEIGHT - PUCK_RADIUS; p.vy = -p.vy * wallRestitution; }
        } else { p.vx = 0; p.vy = 0; }
      }

      if (Math.abs(ball.vx) > 0.05 || Math.abs(ball.vy) > 0.05) {
        isAnythingMoving = true;
        ball.x += ball.vx; ball.y += ball.vy; ball.vx *= 0.98; ball.vy *= 0.98;

        if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = -ball.vx * wallRestitution; }
        if (ball.x + BALL_RADIUS > WIDTH) { ball.x = WIDTH - BALL_RADIUS; ball.vx = -ball.vx * wallRestitution; }

        const inGoalX = ball.x > 110 && ball.x < 250;

        if (ball.y - BALL_RADIUS < 0) {
          if (inGoalX) { if (ball.y < -5) triggerGoal('player'); } 
          else { ball.y = BALL_RADIUS; ball.vy = -ball.vy * wallRestitution; }
        }

        if (ball.y + BALL_RADIUS > HEIGHT) {
          if (inGoalX) { if (ball.y > HEIGHT + 5) triggerGoal('rival'); } 
          else { ball.y = HEIGHT - BALL_RADIUS; ball.vy = -ball.vy * wallRestitution; }
        }
      } else { ball.vx = 0; ball.vy = 0; }

      for (let i = 0; i < pucks.length; i++) {
        for (let j = i + 1; j < pucks.length; j++) {
          let p1 = pucks[i]; let p2 = pucks[j];
          let dx = p2.x - p1.x; let dy = p2.y - p1.y; let distSq = dx*dx + dy*dy;
          if (distSq < (PUCK_RADIUS * 2) ** 2) {
            let dist = Math.sqrt(distSq); let overlap = ((PUCK_RADIUS * 2) - dist) / 2;
            let nx = dx / dist; let ny = dy / dist;
            p1.x -= overlap * nx; p1.y -= overlap * ny; p2.x += overlap * nx; p2.y += overlap * ny;
            let v1n = p1.vx * nx + p1.vy * ny; let v2n = p2.vx * nx + p2.vy * ny;
            if (v1n > v2n) {
              let p = (v1n - v2n) * shockRestitution;
              p1.vx -= p * nx; p1.vy -= p * ny; p2.vx += p * nx; p2.vy += p * ny;
            }
          }
        }
      }

      for (let p of pucks) {
        let dx = ball.x - p.x; let dy = ball.y - p.y; let distSq = dx*dx + dy*dy;
        if (distSq < COL_DIST_PB ** 2) {
          let dist = Math.sqrt(distSq); let overlap = (COL_DIST_PB - dist) / 2;
          let nx = dx / dist; let ny = dy / dist;
          p.x -= overlap * nx; p.y -= overlap * ny; ball.x += overlap * nx; ball.y += overlap * ny;
          let vPn = p.vx * nx + p.vy * ny; let vBn = ball.vx * nx + ball.vy * ny;
          if (vPn > vBn) {
            let p_impulse = (2.0 * (vPn - vBn)) / (PUCK_MASS + BALL_MASS);
            p.vx -= p_impulse * BALL_MASS * nx * shockRestitution; p.vy -= p_impulse * BALL_MASS * ny * shockRestitution;
            ball.vx += p_impulse * PUCK_MASS * nx * shockRestitution; ball.vy += p_impulse * PUCK_MASS * ny * shockRestitution;
          }
        }
      }

      isSimulating.current = isAnythingMoving;

      // ENVIAMOS LAS COORDENADAS EXACTAS AL RIVAL EN VIVO
      if (isAnythingMoving) {
        setPucksState([...pucksPhys.current]); setBallPosState({ ...ballPhys.current });
        socket.emit('physics_sync', { room, pucks: pucksPhys.current, ball: ballPhys.current });
      }

      // CAMBIO DE TURNO
      if (justShot.current && !isAnythingMoving && !isGoalScoredRef.current) {
        justShot.current = false;
        const nextTurn = myTeam === 'player' ? 'rival' : 'player';
        setTurn(nextTurn);
        // Enviamos el último frame avisando que ya es turno del otro
        socket.emit('physics_sync', { room, pucks: pucksPhys.current, ball: ballPhys.current, turn: nextTurn, isTurnChange: true });
      }
    };

    const physicsLoop = setInterval(updatePhysics, 16);
    return () => clearInterval(physicsLoop);
  }, [turn, myTeam, matchStatus, socket, room]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, puckId: string, team: string) => {
    if (isSimulating.current || turn !== team || team !== myTeam || isGoalScoredRef.current || matchStatus === 'ended') return;
    setAimingPuckId(puckId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!aimingPuckId) return;
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!aimingPuckId) return;
    
    const aimDx = dragStart.x - dragCurrent.x;
    const aimDy = dragStart.y - dragCurrent.y;
    
    if (Math.sqrt(aimDx**2 + aimDy**2) > 10) {
      let vx = aimDx * 0.18; let vy = aimDy * 0.18;
      if (myTeam === 'rival') { vx = -vx; vy = -vy; } // Invertimos input táctil
      
      const activePuck = pucksPhys.current.find((p: any) => p.id === aimingPuckId);
      if (activePuck) {
        activePuck.vx = vx; activePuck.vy = vy;
        justShot.current = true;
      }
    }
    setAimingPuckId(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const activePuckState = pucksState.find(p => p.id === aimingPuckId);
  const aimDx = dragStart.x - dragCurrent.x;
  const aimDy = dragStart.y - dragCurrent.y;
  const aimDistance = Math.sqrt(aimDx**2 + aimDy**2);

  return (
    // ¡NUEVO LAYOUT!: Ahora hay overflow-y-auto en el contenedor principal para que puedas bajar la pantalla si no cabe
    <div className="min-h-[100dvh] w-full bg-neutral-950 flex flex-col items-center py-6 px-2 overflow-y-auto font-sans select-none relative">
      
      <div className="w-full max-w-[360px] flex justify-between items-center mb-6 shrink-0 z-10">
        <div className={`px-3 py-2 rounded-xl border-2 transition-colors duration-300 ${turn === 'player' && matchStatus === 'playing' ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-neutral-800 border-neutral-700 opacity-50'}`}>
          <span className="text-white font-bold text-xs tracking-wider">{myTeam === 'player' ? 'TÚ' : opponentName}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-sm font-mono font-bold mb-1 tracking-widest ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`}>
            {formatTime(timeLeft)}
          </span>
          <div className="bg-neutral-800 px-6 py-2 rounded-xl border border-neutral-700 flex items-center gap-3">
            <span className={`text-white font-black text-2xl ${myTeam === 'rival' ? 'order-3' : 'order-1'}`}>{score.player}</span>
            <span className="text-neutral-600 font-black text-xl order-2">-</span>
            <span className={`text-red-500 font-black text-2xl ${myTeam === 'rival' ? 'order-1' : 'order-3'}`}>{score.rival}</span>
          </div>
        </div>
        <div className={`px-3 py-2 rounded-xl border-2 transition-colors duration-300 ${turn === 'rival' && matchStatus === 'playing' ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-neutral-800 border-neutral-700 opacity-50'}`}>
          <span className="text-white font-bold text-xs tracking-wider">{myTeam === 'rival' ? 'TÚ' : opponentName}</span>
        </div>
      </div>

      {/* LA CANCHA AHORA ES SHRINK-0 (no se aplasta) y TOUCH-NONE (para que arrastrar la ficha no scrollee) */}
      <div className="relative w-[360px] h-[640px] shrink-0 touch-none bg-gradient-to-b from-green-600 to-green-700 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.15)] border-4 border-neutral-300 mb-10">
        
        {matchStatus === 'ended' && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-neutral-900 border-2 border-neutral-700 p-8 rounded-2xl flex flex-col items-center w-4/5 shadow-2xl">
              <h2 className="text-4xl font-black mb-2 tracking-widest text-white">FIN DEL PARTIDO</h2>
              <button onClick={restartMatch} className="w-full bg-green-500 hover:bg-green-400 text-neutral-950 font-black py-3 rounded-xl mt-6 transition-transform active:scale-95">REINICIAR</button>
            </div>
          </div>
        )}

        {isGoalScored && matchStatus === 'playing' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 px-8 py-6 rounded-2xl border-4 border-white shadow-[0_0_50px_rgba(250,204,21,0.5)] transform animate-bounce">
              <h2 className="text-white font-black text-5xl tracking-widest drop-shadow-lg text-center">¡GOL!</h2>
            </div>
          </div>
        )}

        <div className="absolute top-1/2 w-full h-[3px] bg-white/40 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-[3px] border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 left-1/2 w-40 h-16 border-b-[3px] border-l-[3px] border-r-[3px] border-white/40 transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-40 h-16 border-t-[3px] border-l-[3px] border-r-[3px] border-white/40 transform -translate-x-1/2"></div>
        
        <div className="absolute top-0 left-[110px] w-2 h-2 bg-white rounded-full z-10 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 left-[250px] w-2 h-2 bg-white rounded-full z-10 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-[110px] w-2 h-2 bg-white rounded-full z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute bottom-0 left-[250px] w-2 h-2 bg-white rounded-full z-10 transform -translate-x-1/2 translate-y-1/2"></div>

        {aimingPuckId && activePuckState && aimDistance > 5 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ opacity: Math.min(1, aimDistance / 100) }}>
            <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="rgba(255, 255, 255, 1)" /></marker></defs>
            <line x1={renderX(activePuckState.x)} y1={renderY(activePuckState.y)} x2={renderX(activePuckState.x) + aimDx} y2={renderY(activePuckState.y) + aimDy} stroke="rgba(255, 255, 255, 1)" strokeWidth="5" strokeDasharray="10 5" strokeLinecap="round" markerEnd="url(#arrowhead)" />
          </svg>
        )}

        <div 
          className="absolute w-5 h-5 rounded-full border border-black z-30 shadow-[0_4px_8px_rgba(0,0,0,0.6)] bg-white flex items-center justify-center overflow-hidden"
          style={{ left: `${renderX(ballPosState.x) - BALL_RADIUS}px`, top: `${renderY(ballPosState.y) - BALL_RADIUS}px` }} 
        >
          <div className="absolute top-[20%] left-[20%] w-3 h-3 bg-neutral-900 rounded-sm transform rotate-12"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-neutral-900 rounded-sm"></div>
        </div>

        {pucksState.map((puck) => (
          <div
            key={puck.id}
            onPointerDown={(e) => handlePointerDown(e, puck.id, puck.team)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`absolute w-9 h-9 rounded-full border-[2px] border-white shadow-[0_5px_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-40 transition-transform ${
              puck.team === 'player' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-red-500 to-red-700'
            } ${turn === puck.team && myTeam === puck.team && matchStatus === 'playing' && !isSimulating.current && !isGoalScored ? 'cursor-grab hover:scale-105' : 'cursor-default opacity-90'}`}
            style={{ left: `${renderX(puck.x) - PUCK_RADIUS}px`, top: `${renderY(puck.y) - PUCK_RADIUS}px` }} 
          >
            <div className="absolute inset-0 rounded-full border border-black/20 m-1 pointer-events-none"></div>
            <span className="text-white font-black text-[10px] tracking-tighter drop-shadow-md z-10 pointer-events-none">{puck.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}