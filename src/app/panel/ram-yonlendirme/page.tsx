"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  Plus,
  Search,
  User,
  Calendar,
  Clock,
  Phone,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  Download,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Building2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// RAM yönlendirme tipi
interface RamReferral {
  id: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  class_key: string;
  class_display: string;
  birth_date: string;
  parent_name: string;
  parent_phone: string;
  referral_date: string;
  referral_reason: string;
  detailed_description: string;
  supporting_documents: string[];
  status: string;
  sent_date: string;
  evaluation_date: string;
  result_date: string;
  result_summary: string;
  recommendation: string;
  diagnosis: string;
  iep_required: boolean;
  next_evaluation_date: string;
  notes: string;
}

// Yönlendirme nedenleri
const REFERRAL_REASONS = [
  { value: 'ozel_egitim', label: 'Özel Eğitim Değerlendirmesi', description: 'Öğrenme güçlüğü, zihinsel engel vb.' },
  { value: 'ustun_zeka', label: 'Üstün Zeka / Özel Yetenek', description: 'BİLSEM değerlendirmesi' },
  { value: 'dikkat_eksikligi', label: 'Dikkat Eksikliği / Hiperaktivite', description: 'DEHB değerlendirmesi' },
  { value: 'otizm', label: 'Otizm Spektrum Bozukluğu', description: 'OSB değerlendirmesi' },
  { value: 'dil_konusma', label: 'Dil ve Konuşma Bozukluğu', description: 'Artikülasyon, kekemelik vb.' },
  { value: 'duygusal_davranis', label: 'Duygusal / Davranışsal Sorunlar', description: 'Psikolojik değerlendirme' },
  { value: 'fiziksel_engel', label: 'Fiziksel Engel', description: 'Ortopedik, görme, işitme engeli' },
  { value: 'kronik_hastalik', label: 'Kronik Hastalık', description: 'Evde/hastanede eğitim gereksinimi' },
  { value: 'diger', label: 'Diğer', description: 'Belirtilen nedenler dışında' }
];

// Durum seçenekleri
const STATUS_OPTIONS = [
  { value: 'hazirlaniyor', label: 'Hazırlanıyor', color: 'slate', icon: ClipboardList },
  { value: 'gonderildi', label: 'RAM\'a Gönderildi', color: 'blue', icon: Send },
  { value: 'degerlendirmede', label: 'Değerlendirmede', color: 'amber', icon: Clock },
  { value: 'sonuclandi', label: 'Sonuçlandı', color: 'green', icon: CheckCircle2 },
  { value: 'iptal', label: 'İptal Edildi', color: 'red', icon: XCircle }
];

export default function RamYonlendirmePage() {
  const [referrals, setReferrals] = useState<RamReferral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReferral, setEditingReferral] = useState<RamReferral | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form verileri
  const [formData, setFormData] = useState({
    student_name: '',
    class_display: '',
    class_key: '',
    birth_date: '',
    parent_name: '',
    parent_phone: '',
    referral_date: new Date().toISOString().split('T')[0],
    referral_reason: '',
    detailed_description: '',
    supporting_documents: [] as string[],
    status: 'hazirlaniyor',
    sent_date: '',
    evaluation_date: '',
    result_date: '',
    result_summary: '',
    recommendation: '',
    diagnosis: '',
    iep_required: false,
    next_evaluation_date: '',
    notes: ''
  });
  
  // Verileri yükle
  useEffect(() => {
    loadReferrals();
  }, []);
  
  const loadReferrals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ram_referrals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('RAM yönlendirmeleri yüklenemedi:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kaydet
  const handleSave = async () => {
    if (!formData.student_name.trim()) {
      toast.error('Öğrenci adı gerekli');
      return;
    }
    if (!formData.referral_reason) {
      toast.error('Yönlendirme nedeni seçin');
      return;
    }
    
    try {
      if (editingReferral) {
        const { error } = await supabase
          .from('ram_referrals')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReferral.id);
        
        if (error) throw error;
        toast.success('Kayıt güncellendi');
      } else {
        const { error } = await supabase
          .from('ram_referrals')
          .insert(formData);
        
        if (error) throw error;
        toast.success('RAM yönlendirmesi oluşturuldu');
      }
      
      resetForm();
      loadReferrals();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };
  
  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu RAM yönlendirmesini silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase.from('ram_referrals').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Yönlendirme silindi');
      loadReferrals();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setShowForm(false);
    setEditingReferral(null);
    setFormData({
      student_name: '',
      class_display: '',
      class_key: '',
      birth_date: '',
      parent_name: '',
      parent_phone: '',
      referral_date: new Date().toISOString().split('T')[0],
      referral_reason: '',
      detailed_description: '',
      supporting_documents: [],
      status: 'hazirlaniyor',
      sent_date: '',
      evaluation_date: '',
      result_date: '',
      result_summary: '',
      recommendation: '',
      diagnosis: '',
      iep_required: false,
      next_evaluation_date: '',
      notes: ''
    });
  };
  
  // Düzenleme moduna geç
  const startEditing = (referral: RamReferral) => {
    setEditingReferral(referral);
    setFormData({
      student_name: referral.student_name,
      class_display: referral.class_display || '',
      class_key: referral.class_key || '',
      birth_date: referral.birth_date || '',
      parent_name: referral.parent_name || '',
      parent_phone: referral.parent_phone || '',
      referral_date: referral.referral_date || '',
      referral_reason: referral.referral_reason || '',
      detailed_description: referral.detailed_description || '',
      supporting_documents: referral.supporting_documents || [],
      status: referral.status || 'hazirlaniyor',
      sent_date: referral.sent_date || '',
      evaluation_date: referral.evaluation_date || '',
      result_date: referral.result_date || '',
      result_summary: referral.result_summary || '',
      recommendation: referral.recommendation || '',
      diagnosis: referral.diagnosis || '',
      iep_required: referral.iep_required || false,
      next_evaluation_date: referral.next_evaluation_date || '',
      notes: referral.notes || ''
    });
    setShowForm(true);
  };
  
  // Filtrelenmiş liste
  const filteredReferrals = useMemo(() => {
    return referrals.filter(ref => {
      if (statusFilter && ref.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = ref.student_name.toLowerCase().includes(query);
        const matchesClass = ref.class_display?.toLowerCase().includes(query);
        if (!matchesName && !matchesClass) return false;
      }
      return true;
    });
  }, [referrals, statusFilter, searchQuery]);
  
  // İstatistikler
  const stats = useMemo(() => ({
    total: referrals.length,
    preparing: referrals.filter(r => r.status === 'hazirlaniyor').length,
    sent: referrals.filter(r => r.status === 'gonderildi').length,
    evaluating: referrals.filter(r => r.status === 'degerlendirmede').length,
    completed: referrals.filter(r => r.status === 'sonuclandi').length,
    iepRequired: referrals.filter(r => r.iep_required).length
  }), [referrals]);
  
  // Renk haritası
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
            <ExternalLink className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">RAM Yönlendirme</h1>
            <p className="text-sm text-slate-500">Rehberlik Araştırma Merkezi başvuruları</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Yönlendirme
        </Button>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Toplam</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-slate-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.preparing}</p>
            <p className="text-xs text-slate-500">Hazırlanan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.sent}</p>
            <p className="text-xs text-slate-500">Gönderilen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-amber-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.evaluating}</p>
            <p className="text-xs text-slate-500">Değerlendirmede</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-green-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
            <p className="text-xs text-slate-500">Sonuçlanan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-orange-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.iepRequired}</p>
            <p className="text-xs text-slate-500">BEP Gerekli</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-purple-600" />
              {editingReferral ? 'Yönlendirme Düzenle' : 'Yeni RAM Yönlendirmesi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Öğrenci Bilgileri */}
            <div>
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Öğrenci Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Öğrenci Adı Soyadı *</Label>
                  <Input
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sınıf</Label>
                  <Input
                    value={formData.class_display}
                    onChange={(e) => setFormData({ ...formData, class_display: e.target.value, class_key: e.target.value })}
                    placeholder="Örn: 4-A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doğum Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Veli Adı</Label>
                  <Input
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    placeholder="Veli adı soyadı"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Veli Telefon</Label>
                  <Input
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="0XXX XXX XX XX"
                  />
                </div>
              </div>
            </div>
            
            {/* Yönlendirme Bilgileri */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Yönlendirme Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yönlendirme Nedeni *</Label>
                  <select
                    value={formData.referral_reason}
                    onChange={(e) => setFormData({ ...formData, referral_reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seçin...</option>
                    {REFERRAL_REASONS.map(reason => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Yönlendirme Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.referral_date}
                    onChange={(e) => setFormData({ ...formData, referral_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label>Detaylı Açıklama</Label>
                <textarea
                  value={formData.detailed_description}
                  onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  placeholder="Öğrencinin durumu, gözlemler, değerlendirmeler..."
                />
              </div>
            </div>
            
            {/* Süreç Takibi */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Süreç Takibi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Gönderim Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.sent_date}
                    onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Değerlendirme Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.evaluation_date}
                    onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sonuç Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.result_date}
                    onChange={(e) => setFormData({ ...formData, result_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            {/* Sonuçlar (Sonuçlandıysa) */}
            {(formData.status === 'sonuclandi' || editingReferral?.status === 'sonuclandi') && (
              <div className="pt-4 border-t">
                <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Sonuçlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanı</Label>
                    <Input
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      placeholder="RAM tarafından konulan tanı"
                    />
                  </div>
                  <div className="space-y-2 flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.iep_required}
                        onChange={(e) => setFormData({ ...formData, iep_required: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium">BEP Gerekli</span>
                    </label>
                    <div className="space-y-2 flex-1">
                      <Label>Sonraki Değerlendirme</Label>
                      <Input
                        type="date"
                        value={formData.next_evaluation_date}
                        onChange={(e) => setFormData({ ...formData, next_evaluation_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>Sonuç Özeti</Label>
                  <textarea
                    value={formData.result_summary}
                    onChange={(e) => setFormData({ ...formData, result_summary: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="RAM değerlendirme sonucu..."
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>Öneriler</Label>
                  <textarea
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="RAM tarafından yapılan öneriler..."
                  />
                </div>
              </div>
            )}
            
            {/* Notlar */}
            <div className="space-y-2">
              <Label>Ek Notlar</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                placeholder="Diğer notlar..."
              />
            </div>
            
            {/* Butonlar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                İptal
              </Button>
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                {editingReferral ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filtre */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Öğrenci ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tüm Durumlar</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              
              <Button variant="outline" size="sm" onClick={loadReferrals}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-slate-600">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : filteredReferrals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ExternalLink className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">RAM yönlendirmesi bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map(referral => {
            const status = STATUS_OPTIONS.find(s => s.value === referral.status);
            const reason = REFERRAL_REASONS.find(r => r.value === referral.referral_reason);
            const isExpanded = expandedId === referral.id;
            const StatusIcon = status?.icon || ClipboardList;
            
            return (
              <Card 
                key={referral.id}
                className={`transition-all hover:shadow-md ${colorMap[status?.color || 'slate'].border} border-l-4`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Durum İkonu */}
                    <div className={`p-3 rounded-xl ${colorMap[status?.color || 'slate'].bg}`}>
                      <StatusIcon className={`h-6 w-6 ${colorMap[status?.color || 'slate'].text}`} />
                    </div>
                    
                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{referral.student_name}</h3>
                        {referral.class_display && (
                          <Badge variant="outline">{referral.class_display}</Badge>
                        )}
                        <Badge className={`${colorMap[status?.color || 'slate'].bg} ${colorMap[status?.color || 'slate'].text}`}>
                          {status?.label}
                        </Badge>
                        {referral.iep_required && (
                          <Badge className="bg-orange-100 text-orange-700">BEP</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-1">
                        {reason?.label || referral.referral_reason}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(referral.referral_date).toLocaleDateString('tr-TR')}
                        </span>
                        {referral.diagnosis && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {referral.diagnosis}
                          </span>
                        )}
                      </div>
                      
                      {/* Genişletilmiş İçerik */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-xl">
                          {referral.detailed_description && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Açıklama</p>
                              <p className="text-sm text-slate-700">{referral.detailed_description}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {referral.sent_date && (
                              <div>
                                <p className="text-xs text-slate-500">Gönderim</p>
                                <p className="text-sm font-medium">{new Date(referral.sent_date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            )}
                            {referral.evaluation_date && (
                              <div>
                                <p className="text-xs text-slate-500">Değerlendirme</p>
                                <p className="text-sm font-medium">{new Date(referral.evaluation_date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            )}
                            {referral.result_date && (
                              <div>
                                <p className="text-xs text-slate-500">Sonuç</p>
                                <p className="text-sm font-medium">{new Date(referral.result_date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            )}
                            {referral.next_evaluation_date && (
                              <div>
                                <p className="text-xs text-slate-500">Sonraki Değerlendirme</p>
                                <p className="text-sm font-medium">{new Date(referral.next_evaluation_date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            )}
                          </div>
                          
                          {referral.result_summary && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Sonuç Özeti</p>
                              <p className="text-sm text-slate-700">{referral.result_summary}</p>
                            </div>
                          )}
                          
                          {referral.recommendation && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Öneriler</p>
                              <p className="text-sm text-slate-700">{referral.recommendation}</p>
                            </div>
                          )}
                          
                          {referral.parent_name && (
                            <div className="pt-2 border-t flex items-center gap-4 text-sm text-slate-600">
                              <span><strong>Veli:</strong> {referral.parent_name}</span>
                              {referral.parent_phone && <span><strong>Tel:</strong> {referral.parent_phone}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : referral.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEditing(referral)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(referral.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
