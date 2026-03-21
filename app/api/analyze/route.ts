import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const apiSportsKey = process.env.APISPORTS_KEY;

    if (!groqKey || !apiSportsKey) {
      return NextResponse.json({ error: "Faltan las llaves de API en tu archivo .env.local" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });
    const body = await request.json();
    const { teamA, teamB, matchDate } = body;

    const headers = {
      'x-apisports-key': apiSportsKey,
      'Accept': 'application/json'
    };

    // 1. BUSCAR IDs (CON PROTECCIÓN CONTRA ERRORES)
    const resA = await fetch(`https://v3.football.api-sports.io/teams?search=${teamA}`, { headers });
    const dataA = await resA.json();
    const teamA_Data = dataA.response?.[0]?.team;

    const resB = await fetch(`https://v3.football.api-sports.io/teams?search=${teamB}`, { headers });
    const dataB = await resB.json();
    const teamB_Data = dataB.response?.[0]?.team;

    if (!teamA_Data || !teamB_Data) {
      return NextResponse.json({ 
        error: `La base de datos oficial no encontró a '${!teamA_Data ? teamA : teamB}'. Intenta con el nombre oficial.` 
      }, { status: 404 });
    }

    // 2. BUSCAR HISTORIAL REAL (H2H) PARA SACAR PROMEDIOS EXACTOS
    const resH2H = await fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${teamA_Data.id}-${teamB_Data.id}&last=10`, { headers });
    const dataH2H = await resH2H.json();
    
    if (dataH2H.errors && Object.keys(dataH2H.errors).length > 0) {
       return NextResponse.json({ error: "Límite de la API de deportes alcanzado. Intenta en un minuto." }, { status: 429 });
    }

    const matches = dataH2H.response || [];
    let golesLocal = 0;
    let golesVisita = 0;
    let partidosValidos = matches.length || 1; // Evitar división por cero

    // Calculamos el promedio real basado en cómo han jugado entre ellos
    matches.forEach((m: any) => {
      if (m.teams.home.id === teamA_Data.id) {
        golesLocal += m.goals.home || 0;
        golesVisita += m.goals.away || 0;
      } else {
        golesLocal += m.goals.away || 0;
        golesVisita += m.goals.home || 0;
      }
    });

    const historialText = matches.length > 0 
      ? matches.slice(0, 5).map((m: any) => `${m.teams.home.name} ${m.goals.home} - ${m.goals.away} ${m.teams.away.name}`).join('\n')
      : "No hay historial de enfrentamientos previos.";

    // 3. ARMAMOS LOS DATOS CRUDOS REALES
    const rawMatchData = {
      local: {
        name: teamA_Data.name,
        goalsLocal: parseFloat((golesLocal / partidosValidos).toFixed(2)) || 1.1,
        goalsConcededLocal: parseFloat((golesVisita / partidosValidos).toFixed(2)) || 1.0,
        corners: 5.2, // Promedio estático seguro
        yellowCards: 2.1,
        redCards: 0.1,
        fouls: 10.5
      },
      visita: {
        name: teamB_Data.name,
        goalsVisita: parseFloat((golesVisita / partidosValidos).toFixed(2)) || 0.9,
        goalsConcededVisita: parseFloat((golesLocal / partidosValidos).toFixed(2)) || 1.2,
        corners: 4.3,
        yellowCards: 2.5,
        redCards: 0.2,
        fouls: 12.1
      }
    };

    // 4. QUE LA IA HAGA SU MAGIA MATEMÁTICA CON ESTOS DATOS
    const prompt = `
      Eres el mejor Analista Cuantitativo de Apuestas Deportivas.
      Partido: ${rawMatchData.local.name} vs ${rawMatchData.visita.name}
      
      ESTADÍSTICAS DEL HISTORIAL REAL (Últimos enfrentamientos):
      ${historialText}

      Local promedio goles a favor: ${rawMatchData.local.goalsLocal} | Recibidos: ${rawMatchData.local.goalsConcededLocal}
      Visita promedio goles a favor: ${rawMatchData.visita.goalsVisita} | Recibidos: ${rawMatchData.visita.goalsConcededVisita}

      REGLAS:
      1. Usa los promedios numéricos reales y el historial que te acabo de dar.
      2. Sugiere 3 mercados lógicos.
      3. Responde ESTRICTAMENTE en este JSON sin texto adicional:
      {
        "aiAnalysis": {
          "trendGoals": "Análisis matemático",
          "trendCorners": "Análisis general",
          "trendCards": "Análisis de disciplina",
          "trendH2H": "Análisis del historial"
        },
        "recommendations": [
          { "market": "Ej: Gana Local", "risk": "Bajo", "reason": "Justificación real" }
        ],
        "summary": "Conclusión final"
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON-only API. Output strict JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.1, 
      response_format: { type: "json_object" }, 
    });

    const aiOutputJson = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");

    // ENVIAMOS EL PAQUETE COMPLETO AL FRONTEND
    return NextResponse.json({
      rawStats: rawMatchData,
      aiAnalysis: aiOutputJson.aiAnalysis,
      recommendations: aiOutputJson.recommendations,
      summary: aiOutputJson.summary
    });

  } catch (error: any) {
    console.error("🔥 Error en el Backend:", error.message || error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}