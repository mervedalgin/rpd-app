"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Settings, ExternalLink, ChevronDown } from "lucide-react";

interface ConfigStatus {
  telegram: boolean;
  sheets: boolean;
  configured: boolean;
}

export default function ConfigurationStatus() {
  const [status, setStatus] = useState<ConfigStatus>({ telegram: false, sheets: false, configured: false });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/config-check');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Configuration check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 py-3 px-4 bg-transparent">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
          <span className="text-sm text-orange-700">Yapılandırma kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  const allConfigured = status.telegram && status.sheets;

  return (
    <div className="mb-6" ref={dropdownRef}>
      {/* Dropdown Header/Button */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="config-dropdown-content"
        className="w-full flex items-center justify-between py-3 px-4 bg-transparent hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg transition-colors duration-200"
      >
        <div className={`flex items-center space-x-2 ${allConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
          {allConfigured ? <CheckCircle className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
          <span className="font-medium">Sistem Yapılandırması</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Content */}
      <div
        id="config-dropdown-content"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'max-h-96 opacity-100 translate-y-0' 
            : 'max-h-0 opacity-0 -translate-y-2'
        }`}
      >
        <div className="p-4 bg-white rounded-lg border shadow-sm mt-2">
          <div className={`mb-3 text-sm ${allConfigured ? 'text-green-600' : 'text-yellow-600'}`}>
            {allConfigured 
              ? 'Tüm entegrasyonlar aktif ve çalışır durumda' 
              : 'Bazı entegrasyonlar yapılandırılmamış'
            }
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Telegram Bot</span>
              <Badge variant={status.telegram ? "default" : "destructive"} className="flex items-center space-x-1">
                {status.telegram ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>{status.telegram ? 'Aktif' : 'Yapılandırılmamış'}</span>
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Google Sheets</span>
              <Badge variant={status.sheets ? "default" : "destructive"} className="flex items-center space-x-1">
                {status.sheets ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>{status.sheets ? 'Aktif' : 'Yapılandırılmamış'}</span>
              </Badge>
            </div>
            
            {!allConfigured && (
              <div className="pt-3 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'Gizle' : 'Kurulum Talimatları'}
                </Button>
                
                {showDetails && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-300">
                    <p className="font-medium">Kurulum için gerekli adımlar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>.env.local dosyasını oluşturun</li>
                      <li>Telegram Bot token ve chat ID&apos;sini ekleyin</li>
                      <li>Google Service Account bilgilerini ekleyin</li>
                      <li>Sayfayı yenileyin</li>
                    </ol>
                    <a 
                      href="/SETUP.md" 
                      target="_blank"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Detaylı kurulum talimatları</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}