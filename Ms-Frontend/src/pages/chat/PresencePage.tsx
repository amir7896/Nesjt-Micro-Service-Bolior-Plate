import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import type { Presence } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function PresencePage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const userId = String(
      new FormData(event.currentTarget).get('userId') ?? '',
    ).trim();
    try {
      setResult(await api<Presence>(`/chat/presence/${userId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>Presence</h1>
      <p className="lead">
        GET /api/chat/presence/:userId — online only while that user has a
        Socket.IO connection on /chat.
      </p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <label>
          userId
          <input name="userId" required />
        </label>
        <button type="submit">Check status</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
