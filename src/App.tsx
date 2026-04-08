import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  ClipboardList, 
  TrendingDown, 
  Wrench, 
  Stethoscope, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  LogOut, 
  LogIn,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type Step = 'intro' | 'identification' | 'section-a' | 'section-b' | 'section-c' | 'section-d' | 'section-e' | 'success';

interface FormData {
  pharmacyName: string;
  city: string;
  respondentRole: string;
  date: string;
  phone: string;
  experience: string;
  answers: Record<string, any>;
}

const initialFormData: FormData = {
  pharmacyName: '',
  city: '',
  respondentRole: '',
  date: new Date().toISOString().split('T')[0],
  phone: '',
  experience: '',
  answers: {}
};

const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Fès", "Tanger", "Marrakech", "Salé", "Meknès", "Oujda", 
  "Kénitra", "Agadir", "Tétouan", "Témara", "Safi", "Mohammédia", "Khouribga", 
  "El Jadida", "Béni Mellal", "Aït Melloul", "Nador", "Dar Bouazza", "Taza", 
  "Settat", "Berrechid", "Khemisset", "Inezgane", "Ksar El Kebir", "Larache", 
  "Guelmim", "Arfoud", "Errachidia", "Midelt", "Azrou", "Ifrane"
].sort();

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCityOpen, setIsCityOpen] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) setIsGuest(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsGuest(false);
    } catch (err: any) {
      // Don't show error if user just closed the popup or cancelled the request
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setError(null);
  };

  const handleLogout = () => {
    signOut(auth);
    setIsGuest(false);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAnswer = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  const handleSubmit = async () => {
    if (!user && !isGuest) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'responses'), {
        ...formData,
        userId: user ? user.uid : 'anonymous',
        isGuest: !user,
        createdAt: serverTimestamp()
      });
      setCurrentStep('success');
    } catch (err: any) {
      console.error("Error submitting questionnaire:", err);
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-lg shadow-brand-500/10 cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src="https://framerusercontent.com/images/YPAzIjoMNrFadoMFFkX13J0nXrs.png?scale-down-to=512&width=3432&height=3432" 
                alt="Anzarseha Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-slate-900 leading-none text-base sm:text-lg">Anzarseha</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 sm:mt-1">Contact: anass.rhomari@anzarseha.com</p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900">Mode Invité</p>
                <p className="text-[10px] text-slate-500 font-medium">Non connecté</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all duration-300"
                title="Quitter le mode invité"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all duration-300 text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Connexion
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-32">
        {!user && !isGuest ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center"
          >
            <motion.div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] overflow-hidden mx-auto mb-6 sm:mb-8 shadow-2xl shadow-brand-500/20 border-4 border-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { duration: 0.5 },
                y: { 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }
              }}
            >
              <img 
                src="https://framerusercontent.com/images/YPAzIjoMNrFadoMFFkX13J0nXrs.png?scale-down-to=512&width=3432&height=3432" 
                alt="Anzarseha Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">Bienvenue sur le Questionnaire Terrain</h2>
            <p className="text-slate-600 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-base sm:text-lg">
              Veuillez vous connecter ou continuer en tant qu'invité pour commencer l'étude.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-brand-500 text-white rounded-xl sm:rounded-2xl hover:bg-brand-600 transition-all duration-300 font-bold shadow-2xl shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg disabled:opacity-50 disabled:scale-100"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {isLoggingIn ? 'Connexion...' : 'Se connecter avec Google'}
              </button>
              <button 
                onClick={handleContinueAsGuest}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-600 border border-slate-200 rounded-xl sm:rounded-2xl hover:bg-slate-50 transition-all duration-300 font-bold shadow-xl shadow-slate-200/20 hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
              >
                Continuer sans connexion
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Progress Bar */}
            {currentStep !== 'intro' && currentStep !== 'success' && (
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">Progression de l'étude</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {getStepIndex(currentStep)} / 6
                  </span>
                </div>
                <div className="h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-brand-500 rounded-full shadow-sm shadow-brand-500/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${(getStepIndex(currentStep) / 6) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl p-5 flex items-start gap-4 text-red-700 shadow-sm"
              >
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <p className="text-sm font-bold">{error}</p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep !== 'intro' && currentStep !== 'success' && (
              <div className="fixed bottom-0 left-0 right-0 glass p-4 sm:p-6 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:p-0 flex justify-between gap-4 sm:gap-6">
                <button
                  onClick={handlePrev}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 text-sm sm:text-base",
                    currentStep === 'identification' 
                      ? "opacity-0 pointer-events-none" 
                      : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200 shadow-sm"
                  )}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Retour</span>
                </button>

                {currentStep === 'section-e' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.pharmacyName}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-4 bg-brand-500 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-brand-600 transition-all duration-300 shadow-xl shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        Terminer
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentStep === 'identification' && !formData.pharmacyName}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-4 bg-brand-500 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-brand-600 transition-all duration-300 shadow-xl shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                  >
                    Suivant
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );

  function getStepIndex(step: Step): number {
    const steps: Step[] = ['identification', 'section-a', 'section-b', 'section-c', 'section-d', 'section-e'];
    return steps.indexOf(step) + 1;
  }

  function handleNext() {
    const steps: Step[] = ['intro', 'identification', 'section-a', 'section-b', 'section-c', 'section-d', 'section-e', 'success'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    const steps: Step[] = ['intro', 'identification', 'section-a', 'section-b', 'section-c', 'section-d', 'section-e', 'success'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl shadow-brand-500/10">
            <div className="flex flex-col items-center text-center">
              <motion.div 
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8 shadow-2xl shadow-brand-500/20 border-4 border-white"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotate: [3, 0, 3],
                  y: [0, -8, 0]
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <img 
                  src="https://framerusercontent.com/images/YPAzIjoMNrFadoMFFkX13J0nXrs.png?scale-down-to=512&width=3432&height=3432" 
                  alt="Anzarseha Logo" 
                  className="w-full h-full object-cover scale-110"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 mb-6 sm:mb-8 leading-tight tracking-tight">Étude des Défis<br/>Pharmacies Maroc</h2>
              
              <div className="max-w-2xl mx-auto mb-8 sm:mb-12 space-y-4 sm:space-y-6 text-left bg-white/50 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-white/60 shadow-2xl shadow-brand-500/5">
                <p className="text-slate-700 leading-relaxed font-medium text-base sm:text-lg">
                  Dans le cadre du développement d'<strong>Anzarseha</strong>, une solution digitale dédiée aux pharmacies marocaines, nous menons actuellement une série d'entretiens terrain auprès de pharmaciens de plusieurs villes afin de mieux comprendre vos réalités opérationnelles quotidiennes.
                </p>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Ce questionnaire n'a pas pour objectif de vous présenter un produit, ni de vous vendre quoi que ce soit. Il s'agit d'une démarche d'<strong>écoute pure</strong> : nous cherchons à identifier, de manière concrète et sans a priori, les défis que vous rencontrez dans la gestion de votre pharmacie — qu'ils soient administratifs, organisationnels, financiers ou liés à la relation patient.
                </p>
                <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-brand-500/5 rounded-xl sm:rounded-2xl border border-brand-500/10">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 text-brand-500 shrink-0">🔒</div>
                  <p className="text-[11px] sm:text-sm text-slate-500 leading-relaxed italic">
                    Vos réponses sont strictement confidentielles et seront utilisées uniquement à des fins d'analyse interne. Aucune information nominative ne sera divulguée. L'entretien dure moins de 20 minutes.
                  </p>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium text-center pt-2 text-sm sm:text-base">
                  Nous vous remercions pour votre temps et la franchise de vos réponses — elles constituent la base sur laquelle nous construisons des outils qui répondent à de vrais besoins, pas à des suppositions.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full mb-8 sm:mb-12">
                <div className="p-4 sm:p-8 bg-white/50 rounded-xl sm:rounded-[2rem] border border-white/60 shadow-xl shadow-brand-500/5">
                  <p className="text-2xl sm:text-4xl font-display font-bold text-brand-500">25</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-1 sm:mt-2">Questions</p>
                </div>
                <div className="p-4 sm:p-8 bg-white/50 rounded-xl sm:rounded-[2rem] border border-white/60 shadow-xl shadow-brand-500/5">
                  <p className="text-2xl sm:text-4xl font-display font-bold text-brand-500">~20</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-1 sm:mt-2">Minutes</p>
                </div>
                <div className="p-4 sm:p-8 bg-white/50 rounded-xl sm:rounded-[2rem] border border-white/60 shadow-xl shadow-brand-500/5">
                  <p className="text-2xl sm:text-4xl font-display font-bold text-brand-500">🔒</p>
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-1 sm:mt-2">Confid.</p>
                </div>
              </div>
              <button 
                onClick={handleNext}
                className="w-full sm:w-auto px-10 sm:px-20 py-4 sm:py-6 bg-brand-500 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-brand-600 transition-all duration-300 shadow-2xl shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg"
              >
                Commencer le questionnaire
              </button>
            </div>
          </div>
        );

      case 'identification':
        return (
          <div className="space-y-6 sm:space-y-8">
            <SectionHeader 
              icon={<ClipboardList className="w-6 h-6 sm:w-7 sm:h-7" />}
              title="Identification"
              description="Informations générales"
              color="brand"
            />
            <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputGroup 
                  label="Nom de la pharmacie" 
                  subLabel='(ou "Sans")'
                  required
                  value={formData.pharmacyName}
                  onChange={(v) => updateFormData('pharmacyName', v)}
                  placeholder="Ex: Pharmacie Centrale"
                />
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Ville</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsCityOpen(!isCityOpen)}
                      className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/40 border border-white/60 rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none flex items-center justify-between group"
                    >
                      <span className={formData.city ? "text-slate-900" : "text-slate-400"}>
                        {formData.city || "Sélectionner"}
                      </span>
                      <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isCityOpen ? "rotate-90" : "")} />
                    </button>
                    
                    <AnimatePresence>
                      {isCityOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsCityOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl sm:rounded-2xl shadow-2xl z-20 max-h-64 overflow-y-auto scrollbar-none"
                          >
                            <div className="p-2 space-y-1">
                              {MOROCCAN_CITIES.map(city => (
                                <button
                                  key={city}
                                  onClick={() => {
                                    updateFormData('city', city);
                                    setIsCityOpen(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2 rounded-lg sm:rounded-xl text-sm font-bold transition-all",
                                    formData.city === city 
                                      ? "bg-brand-500 text-white" 
                                      : "text-slate-600 hover:bg-brand-50"
                                  )}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputGroup 
                  label="Répondant (rôle)" 
                  value={formData.respondentRole}
                  onChange={(v) => updateFormData('respondentRole', v)}
                  placeholder="Ex: Titulaire"
                />
                <InputGroup 
                  label="Téléphone / WhatsApp" 
                  value={formData.phone}
                  onChange={(v) => updateFormData('phone', v)}
                  placeholder="06..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <InputGroup 
                  label="Ancienneté (ans)" 
                  value={formData.experience}
                  onChange={(v) => updateFormData('experience', v)}
                  placeholder="Ex: 10 ans"
                />
              </div>
            </div>
          </div>
        );

      case 'section-a':
        return (
          <div className="space-y-8">
            <SectionHeader 
              icon={<LayoutDashboard className="w-7 h-7" />}
              title="Section A: Flux de travail quotidien"
              description="Comprendre les tâches manuelles et la charge opérationnelle"
              color="brand"
            />
            <QuestionCard 
              id="q1"
              number="Q1"
              text="Décrivez votre matin type. De l'ouverture jusqu'au premier client — quelles sont les tâches manuelles que vous réalisez ?"
              type="textarea"
              value={formData.answers.q1}
              onChange={(v) => updateAnswer('q1', v)}
            />
            <QuestionCard 
              id="q2"
              number="Q2"
              text="Quelle proportion de votre journée passez-vous au comptoir avec les patients, versus en back-office ?"
              type="radio"
              options={[
                "20% admin / 80% comptoir",
                "40% admin / 60% comptoir",
                "50% / 50%",
                "+60% admin / moins de comptoir"
              ]}
              value={formData.answers.q2}
              onChange={(v) => updateAnswer('q2', v)}
            />
            <QuestionCard 
              id="q4"
              number="Q4"
              text="Quels outils numériques ou logiciels utilisez-vous au quotidien ?"
              type="checkbox"
              options={[
                "Logiciel de gestion (PharmaPro, Pharmatic...)",
                "Tableur Excel / Sheets",
                "WhatsApp (usage pro)",
                "Cahier papier",
                "Application mobile",
                "Aucun outil numérique"
              ]}
              value={formData.answers.q4 || []}
              onChange={(v) => updateAnswer('q4', v)}
            />
          </div>
        );

      case 'section-b':
        return (
          <div className="space-y-8">
            <SectionHeader 
              icon={<TrendingDown className="w-7 h-7" />}
              title="Section B: Enjeux financiers & rentabilité"
              description="Identifier les coûts cachés et les priorités économiques"
              color="brand"
            />
            <QuestionCard 
              id="q5"
              number="Q5"
              text="En dehors de l'achat des médicaments, quelle est votre plus grosse dépense mensuelle ?"
              type="radio"
              options={[
                "Personnel / Salaires",
                "Loyer / charges fixes",
                "Produits périmés / gaspillage",
                "Logistique / livraisons",
                "Frais bancaires / commissions",
                "Autre"
              ]}
              value={formData.answers.q5}
              onChange={(v) => updateAnswer('q5', v)}
            />
            <QuestionCard 
              id="q6"
              number="Q6"
              text="Quel indicateur voudriez-vous voir s'améliorer en priorité ?"
              type="radio"
              options={[
                "Chiffre d'affaires global",
                "Marge nette",
                "Fidélisation patients",
                "Rotation du stock",
                "Réduction des pertes"
              ]}
              value={formData.answers.q6}
              onChange={(v) => updateAnswer('q6', v)}
            />
          </div>
        );

      case 'section-c':
        return (
          <div className="space-y-8">
            <SectionHeader 
              icon={<Wrench className="w-7 h-7" />}
              title="Section C: Pratiques « bricolées »"
              description="Repérer les solutions de fortune qui signalent un besoin non adressé"
              color="brand"
            />
            <QuestionCard 
              id="q8"
              number="Q8"
              text="Quelle partie de votre travail avez-vous dû « inventer » vous-même ?"
              type="textarea"
              value={formData.answers.q8}
              onChange={(v) => updateAnswer('q8', v)}
            />
            <QuestionCard 
              id="q9"
              number="Q9"
              text="Quel outil utilisez-vous le plus souvent pour une tâche pour laquelle il n'a pas été conçu ?"
              type="checkbox"
              options={[
                "WhatsApp pour suivi patients",
                "Excel pour gestion de stock",
                "Cahier pour ordonnances",
                "SMS pour rappels de traitement",
                "Facebook / groupes locaux"
              ]}
              value={formData.answers.q9 || []}
              onChange={(v) => updateAnswer('q9', v)}
            />
          </div>
        );

      case 'section-d':
        return (
          <div className="space-y-8">
            <SectionHeader 
              icon={<Stethoscope className="w-7 h-7" />}
              title="Section D: Opérations & Communication"
              description="Ordonnances, assurances, stock et communication patient"
              color="brand"
            />
            <QuestionCard 
              id="q11"
              number="Q11"
              text="Temps pour vérifier et entrer une ordonnance complexe ?"
              type="radio"
              options={[
                "Moins de 2 min",
                "2 à 5 min",
                "5 à 10 min",
                "Plus de 10 min"
              ]}
              value={formData.answers.q11}
              onChange={(v) => updateAnswer('q11', v)}
            />
            <QuestionCard 
              id="q13"
              number="Q13"
              text="Temps hebdomadaire consacré aux dossiers AMO/CNOPS ?"
              type="radio"
              options={[
                "Moins de 2h/semaine",
                "2 à 5h/semaine",
                "5 à 10h/semaine",
                "Plus de 10h/semaine"
              ]}
              value={formData.answers.q13}
              onChange={(v) => updateAnswer('q13', v)}
            />
            <QuestionCard 
              id="q19"
              number="Q19"
              text="Utilisez-vous WhatsApp pour envoyer des messages vocaux aux patients ?"
              type="radio"
              options={[
                "Non, jamais",
                "Oui, rarement",
                "Oui, régulièrement",
                "Oui, c'est mon moyen principal"
              ]}
              value={formData.answers.q19}
              onChange={(v) => updateAnswer('q19', v)}
            />
          </div>
        );

      case 'section-e':
        return (
          <div className="space-y-8">
            <SectionHeader 
              icon={<CheckCircle2 className="w-7 h-7" />}
              title="Section E: Priorisation & Adoption"
              description="Identifier les priorités réelles et le potentiel d'adoption"
              color="brand"
            />
            <QuestionCard 
              id="q20"
              number="Q20"
              text="Si vous pouviez supprimer UNE SEULE tâche de votre journée — laquelle choisiriez-vous ?"
              type="textarea"
              value={formData.answers.q20}
              onChange={(v) => updateAnswer('q20', v)}
            />
            <QuestionCard 
              id="q23"
              number="Q23"
              text="Combien seriez-vous prêt à payer par mois pour une solution adaptée ?"
              type="radio"
              options={[
                "0 — je ne paierais pas",
                "50–200 MAD/mois",
                "200–500 MAD/mois",
                "+500 MAD/mois"
              ]}
              value={formData.answers.q23}
              onChange={(v) => updateAnswer('q23', v)}
            />
            <QuestionCard 
              id="q24"
              number="Q24"
              text="Seriez-vous prêt à tester gratuitement une solution pendant 30 jours ?"
              type="radio"
              options={[
                "Oui, volontiers",
                "Oui, mais seulement si...",
                "Peut-être, à voir",
                "Non, pas intéressé"
              ]}
              value={formData.answers.q24}
              onChange={(v) => updateAnswer('q24', v)}
            />
          </div>
        );

      case 'success':
        return (
          <div className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center shadow-2xl shadow-emerald-500/10">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Merci pour votre participation !</h2>
            <p className="text-slate-600 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-base sm:text-lg">
              Vos réponses ont été enregistrées avec succès. Elles nous seront précieuses pour améliorer les services de santé au Maroc.
            </p>
            <button 
              onClick={() => {
                setFormData(initialFormData);
                setCurrentStep('intro');
              }}
              className="w-full sm:w-auto px-10 sm:px-12 py-3.5 sm:py-4 bg-brand-500 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-brand-600 transition-all duration-300 shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
            >
              Nouveau questionnaire
            </button>
          </div>
        );

      default:
        return null;
    }
  }
}

// --- UI Sub-components ---

function SectionHeader({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: 'brand' }) {
  return (
    <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex items-start gap-4 sm:gap-6 shadow-2xl shadow-brand-500/5">
      <div className="p-3 sm:p-4 bg-brand-500 rounded-xl sm:rounded-2xl shadow-lg shadow-brand-500/20 text-white shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{description}</p>
      </div>
    </div>
  );
}

function QuestionCard({ id, number, text, type, options, value, onChange }: { 
  id: string, 
  number: string, 
  text: string, 
  type: 'textarea' | 'radio' | 'checkbox', 
  options?: string[],
  value: any,
  onChange: (val: any) => void 
}) {
  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
      <div className="bg-white/40 px-5 sm:px-8 py-4 sm:py-5 border-b border-white/60 flex items-center gap-3 sm:gap-4">
        <span className="bg-brand-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg uppercase tracking-widest shadow-sm shadow-brand-500/20">{number}</span>
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">{text}</h4>
      </div>
      <div className="p-5 sm:p-8">
        {type === 'textarea' && (
          <textarea
            className="w-full min-h-[100px] sm:min-h-[140px] p-4 sm:p-5 bg-white/40 border border-white/60 rounded-xl sm:rounded-2xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none placeholder:text-slate-400"
            placeholder="Votre réponse ici..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {type === 'radio' && options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all duration-300 text-sm font-bold",
                  value === opt 
                    ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20 scale-[1.01] sm:scale-[1.02]" 
                    : "bg-white/40 border-white/60 text-slate-600 hover:bg-white hover:border-brand-200"
                )}
              >
                <div className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  value === opt ? "border-white" : "border-slate-300"
                )}>
                  {value === opt && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full" />}
                </div>
                {opt}
              </button>
            ))}
          </div>
        )}

        {type === 'checkbox' && options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {options.map((opt) => {
              const isChecked = Array.isArray(value) && value.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    if (isChecked) {
                      onChange(current.filter(i => i !== opt));
                    } else {
                      onChange([...current, opt]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all duration-300 text-sm font-bold",
                    isChecked 
                      ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20 scale-[1.01] sm:scale-[1.02]" 
                      : "bg-white/40 border-white/60 text-slate-600 hover:bg-white hover:border-brand-200"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                    isChecked ? "bg-white border-white" : "border-slate-300"
                  )}>
                    {isChecked && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-brand-500" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InputGroup({ label, subLabel, value, onChange, placeholder, required }: { 
  label: string, 
  subLabel?: string,
  value: string, 
  onChange: (v: string) => void, 
  placeholder?: string,
  required?: boolean
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
        {subLabel && <span className="block mt-0.5 text-[9px] sm:text-[10px] text-slate-400 normal-case font-medium italic">{subLabel}</span>}
      </label>
      <input
        type="text"
        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-white/40 border border-white/60 rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
