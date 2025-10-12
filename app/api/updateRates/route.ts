// app/api/updateRates/route.ts
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

// Instance Service Role côté serveur (sécurisé)
const supabase: SupabaseClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_CURRENCY = "EUR";

export async function GET() {
  try {
    console.log("🔄 Début de la mise à jour des taux de change...");

    const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`);
    
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    
    const json = await res.json();
    
    if (json.result !== "success" || !json.rates) {
      console.error("❌ Réponse invalide de l'API:", json);
      throw new Error("Échec de la récupération des taux de change");
    }

    const fetchedRates = json.rates;

    const rates = {
      EUR: 1,
      USD: fetchedRates.USD ?? 1.08,
      GBP: fetchedRates.GBP ?? 0.85,
      MGA: fetchedRates.MGA ?? 4500,
    };
    
    const { data: existing, error: selectError } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("base_currency", BASE_CURRENCY)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("❌ Erreur lors de la sélection:", selectError);
      throw new Error(`Erreur Supabase select: ${selectError.message}`);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("exchange_rates")
        .update({
          rates: rates,
          updated_at: new Date().toISOString()
        })
        .eq("base_currency", BASE_CURRENCY);
      
      if (updateError) throw new Error(`Échec de la mise à jour: ${updateError.message}`);
      
      console.log("✅ Taux mis à jour avec succès");
    } else {
      const { error: insertError } = await supabase
        .from("exchange_rates")
        .insert({
          base_currency: BASE_CURRENCY,
          rates: rates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) throw new Error(`Échec de l'insertion: ${insertError.message}`);
      
      console.log("✅ Taux insérés avec succès");
    }

    return NextResponse.json({ 
      success: true, 
      rates,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("❌ Erreur globale:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: "update failed", 
        detail: err.message 
      },
      { status: 500 }
    );
  }
}
