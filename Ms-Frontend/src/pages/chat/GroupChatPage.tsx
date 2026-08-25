import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function GroupChatPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const memberIds = String(form.get('memberIds') ?? '')
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    try {
      const response = await api<Conversation>('/chat/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          memberIds,
        }),
      });
      setResult(response);
      navigate(`/chat/conversations/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>Create group</h1>
      <p className="lead">
        POST /api/chat/groups — memberIds are auth account ids, comma-separated.
      </p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <label>
          name
          <input name="name" required maxLength={120} />
        </label>
        <label>
          memberIds
          <textarea name="memberIds" rows={3} required />
        </label>
        <button type="submit">Create group</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
