"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPantry, updatePantry, analyzePantry, generateAIRecipe, createRecipe } from "@/lib/api";
import { PantryItem } from "@/types";
import { 
  FaPlus, FaTrash, FaChevronRight, FaWandMagicSparkles, FaBasketShopping, 
  FaCamera, FaCalendarDays, FaFire, FaUtensils, FaPen, FaXmark, FaCheck, 
  FaSpinner, FaFloppyDisk, FaCloudArrowUp, FaClockRotateLeft, FaRobot
} from "react-icons/fa6";

// --- TYPES ---
type SaveStatus = "saved" | "saving" | "error";
type ModalType = "success" | "error";
type AiActionType = "rescue" | "plan" | "suggest";

interface ModalState {
  show: boolean;
  type: ModalType;
  message: string;
}

interface AiStatus {
  loading: boolean;
  message: string;
}

export default function PantryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [items, setItems] = useState<PantryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Kayıt Durumu
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isDirty = useRef<boolean>(false);

  // Modal State
  const [modal, setModal] = useState<ModalState>({ show: false, type: "success", message: "" });
  const [showDateModal, setShowDateModal] = useState(false); 
  const [showAIModal, setShowAIModal] = useState(false); 
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempDateInput, setTempDateInput] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus>({ loading: false, message: "" });

  // --- TARİH HESAPLAMA ---
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateLocal = (dateStr: string) => {
    if (!dateStr || dateStr === "0000-00-00") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const addDays = (days: number) => {
    const result = new Date(); 
    result.setHours(0, 0, 0, 0); 
    result.setDate(result.getDate() + days);
    return formatDateLocal(result);
  };

  const calculateStatus = (expiryDateString: string | null) => {
    if (!expiryDateString || expiryDateString === "0000-00-00" || expiryDateString === "") 
        return { status: "fresh", text: "Tarih Yok" };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const expiry = parseDateLocal(expiryDateString);
    if (!expiry) return { status: "fresh", text: "Geçersiz" };

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "expired", text: `${Math.abs(diffDays)} gün geçti` };
    if (diffDays === 0) return { status: "expired", text: "Bugün son!" };
    if (diffDays <= 3) return { status: "expired", text: `${diffDays} gün kaldı` };
    if (diffDays <= 7) return { status: "warning", text: `${diffDays} gün kaldı` };
    return { status: "fresh", text: `${diffDays} gün kaldı` };
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "fresh": return "text-green-500 bg-green-500/20";
      case "warning": return "text-yellow-500 bg-yellow-500/20";
      case "expired": return "text-red-500 bg-red-500/20";
      default: return "text-gray-400 bg-gray-100";
    }
  };

  const showModalMessage = (type: ModalType, message: string) => {
    setModal({ show: true, type, message });
  };

  // --- YARDIMCI: GÖRSEL SIKIŞTIRMA ---
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image(); 
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          if(ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(file.type)); 
          } else reject(new Error("Canvas hatası"));
        };
        img.onerror = (error) => reject(error);
      };
    });
  };

  // --- 1. VERİLERİ YÜKLE ---
  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      try {
        if (user) {
            const data = await getPantry(user.token);
            if (data && Array.isArray(data)) {
                const cleanData = data.map((i: any) => ({
                    ...i,
                    expiresIn: i.expiresIn === "0000-00-00" ? "" : i.expiresIn,
                    status: calculateStatus(i.expiresIn).status as any
                }));
                setItems(cleanData);
            }
        } else {
            const saved = localStorage.getItem("tariften_pantry");
            if (saved) setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Veri yükleme hatası:", e);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }
    loadData();
  }, [user, authLoading]);

  // --- 2. VERİLERİ KAYDET ---
  useEffect(() => {
    if (authLoading || !isLoaded || !isDirty.current) return;

    setSaveStatus("saving");
    const timeoutId = setTimeout(async () => {
        if (user) {
            const payload = items.map(i => ({
                name: i.name,
                quantity: i.quantity || "", 
                unit: i.unit || "",
                status: i.status,
                expiresIn: i.expiresIn || ""
            }));
            
            // DÜZELTME: Payload { items: [...] } formatında api.ts içinde sarılıyor, buraya düz array veriyoruz.
            // api.ts dosyasındaki updatePantry fonksiyonu bu array'i { items: items } şeklinde paketleyecek.
            const success = await updatePantry(user.token, payload as any);
            if (success) setSaveStatus("saved");
            else setSaveStatus("error");
            
        } else {
            localStorage.setItem("tariften_pantry", JSON.stringify(items));
            setSaveStatus("saved");
        }
        isDirty.current = false;
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [items, user, isLoaded, authLoading]);

  const updateItems = (newItems: PantryItem[]) => {
      setItems(newItems);
      isDirty.current = true;
      setSaveStatus("saving");
  };

  // --- MANUEL EKLEME ---
  const handleManualAdd = () => {
    if (!inputValue.trim()) return;

    const rawInputs = inputValue.split(",").map(s => s.trim()).filter(s => s);
    const newItems: PantryItem[] = [];

    rawInputs.forEach(input => {
        const match = input.match(/^(.*?)\s+(\d+)\s*(gün|gun|day|hafta|week|ay|month)s?$/i);
        let name = input;
        let expiryDate = addDays(7); 

        if (match) {
            name = match[1].trim(); 
            const amount = parseInt(match[2]);
            const unit = match[3].toLowerCase();
            let daysToAdd = 0;
            if (unit.includes("gün") || unit.includes("gun")) daysToAdd = amount;
            if (unit.includes("hafta")) daysToAdd = amount * 7;
            if (unit.includes("ay")) daysToAdd = amount * 30;
            if (daysToAdd > 0) expiryDate = addDays(daysToAdd);
        }

        const newItemStatus = calculateStatus(expiryDate);
        newItems.push({
            id: Date.now().toString() + Math.random(),
            name: name.charAt(0).toUpperCase() + name.slice(1),
            quantity: "", 
            unit: "",
            status: newItemStatus.status as any,
            expiresIn: expiryDate
        });
    });

    updateItems([...newItems, ...items]); 
    setInputValue("");
  };

  // --- FİŞ OKUTMA ---
  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { showModalMessage("error", "Fiş okuma özelliği için giriş yapmalısınız."); return; }
    
    if (file.size > 10 * 1024 * 1024) { showModalMessage("error", "Dosya boyutu çok büyük (Max 10MB)."); return; }

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const resizedBase64 = await resizeImage(file);
            const analyzedItems = await analyzePantry(user.token, "", resizedBase64);
            
            const newItems: PantryItem[] = analyzedItems.map((item: any) => {
                const date = item.expiry_date || addDays(7);
                return {
                    id: Date.now().toString() + Math.random(),
                    name: item.name,
                    quantity: item.quantity || "",
                    unit: "",
                    status: calculateStatus(date).status as any,
                    expiresIn: date
                };
            });

            updateItems([...newItems, ...items]);
            showModalMessage("success", `${newItems.length} ürün fişten eklendi!`);
        } catch (e) {
            showModalMessage("error", "Fiş analiz edilemedi.");
        } finally {
            setAnalyzing(false);
        }
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((item) => item.id !== id));
  };
  
  const saveDate = () => {
    if (editingItemId && tempDateInput) {
      const updatedList = items.map((item) => {
          if (item.id === editingItemId) {
              const analysis = calculateStatus(tempDateInput);
              return { 
                  ...item, 
                  expiresIn: tempDateInput, 
                  status: analysis.status as any 
              };
          }
          return item;
      });
      updateItems(updatedList);
      setShowDateModal(false);
    }
  };
  
  const handleAiAction = async (type: AiActionType) => {
      if (!user) { showModalMessage("error", "Bu özellik için giriş yapmalısınız."); return; }
      
      let prompt = "";
      if (type === "rescue") {
          const critical = items.filter(i => calculateStatus(i.expiresIn).status === "expired" || calculateStatus(i.expiresIn).status === "warning");
          if (critical.length === 0) { showModalMessage("success", "Harika! Şu an kurtarılması gereken acil bir ürün yok."); return; }
          prompt = critical.map(i => i.name).join(", ");
      } else {
          if (items.length === 0) { showModalMessage("error", "Dolabın boş! Önce malzeme ekle."); return; }
          prompt = items.map(i => i.name).join(", ");
      }

      setAiStatus({ loading: true, message: type === "rescue" ? "Kurtarıcı tarif hazırlanıyor..." : "AI Şef düşünüyor..." });
      setShowAIModal(true);

      try {
          const aiResponse = await generateAIRecipe(user.token, prompt); 
          if (aiResponse.success && aiResponse.recipe) {
              const saveResponse = await createRecipe(user.token, aiResponse.recipe);
              if (saveResponse.success) {
                  setShowAIModal(false);
                  router.push(`/recipe/${saveResponse.slug || saveResponse.id}`);
              } else {
                  showModalMessage("error", "Tarif kaydedilemedi.");
                  setShowAIModal(false);
              }
          } else {
              showModalMessage("error", "Yapay zeka yanıt veremedi.");
              setShowAIModal(false);
          }
      } catch (e) {
          showModalMessage("error", "Bir hata oluştu.");
          setShowAIModal(false);
      }
  };

  const closeModal = () => { 
      setShowDateModal(false); setShowAIModal(false); setEditingItemId(null); setAiStatus(prev => ({...prev, loading: false}));
  };

  // Grafik verileri
  const expiredCount = items.filter(i => calculateStatus(i.expiresIn).status === "expired").length;
  const warningCount = items.filter(i => calculateStatus(i.expiresIn).status === "warning").length;
  const totalItems = items.length || 1;
  const expiredWidth = `${(expiredCount / totalItems) * 100}%`;
  const warningWidth = `${(warningCount / totalItems) * 100}%`;

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500"><FaSpinner className="animate-spin text-2xl mr-2"/> Dolap Yükleniyor...</div>;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-20 font-sans text-slate-800 relative">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
          <div>
            <nav className="flex items-center text-xs text-gray-400 mb-2 font-medium gap-2">
              <Link href="/" className="hover:text-brand">Anasayfa</Link>
              <FaChevronRight className="text-[10px]" />
              <span className="text-gray-800">Dolap Asistanı</span>
            </nav>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Mutfağını Yönet</h1>
            <p className="text-gray-500 text-sm mt-1">Evdeki malzemeleri gir, <strong className="text-brand">israfı önle</strong> ve tasarruf et.</p>
          </div>
          <div className="bg-orange-50 text-orange-800 text-xs font-bold px-4 py-2 rounded-full border border-orange-100 flex items-center gap-2 shadow-sm">
            <FaBasketShopping /> {items.length} Malzeme Stokta
          </div>
        </div>

       {/* KAYIT DURUMU GÖSTERGESİ */}
        <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-500">
            {saveStatus === "saving" && <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse"><FaSpinner className="animate-spin"/> Kaydediliyor...</div>}
            {saveStatus === "error" && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"><FaXmark/> Kayıt Hatası</div>
            )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* SOL KOLON */}
            <div className="lg:col-span-7 space-y-6">
                {/* Giriş Kartı */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 focus-within:border-brand/50 transition-all relative overflow-hidden">
                    {analyzing && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center text-brand font-bold animate-pulse"><FaWandMagicSparkles className="mr-2"/> Fiş Okunuyor...</div>}
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-bold text-slate-700">Hızlı Stok Ekle</label>
                        <label className="text-xs font-bold text-brand flex items-center gap-1 hover:bg-brand/10 px-3 py-1.5 rounded-lg transition cursor-pointer border border-brand/20"><FaCamera /> Fiş Okut<input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} /></label>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleManualAdd()} placeholder='Örn: "Süt 3 gün", "Yumurta", "Peynir"' className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white transition"/>
                        <button onClick={handleManualAdd} className="bg-slate-900 hover:bg-slate-700 text-white w-12 h-12 rounded-xl flex items-center justify-center transition shadow-lg"><FaPlus /></button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 ml-1 flex items-center gap-1"><FaUtensils className="text-[8px]"/> İpucu: "Muz 3 gün" yazarsan tarihi otomatik ayarlarım.</p>
                </div>

                {/* Liste */}
                <div className="space-y-3">
                    {items.length > 0 ? items.map((item) => {
                        const info = calculateStatus(item.expiresIn);
                        const colorClass = getStatusColor(info.status);
                        const dotColor = colorClass.split(" ")[0];

                        return (
                            <div key={item.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${dotColor}`} />
                                    <div>
                                        <div className="font-bold text-slate-800">{item.name}</div>
                                        <button onClick={() => { setEditingItemId(item.id); setTempDateInput(item.expiresIn || ""); setShowDateModal(true); }} className="text-xs text-gray-400 font-medium hover:text-brand flex items-center gap-1 transition mt-0.5">
                                            <FaCalendarDays className="text-[10px]" /> {item.expiresIn ? (info.text) : "Tarih Yok (7 gün)"} <FaPen className="text-[8px] opacity-0 group-hover:opacity-100" />
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="w-9 h-9 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"><FaTrash className="text-sm" /></button>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200"><FaBasketShopping className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500 font-medium">Dolabın boş görünüyor.</p></div>
                    )}
                </div>
            </div>

            {/* SAĞ: AKSİYONLAR */}
            <div className="lg:col-span-5 space-y-4 sticky top-24 h-fit">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FaWandMagicSparkles className="text-brand" /> Yapay Zeka Şef</h3>
                <button onClick={() => handleAiAction("rescue")} className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white p-1 rounded-2xl shadow-lg shadow-red-500/20 group hover:scale-[1.02] transition-transform text-left">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 h-full"><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:animate-bounce"><FaFire /></div><div><div className="font-bold text-lg">Bozulacakları Kurtar</div><div className="text-xs text-white/80">Kritik ürünler için tarif.</div></div></div>
                </button>
                <button onClick={() => handleAiAction("plan")} className="w-full bg-white border-2 border-brand/10 hover:border-brand/30 p-4 rounded-2xl shadow-sm flex items-center gap-4 group transition-all text-left">
                    <div className="w-12 h-12 bg-brand/5 text-brand rounded-full flex items-center justify-center text-xl group-hover:bg-brand group-hover:text-white transition-colors"><FaCalendarDays /></div>
                    <div><div className="font-bold text-slate-800">3 Günlük Planla</div><div className="text-xs text-gray-500">Mevcut malzemelerle plan.</div></div>
                    <FaChevronRight className="ml-auto text-gray-300 group-hover:text-brand" />
                </button>
                <button onClick={() => handleAiAction("suggest")} className="w-full bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-gray-300 transition-all text-left">
                    <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center text-xl"><FaUtensils /></div>
                    <div><div className="font-bold text-slate-800">Rastgele Tarif Öner</div><div className="text-xs text-gray-500">Dolaptakilerle ne yapabilirim?</div></div>
                </button>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mt-4">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Kritik (Hemen Tüket)</span>
                    <span className="font-bold text-red-500">{expiredCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                    <div style={{ width: expiredWidth }} className="bg-red-500 h-full" />
                    <div style={{ width: warningWidth }} className="bg-yellow-400 h-full" />
                  </div>
                </div>
            </div>
        </div>

        {/* --- MODALS --- */}
        {showDateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaXmark /></button>
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><FaClockRotateLeft className="text-brand"/> Tarihi Güncelle</h3>
            <input type="date" value={tempDateInput} onChange={(e) => setTempDateInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 mt-4 focus:border-brand outline-none" />
            <div className="flex gap-2"><button onClick={saveDate} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition">Kaydet</button></div>
          </div>
        </div>
      )}

      {showAIModal && aiStatus.loading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
            <div className="text-center text-white p-8">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-[#db4c3f] border border-white/10 animate-bounce-slow"><FaRobot /></div>
                <h3 className="text-2xl font-bold font-heading mb-2">Şef Dolabına Bakıyor...</h3>
                <p className="text-white/60 text-lg animate-pulse">{aiStatus.message}</p>
            </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center relative">
               <button onClick={() => setModal({ ...modal, show: false })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaXmark className="text-xl"/></button>
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${modal.type === "success" ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}>
                  {modal.type === "success" ? <FaCheck /> : <FaXmark />}
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">{modal.type === "success" ? "Başarılı!" : "Hata"}</h3>
               <p className="text-gray-500 mb-6">{modal.message}</p>
               <button onClick={() => setModal({ ...modal, show: false })} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Tamam</button>
           </div>
        </div>
      )}
    </div>
    </main>
  );
}