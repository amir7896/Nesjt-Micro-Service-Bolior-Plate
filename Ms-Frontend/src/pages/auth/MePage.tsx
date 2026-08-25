import { useState } from 'react';
import { api } from '../../api/client';
import type { AuthUser } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function MePage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setResult(await api<AuthUser>('/auth/me'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>Auth me</h1>
      <p className="lead">
        GET /api/auth/me — account id here is the <code>userId</code> used in chat.
      </p>
      <div className="card">
        <button type="button" onClick={() => void load()}>
          Load /auth/me
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>
      <JsonPanel value={result} />
    </>
  );
}
