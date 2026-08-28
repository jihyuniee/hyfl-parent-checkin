import { env } from "cloudflare:workers";

let setupPromise: Promise<void> | undefined;

export function ensureDatabase() {
  if (!setupPromise) {
    setupPromise = env.DB.exec(`
      CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, school_year INTEGER NOT NULL, grade INTEGER NOT NULL, class_no INTEGER NOT NULL, student_no INTEGER NOT NULL, name TEXT NOT NULL, active INTEGER DEFAULT 1 NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS students_identity_idx ON students (school_year, grade, class_no, student_no);
      CREATE INDEX IF NOT EXISTS students_checkin_lookup_idx ON students (grade, class_no, name, active);
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title TEXT NOT NULL, event_date TEXT NOT NULL, status TEXT DEFAULT 'draft' NOT NULL, target_grades TEXT DEFAULT '1,2,3' NOT NULL, opens_at TEXT, closes_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);
      CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, event_id INTEGER NOT NULL, student_id INTEGER NOT NULL, guardian_name TEXT NOT NULL, relationship TEXT NOT NULL, party_size INTEGER DEFAULT 1 NOT NULL, checked_in_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, FOREIGN KEY (event_id) REFERENCES events(id), FOREIGN KEY (student_id) REFERENCES students(id));
      CREATE UNIQUE INDEX IF NOT EXISTS attendance_event_student_idx ON attendance (event_id, student_id);
      INSERT INTO events (title, event_date, status, target_grades) SELECT '2026학년도 1학년 학부모 총회', '2026-09-03', 'scheduled', '1' WHERE NOT EXISTS (SELECT 1 FROM events WHERE event_date='2026-09-03' AND target_grades='1');
      INSERT INTO events (title, event_date, status, target_grades) SELECT '2026학년도 2학년 학부모 총회', '2026-09-04', 'scheduled', '2' WHERE NOT EXISTS (SELECT 1 FROM events WHERE event_date='2026-09-04' AND target_grades='2');
    `).then(() => undefined).catch(error => { setupPromise = undefined; throw error; });
  }
  return setupPromise;
}
