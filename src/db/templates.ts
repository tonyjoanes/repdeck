import type { WorkoutConfig } from "@/types/workout";
import { getDb } from "./database";

export type StoredTemplate = {
  id: string;
  name: string;
  config: WorkoutConfig;
  created_at: string;
};

type RawTemplate = Omit<StoredTemplate, "config"> & { config: string };

export function saveTemplate(name: string, config: WorkoutConfig): string {
  const db = getDb();
  const id = Date.now().toString();
  db.runSync(
    "INSERT INTO workout_templates (id, name, config, created_at) VALUES (?, ?, ?, ?)",
    [id, name, JSON.stringify(config), new Date().toISOString()]
  );
  return id;
}

export function getTemplates(): StoredTemplate[] {
  const db = getDb();
  const rows = db.getAllSync<RawTemplate>(
    "SELECT * FROM workout_templates ORDER BY created_at ASC"
  );
  return rows.map((row) => ({ ...row, config: JSON.parse(row.config) as WorkoutConfig }));
}

export function deleteTemplate(id: string): void {
  getDb().runSync("DELETE FROM workout_templates WHERE id = ?", [id]);
}
