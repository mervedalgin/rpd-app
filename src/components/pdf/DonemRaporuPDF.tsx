import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { registerFonts } from '@/lib/pdf-fonts';

registerFonts();

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  period: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 2,
  },
  dateRange: {
    fontSize: 9,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    color: '#334155',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  colBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  totalStudents: number;
  totalReferrals: number;
  totalDiscipline: number;
  totalAppointments: number;
  totalClassActivities: number;
  totalParentContacts: number;
  referralsByReason: Record<string, number>;
  activitiesByType: Record<string, number>;
  ramReferrals: number;
  ramCompleted: number;
  ramPending: number;
  riskStudentsActive: number;
  riskStudentsCritical: number;
}

const REASON_LABELS: Record<string, string> = {
  akademik: 'Akademik Sorunlar',
  davranis: 'Davranış Problemleri',
  sosyal: 'Sosyal İlişki Sorunları',
  ailevi: 'Aile Sorunları',
  duygusal: 'Duygusal Sorunlar',
  dikkat: 'Dikkat/Konsantrasyon',
  kaygi: 'Kaygı/Stres',
  zorbalik: 'Akran Zorbalığı',
  diger: 'Diğer',
};

const ACTIVITY_LABELS: Record<string, string> = {
  tanitim: 'Rehberlik Tanıtımı',
  benlik: 'Benlik Gelişimi',
  kariyer: 'Kariyer/Meslek',
  akademik: 'Akademik Gelişim',
  sosyal: 'Sosyal Beceriler',
  duygusal: 'Duygusal Farkındalık',
  guvenlik: 'Güvenlik/Koruma',
  deger: 'Değerler Eğitimi',
  diger: 'Diğer',
};

interface Props {
  data: ReportData;
  year: number;
}

function StatRow({ label, value, alt }: { label: string; value: string | number; alt?: boolean }) {
  return (
    <View style={alt ? styles.statRowAlt : styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function DonemRaporuPDF({ data, year }: Props) {
  const now = new Date().toLocaleDateString('tr-TR');
  const startFormatted = new Date(data.startDate).toLocaleDateString('tr-TR');
  const endFormatted = new Date(data.endDate).toLocaleDateString('tr-TR');

  const reasonEntries = Object.entries(data.referralsByReason);
  const activityEntries = Object.entries(data.activitiesByType);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.title}>DUMLUPINAR İLKOKULU</Text>
          <Text style={styles.subtitle}>Rehberlik ve Psikolojik Danışmanlık Hizmetleri</Text>
          <Text style={styles.period}>{data.period} Raporu</Text>
          <Text style={styles.dateRange}>({startFormatted} - {endFormatted})</Text>
        </View>

        {/* Genel İstatistikler */}
        <Text style={styles.sectionTitle}>GENEL İSTATİSTİKLER</Text>
        <StatRow label="Toplam Görülen Öğrenci" value={data.totalStudents} />
        <StatRow label="Toplam Yönlendirme" value={data.totalReferrals} alt />
        <StatRow label="Tamamlanan Görüşme" value={data.totalAppointments} />
        <StatRow label="Disiplin Olayları" value={data.totalDiscipline} alt />
        <StatRow label="Sınıf Etkinlikleri" value={data.totalClassActivities} />
        <StatRow label="Veli İletişimleri" value={data.totalParentContacts} alt />

        {/* RAM & Risk yan yana */}
        <View style={styles.twoCol}>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>RAM YÖNLENDİRMELERİ</Text>
            <StatRow label="Toplam Başvuru" value={data.ramReferrals} />
            <StatRow label="Sonuçlanan" value={data.ramCompleted} alt />
            <StatRow label="Devam Eden" value={data.ramPending} />
          </View>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>RİSK TAKİBİ</Text>
            <StatRow label="Aktif Takipteki Öğrenci" value={data.riskStudentsActive} />
            <StatRow label="Yüksek/Kritik Risk" value={data.riskStudentsCritical} alt />
          </View>
        </View>

        {/* Yönlendirme Nedenleri */}
        {reasonEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>YÖNLENDİRME NEDENLERİ</Text>
            {reasonEntries.map(([reason, count], i) => (
              <StatRow
                key={reason}
                label={REASON_LABELS[reason] || reason}
                value={count}
                alt={i % 2 === 1}
              />
            ))}
          </>
        )}

        {/* Sınıf Etkinlikleri */}
        {activityEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SINIF ETKİNLİKLERİ</Text>
            {activityEntries.map(([type, count], i) => (
              <StatRow
                key={type}
                label={ACTIVITY_LABELS[type] || type}
                value={count}
                alt={i % 2 === 1}
              />
            ))}
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Oluşturma Tarihi: {now} — DUMLUPINAR İLKOKULU RPD Servisi
        </Text>
      </Page>
    </Document>
  );
}
