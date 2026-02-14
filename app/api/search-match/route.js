// app/api/search-match/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  // Obtenemos lo que escribiste en el buscador (ej: "Real Madrid")
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ response: [] });

  // API Pública de TheSportsDB (Clave '3' es de prueba gratis)
  const API_KEY = "3";
  
  // Endpoint Mágico: Busca eventos por nombre de equipo
  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/searchevents.php?e=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.event) {
        return NextResponse.json({ response: [] });
    }

    // Filtramos para que solo salgan partidos de Futbol (strSport = Soccer)
    // y ordenamos por fecha
    const soccerMatches = data.event
        .filter(match => match.strSport === "Soccer")
        .sort((a, b) => new Date(b.dateEvent) - new Date(a.dateEvent)) // Más recientes primero
        .slice(0, 5); // Solo los 5 más relevantes

    const formattedEvents = soccerMatches.map(match => ({
        fixture: { 
            id: match.idEvent, 
            status: { elapsed: "0" }, // Por defecto
            date: match.dateEvent
        },
        league: { name: match.strLeague },
        teams: {
            home: { name: match.strHomeTeam, logo: null }, // Esta API no da logos directos aquí, pero no importa para el admin
            away: { name: match.strAwayTeam, logo: null }
        },
        goals: { 
            home: parseInt(match.intHomeScore) || 0, 
            away: parseInt(match.intAwayScore) || 0 
        },
        time: match.strTime?.substring(0, 5) || "Pronto" // Hora del partido
    }));

    return NextResponse.json({ response: formattedEvents });

  } catch (error) {
    console.error("Error buscando:", error);
    return NextResponse.json({ response: [] });
  }
}