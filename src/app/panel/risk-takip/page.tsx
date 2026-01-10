"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
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
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
  Heart,
  Brain,
  Users,
  ExternalLink,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Risk öğrenci tipi
interface RiskStudent {
  id: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  class_key: string;
  class_display: string;
  risk_level: string;
  risk_type: string[];
  description: string;
  intervention_plan: string;
  status: string;
  last_contact_date: string;
  next_follow_up_date: string;
  notes: string;
  related_referral_id?: string;
  related_ram_id?: string;
}

// Risk seviyeleri
const RISK_LEVELS = [
  { value: 'low', label: 'Düşük', color: 'green', description: 'İzleme gerektirir' },
  { value: 'medium', label: 'Orta', color: 'amber', description: 'Düzenli takip gerektirir' },
  { value: 'high', label: 'Yüksek', color: 'orange', description: 'Yakın takip gerektirir' },
  { value: 'critical', label: 'Kritik', color: 'red', description: 'Acil müdahale gerektirir' }
];

// Risk türleri
const RISK_TYPES = [
  { value: 'intihar_riski', label: 'İntihar Riski', icon: '⚠️' },
  { value: 'ihmal_istismar', label: 'İhmal/İstismar', icon: '🛡️' },
  { value: 'siddet', label: 'Şiddet Eğilimi', icon: '⚡' },
  { value: 'madde', label: 'Madde Kullanımı', icon: '💊' },
  { value: 'kaygi_depresyon', label: 'Kaygı/Depresyon', icon: '😔' },
  { value: 'okul_reddi', label: 'Okul Reddi', icon: '🏫' },
  { value: 'aile_sorunu', label: 'Aile Sorunu', icon: '👨‍👩‍👧' },
  { value: 'akran_zorbaligi', label: 'Akran Zorbalığı', icon: '👊' },
  { value: 'diger', label: 'Diğer', icon: '📌' }
];

// Durum seçenekleri
const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif Takip', color: 'blue' },
  { value: 'monitoring', label: 'İzlemede', color: 'amber' },
  { value: 'resolved', label: 'Çözüldü', color: 'green' },
  { value: 'referred', label: 'Sevk Edildi', color: 'purple' }
];

export default function RiskTakipPage() {
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<RiskStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Yeni öğrenci formu
  const [formData, setFormData] = useState({
    student_name: '',
    class_display: '',
    class_key: '',
    risk_level: 'medium',
    risk_type: [] as string[],
    description: '',
    intervention_plan: '',
    status: 'active',
    last_contact_date: new Date().toISOString().split('T')[0],
    next_follow_up_date: '',
    notes: ''
  });
  
  // Verileri yükle
  useEffect(() => {
    loadRiskStudents();
  }, []);
  
  const loadRiskStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('risk_students')
        .select('*')
        .order('risk_level', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRiskStudents(data || []);
    } catch (error) {
      console.error('Risk listesi yüklenemedi:', error);
      toast.error('Risk listesi yüklenirken hata oluştu');
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
    
    if (formData.risk_type.length === 0) {
      toast.error('En az bir risk türü seçin');
      return;
    }
    
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('risk_students')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStudent.id);
        
        if (error) throw error;
        toast.success('Kayıt güncellendi');
      } else {
        const { error } = await supabase
          .from('risk_students')
          .insert(formData);
        
        if (error) throw error;
        toast.success('Öğrenci risk listesine eklendi');
      }
      
      resetForm();
      loadRiskStudents();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };
  
  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu öğrenciyi risk listesinden kaldırmak istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase.from('risk_students').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Öğrenci listeden kaldırıldı');
      loadRiskStudents();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({
      student_name: '',
      class_display: '',
      class_key: '',
      risk_level: 'medium',
      risk_type: [],
      description: '',
      intervention_plan: '',
      status: 'active',
      last_contact_date: new Date().toISOString().split('T')[0],
      next_follow_up_date: '',
      notes: ''
    });
  };
  
  // Düzenleme moduna geç
  const startEditing = (student: RiskStudent) => {
    setEditingStudent(student);
    setFormData({
      student_name: student.student_name,
      class_display: student.class_display,
      class_key: student.class_key,
      risk_level: student.risk_level,
      risk_type: student.risk_type || [],
      description: student.description || '',
      intervention_plan: student.intervention_plan || '',
      status: student.status,
      last_contact_date: student.last_contact_date || '',
      next_follow_up_date: student.next_follow_up_date || '',
      notes: student.notes || ''
    });
    setShowForm(true);
  };
  
  // Risk türü toggle
  const toggleRiskType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      risk_type: prev.risk_type.includes(type)
        ? prev.risk_type.filter(t => t !== type)
        : [...prev.risk_type, type]
    }));
  };
  
  // Filtrelenmiş liste
  const filteredStudents = useMemo(() => {
    return riskStudents.filter(student => {
      if (levelFilter && student.risk_level !== levelFilter) return false;
      if (statusFilter && student.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = student.student_name.toLowerCase().includes(query);
        const matchesClass = student.class_display?.toLowerCase().includes(query);
        if (!matchesName && !matchesClass) return false;
      }
      return true;
    });
  }, [riskStudents, levelFilter, statusFilter, searchQuery]);
  
  // İstatistikler
  const stats = useMemo(() => ({
    total: riskStudents.length,
    critical: riskStudents.filter(s => s.risk_level === 'critical').length,
    high: riskStudents.filter(s => s.risk_level === 'high').length,
    active: riskStudents.filter(s => s.status === 'active').length,
    needsFollowUp: riskStudents.filter(s => {
      if (!s.next_follow_up_date) return false;
      return s.next_follow_up_date <= new Date().toISOString().split('T')[0];
    }).length
  }), [riskStudents]);
  
  // Renk haritası
  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100' }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Risk Takip Listesi</h1>
            <p className="text-sm text-slate-500">Özel takip gerektiren öğrenciler</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Öğrenci Ekle
        </Button>
      </div>
      
      {/* Uyarı Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={`${stats.critical > 0 ? 'border-red-300 bg-red-50' : ''}`}>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-red-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.critical}</p>
            <p className="text-xs text-slate-500">Kritik</p>
          </CardContent>
        </Card>
        
        <Card className={`${stats.high > 0 ? 'border-orange-300 bg-orange-50' : ''}`}>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-orange-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.high}</p>
            <p className="text-xs text-slate-500">Yüksek Risk</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
            <p className="text-xs text-slate-500">Aktif Takip</p>
          </CardContent>
        </Card>
        
        <Card className={`${stats.needsFollowUp > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-amber-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.needsFollowUp}</p>
            <p className="text-xs text-slate-500">Takip Gerekli</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-slate-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Toplam</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card className="border-2 border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              {editingStudent ? 'Kayıt Düzenle' : 'Yeni Risk Kaydı'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Öğrenci Adı *</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Öğrenci adı soyadı"
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
                <Label>Risk Seviyesi *</Label>
                <select
                  value={formData.risk_level}
                  onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {RISK_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Risk Türleri */}
            <div className="space-y-2">
              <Label>Risk Türleri *</Label>
              <div className="flex flex-wrap gap-2">
                {RISK_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleRiskType(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.risk_type.includes(type.value)
                        ? 'bg-red-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-red-300'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Açıklama */}
            <div className="space-y-2">
              <Label>Durum Açıklaması</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500"
                placeholder="Öğrencinin durumunu açıklayın..."
              />
            </div>
            
            {/* Müdahale Planı */}
            <div className="space-y-2">
              <Label>Müdahale Planı</Label>
              <textarea
                value={formData.intervention_plan}
                onChange={(e) => setFormData({ ...formData, intervention_plan: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500"
                placeholder="Planlanan müdahaleler..."
              />
            </div>
            
            {/* Tarihler ve Durum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Son Görüşme</Label>
                <Input
                  type="date"
                  value={formData.last_contact_date}
                  onChange={(e) => setFormData({ ...formData, last_contact_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sonraki Takip</Label>
                <Input
                  type="date"
                  value={formData.next_follow_up_date}
                  onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Notlar */}
            <div className="space-y-2">
              <Label>Ek Notlar</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500"
                placeholder="Diğer notlar..."
              />
            </div>
            
            {/* Butonlar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                İptal
              </Button>
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
                {editingStudent ? 'Güncelle' : 'Kaydet'}
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
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tüm Seviyeler</option>
                {RISK_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
              
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
              
              <Button variant="outline" size="sm" onClick={loadRiskStudents}>
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
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            <span className="ml-3 text-slate-600">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Risk listesinde öğrenci bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map(student => {
            const riskLevel = RISK_LEVELS.find(l => l.value === student.risk_level);
            const status = STATUS_OPTIONS.find(s => s.value === student.status);
            const isExpanded = expandedId === student.id;
            const needsFollowUp = student.next_follow_up_date && student.next_follow_up_date <= new Date().toISOString().split('T')[0];
            
            return (
              <Card 
                key={student.id}
                className={`transition-all ${colorMap[riskLevel?.color || 'amber'].bg} ${colorMap[riskLevel?.color || 'amber'].border} border-2`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Risk Seviyesi Göstergesi */}
                    <div className={`p-3 rounded-xl ${colorMap[riskLevel?.color || 'amber'].badge}`}>
                      {student.risk_level === 'critical' ? (
                        <AlertCircle className={`h-6 w-6 ${colorMap[riskLevel?.color || 'amber'].text}`} />
                      ) : (
                        <AlertTriangle className={`h-6 w-6 ${colorMap[riskLevel?.color || 'amber'].text}`} />
                      )}
                    </div>
                    
                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{student.student_name}</h3>
                        {student.class_display && (
                          <Badge variant="outline">{student.class_display}</Badge>
                        )}
                        <Badge className={`${colorMap[riskLevel?.color || 'amber'].badge} ${colorMap[riskLevel?.color || 'amber'].text}`}>
                          {riskLevel?.label}
                        </Badge>
                        {status && (
                          <Badge variant="outline" className={`${colorMap[status.color].text}`}>
                            {status.label}
                          </Badge>
                        )}
                        {needsFollowUp && (
                          <Badge variant="destructive" className="animate-pulse">
                            Takip Gerekli!
                          </Badge>
                        )}
                      </div>
                      
                      {/* Risk Türleri */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.risk_type?.map(type => {
                          const riskType = RISK_TYPES.find(t => t.value === type);
                          return (
                            <span key={type} className="text-xs px-2 py-0.5 bg-white/50 rounded-full">
                              {riskType?.icon} {riskType?.label}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Genişletilmiş İçerik */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 p-4 bg-white/50 rounded-xl">
                          {student.description && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Durum Açıklaması</p>
                              <p className="text-sm text-slate-700">{student.description}</p>
                            </div>
                          )}
                          {student.intervention_plan && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Müdahale Planı</p>
                              <p className="text-sm text-slate-700">{student.intervention_plan}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            {student.last_contact_date && (
                              <div>
                                <p className="text-xs text-slate-500">Son Görüşme</p>
                                <p className="text-sm font-medium">{new Date(student.last_contact_date).toLocaleDateString('tr-TR')}</p>
                              </div>
                            )}
                            {student.next_follow_up_date && (
                              <div>
                                <p className="text-xs text-slate-500">Sonraki Takip</p>
                                <p className={`text-sm font-medium ${needsFollowUp ? 'text-red-600' : ''}`}>
                                  {new Date(student.next_follow_up_date).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            )}
                          </div>
                          {student.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-slate-500">{student.notes}</p>
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
                        onClick={() => setExpandedId(isExpanded ? null : student.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Link href={`/panel/vaka-dosyalari?student=${encodeURIComponent(student.student_name)}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => startEditing(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)} className="text-red-500">
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
