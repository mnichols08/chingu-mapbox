/// <reference lib="webworker" />
import type { Analysis } from "./domain";

declare const self: DedicatedWorkerGlobalScope;

export interface AnalysisRequest { id: number; xml: string }
export type AnalysisResponse =
  | { id: number; analysis: Analysis; elapsedMs: number }
  | { id: number; error: string };

self.onmessage = async ({ data }: MessageEvent<AnalysisRequest>) => {
  try {
    const { analyze_gpx } = await import("../rust/pkg/adventure_analysis");
    const start = performance.now();
    const analysis: Analysis = JSON.parse(analyze_gpx(data.xml));
    const response: AnalysisResponse = { id: data.id, analysis, elapsedMs: performance.now() - start };
    self.postMessage(response);
  } catch (error) {
    const response: AnalysisResponse = { id: data.id, error: error instanceof Error ? error.message : String(error) };
    self.postMessage(response);
  }
};
