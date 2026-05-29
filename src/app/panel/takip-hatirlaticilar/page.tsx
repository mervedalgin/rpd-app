"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellRing,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Check,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CalendarClock,
  Timer,
  Filter,
  BellOff
} from "lucide-react";
import { toast } from "sonner";

// Takip hatırlatıcı tipi
interface FollowUp {
  id: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  class_key: string;
  class_display: string;
  follow_up_type: string;
  title: string;
  description: string;
  due_date: string;
  reminder_date: string;
  priority: string;
  status: string;
  completed_at: string;
  notes: string;
  related_record_type: string;
  related_record_id: string;
}

// Takip tipleri
const FOLLOW_UP_TYPES = [
  { value: 'gorusme', label: 'Görüşme Takibi', icon: '👥' },
  { value: 'disiplin', label: 'Disiplin Takibi', icon: '⚠️' },
  { value: 'risk', label: 'Risk Takibi', icon: '🚨' },
  { value: 'ram', label: 'RAM Süreç Takibi', icon: '📋' },
  { value: 'veli', label: 'Veli İletişim Takibi', icon: '📞' },
  { value: 'akademik', label: 'Akademik Takip', icon: '📚' },
  { value: 'bep', label: 'BEP Takibi', icon: '📄' },
  { value: 'diger', label: 'Diğer', icon: '📌' }
];

// Öncelik seviyeleri
const PRIORITY_LEVELS = [
  { value: 'low', label: 'Düşük', color: 'slate', icon: Info },
  { value: 'medium', label: 'Normal', color: 'blue', icon: Clock },
  { value: 'high', label: 'Yüksek', color: 'amber', icon: AlertTriangle },
  { value: 'urgent', label: 'Acil', color: 'red', icon: BellRing }
];

// Durum seçenekleri
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede', color: 'amber' },
  { value: 'completed', label: 'Tamamlandı', color: 'green' },
  { value: 'cancelled', label: 'İptal', color: 'slate' },
  { value: 'overdue', label: 'Gecikmeli', color: 'red' }
];

export default function TakipHatirlaticilarPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  
  // Form verileri
  const [formData, setFormData] = useState({
    student_name: '',
    class_display: '',
    class_key: '',
    follow_up_type: '',
    title: '',
    description: '',
    due_date: '',
    reminder_date: '',
    priority: 'medium',
    status: 'pending',
    notes: '',
    related_record_type: '',
    related_record_id: ''
  });
  
  // Verileri yükle
  useEffect(() => {
    loadFollowUps();
  }, []);
  
  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/follow-ups');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Yüklenemedi');
      const data = json.data as FollowUp[];

      // Gecikmiş olanları otomatik olarak işaretle
      const today = new Date().toISOString().split('T')[0];
      const updatedData = (data || []).map(item => {
        if (item.status === 'pending' && item.due_date < today) {
          return { ...item, status: 'overdue' };
        }
        return item;
      });
      
      setFollowUps(updatedData);
    } catch (error) {
      console.error('Takip hatırlatıcıları yüklenemedi:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kaydet
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Başlık gerekli');
      return;
    }
    if (!formData.due_date) {
      toast.error('Son tarih seçin');
      return;
    }
    
    try {
      if (editingFollowUp) {
        const res = await fetch('/api/follow-ups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFollowUp.id,
            ...formData,
            updated_at: new Date().toISOString()
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Güncellenemedi');
        toast.success('Hatırlatıcı güncellendi');
      } else {
        const res = await fetch('/api/follow-ups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Oluşturulamadı');
        toast.success('Hatırlatıcı oluşturuldu');
      }
      
      resetForm();
      loadFollowUps();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };
  
  // Tamamla
  const handleComplete = async (id: string) => {
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'İşlem başarısız');
      toast.success('Tamamlandı olarak işaretlendi');
      loadFollowUps();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('İşlem başarısız');
    }
  };
  
  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu hatırlatıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      const res = await fetch('/api/follow-ups?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Silme sırasında hata oluştu');

      toast.success('Hatırlatıcı silindi');
      loadFollowUps();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setShowForm(false);
    setEditingFollowUp(null);
    setFormData({
      student_name: '',
      class_display: '',
      class_key: '',
      follow_up_type: '',
      title: '',
      description: '',
      due_date: '',
      reminder_date: '',
      priority: 'medium',
      status: 'pending',
      notes: '',
      related_record_type: '',
      related_record_id: ''
    });
  };
  
  // Düzenleme moduna geç
  const startEditing = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setFormData({
      student_name: followUp.student_name || '',
      class_display: followUp.class_display || '',
      class_key: followUp.class_key || '',
      follow_up_type: followUp.follow_up_type || '',
      title: followUp.title,
      description: followUp.description || '',
      due_date: followUp.due_date || '',
      reminder_date: followUp.reminder_date || '',
      priority: followUp.priority || 'medium',
      status: followUp.status || 'pending',
      notes: followUp.notes || '',
      related_record_type: followUp.related_record_type || '',
      related_record_id: followUp.related_record_id || ''
    });
    setShowForm(true);
  };
  
  // Bugünün tarihi
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Filtrelenmiş liste
  const filteredFollowUps = useMemo(() => {
    return followUps.filter(fu => {
      // Görünüm modu filtreleri
      if (viewMode === 'today' && fu.due_date !== today) return false;
      if (viewMode === 'week' && (fu.due_date < today || fu.due_date > weekFromNow)) return false;
      if (viewMode === 'overdue' && fu.status !== 'overdue') return false;
      
      // Durum filtresi
      if (statusFilter && fu.status !== statusFilter) return false;
      
      // Tip filtresi
      if (typeFilter && fu.follow_up_type !== typeFilter) return false;
      
      // Arama
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = fu.title.toLowerCase().includes(query);
        const matchesStudent = fu.student_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesStudent) return false;
      }
      
      return true;
    });
  }, [followUps, viewMode, statusFilter, typeFilter, searchQuery, today, weekFromNow]);
  
  // İstatistikler
  const stats = useMemo(() => ({
    total: followUps.filter(f => f.status === 'pending' || f.status === 'overdue').length,
    today: followUps.filter(f => f.due_date === today && f.status === 'pending').length,
    week: followUps.filter(f => f.due_date >= today && f.due_date <= weekFromNow && f.status === 'pending').length,
    overdue: followUps.filter(f => f.status === 'overdue').length,
    urgent: followUps.filter(f => f.priority === 'urgent' && f.status === 'pending').length,
    completed: followUps.filter(f => f.status === 'completed').length
  }), [followUps, today, weekFromNow]);
  
  // Renk haritası
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
  };
  
  // Kalan gün hesapla
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Takip Hatırlatıcılar</h1>
            <p className="text-sm text-slate-500">Görüşme ve süreç takipleri</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Hatırlatıcı
        </Button>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${viewMode === 'all' ? 'ring-2 ring-orange-500' : 'hover:shadow-md'}`}
          onClick={() => setViewMode('all')}
        >
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-orange-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Aktif</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${viewMode === 'today' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
          onClick={() => setViewMode('today')}
        >
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
            <p className="text-xs text-slate-500">Bugün</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${viewMode === 'week' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
          onClick={() => setViewMode('week')}
        >
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.week}</p>
            <p className="text-xs text-slate-500">Bu Hafta</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${viewMode === 'overdue' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
          onClick={() => setViewMode('overdue')}
        >
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-red-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-slate-500">Gecikmeli</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-amber-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <BellRing className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.urgent}</p>
            <p className="text-xs text-slate-500">Acil</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-green-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-slate-500">Tamamlanan</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card className="border-2 border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              {editingFollowUp ? 'Hatırlatıcı Düzenle' : 'Yeni Hatırlatıcı'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlık *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Hatırlatıcı başlığı"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tip</Label>
                <select
                  value={formData.follow_up_type}
                  onChange={(e) => setFormData({ ...formData, follow_up_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seçin...</option>
                  {FOLLOW_UP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Öğrenci (Opsiyonel)</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Öğrenci adı"
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
                <Label>Öncelik</Label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {PRIORITY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Son Tarih *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Hatırlatma Tarihi</Label>
                <Input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="Detaylı açıklama..."
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>İptal</Button>
              <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                {editingFollowUp ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tüm Tipler</option>
                {FOLLOW_UP_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
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
              
              <Button variant="outline" size="sm" onClick={loadFollowUps}>
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
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-slate-600">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : filteredFollowUps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BellOff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Hatırlatıcı bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFollowUps.map(followUp => {
            const priority = PRIORITY_LEVELS.find(p => p.value === followUp.priority);
            const type = FOLLOW_UP_TYPES.find(t => t.value === followUp.follow_up_type);
            const statusInfo = STATUS_OPTIONS.find(s => s.value === followUp.status);
            const isExpanded = expandedId === followUp.id;
            const daysRemaining = getDaysRemaining(followUp.due_date);
            const PriorityIcon = priority?.icon || Clock;
            
            return (
              <Card 
                key={followUp.id}
                className={`transition-all hover:shadow-md ${
                  followUp.status === 'overdue' 
                    ? 'border-l-4 border-l-red-500 bg-red-50/30'
                    : followUp.status === 'completed'
                    ? 'border-l-4 border-l-green-500 opacity-60'
                    : `border-l-4 ${colorMap[priority?.color || 'slate'].border}`
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* İkon */}
                    <div className={`p-3 rounded-xl ${colorMap[priority?.color || 'slate'].bg}`}>
                      <PriorityIcon className={`h-6 w-6 ${colorMap[priority?.color || 'slate'].text}`} />
                    </div>
                    
                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${followUp.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {followUp.title}
                        </h3>
                        {type && (
                          <Badge variant="outline" className="text-xs">
                            {type.icon} {type.label}
                          </Badge>
                        )}
                        <Badge className={`${colorMap[statusInfo?.color || 'slate'].bg} ${colorMap[statusInfo?.color || 'slate'].text}`}>
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      
                      {followUp.student_name && (
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {followUp.student_name}
                          {followUp.class_display && <span>({followUp.class_display})</span>}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className={`flex items-center gap-1 ${daysRemaining < 0 ? 'text-red-500' : daysRemaining === 0 ? 'text-amber-500' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {new Date(followUp.due_date).toLocaleDateString('tr-TR')}
                          {daysRemaining < 0 && ` (${Math.abs(daysRemaining)} gün gecikti)`}
                          {daysRemaining === 0 && ' (Bugün)'}
                          {daysRemaining > 0 && daysRemaining <= 3 && ` (${daysRemaining} gün kaldı)`}
                        </span>
                        <Badge className={`${colorMap[priority?.color || 'slate'].bg} ${colorMap[priority?.color || 'slate'].text} text-xs`}>
                          {priority?.label}
                        </Badge>
                      </div>
                      
                      {/* Genişletilmiş */}
                      {isExpanded && followUp.description && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">{followUp.description}</p>
                          {followUp.notes && (
                            <p className="text-sm text-slate-500 mt-2 pt-2 border-t">
                              <strong>Not:</strong> {followUp.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1">
                      {followUp.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComplete(followUp.id)}
                          className="text-green-600 hover:bg-green-100"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : followUp.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEditing(followUp)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(followUp.id)} className="text-red-500">
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
