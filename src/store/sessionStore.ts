import type { SessionResult } from "@/types/workout";

let _lastResult: SessionResult | null = null;

export function setLastResult(r: SessionResult): void {
  _lastResult = r;
}

export function getLastResult(): SessionResult | null {
  return _lastResult;
}
