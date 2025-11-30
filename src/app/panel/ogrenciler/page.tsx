"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Users, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePanelData, useClassStudents } from "../hooks";

export default function OgrencilerPage() {
  const { classes, loadingFilters } = usePanelData();
  const { classStudents, setClassStudents, loadingStudents, studentError, setStudentError, loadClassStudents } = useClassStudents();
  
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");
  const [newStudentNumber, setNewStudentNumber] = useState("");

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentClass || !newStudentNumber.trim()) return;

    try {
      const classText = classes.find((c) => c.value === newStudentClass)?.text || newStudentClass;
      const res = await fetch("/api/class-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_key: newStudentClass,
          class_display: classText,
          student_name: newStudentName.trim(),
          student_number: newStudentNumber.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error("Öğrenci ekleme isteği başarısız");
      }

      const json = await res.json();
      if (json.student) {
        if (json.student.class_key === selectedClass) {
          setClassStudents((prev) => [...prev, json.student]);
        }
        toast.success(`${newStudentName} başarıyla eklendi`);
        setNewStudentName("");
        setNewStudentClass("");
        setNewStudentNumber("");
      }
    } catch (error) {
      console.error("Panel add student error:", error);
      setStudentError("Öğrenci eklenemedi");
      toast.error("Öğrenci eklenirken hata oluştu");
    }
  };

  const handleClearForm = () => {
    setNewStudentName("");
    setNewStudentClass("");
    setNewStudentNumber("");
    toast.info("Form temizlendi");
  };

  const handleDeleteStudent = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/class-students?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Öğrenci silme isteği başarısız");
      }
      setClassStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Öğrenci silindi");
    } catch (error) {
      console.error("Panel delete student error:", error);
      setStudentError("Öğrenci silinemedi");
      toast.error("Öğrenci silinirken hata oluştu");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Öğrenci Yönetimi</h1>
          <p className="text-sm text-slate-500">Sınıflara öğrenci ekleyin veya çıkarın</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sınıf Öğrencileri */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Sınıf Öğrencileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              disabled={loadingFilters || classes.length === 0}
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                const classText = classes.find(c => c.value === value)?.text || value;
                toast.info(`${classText} sınıfı seçildi`);
                loadClassStudents(value, true);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={loadingFilters ? "Yükleniyor..." : "Sınıf/Şube seçin"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-80 rounded-lg border border-slate-200/80 bg-white overflow-y-auto">
              {selectedClass ? (
                loadingStudents ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Öğrenciler yükleniyor…
                  </div>
                ) : classStudents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 px-4 text-center">
                    Bu sınıfa kayıtlı öğrenci bulunamadı.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {classStudents.map((s, idx) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-6">{idx + 1}</span>
                          <span className="text-sm font-medium text-slate-800">
                            {s.student_number ? `${s.student_number} ${s.student_name}` : s.student_name}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-red-500 border-red-100 hover:bg-red-50"
                          onClick={() => handleDeleteStudent(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 px-4 text-center">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Önce bir sınıf/şube seçin</p>
                  </div>
                </div>
              )}
            </div>

            {studentError && (
              <p className="text-xs text-red-500">{studentError}</p>
            )}

            {selectedClass && classStudents.length > 0 && (
              <p className="text-xs text-slate-500 text-center">
                Toplam {classStudents.length} öğrenci
              </p>
            )}
          </CardContent>
        </Card>

        {/* Yeni Öğrenci Ekle */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Yeni Öğrenci Ekle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
              <Input
                placeholder="Öğrenci adı soyadı"
                className="h-10"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Öğrenci Numarası</label>
              <Input
                placeholder="Öğrenci numarası (örn. 75)"
                className="h-10"
                value={newStudentNumber}
                onChange={(e) => setNewStudentNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Sınıf / Şube</label>
              <Select
                disabled={loadingFilters || classes.length === 0}
                value={newStudentClass}
                onValueChange={setNewStudentClass}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingFilters ? "Yükleniyor..." : "Sınıf/Şube seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleClearForm}
                disabled={!newStudentName && !newStudentClass && !newStudentNumber}
              >
                Temizle
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!newStudentName.trim() || !newStudentClass || !newStudentNumber.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Kaydet
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Eklenen öğrenciler ana sayfadaki yönlendirme formundaki öğrenci listesinde de görünür.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
