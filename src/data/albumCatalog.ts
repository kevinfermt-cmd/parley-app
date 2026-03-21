// Ruta: src/data/albumCatalog.ts

export const ALL_CATALOGS: Record<string, any> = {
  // --- ÁLBUM 1: CHAMPIONS LEAGUE 25/26 ---
  "ucl_25_26": {
    info: {
      name: "Champions League 2025/2026",
      timeLeft: "Hasta 30/05/2026",
      theme: "from-blue-900 to-indigo-900",
      iconColor: "text-blue-400"
    },
    cards: [
      // Real Madrid
      { id: "c_mbappe", name: "Kylian Mbappé", team: "Real Madrid", rarity: "Legendary" },
      { id: "c_vinicius", name: "Vinícius Jr", team: "Real Madrid", rarity: "Epic" },
      { id: "c_bellingham", name: "Jude Bellingham", team: "Real Madrid", rarity: "Epic" },
      { id: "c_valverde", name: "Fede Valverde", team: "Real Madrid", rarity: "Rare" },
      { id: "c_courtois", name: "Thibaut Courtois", team: "Real Madrid", rarity: "Rare" },
      { id: "c_rudiger", name: "Antonio Rüdiger", team: "Real Madrid", rarity: "Epic" },
      { id: "c_alexander_arnold", name: "Trent Alexander-Arnold", team: "Real Madrid", rarity: "Epic" },
      { id: "c_tchouameni", name: "Aurélien Tchouaméni", team: "Real Madrid", rarity: "Rare" },
      { id: "c_rodrygo", name: "Rodrygo", team: "Real Madrid", rarity: "Epic" },
      { id: "c_camavinga", name: "Eduardo Camavinga", team: "Real Madrid", rarity: "Rare" },
      { id: "c_militao", name: "Éder Militão", team: "Real Madrid", rarity: "Epic" },
      { id: "c_mendy", name: "Ferland Mendy", team: "Real Madrid", rarity: "Common" },
      { id: "c_brahim", name: "Brahim Díaz", team: "Real Madrid", rarity: "Rare" },
      { id: "c_guler", name: "Arda Güler", team: "Real Madrid", rarity: "Rare" },
      { id: "c_lunin", name: "Andriy Lunin", team: "Real Madrid", rarity: "Rare" },
      { id: "c_alaba", name: "David Alaba", team: "Real Madrid", rarity: "Rare" },

      // Man City
      { id: "c_haaland", name: "Erling Haaland", team: "Man City", rarity: "Legendary" },
      { id: "c_kdb", name: "Kevin De Bruyne", team: "Man City", rarity: "Legendary" },
      { id: "c_rodri", name: "Rodri", team: "Man City", rarity: "Legendary" },
      { id: "c_foden", name: "Phil Foden", team: "Man City", rarity: "Epic" },
      { id: "c_dias", name: "Rúben Dias", team: "Man City", rarity: "Epic" },
      { id: "c_ederson", name: "Ederson", team: "Man City", rarity: "Epic" },
      { id: "c_gvardiol", name: "Josko Gvardiol", team: "Man City", rarity: "Epic" },
      { id: "c_bernardo", name: "Bernardo Silva", team: "Man City", rarity: "Epic" },
      { id: "c_akanji", name: "Manuel Akanji", team: "Man City", rarity: "Rare" },
      { id: "c_stones", name: "John Stones", team: "Man City", rarity: "Rare" },
      { id: "c_doku", name: "Jérémy Doku", team: "Man City", rarity: "Rare" },
      { id: "c_walker", name: "Kyle Walker", team: "Man City", rarity: "Rare" },
      { id: "c_grealish", name: "Jack Grealish", team: "Man City", rarity: "Rare" },
      { id: "c_kovacic", name: "Mateo Kovacic", team: "Man City", rarity: "Rare" },
      { id: "c_ake", name: "Nathan Aké", team: "Man City", rarity: "Rare" },

      // Barcelona
      { id: "c_lewandowski", name: "Robert Lewandowski", team: "Barcelona", rarity: "Legendary" },
      { id: "c_yamal", name: "Lamine Yamal", team: "Barcelona", rarity: "Legendary" },
      { id: "c_pedri", name: "Pedri", team: "Barcelona", rarity: "Epic" },
      { id: "c_raphinha", name: "Raphinha", team: "Barcelona", rarity: "Epic" },
      { id: "c_gavi", name: "Gavi", team: "Barcelona", rarity: "Epic" },
      { id: "c_araujo", name: "Ronald Araújo", team: "Barcelona", rarity: "Epic" },
      { id: "c_terstegen", name: "Marc-André ter Stegen", team: "Barcelona", rarity: "Epic" },
      { id: "c_cubarsi", name: "Pau Cubarsí", team: "Barcelona", rarity: "Rare" },
      { id: "c_kounde", name: "Jules Koundé", team: "Barcelona", rarity: "Rare" },
      { id: "c_balde", name: "Alejandro Balde", team: "Barcelona", rarity: "Rare" },
      { id: "c_dejong", name: "Frenkie de Jong", team: "Barcelona", rarity: "Epic" },
      { id: "c_olmo", name: "Dani Olmo", team: "Barcelona", rarity: "Rare" },
      { id: "c_christensen", name: "Andreas Christensen", team: "Barcelona", rarity: "Rare" },
      { id: "c_fermin", name: "Fermín López", team: "Barcelona", rarity: "Common" },

      // Arsenal
      { id: "c_saka", name: "Bukayo Saka", team: "Arsenal", rarity: "Legendary" },
      { id: "c_odegaard", name: "Martin Odegaard", team: "Arsenal", rarity: "Epic" },
      { id: "c_saliba", name: "William Saliba", team: "Arsenal", rarity: "Epic" },
      { id: "c_rice", name: "Declan Rice", team: "Arsenal", rarity: "Epic" },
      { id: "c_gabriel", name: "Gabriel Magalhães", team: "Arsenal", rarity: "Rare" },
      { id: "c_raya", name: "David Raya", team: "Arsenal", rarity: "Rare" },
      { id: "c_white", name: "Ben White", team: "Arsenal", rarity: "Rare" },
      { id: "c_havertz", name: "Kai Havertz", team: "Arsenal", rarity: "Rare" },
      { id: "c_martinelli", name: "Gabriel Martinelli", team: "Arsenal", rarity: "Rare" },
      { id: "c_trossard", name: "Leandro Trossard", team: "Arsenal", rarity: "Rare" },
      { id: "c_calafiori", name: "Riccardo Calafiori", team: "Arsenal", rarity: "Rare" },
      { id: "c_merino", name: "Mikel Merino", team: "Arsenal", rarity: "Rare" },
      { id: "c_timber", name: "Jurrien Timber", team: "Arsenal", rarity: "Common" },
      { id: "c_jesus", name: "Gabriel Jesus", team: "Arsenal", rarity: "Rare" },

      // Bayern Munich
      { id: "c_kane", name: "Harry Kane", team: "Bayern Munich", rarity: "Legendary" },
      { id: "c_musiala", name: "Jamal Musiala", team: "Bayern Munich", rarity: "Legendary" },
      { id: "c_kimmich", name: "Joshua Kimmich", team: "Bayern Munich", rarity: "Epic" },
      { id: "c_sane", name: "Leroy Sané", team: "Bayern Munich", rarity: "Epic" },
      { id: "c_neuer", name: "Manuel Neuer", team: "Bayern Munich", rarity: "Epic" },
      { id: "c_davies", name: "Alphonso Davies", team: "Bayern Munich", rarity: "Epic" },
      { id: "c_upamecano", name: "Dayot Upamecano", team: "Bayern Munich", rarity: "Rare" },
      { id: "c_kim", name: "Kim Min-jae", team: "Bayern Munich", rarity: "Rare" },
      { id: "c_palhinha", name: "João Palhinha", team: "Bayern Munich", rarity: "Rare" },
      { id: "c_gnabry", name: "Serge Gnabry", team: "Bayern Munich", rarity: "Rare" },
      { id: "c_coman", name: "Kingsley Coman", team: "Bayern Munich", rarity: "Rare" },
      { id: "c_muller", name: "Thomas Müller", team: "Bayern Munich", rarity: "Epic" },
      { id: "c_tel", name: "Mathys Tel", team: "Bayern Munich", rarity: "Common" },

      // Paris Saint-Germain
      { id: "c_donnarumma", name: "Gianluigi Donnarumma", team: "PSG", rarity: "Epic" },
      { id: "c_marquinhos", name: "Marquinhos", team: "PSG", rarity: "Epic" },
      { id: "c_hakimi", name: "Achraf Hakimi", team: "PSG", rarity: "Epic" },
      { id: "c_vitinha", name: "Vitinha", team: "PSG", rarity: "Epic" },
      { id: "c_dembele", name: "Ousmane Dembélé", team: "PSG", rarity: "Epic" },
      { id: "c_barcola", name: "Bradley Barcola", team: "PSG", rarity: "Rare" },
      { id: "c_zaire_emery", name: "Warren Zaïre-Emery", team: "PSG", rarity: "Rare" },
      { id: "c_mendes", name: "Nuno Mendes", team: "PSG", rarity: "Rare" },
      { id: "c_pacho", name: "Willian Pacho", team: "PSG", rarity: "Rare" },
      { id: "c_neves", name: "João Neves", team: "PSG", rarity: "Rare" },
      { id: "c_ramos", name: "Gonçalo Ramos", team: "PSG", rarity: "Rare" },
      { id: "c_kolo_muani", name: "Randal Kolo Muani", team: "PSG", rarity: "Rare" },
      { id: "c_asensio", name: "Marco Asensio", team: "PSG", rarity: "Rare" },
      { id: "c_ruiz", name: "Fabián Ruiz", team: "PSG", rarity: "Rare" },

      // Liverpool
      { id: "c_salah", name: "Mohamed Salah", team: "Liverpool", rarity: "Legendary" },
      { id: "c_vandijk", name: "Virgil van Dijk", team: "Liverpool", rarity: "Legendary" },
      { id: "c_alisson", name: "Alisson Becker", team: "Liverpool", rarity: "Epic" },
      { id: "c_macallister", name: "Alexis Mac Allister", team: "Liverpool", rarity: "Epic" },
      { id: "c_szoboszlai", name: "Dominik Szoboszlai", team: "Liverpool", rarity: "Epic" },
      { id: "c_diaz", name: "Luis Díaz", team: "Liverpool", rarity: "Epic" },
      { id: "c_jota", name: "Diogo Jota", team: "Liverpool", rarity: "Rare" },
      { id: "c_konate", name: "Ibrahima Konaté", team: "Liverpool", rarity: "Rare" },
      { id: "c_robertson", name: "Andrew Robertson", team: "Liverpool", rarity: "Rare" },
      { id: "c_nunez", name: "Darwin Núñez", team: "Liverpool", rarity: "Rare" },
      { id: "c_gravenberch", name: "Ryan Gravenberch", team: "Liverpool", rarity: "Rare" },
      { id: "c_bradley", name: "Conor Bradley", team: "Liverpool", rarity: "Rare" },
      { id: "c_gakpo", name: "Cody Gakpo", team: "Liverpool", rarity: "Rare" },
      { id: "c_elliott", name: "Harvey Elliott", team: "Liverpool", rarity: "Common" },

      // Atlético de Madrid
      { id: "c_griezmann", name: "Antoine Griezmann", team: "Atlético de Madrid", rarity: "Legendary" },
      { id: "c_alvarez", name: "Julián Álvarez", team: "Atlético de Madrid", rarity: "Epic" },
      { id: "c_oblak", name: "Jan Oblak", team: "Atlético de Madrid", rarity: "Epic" },
      { id: "c_sorloth", name: "Alexander Sørloth", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_koke", name: "Koke", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_depaul", name: "Rodrigo De Paul", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_gimenez", name: "José María Giménez", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_lenormand", name: "Robin Le Normand", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_llorente", name: "Marcos Llorente", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_gallagher", name: "Conor Gallagher", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_lino", name: "Samuel Lino", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_barrios", name: "Pablo Barrios", team: "Atlético de Madrid", rarity: "Rare" },
      { id: "c_molina", name: "Nahuel Molina", team: "Atlético de Madrid", rarity: "Common" },
      { id: "c_correa", name: "Ángel Correa", team: "Atlético de Madrid", rarity: "Common" }
]
  },

  // --- ÁLBUM 2: EL FUTURO (Ejemplo Mundial) ---
  // "worldcup_26": {
  //   info: {
  //     name: "Copa del Mundo 2026",
  //     timeLeft: "30 días restantes",
  //     theme: "from-yellow-700 to-red-900",
  //     iconColor: "text-yellow-400"
  //   },
  //   cards: [
  //     { id: "wc_messi", name: "Lionel Messi", team: "Argentina", rarity: "Legendary" },
  //     // ...
  //   ]
  // }
};

// ==========================================
// EL INTERRUPTOR MAESTRO: 
// Cambia esto cuando quieras lanzar una nueva temporada
// ==========================================
export const CURRENT_ALBUM_ID = "ucl_25_26";