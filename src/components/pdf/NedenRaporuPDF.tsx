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
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ea580c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ea580c',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff7ed',
  },
  colNo: { width: '8%', textAlign: 'center' },
  colName: { width: '42%' },
  colClass: { width: '28%', textAlign: 'center' },
  colDate: { width: '22%', textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
  },
});

interface Student {
  student_name: string;
  class_display: string;
  date?: string;
}

interface Props {
  reason: string;
  students: Student[];
  periodLabel: string;
}

export function NedenRaporuPDF({ reason, students, periodLabel }: Props) {
  const now = new Date().toLocaleDateString('tr-TR');

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Başlık */}
        <Text style={styles.title}>RPD Yönlendirme Raporu</Text>
        <Text style={styles.subtitle}>Yönlendirme Nedeni: {reason}</Text>
        <Text style={styles.meta}>Dönem: {periodLabel}</Text>
        <Text style={styles.meta}>Toplam Öğrenci: {students.length}</Text>
        <Text style={styles.meta}>Rapor Tarihi: {now}</Text>

        {/* Tablo Başlığı */}
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.colName]}>Öğrenci Adı</Text>
          <Text style={[styles.tableHeaderText, styles.colClass]}>Sınıf</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Tarih</Text>
        </View>

        {/* Tablo Satırları */}
        {students.map((s, idx) => (
          <View
            key={`${s.student_name}-${idx}`}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            wrap={false}
          >
            <Text style={styles.colNo}>{idx + 1}</Text>
            <Text style={styles.colName}>{s.student_name}</Text>
            <Text style={styles.colClass}>{s.class_display}</Text>
            <Text style={styles.colDate}>
              {s.date ? new Date(s.date).toLocaleDateString('tr-TR') : '-'}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          DUMLUPINAR İLKOKULU — RPD Servisi
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
