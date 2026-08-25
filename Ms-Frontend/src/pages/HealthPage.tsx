import { useState } from 'react';
import { api } from '../api/client';
import { JsonPanel } from '../components/JsonPanel';

export function HealthPage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setResult(await api('/health'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    }
  }

  return (
    <>
      <h1>Health</h1>
      <p className="lead">GET /api/health — gateway + RabbitMQ + Redis.</p>
      <div className="card">
        <button type="button" onClick={() => void load()}>
          Call health
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>
      <JsonPanel value={result} />
    </>
  );
}
