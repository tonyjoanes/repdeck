import type { WorkoutConfig } from "@/types/workout";

const STORAGE_KEY = "repdeck.workoutTemplates";

export type StoredTemplate = {
  id: string;
  name: string;
  config: WorkoutConfig;
  created_at: string;
};

function readTemplates(): StoredTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredTemplate[];
  } catch {
    return [];
  }
}

function writeTemplates(templates: StoredTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function saveTemplate(name: string, config: WorkoutConfig): string {
  const id = Date.now().toString();
  const template: StoredTemplate = {
    id,
    name,
    config,
    created_at: new Date().toISOString(),
  };

  writeTemplates([...readTemplates(), template]);
  return id;
}

export function getTemplates(): StoredTemplate[] {
  return readTemplates().sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function deleteTemplate(id: string): void {
  writeTemplates(readTemplates().filter((template) => template.id !== id));
}
