"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  MessageSquare,
  PhoneCall,
  Mail,
  Video,
  Users,
  ChevronDown,
  ChevronUp,
  Home,
  School,
  AlertCircle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Veli iletişim tipi
interface ParentContact {
  id: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  class_key: string;
  class_display: string;
  parent_name: string;
  parent_relation: string;
  parent_phone: string;
  parent_email: string;
  contact_date: string;
  contact_type: string;
  contact_direction: string;
  subject: string;
  summary: string;
  outcome: string;
  follow_up_required: boolean;
  follow_up_date: string;
  follow_up_notes: string;
  attachments: string[];
}

// İletişim tipleri
const CONTACT_TYPES = [
  { value: 'telefon', label: 'Telefon Görüşmesi', icon: PhoneCall, color: 'blue' },
  { value: 'yuz_yuze', label: 'Yüz Yüze Görüşme', icon: Users, color: 'green' },
  { value: 'toplanti', label: 'Veli Toplantısı', icon: Users, color: 'purple' },
  { value: 'ev_ziyareti', label: 'Ev Ziyareti', icon: Home, color: 'amber' },
  { value: 'okul_daveti', label: 'Okula Davet', icon: School, color: 'cyan' },
  { value: 'mesaj', label: 'SMS/WhatsApp', icon: MessageSquare, color: 'pink' },
  { value: 'email', label: 'E-posta', icon: Mail, color: 'indigo' },
  { value: 'video', label: 'Video Görüşme', icon: Video, color: 'red' }
];

// İletişim yönü
const CONTACT_DIRECTIONS = [
  { value: 'outgoing', label: 'Giden (Biz aradık)', icon: '📤' },
  { value: 'incoming', label: 'Gelen (Bizi aradı)', icon: '📥' }
];

// Veli yakınlığı
const PARENT_RELATIONS = [
  { value: 'anne', label: 'Anne' },
  { value: 'baba', label: 'Baba' },
  { value: 'veli', label: 'Veli (Diğer)' },
  { value: 'dede', label: 'Dede' },
  { value: 'nine', label: 'Babaanne/Anneanne' },
  { value: 'diger', label: 'Diğer Aile Üyesi' }
];

export default function VeliIletisimPage() {
  const [contacts, setContacts] = useState<ParentContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ParentContact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form verileri
  const [formData, setFormData] = useState({
    student_name: '',
    class_display: '',
    class_key: '',
    parent_name: '',
    parent_relation: 'anne',
    parent_phone: '',
    parent_email: '',
    contact_date: new Date().toISOString().split('T')[0],
    contact_type: 'telefon',
    contact_direction: 'outgoing',
    subject: '',
    summary: '',
    outcome: '',
    follow_up_required: false,
    follow_up_date: '',
    follow_up_notes: '',
    attachments: [] as string[]
  });
  
  // Verileri yükle
  useEffect(() => {
    loadContacts();
  }, []);
  
  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parent_contacts')
        .select('*')
        .order('contact_date', { ascending: false });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Veli iletişimleri yüklenemedi:', error);
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
    if (!formData.subject.trim()) {
      toast.error('Konu gerekli');
      return;
    }
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('parent_contacts')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContact.id);
        
        if (error) throw error;
        toast.success('İletişim kaydı güncellendi');
      } else {
        const { error } = await supabase
          .from('parent_contacts')
          .insert(formData);
        
        if (error) throw error;
        toast.success('İletişim kaydedildi');
      }
      
      resetForm();
      loadContacts();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };
  
  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu iletişim kaydını silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase.from('parent_contacts').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('İletişim kaydı silindi');
      loadContacts();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında hata oluştu');
    }
  };
  
  // Formu sıfırla
  const resetForm = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({
      student_name: '',
      class_display: '',
      class_key: '',
      parent_name: '',
      parent_relation: 'anne',
      parent_phone: '',
      parent_email: '',
      contact_date: new Date().toISOString().split('T')[0],
      contact_type: 'telefon',
      contact_direction: 'outgoing',
      subject: '',
      summary: '',
      outcome: '',
      follow_up_required: false,
      follow_up_date: '',
      follow_up_notes: '',
      attachments: []
    });
  };
  
  // Düzenleme moduna geç
  const startEditing = (contact: ParentContact) => {
    setEditingContact(contact);
    setFormData({
      student_name: contact.student_name || '',
      class_display: contact.class_display || '',
      class_key: contact.class_key || '',
      parent_name: contact.parent_name || '',
      parent_relation: contact.parent_relation || 'anne',
      parent_phone: contact.parent_phone || '',
      parent_email: contact.parent_email || '',
      contact_date: contact.contact_date || '',
      contact_type: contact.contact_type || 'telefon',
      contact_direction: contact.contact_direction || 'outgoing',
      subject: contact.subject || '',
      summary: contact.summary || '',
      outcome: contact.outcome || '',
      follow_up_required: contact.follow_up_required || false,
      follow_up_date: contact.follow_up_date || '',
      follow_up_notes: contact.follow_up_notes || '',
      attachments: contact.attachments || []
    });
    setShowForm(true);
  };
  
  // Filtrelenmiş liste
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      if (typeFilter && contact.contact_type !== typeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesStudent = contact.student_name?.toLowerCase().includes(query);
        const matchesParent = contact.parent_name?.toLowerCase().includes(query);
        const matchesSubject = contact.subject?.toLowerCase().includes(query);
        if (!matchesStudent && !matchesParent && !matchesSubject) return false;
      }
      return true;
    });
  }, [contacts, typeFilter, searchQuery]);
  
  // İstatistikler
  const stats = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthStr = thisMonth.toISOString().split('T')[0];
    
    return {
      total: contacts.length,
      thisMonth: contacts.filter(c => c.contact_date >= thisMonthStr).length,
      outgoing: contacts.filter(c => c.contact_direction === 'outgoing').length,
      incoming: contacts.filter(c => c.contact_direction === 'incoming').length,
      followUpRequired: contacts.filter(c => c.follow_up_required && !c.follow_up_notes).length,
      byType: CONTACT_TYPES.reduce((acc, type) => {
        acc[type.value] = contacts.filter(c => c.contact_type === type.value).length;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [contacts]);
  
  // Renk haritası
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Veli İletişim Günlüğü</h1>
            <p className="text-sm text-slate-500">Veli görüşme ve iletişim kayıtları</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni İletişim
        </Button>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-pink-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Phone className="h-6 w-6 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Toplam</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
            <p className="text-xs text-slate-500">Bu Ay</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-green-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.outgoing}</p>
            <p className="text-xs text-slate-500">Giden</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.incoming}</p>
            <p className="text-xs text-slate-500">Gelen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-amber-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.followUpRequired}</p>
            <p className="text-xs text-slate-500">Takip Bekleyen</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card className="border-2 border-pink-200 bg-pink-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-pink-600" />
              {editingContact ? 'İletişim Düzenle' : 'Yeni Veli İletişimi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Öğrenci & Veli Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Öğrenci Adı *</Label>
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
                <Label>Veli Yakınlığı</Label>
                <select
                  value={formData.parent_relation}
                  onChange={(e) => setFormData({ ...formData, parent_relation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  {PARENT_RELATIONS.map(rel => (
                    <option key={rel.value} value={rel.value}>{rel.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Veli Adı</Label>
                <Input
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="Veli adı soyadı"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="0XXX XXX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            {/* İletişim Detayları */}
            <div className="pt-4 border-t">
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> İletişim Detayları
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={formData.contact_date}
                    onChange={(e) => setFormData({ ...formData, contact_date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>İletişim Türü</Label>
                  <select
                    value={formData.contact_type}
                    onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    {CONTACT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Yön</Label>
                  <select
                    value={formData.contact_direction}
                    onChange={(e) => setFormData({ ...formData, contact_direction: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    {CONTACT_DIRECTIONS.map(dir => (
                      <option key={dir.value} value={dir.value}>{dir.icon} {dir.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Konu *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Görüşme konusu"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Görüşme Özeti</Label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500"
                placeholder="Görüşme içeriği ve detaylar..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sonuç/Karar</Label>
              <textarea
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500"
                placeholder="Görüşme sonucu, alınan kararlar..."
              />
            </div>
            
            {/* Takip */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.follow_up_required}
                    onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-medium">Takip Gerekli</span>
                </label>
              </div>
              
              {formData.follow_up_required && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Takip Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Takip Notu</Label>
                    <Input
                      value={formData.follow_up_notes}
                      onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
                      placeholder="Takip için notlar..."
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Butonlar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>İptal</Button>
              <Button onClick={handleSave} className="bg-pink-600 hover:bg-pink-700">
                {editingContact ? 'Güncelle' : 'Kaydet'}
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
                placeholder="Öğrenci, veli veya konu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tüm İletişim Türleri</option>
                {CONTACT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <Button variant="outline" size="sm" onClick={loadContacts}>
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
            <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
            <span className="ml-3 text-slate-600">Yükleniyor...</span>
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Veli iletişim kaydı bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map(contact => {
            const type = CONTACT_TYPES.find(t => t.value === contact.contact_type);
            const isExpanded = expandedId === contact.id;
            const TypeIcon = type?.icon || Phone;
            const relation = PARENT_RELATIONS.find(r => r.value === contact.parent_relation);
            
            return (
              <Card 
                key={contact.id}
                className={`transition-all hover:shadow-md border-l-4 ${colorMap[type?.color || 'slate'].border}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* İkon */}
                    <div className={`p-3 rounded-xl ${colorMap[type?.color || 'slate'].bg}`}>
                      <TypeIcon className={`h-6 w-6 ${colorMap[type?.color || 'slate'].text}`} />
                    </div>
                    
                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{contact.subject}</h3>
                        <Badge variant="outline">{contact.student_name}</Badge>
                        {contact.class_display && (
                          <Badge variant="outline" className="text-xs">{contact.class_display}</Badge>
                        )}
                        <Badge className={`${colorMap[type?.color || 'slate'].bg} ${colorMap[type?.color || 'slate'].text}`}>
                          {type?.label}
                        </Badge>
                        {contact.contact_direction === 'incoming' && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">📥 Gelen</Badge>
                        )}
                        {contact.follow_up_required && !contact.follow_up_notes && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">Takip Bekliyor</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {contact.parent_name || relation?.label || 'Veli'}
                        {contact.parent_phone && (
                          <span className="text-slate-400">• {contact.parent_phone}</span>
                        )}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contact.contact_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      
                      {/* Genişletilmiş İçerik */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-xl">
                          {contact.summary && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Görüşme Özeti</p>
                              <p className="text-sm text-slate-700">{contact.summary}</p>
                            </div>
                          )}
                          
                          {contact.outcome && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Sonuç/Karar</p>
                              <p className="text-sm text-slate-700">{contact.outcome}</p>
                            </div>
                          )}
                          
                          {contact.follow_up_required && (
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Takip Bilgisi
                              </p>
                              {contact.follow_up_date && (
                                <p className="text-sm text-slate-700">
                                  Tarih: {new Date(contact.follow_up_date).toLocaleDateString('tr-TR')}
                                </p>
                              )}
                              {contact.follow_up_notes && (
                                <p className="text-sm text-slate-700">Not: {contact.follow_up_notes}</p>
                              )}
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
                        onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEditing(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)} className="text-red-500">
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
