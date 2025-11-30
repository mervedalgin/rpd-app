"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  AlertTriangle, 
  CalendarDays, 
  Users, 
  UserCheck,
  LayoutDashboard,
  Send,
  GraduationCap,
  Settings,
  FileText,
  Menu,
  X,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  LogOut
} from "lucide-react";
import { toast } from "sonner";

const MASTER_PASSWORD = "sagopa";
const MAX_ATTEMPTS = 3;
const SESSION_KEY = "panel_authenticated";
const LOCKOUT_KEY = "panel_lockout";

const menuItems = [
  { 
    href: "/panel", 
    label: "Özet", 
    icon: LayoutDashboard,
    exact: true 
  },
  { 
    href: "/panel/nedenler", 
    label: "Yönlendirme Nedenleri", 
    icon: AlertTriangle 
  },
  { 
    href: "/panel/zaman", 
    label: "Günlük / Haftalık", 
    icon: CalendarDays 
  },
  { 
    href: "/panel/ogretmen", 
    label: "Öğretmen & Sınıf", 
    icon: UserCheck 
  },
  {
    href: "/panel/ogrenci-listesi",
    label: "Öğrenciler",
    icon: GraduationCap
  },
  {
    href: "/panel/belge",
    label: "Belge Oluştur",
    icon: FileText
  },
  { 
    href: "/panel/ogrenciler", 
    label: "Öğrenci Yönetimi", 
    icon: Settings 
  },
  { 
    href: "/panel/telegram", 
    label: "Telegram", 
    icon: Send 
  },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Şifre koruması state'leri
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Session kontrolü
  useEffect(() => {
    const checkAuth = () => {
      // Lockout kontrolü
      const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
      if (lockoutTime) {
        const lockoutDate = new Date(lockoutTime);
        const now = new Date();
        // 5 dakika lockout süresi
        if (now.getTime() - lockoutDate.getTime() < 5 * 60 * 1000) {
          router.push("/");
          return;
        } else {
          localStorage.removeItem(LOCKOUT_KEY);
        }
      }

      const authenticated = sessionStorage.getItem(SESSION_KEY);
      if (authenticated === "true") {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Şifre kontrolü
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === MASTER_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      toast.success("Giriş başarılı! Panele yönlendiriliyorsunuz...");
      setPassword("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword("");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_KEY, new Date().toISOString());
        toast.error("3 yanlış deneme! Ana sayfaya yönlendiriliyorsunuz...");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        toast.error(`Yanlış şifre! Kalan deneme hakkı: ${MAX_ATTEMPTS - newAttempts}`);
      }
    }
  };

  // Çıkış yapma
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    toast.success("Çıkış yapıldı!");
    router.push("/");
  };

  // Sayfa değiştiğinde sidebar'ı kapat
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ESC tuşuyla kapat
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Mevcut sayfa adını bul
  const currentPage = menuItems.find(item => isActive(item.href, item.exact))?.label || "Panel";

  // Loading durumu
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Şifre ekranı
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4">
        <div className={`w-full max-w-md transition-transform ${isShaking ? "animate-shake" : ""}`}>
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Üst Kısım */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-full mb-4">
                <ShieldAlert className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Panel Girişi</h1>
              <p className="text-blue-100 text-sm mt-2">Devam etmek için şifrenizi girin</p>
            </div>
            
            {/* Form Kısmı */}
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Deneme Hakkı Göstergesi */}
              {attempts > 0 && (
                <div className="flex items-center justify-center gap-2">
                  {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < attempts 
                          ? "bg-red-500" 
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">
                    {MAX_ATTEMPTS - attempts} deneme hakkı kaldı
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={!password}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Giriş Yap
              </button>

              <div className="text-center">
                <Link 
                  href="/" 
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  ← Ana Sayfaya Dön
                </Link>
              </div>
            </form>
          </div>

          {/* Alt Bilgi */}
          <p className="text-center text-xs text-slate-400 mt-4">
            RPD Öğrenci Takip Sistemi • Güvenli Giriş
          </p>
        </div>

        {/* Shake animasyonu için style */}
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* Mobil Üst Bar */}
      <div className="lg:hidden fixed top-12 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium">{currentPage}</span>
        </button>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span>Panel</span>
        </div>
      </div>

      {/* Mobil Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sol Menü - Desktop ve Mobil */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 lg:w-64 
        bg-white/95 lg:bg-white/80 backdrop-blur 
        border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
        pt-4 lg:pt-4
      `}>
        {/* Mobil Kapat Butonu */}
        <div className="lg:hidden flex items-center justify-between px-4 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Panel Menü
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Başlık */}
        <div className="hidden lg:block px-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            İstatistikler
          </h2>
          <p className="text-xs text-slate-500 mt-1">Öğrenci Yönetimi</p>
        </div>

        {/* Menü Öğeleri */}
        <nav className="flex-1 px-3 py-4 lg:py-0 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 lg:h-4 lg:w-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-blue-400 lg:hidden" />}
              </Link>
            );
          })}
        </nav>

        {/* Çıkış Butonu - Desktop */}
        <div className="hidden lg:block px-3 py-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>

        {/* Alt Bilgi - Mobil */}
        <div className="lg:hidden px-4 py-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
          <p className="text-xs text-slate-500 text-center">
            RPD Öğrenci Takip Sistemi
          </p>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 p-4 lg:p-6 overflow-auto mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
