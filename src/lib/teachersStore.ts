import fs from 'fs';
import path from 'path';
import { TeacherRecord } from './teachers';

function getStorePath() {
  const dir = path.join(process.cwd(), 'var');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'teachers.json');
}

export function loadTeachersFromStore(): TeacherRecord[] {
  try {
    const file = getStorePath();
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as TeacherRecord[];
    return [];
  } catch {
    return [];
  }
}

export function saveTeachersToStore(records: TeacherRecord[]): void {
  const file = getStorePath();
  fs.writeFileSync(file, JSON.stringify(records, null, 2), 'utf8');
}
