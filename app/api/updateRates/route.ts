// app/api/updaterates/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// L'URL et la clé d'Admin (à lire depuis .env.local)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// Devise de base pour la comparaison
const BASE_CURRENCY = "EUR"; 

export async function GET() {
  try {
    // 1. Récupération des taux depuis l'alternative gratuite
    const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`);
    const json = await res.json();
    
    // Vérification de la réussite de l'appel externe
    if (json.result !== "success" || !json.rates) {
        console.error("Échec de l'appel à l'API de taux de change externe.", json);
        throw new Error("Échec de la récupération des taux de change externes.");
    }

    const fetchedRates = json.rates;

    // 2. Construction de l'objet des taux
    const rates = {
      EUR: 1, // La base est toujours 1
      USD: fetchedRates.USD ?? 1.08,
      GBP: fetchedRates.GBP ?? 0.85,
      MGA: fetchedRates.MGA ?? 4500, // Taux par défaut si manquant
    };
    
    const rateObject = {
        base_currency: BASE_CURRENCY, 
        rates: rates, 
    };

    // 3. Mise à jour de Supabase (Upsert)
    // Utilise onConflict pour cibler la ligne à mettre à jour (nécessite UNIQUE constraint sur base_currency)
    const { error: upsertError } = await supabase
      .from("exchange_rates")
      .upsert(rateObject, { 
          onConflict: 'base_currency', // Utilise la colonne unique pour le conflit
          ignoreDuplicates: false,
      });
      
    if (upsertError) {
        // Capture l'erreur spécifique de Supabase
        console.error("❌ Erreur Supabase lors de l'upsert des taux:", upsertError.message);
        throw new Error(`Échec de l'upsert Supabase: ${upsertError.message}`);
    }

    return NextResponse.json({ success: true, rates });
  } catch (err: any) {
    console.error("Erreur update rates", err);
    // Retourne le message d'erreur détaillé pour le diagnostic
    return NextResponse.json(
      { success: false, error: "update failed", detail: err.message },
      { status: 500 }
    );
  }
}