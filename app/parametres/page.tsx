// app/parametres/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, RefreshCw, TrendingUp, Calendar } from "lucide-react";

type CurrencyType = "MGA" | "USD" | "EUR" | "GBP";

interface ExchangeRate {
  base_currency: string;
  rates: {
    EUR: number;
    USD: number;
    GBP: number;
    MGA: number;
  };
  updated_at: string;
}

// Hook pour utiliser le ThemeContext (simulé ici, à remplacer par votre vrai hook)
const useTheme = () => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Lire le thème du localStorage au chargement
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  };

  return { theme, toggleTheme };
};

export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const [currency, setCurrency] = useState<CurrencyType>("MGA");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Charger les paramètres initiaux
  useEffect(() => {
    loadSettings();
    loadExchangeRates();
  }, []);

  const loadSettings = () => {
    const savedCurrency = localStorage.getItem('currency') as CurrencyType;
    if (savedCurrency) setCurrency(savedCurrency);
  };

  const loadExchangeRates = async () => {
    try {
      // Simuler le chargement des taux depuis Supabase
      // Dans votre vraie app, remplacer par: const { data } = await supabase.from('exchange_rates').select('*').single()
      
      // Simulation de données
      const mockData: ExchangeRate = {
        base_currency: "EUR",
        rates: {
          EUR: 1,
          USD: 1.08,
          GBP: 0.85,
          MGA: 4850
        },
        updated_at: new Date().toISOString()
      };
      
      setExchangeRates(mockData);
      setLastUpdate(formatDate(mockData.updated_at));
    } catch (error) {
      console.error("Erreur chargement des taux:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder seulement la devise
      localStorage.setItem('currency', currency);
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert("Paramètres enregistrés avec succès !");
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      // Appeler votre API route
      const response = await fetch('/api/updateRates');
      const data = await response.json();
      
      if (data.success) {
        // Recharger les taux
        await loadExchangeRates();
        alert("Taux de change mis à jour avec succès !");
      } else {
        alert("Erreur lors de la mise à jour des taux");
      }
    } catch (error) {
      alert("Erreur lors de la mise à jour des taux");
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: "€",
      USD: "$",
      GBP: "£",
      MGA: "Ar"
    };
    return symbols[curr] || curr;
  };

  const getCurrencyName = (curr: string) => {
    const names: Record<string, string> = {
      EUR: "Euro",
      USD: "Dollar US",
      GBP: "Livre Sterling",
      MGA: "Ariary"
    };
    return names[curr] || curr;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Paramètres
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Gérez vos préférences et les taux de change
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Apparence */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Apparence
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Mode sombre
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {theme === 'dark' ? 'Activé' : 'Désactivé'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-12 w-20 items-center rounded-full transition-all duration-300 ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                } hover:shadow-lg`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 flex items-center justify-center ${
                    theme === 'dark' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Section Devise */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Devise par défaut
              </h2>
            </div>

            <label className="block">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>
                Sélectionnez votre devise
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 outline-none`}
              >
                <option value="MGA">🇲🇬 MGA - Ariary Malgache</option>
                <option value="USD">🇺🇸 USD - Dollar US</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - Livre Sterling</option>
              </select>
            </label>
          </div>

          {/* Section Taux de Change */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 lg:col-span-2`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <RefreshCw className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Taux de Change
                  </h2>
                  {lastUpdate && (
                    <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      <Calendar className="w-3 h-3" />
                      <span>Dernière mise à jour: {lastUpdate}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleUpdateRates}
                disabled={isUpdatingRates}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg whitespace-nowrap`}
              >
                <RefreshCw className={`w-4 h-4 ${isUpdatingRates ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isUpdatingRates ? 'Mise à jour...' : 'Mettre à jour'}
                </span>
                <span className="sm:hidden">MAJ</span>
              </button>
            </div>

            {exchangeRates && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(exchangeRates.rates).map(([curr, rate]) => (
                  <div
                    key={curr}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      currency === curr
                        ? theme === 'dark'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-500 bg-blue-50'
                        : theme === 'dark'
                        ? 'border-gray-700 bg-gray-700/30'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {getCurrencySymbol(curr)}
                    </div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getCurrencyName(curr)}
                    </div>
                    <div className={`text-lg font-semibold mt-2 ${
                      currency === curr
                        ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {rate.toFixed(2)}
                    </div>
                    {curr !== exchangeRates.base_currency && (
                      <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        par {exchangeRates.base_currency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={`mt-4 p-4 rounded-xl ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">Base: </span>
                {exchangeRates?.base_currency || 'EUR'} - Les taux sont mis à jour automatiquement depuis une API externe
              </p>
            </div>
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </div>
  );
}