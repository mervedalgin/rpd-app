import { z } from "zod/v4";

// ---- Paylaşılan şemalar ----

export const appointmentCreateSchema = z.object({
  appointment_date: z.iso.date(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli saat formatı: HH:MM"),
  duration: z.number().int().min(5).max(180).default(15),
  participant_type: z.enum(["student", "parent", "teacher", "other"]),
  participant_name: z.string().min(1).max(200),
  participant_class: z.string().max(100).optional(),
  participant_phone: z.string().max(20).optional(),
  topic_tags: z.array(z.string().max(100)).max(20).default([]),
  location: z.string().max(100).default("guidance_office"),
  purpose: z.string().max(2000).optional(),
  preparation_note: z.string().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  template_type: z.string().max(100).optional(),
});

export const appointmentUpdateSchema = z.object({
  id: z.string().uuid(),
  appointment_date: z.iso.date().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(5).max(180).optional(),
  participant_type: z.enum(["student", "parent", "teacher", "other"]).optional(),
  participant_name: z.string().min(1).max(200).optional(),
  participant_class: z.string().max(100).optional(),
  participant_phone: z.string().max(20).optional(),
  topic_tags: z.array(z.string().max(100)).max(20).optional(),
  location: z.string().max(100).optional(),
  purpose: z.string().max(2000).optional(),
  preparation_note: z.string().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["planned", "completed", "cancelled", "no_show"]).optional(),
  session_notes: z.string().max(5000).optional(),
  outcome: z.string().max(2000).optional(),
  decisions: z.array(z.string().max(500)).max(20).optional(),
  template_type: z.string().max(100).optional(),
});

export const documentRequestSchema = z.object({
  documentType: z.enum([
    "veli-mektubu", "veli-cagrisi", "ogretmen-mektubu",
    "ogretmen-tavsiyesi", "idare-mektubu", "disiplin-kurulu",
  ]),
  currentContent: z.string().min(1).max(50000),
  studentName: z.string().max(200).default(""),
  studentClass: z.string().max(100).default(""),
  meetingDate: z.string().max(20).optional(),
  meetingTime: z.string().max(20).optional(),
});

export const reportRequestSchema = z.object({
  studentName: z.string().min(1).max(200),
  studentClass: z.string().min(1).max(100),
  appointmentDate: z.string().min(1).max(20),
  topicTags: z.array(z.string().max(100)).default([]),
  purpose: z.string().max(2000).default(""),
  outcome: z.string().max(2000).default(""),
  decisions: z.array(z.string().max(500)).default([]),
  sessionNotes: z.string().max(10000).default(""),
  reportType: z.enum(["idare", "ogretmen", "veli", "rehberlik"]),
});

// ---- Yardımcı ----

export function validateBody<T>(schema: z.ZodType<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: messages };
  }
  return { success: true, data: result.data };
}
