import React, { useEffect, useState } from 'react';

type Recommendation = {
  recommendation: 'GO' | 'PUNT' | 'FG';
  delta_wp: number;
  delta_ep: number;
  alternatives: { action: string; wp: number; ep: number }[];
  rationale: string[];
  uncertainty: { std: number; method: string };
  version: string;
};

const CoachDecisionDashboard: React.FC = () => {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRec() {
    setLoading(true);
    setError(null);
    try {
      // call FastAPI service directly (different port); use absolute URL
      const url = process.env.REACT_APP_DECISION_API_URL || 'http://localhost:8008';
      const form = document.getElementById('decision-form') as HTMLFormElement;
      const fd = new FormData(form);
      const params: any = Object.fromEntries(fd.entries());
      // coerce types
      ['down','ydstogo','yardline_100','time_remaining','qtr','score_diff','offense_timeouts','defense_timeouts'].forEach(k => params[k] = Number(params[k]));
      params.home = params.home === 'true' || params.home === true;
      const resp = await fetch(`${url}/v1/recommend?` + new URLSearchParams(params as any).toString());
      const data = await resp.json();
      setRec(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // no initial call; wait for user submit
  }, []);

  return (
    <div className="container">
      <h2>4th & Short Coach Dashboard</h2>
      <form id="decision-form" onSubmit={(e) => { e.preventDefault(); fetchRec(); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <label>Down<input name="down" type="number" min={1} max={4} defaultValue={4} /></label>
        <label>Yds To Go<input name="ydstogo" type="number" min={1} max={100} defaultValue={2} /></label>
        <label>Yardline_100<input name="yardline_100" type="number" min={1} max={99} defaultValue={48} /></label>
        <label>Time Remaining (s)<input name="time_remaining" type="number" min={0} defaultValue={900} /></label>
        <label>Quarter<input name="qtr" type="number" min={1} max={5} defaultValue={2} /></label>
        <label>Score Diff<input name="score_diff" type="number" defaultValue={-3} /></label>
        <label>Off TOs<input name="offense_timeouts" type="number" min={0} max={3} defaultValue={3} /></label>
        <label>Def TOs<input name="defense_timeouts" type="number" min={0} max={3} defaultValue={3} /></label>
        <label>Home<select name="home" defaultValue="true"><option value="true">True</option><option value="false">False</option></select></label>
        <div style={{ alignSelf: 'end' }}>
          <button type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Get Recommendation'}</button>
        </div>
      </form>
      {error && <div className="error">{error}</div>}
      {rec && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Recommendation: {rec.recommendation}</h3>
          <p>Delta WP: {(rec.delta_wp * 100).toFixed(1)}%</p>
          <p>Delta EP: {rec.delta_ep.toFixed(2)}</p>
          <h4>Alternatives</h4>
          <ul>
            {rec.alternatives.map((a, i) => (
              <li key={i}>
                {a.action}: WP {(a.wp * 100).toFixed(1)}% · EP {a.ep.toFixed(2)}
              </li>
            ))}
          </ul>
          <h4>Rationale</h4>
          <ul>
            {rec.rationale.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <small>Version: {rec.version}</small>
        </div>
      )}
    </div>
  );
};

export default CoachDecisionDashboard;


