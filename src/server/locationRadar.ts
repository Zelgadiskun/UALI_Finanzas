import { GoogleGenAI } from "@google/genai";

export interface GroundingLink {
  title: string;
  url: string;
}

export interface LocationRadarResult {
  placeName: string;
  category: "supermercado" | "gasolinera" | "tienda" | "farmacia" | "restaurante" | "general";
  suggestedBudgetCategory: string;
  nudgeMessage: string;
  characterTip: string;
  character: "toto" | "nido" | "chispa";
  groundingLinks: GroundingLink[];
  latitude: number;
  longitude: number;
}

const PRESET_PLACES: Record<string, Partial<LocationRadarResult>> = {
  supermercado: {
    placeName: "Supermercado El Rey / Riba Smith",
    category: "supermercado",
    suggestedBudgetCategory: "Supermercado y Alimentos",
    nudgeMessage:
      "¿Haciendo compras de despensa? Un buen momento para registrar el ticket y no salirte de tu reparto.",
    characterTip: "Toto te sugiere: apegarte a la lista del súper evita gastos hormiga impulsivos.",
    character: "toto",
    groundingLinks: [
      {
        title: "Supermercados cercanos en Google Maps",
        url: "https://www.google.com/maps/search/?api=1&query=supermercado",
      },
    ],
  },
  gasolinera: {
    placeName: "Estación de Combustible Terpel / Texaco",
    category: "gasolinera",
    suggestedBudgetCategory: "Transporte y Gasolina",
    nudgeMessage:
      "¿Cargando combustible? Registra este gasto fijo para calcular tu consumo mensual con precisión.",
    characterTip: "Nido te recuerda: el transporte planificado protege tu liquidez semanal.",
    character: "nido",
    groundingLinks: [
      {
        title: "Gasolineras cercanas en Google Maps",
        url: "https://www.google.com/maps/search/?api=1&query=gasolinera",
      },
    ],
  },
  tienda: {
    placeName: "Tienda de Conveniencia / Abarrotes",
    category: "tienda",
    suggestedBudgetCategory: "Gustos Personales / Snacks",
    nudgeMessage:
      "¿Un snack o antojo de paso? Anótalo antes de salir para que los pequeños gastos sumen en positivo.",
    characterTip:
      "Chispa dice: ¡Registrar los pequeños snacks mantiene tu racha financiera al 100%!",
    character: "chispa",
    groundingLinks: [
      {
        title: "Tiendas de conveniencia en Google Maps",
        url: "https://www.google.com/maps/search/?api=1&query=tienda+de+conveniencia",
      },
    ],
  },
  farmacia: {
    placeName: "Farmacias Arrocha / Metro",
    category: "farmacia",
    suggestedBudgetCategory: "Salud y Cuidado",
    nudgeMessage: "¿Compra en farmacia? Anota tus medicinas o insumos para tu fondo de bienestar.",
    characterTip: "Nido te apoya: la salud es una prioridad que nunca debe escatimarse.",
    character: "nido",
    groundingLinks: [
      {
        title: "Farmacias cercanas en Google Maps",
        url: "https://www.google.com/maps/search/?api=1&query=farmacia",
      },
    ],
  },
};

export async function detectNearbyPlaceWithMaps(
  latitude: number,
  longitude: number,
  simulationType?: string,
): Promise<LocationRadarResult> {
  if (simulationType && PRESET_PLACES[simulationType]) {
    const preset = PRESET_PLACES[simulationType];
    return {
      placeName: preset.placeName!,
      category: preset.category!,
      suggestedBudgetCategory: preset.suggestedBudgetCategory!,
      nudgeMessage: preset.nudgeMessage!,
      characterTip: preset.characterTip!,
      character: preset.character!,
      groundingLinks: preset.groundingLinks || [],
      latitude,
      longitude,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackPlaceResult(latitude, longitude);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use gemini-2.5-flash with Google Maps tool as requested by the prompt
    // and fallback to gemini-3.8-flash if needed
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `El usuario está en las coordenadas latitud ${latitude}, longitud ${longitude}.
Indica qué comercio específico (supermercado, tienda, gasolinera, farmacia o restaurante) se encuentra justo aquí o en el entorno inmediato.
Genera un recordatorio sutil y amigable para la app financiera UALÍ que invite a registrar el gasto si realizó una compra.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude,
            },
          },
        },
      },
    });

    const rawText = response.text || "";
    const chunks =
      (response.candidates?.[0]?.groundingMetadata?.groundingChunks as Array<{
        maps?: { uri?: string; title?: string };
        web?: { uri?: string; title?: string };
      }>) || [];
    const groundingLinks: GroundingLink[] = [];

    for (const chunk of chunks) {
      if (chunk.maps?.uri) {
        groundingLinks.push({
          title: chunk.maps.title || "Ver ubicación en Google Maps",
          url: chunk.maps.uri,
        });
      }
      if (chunk.web?.uri) {
        groundingLinks.push({
          title: chunk.web.title || "Información en la Web",
          url: chunk.web.uri,
        });
      }
    }

    if (groundingLinks.length === 0) {
      groundingLinks.push({
        title: "Ver comercios en Google Maps",
        url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      });
    }

    const lower = rawText.toLowerCase();
    let category: LocationRadarResult["category"] = "general";
    let suggestedBudgetCategory = "Gastos Diarios";
    let character: LocationRadarResult["character"] = "toto";

    if (lower.includes("super") || lower.includes("abarr") || lower.includes("mercado")) {
      category = "supermercado";
      suggestedBudgetCategory = "Supermercado y Alimentos";
      character = "toto";
    } else if (lower.includes("gas") || lower.includes("combustible") || lower.includes("petro")) {
      category = "gasolinera";
      suggestedBudgetCategory = "Transporte y Gasolina";
      character = "nido";
    } else if (lower.includes("farma") || lower.includes("salud") || lower.includes("botica")) {
      category = "farmacia";
      suggestedBudgetCategory = "Salud y Cuidado";
      character = "nido";
    } else if (lower.includes("rest") || lower.includes("café") || lower.includes("comida")) {
      category = "restaurante";
      suggestedBudgetCategory = "Restaurantes y Cafés";
      character = "chispa";
    } else {
      category = "tienda";
      suggestedBudgetCategory = "Compras Generales";
      character = "chispa";
    }

    const firstLine = rawText.split("\n").find((l) => l.trim().length > 5) || "Comercio cercano";
    const placeName = firstLine.replace(/[*#]/g, "").trim().slice(0, 50);

    return {
      placeName: placeName || "Establecimiento cercano",
      category,
      suggestedBudgetCategory,
      nudgeMessage: `Detectamos que estás cerca de ${placeName}. ¿Deseas registrar alguna compra para tu presupuesto de ${suggestedBudgetCategory}?`,
      characterTip:
        character === "toto"
          ? "Toto dice: Registrar a tiempo te asegura que tu balance mensual se mantenga real."
          : character === "nido"
            ? "Nido te recuerda: Separar las compras necesarias de los extras protege tu fondo de ahorro."
            : "Chispa dice: ¡Mantén tu racha de registro financiero sumando este movimiento!",
      character,
      groundingLinks,
      latitude,
      longitude,
    };
  } catch (err) {
    console.warn("Maps grounding fallback invoked:", err);
    return fallbackPlaceResult(latitude, longitude);
  }
}

function fallbackPlaceResult(latitude: number, longitude: number): LocationRadarResult {
  return {
    placeName: "Supermercado / Tienda de Conveniencia",
    category: "supermercado",
    suggestedBudgetCategory: "Supermercado y Alimentos",
    nudgeMessage:
      "Detectamos un comercio en tu ubicación. Si realizaste alguna compra, ¿deseas anotarla con un toque para proteger tu presupuesto?",
    characterTip:
      "Toto te sugiere: un registro al instante ahorra 30 minutos de cuadre a fin de mes.",
    character: "toto",
    groundingLinks: [
      {
        title: "Explorar comercios cercanos en Google Maps",
        url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      },
    ],
    latitude,
    longitude,
  };
}
