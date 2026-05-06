import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bus, 
  Search, 
  MessageSquare, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle, 
  Smartphone,
  ChevronRight,
  Star,
  Send,
  Bot
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { cn, formatPrice } from "@/src/lib/utils";
import { Agency, Journey, Booking, AppView } from "./types";

// --- Components ---

const Header = ({ title, onBack, rightElement }: { title: string; onBack?: () => void; rightElement?: React.ReactNode }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-[#ef6c00] text-white flex items-center px-4 z-50 shadow-md">
    {onBack && (
      <button onClick={onBack} className="p-2 -ml-2 mr-2 hover:bg-white/10 rounded-full">
        <ArrowLeft className="w-6 h-6" />
      </button>
    )}
    <h1 className="text-xl font-bold flex-1">{title}</h1>
    {rightElement}
  </header>
);

const Button = ({ children, onClick, className, variant = "primary", disabled, loading }: any) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={cn(
      "w-full py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg",
      variant === "primary" ? "bg-[#ef6c00] text-white" : "bg-white text-[#ef6c00] border-2 border-[#ef6c00]",
      className
    )}
  >
    {loading && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
    {children}
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>("HOME");
  const [searchParams, setSearchParams] = useState({ from: "", to: "" });
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [bookingData, setBookingData] = useState({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<"OM" | "MTN" | null>(null);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);

  // IA State
  const [chatMessages, setChatMessages] = useState<{role: "user" | "bot", content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agencies").then(res => res.json()).then(setAgencies);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?from=${searchParams.from}&to=${searchParams.to}`);
      const data = await res.json();
      setJourneys(data);
      setView("SEARCH_RESULTS");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (journey: Journey) => {
    setSelectedJourney(journey);
    setView("BOOKING");
  };

  const handleConfirmBookingDetails = () => {
    if (bookingData.name && bookingData.phone) {
      setView("PAYMENT");
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId: selectedJourney?.id,
          customerName: bookingData.name,
          phone: bookingData.phone,
          paymentMethod
        })
      });
      const data = await res.json();
      setConfirmation(data);
      setView("CONFIRMATION");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startAIChat = () => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: "bot",
        content: "Bonjour ! Je suis votre assistant djaagal Connect. Je peux vous aider à trouver un trajet, comparer les prix ou répondre à vos questions sur les agences. Où souhaitez-vous aller ?"
      }]);
    }
    setView("BOT");
  };

  const sendAIMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Utilisateur dit: "${userMsg}". 
      Tu es l'assistant de djaagal Connect, une application de voyage au Cameroun. 
      Données actuelles des trajets: ${JSON.stringify(journeys)}. 
      Données des agences: ${JSON.stringify(agencies)}. 
      Réponds de manière concise, polie et utile en français. Aide l'utilisateur à choisir le meilleur trajet selon l'heure, le prix ou le confort (VIP).
      N'hésite pas à mentionner les agences comme Danay Express ou Touristique s'ils correspondent à sa recherche.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setChatMessages(prev => [...prev, { role: "bot", content: response.text || "Désolé, je n'ai pas compris." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "bot", content: "Une erreur est survenue lors de la communication avec l'IA." }]);
    } finally {
      setLoading(false);
    }
  };

  const getAgency = (id: string) => agencies.find(a => a.id === id);

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans text-[#3d2b1f] pb-10">
      <AnimatePresence mode="wait">
        
        {/* VIEW: HOME */}
        {view === "HOME" && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen"
          >
            <div className="p-8 pb-12 bg-[#ef6c00] text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
               <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
               <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Bus className="w-8 h-8 text-[#fffde7]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">djaagal Connect</h1>
                    <p className="text-sm opacity-80 uppercase tracking-widest font-medium">Cameroun - Nord & Extrême-Nord</p>
                  </div>
                </div>
                <h2 className="text-4xl font-bold leading-tight mb-4">
                  Voyagez l'esprit tranquille.
                </h2>
                <p className="text-lg opacity-90 mb-8 max-w-xs">
                  Réservez vos places en quelques clics auprès des meilleures agences.
                </p>
               </div>
            </div>

            <div className="px-6 -mt-10 mb-8 z-20">
              <form onSubmit={handleSearch} className="bg-white p-6 rounded-[2rem] shadow-2xl space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ef6c00]" />
                    <input 
                      type="text" 
                      placeholder="Ville de départ (ex: Maroua)" 
                      value={searchParams.from}
                      onChange={e => setSearchParams({...searchParams, from: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-neutral-100 rounded-xl focus:ring-2 focus:ring-[#ef6c00] outline-none"
                    />
                  </div>
                  <div className="relative text-center -my-2 z-10">
                    <div className="bg-white inline-block p-1 rounded-full shadow-sm">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <ChevronRight className="w-4 h-4 text-[#ef6c00] rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ef6c00]" />
                    <input 
                      type="text" 
                      placeholder="Destination (ex: Garoua)" 
                      value={searchParams.to}
                      onChange={e => setSearchParams({...searchParams, to: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-neutral-100 rounded-xl focus:ring-2 focus:ring-[#ef6c00] outline-none"
                    />
                  </div>
                </div>
                <Button loading={loading} className="mt-2 text-lg">
                  <Search className="w-5 h-5" /> Trouver mon trajet
                </Button>
              </form>
            </div>

            <div className="px-8 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl text-[#3d2b1f]">Services populaires</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-3xl border border-neutral-100 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3 text-emerald-700">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-[#3d2b1f]">E-Ticket</p>
                  <p className="text-xs text-neutral-500">Zéro papier, 100% digital</p>
                </div>
                <div className="p-4 bg-white rounded-3xl border border-neutral-100 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm">
                  <div className="w-10 h-10 bg-[#ef6c00]/10 rounded-xl flex items-center justify-center mb-3 text-[#ef6c00]">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-[#3d2b1f]">Paiement Mobile</p>
                  <p className="text-xs text-neutral-500">Momo & Orange Money</p>
                </div>
              </div>

              <div 
                onClick={startAIChat}
                className="bg-[#3d2b1f] text-white p-6 rounded-[2rem] flex items-center gap-4 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <div className="p-3 bg-[#ef6c00] rounded-2xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold">Besoin d'aide ?</p>
                  <p className="text-sm opacity-70">Discutez avec notre assistant IA disponible 24h/24.</p>
                </div>
              </div>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
               <button 
                onClick={startAIChat}
                className="w-14 h-14 bg-[#ef6c00] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
               >
                 <MessageSquare className="w-6 h-6" />
               </button>
            </div>
          </motion.div>
        )}

        {/* VIEW: SEARCH RESULTS */}
        {view === "SEARCH_RESULTS" && (
          <motion.div 
            key="results"
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -200, opacity: 0 }}
            className="pt-20 px-6 space-y-6"
          >
            <Header title={`Trajets vers ${searchParams.to}`} onBack={() => setView("HOME")} />
            
            {journeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
                <div className="p-8 bg-neutral-100 rounded-full">
                   <Bus className="w-16 h-16 text-neutral-300" />
                </div>
                <p className="text-lg font-medium text-neutral-500">Aucun trajet trouvé pour cet itinéraire aujourd'hui.</p>
                <Button onClick={() => setView("HOME")} variant="secondary" className="max-w-xs">Nouvelle recherche</Button>
              </div>
            ) : (
              journeys.map(j => {
                const agency = getAgency(j.agencyId);
                return (
                  <motion.div 
                    key={j.id}
                    layoutId={j.id}
                    onClick={() => handleBook(j)}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-neutral-200">
                          {agency?.logo}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{agency?.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-neutral-500 font-medium">{agency?.rating}</span>
                            <span className={cn(
                              "ml-2 text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                              j.class === "VIP" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"
                            )}>{j.class}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#ef6c00]">{formatPrice(j.price)}</p>
                        <p className="text-[10px] text-neutral-400 font-medium">PAR PERSONNE</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-4 border-y border-dashed border-neutral-100">
                       <div className="flex-1">
                          <p className="text-xs text-neutral-400 uppercase font-bold mb-1">Départ</p>
                          <p className="text-lg font-bold">{j.departureTime}</p>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <p className="text-[10px] text-neutral-400 font-bold whitespace-nowrap">3h 30min</p>
                          <div className="w-16 h-px bg-neutral-200 relative">
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                          </div>
                       </div>
                       <div className="flex-1 text-right">
                          <p className="text-xs text-neutral-400 uppercase font-bold mb-1">Arrivée</p>
                          <p className="text-lg font-bold">{j.arrivalTime}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                       <div className="flex items-center gap-2 text-neutral-500">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">{j.seatsRemaining} places dispo.</span>
                       </div>
                       <Button onClick={() => handleBook(j)} className="w-auto py-2 px-6 rounded-full text-sm">
                         Réserver
                       </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* VIEW: BOOKING DETAILS */}
        {view === "BOOKING" && selectedJourney && (
          <motion.div 
            key="booking"
            initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col pt-16"
          >
            <Header title="Finaliser la réservation" onBack={() => setView("SEARCH_RESULTS")} />
            <div className="p-8 flex-1 space-y-8 overflow-y-auto">
              <div className="bg-neutral-50 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-neutral-400 uppercase text-xs tracking-widest">Récapitulatif</h3>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedJourney.from} → {selectedJourney.to}</span>
                  <span className="font-bold text-[#ef6c00]">{formatPrice(selectedJourney.price)}</span>
                </div>
                <div className="flex gap-4 text-sm text-neutral-500">
                   <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedJourney.departureTime}</div>
                   <div className="flex items-center gap-1 font-bold text-[#ef6c00]">{selectedJourney.class}</div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Vos informations</h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-500 uppercase ml-1">Nom Complet</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Jean Dupont"
                        value={bookingData.name}
                        onChange={e => setBookingData({...bookingData, name: e.target.value})}
                        className="w-full px-5 py-4 bg-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#ef6c00]"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-500 uppercase ml-1">Téléphone</label>
                      <input 
                        type="tel" 
                        placeholder="Ex: 6xx xxx xxx"
                        value={bookingData.phone}
                        onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#ef6c00]"
                      />
                   </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-white border-t border-neutral-100">
              <Button onClick={handleConfirmBookingDetails} disabled={!bookingData.name || !bookingData.phone}>
                Passer au paiement
              </Button>
            </div>
          </motion.div>
        )}

        {/* VIEW: PAYMENT */}
        {view === "PAYMENT" && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-[#3d2b1f] z-[70] flex flex-col p-8 pt-20"
          >
            <Header title="Paiement Mobile" onBack={() => setView("BOOKING")} />
            <div className="text-white text-center mb-12">
               <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-2">Total à payer</p>
               <h2 className="text-5xl font-black">{formatPrice(selectedJourney?.price || 0)}</h2>
            </div>

            <div className="space-y-4">
               <p className="text-white/80 font-medium text-center">Choisissez votre mode de paiement :</p>
               
               <button 
                onClick={() => setPaymentMethod("OM")}
                className={cn(
                  "w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all",
                  paymentMethod === "OM" ? "border-[#ef6c00] bg-white/10" : "border-white/10 bg-white/5"
                )}
               >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center">
                       <span className="font-bold text-orange-500 text-lg">OM</span>
                    </div>
                    <div className="text-left font-bold text-white">Orange Money</div>
                  </div>
                  {paymentMethod === "OM" && <CheckCircle className="text-[#ef6c00]" />}
               </button>

               <button 
                onClick={() => setPaymentMethod("MTN")}
                className={cn(
                  "w-full p-6 rounded-3xl flex items-center justify-between border-2 transition-all",
                  paymentMethod === "MTN" ? "border-[#ef6c00] bg-white/10" : "border-white/10 bg-white/5"
                )}
               >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center">
                       <span className="font-bold text-yellow-600 text-lg">MTN</span>
                    </div>
                    <div className="text-left font-bold text-white">MTN MoMo</div>
                  </div>
                  {paymentMethod === "MTN" && <CheckCircle className="text-[#ef6c00]" />}
               </button>
            </div>

            <div className="mt-auto space-y-4">
               <p className="text-center text-white/50 text-xs px-8">
                 En cliquant sur "Confirmer", une demande de retrait sera envoyée vers votre téléphone.
               </p>
               <Button onClick={handlePayment} disabled={!paymentMethod} loading={loading}>
                 Confirmer le paiement
               </Button>
            </div>
          </motion.div>
        )}

        {/* VIEW: CONFIRMATION */}
        {view === "CONFIRMATION" && confirmation && (
          <motion.div 
            key="conf"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#faf7f2] z-[80] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 bg-[#2e7d32] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-200">
               <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2 text-[#3d2b1f]">Billet Confirmé !</h2>
            <p className="text-neutral-500 mb-10 max-w-[250px]">
              Votre réservation pour {confirmation.journey.to} est validée.
            </p>

            <div className="w-full bg-white border-2 border-neutral-100 rounded-[2.5rem] overflow-hidden shadow-inner">
               <div className="p-8 space-y-4">
                  <div className="flex justify-between text-xs font-black text-neutral-400 uppercase tracking-widest">
                     <span>Numéro de Billet</span>
                     <span>Statut</span>
                  </div>
                  <div className="flex justify-between font-mono text-lg font-bold text-[#3d2b1f]">
                     <span>{confirmation.id}</span>
                     <span className="text-[#2e7d32] text-sm">{confirmation.status}</span>
                  </div>
                  <div className="h-px bg-neutral-200 border-t border-dashed my-2" />
                  <div className="flex justify-between text-left">
                     <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase">Passager</p>
                        <p className="font-bold text-[#3d2b1f]">{confirmation.customerName}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase">Départ</p>
                        <p className="font-bold text-[#3d2b1f]">{confirmation.journey.departureTime}</p>
                     </div>
                  </div>
               </div>
               <div className="bg-[#ef6c00] p-4 flex justify-around">
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
               </div>
            </div>

            <div className="w-full mt-12 space-y-4">
               <Button onClick={() => window.print()} variant="secondary">Imprimer le billet</Button>
               <Button onClick={() => setView("HOME")}>Retour à l'accueil</Button>
            </div>
          </motion.div>
        )}

        {/* VIEW: BOT */}
        {view === "BOT" && (
          <motion.div 
            key="bot"
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed inset-0 bg-[#faf7f2] z-[100] flex flex-col pt-16"
          >
            <Header title="Assistant IA" onBack={() => setView("HOME")} />
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map((m, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-4 max-w-[85%]",
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    m.role === "bot" ? "bg-[#3d2b1f] text-white" : "bg-[#ef6c00] text-white"
                  )}>
                    {m.role === "bot" ? <Bot className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                    m.role === "bot" ? "bg-white text-neutral-800" : "bg-[#3d2b1f] text-white"
                  )}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="bg-white p-4 rounded-3xl shadow-sm text-xs italic text-neutral-400 flex items-center gap-2">
                  <div className="animate-bounce">...</div> L'assistant réfléchit
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-6 bg-white border-t border-neutral-100 pb-10">
               <div className="flex gap-3 bg-neutral-100 p-2 rounded-2xl">
                  <input 
                    type="text" 
                    placeholder="Posez votre question..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && sendAIMessage()}
                    className="flex-1 bg-transparent px-4 outline-none text-[#3d2b1f]"
                  />
                  <button 
                    onClick={sendAIMessage}
                    disabled={loading || !chatInput.trim()}
                    className="p-3 bg-[#ef6c00] text-white rounded-xl active:scale-95 disabled:opacity-50 transition-all font-bold"
                  >
                    <Send className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
