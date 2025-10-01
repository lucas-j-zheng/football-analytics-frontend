export interface RecommendResponse {
  recommendation: 'GO' | 'PUNT' | 'FG';
  delta_wp: number;
  alternatives: { action: string; wp: number }[];
  rationale: string[];
  uncertainty: { std: number; method: string };
  version: string;
}

export async function getRecommendation(params: Record<string, string | number | boolean>): Promise<RecommendResponse> {
  const base = process.env.REACT_APP_DECISION_API_URL || 'http://localhost:8008';
  const qs = new URLSearchParams(params as any).toString();
  const res = await fetch(`${base}/v1/recommend?${qs}`);
  if (!res.ok) throw new Error(`Decision API error ${res.status}`);
  return res.json();
}


