// app/parametres/page.tsx
"use client";

import { useState, useEffect } from "react";
// CORRECTION : Ajout de l'icône BookOpen
import { Moon, Sun, RefreshCw, TrendingUp, Calendar, Check, Database, BookOpen } from "lucide-react";
import CacheManager from "@/components/CacheManager";

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

import { supabase } from "@/lib/supabaseClient";

const useTheme = () => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
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

const SweetAlert = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm ${
        type === 'success' 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
      }`}>
        {type === 'success' && (
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
        )}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

// 🆕 AJOUT : Définitions des KPI
const KPI_GLOSSARY = [
  { term: "EN STOCK", definition: "Nombre total d'articles actuellement en stock, prêts à être vendus." },
  { term: "EN TRANSIT", definition: "Nombre total d'articles en cours de livraison ou de transit (ni en stock, ni vendus)." },
  { term: "VENDUS", definition: "Nombre total d'articles qui ont été vendus et ne sont plus dans l'inventaire." },
  { term: "ROTATION (%)", definition: "Pourcentage d'articles vendus par rapport au total des articles. Un taux élevé indique que vous vendez rapidement." },
  { term: "MARGE MOY. (%)", definition: "La marge bénéficiaire moyenne (en %) sur vos produits, basée sur le prix d'achat et le prix de vente estimé." },
  { term: "GAIN TOTAL", definition: "La somme de votre Gain Réel (déjà encaissé) et de votre Gain Potentiel (à venir sur le stock restant)." },
  { term: "ACHAT TOTAL", definition: "La valeur d'achat totale de *tous* les produits que vous avez (stock, transit, et vendus)." },
  { term: "VALEUR STOCK", definition: "Le coût d'achat total de tous les articles *actuellement en stock*." },
  { term: "COÛT VENDUS", definition: "Le coût d'achat total des articles que vous avez *déjà vendus*." },
  { term: "REVENU RÉEL", definition: "Le montant total (en MGA) que vous avez encaissé en vendant vos produits." },
  { term: "GAIN RÉEL", definition: "Votre bénéfice net sur les produits déjà vendus. (REVENU RÉEL - COÛT VENDUS)." },
  { term: "GAIN POTENTIEL", definition: "Le bénéfice que vous réaliserez si vous vendez tout votre *stock actuel* au prix de vente estimé." },
];


export default function ParametresPage() {
  const { theme, toggleTheme } = useTheme();
  const [currency, setCurrency] = useState<CurrencyType>("MGA");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // CORRECTION : Ajout de 'glossaire' au type
  const [activeTab, setActiveTab] = useState<'apparence' | 'devise' | 'cache' | 'glossaire'>('apparence');

  const loadSettings = () => {
    const savedCurrency = localStorage.getItem('currency') as CurrencyType;
    if (savedCurrency) setCurrency(savedCurrency);
    else setCurrency("MGA");
  };

  const loadAvailableCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('currency');
      
      if (error) throw error;
      
      const uniqueCurrencies = [...new Set(data?.map(p => p.currency) || [])];
      if (!uniqueCurrencies.includes('MGA')) {
        uniqueCurrencies.unshift('MGA');
      }
      
      setAvailableCurrencies(uniqueCurrencies);
    } catch (error) {
      console.error("Erreur chargement des devises:", error);
      setAvailableCurrencies(['MGA', 'EUR', 'USD', 'GBP']);
    }
  };

  const loadExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', 'EUR')
        .single();
      
      if (error) throw error;
      
      if (data) {
        setExchangeRates({
          base_currency: data.base_currency,
          rates: data.rates,
          updated_at: data.updated_at
        });
        setLastUpdate(formatDate(data.updated_at));
      }
    } catch (error) {
      console.error("Erreur chargement des taux:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('currency', currency);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlert({ message: "Paramètres enregistrés avec succès !", type: 'success' });
    } catch (error) {
      setAlert({ message: "Erreur lors de l'enregistrement : " + error, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      const response = await fetch('/api/updateRates');
      const data = await response.json();
      
      if (data.success) {
        await loadExchangeRates();
        setAlert({ message: "Taux de change mis à jour avec succès !", type: 'success' });
      } else {
        setAlert({ message: `Erreur: ${data.detail || 'Erreur inconnue'}`, type: 'error' });
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      setAlert({ message: "Erreur lors de la mise à jour des taux", type: 'error' });
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
      MGA: "Ariary Malgache"
    };
    return names[curr] || curr;
  };

  const getCurrencyFlag = (curr: string) => {
    const flags: Record<string, string> = {
      EUR: "🇪🇺",
      USD: "🇺🇸",
      GBP: "🇬🇧",
      MGA: "🇲🇬"
    };
    return flags[curr] || "💱";
  };

  useEffect(() => {
    loadSettings();
    loadExchangeRates();
    loadAvailableCurrencies();
  },[]); // CORRECTION : Array de dépendances vide pour n'exécuter qu'au montage

  // 🆕 AJOUT : Ajout du nouvel onglet Glossaire
  const tabs = [
    { id: 'apparence' as const, label: 'Apparence', icon: Sun },
    { id: 'devise' as const, label: 'Devise', icon: TrendingUp },
    { id: 'cache' as const, label: 'Cache', icon: Database },
    { id: 'glossaire' as const, label: 'Glossaire KPI', icon: BookOpen },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {alert && (
        <SweetAlert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-7xl pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Paramètres
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Gérez vos préférences et les paramètres système
          </p>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 rounded-2xl p-1 backdrop-blur-sm overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="space-y-6">
          {activeTab === 'apparence' && (
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
          )}

          {activeTab === 'devise' && (
            <>
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
                    {availableCurrencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {getCurrencyFlag(curr)} {curr} - {getCurrencyName(curr)}
                      </option>
                    ))}
                  </select>
                </label>
                
                <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {availableCurrencies.length} devise(s) disponible(s) dans votre base de données
                  </p>
                </div>
              </div>

              {/* Section Taux de Change */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
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

                {exchangeRates ? (
                  <>
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

                    <div className={`mt-4 p-4 rounded-xl ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50'
                    }`}>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-semibold">Base: </span>
                        {exchangeRates.base_currency} - Les taux sont mis à jour depuis l'API open.er-api.com
                      </p>
                    </div>
                  </>
                ) : (
                  <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chargement des taux de change...</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'cache' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Database className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Gestion du Cache
                </h2>
              </div>
              <CacheManager />
            </div>
          )}

          {/* 🆕 AJOUT : Onglet Glossaire KPI */}
          {activeTab === 'glossaire' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <BookOpen className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Glossaire des Indicateurs Clés (KPI)
                </h2>
              </div>
              
              <p className={`mb-6 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Voici une explication simple des termes utilisés dans votre tableau de bord Revendeur pour vous aider à mieux comprendre vos performances.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {KPI_GLOSSARY.map((item) => (
                  <div key={item.term} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h3 className={`font-bold text-base mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.term}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bouton de sauvegarde */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            } disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Enregistrer les paramètres</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}