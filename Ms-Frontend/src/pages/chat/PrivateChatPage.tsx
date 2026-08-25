import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function PrivateChatPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const userId = String(
      new FormData(event.currentTarget).get('userId') ?? '',
    ).trim();
    try {
      const response = await api<Conversation>('/chat/private', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setResult(response);
      navigate(`/chat/conversations/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>Start private chat</h1>
      <p className="lead">
        POST /api/chat/private — <code>userId</code> is the other user&apos;s
        auth account id from GET /auth/me (<code>data.id</code>), not a profile
        id.
      </p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <label>
          other userId
          <input name="userId" required placeholder="uuid from /auth/me" />
        </label>
        <button type="submit">Open or create</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
