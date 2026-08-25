import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { UserProfile } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function UserAdminPage() {
  const [params] = useSearchParams();
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  async function getOne(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const id = String(new FormData(event.currentTarget).get('id') ?? '').trim();
    try {
      setResult(await api<UserProfile>(`/users/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function patchOne(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const id = String(form.get('id') ?? '').trim();
    try {
      setResult(
        await api<UserProfile>(`/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            firstName: form.get('firstName') || undefined,
            lastName: form.get('lastName') || undefined,
          }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function removeOne(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const id = String(new FormData(event.currentTarget).get('id') ?? '').trim();
    if (!window.confirm('Deactivate this user?')) {
      return;
    }
    try {
      setResult(await api(`/users/${id}`, { method: 'DELETE' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  const defaultId = params.get('id') ?? '';

  return (
    <>
      <h1>User by profile id (admin)</h1>
      <p className="lead">
        GET / PATCH / DELETE /api/users/:id — <code>:id</code> is the profile
        id, not the auth account id.
      </p>
      {error ? <p className="error">{error}</p> : null}

      <form className="card" onSubmit={(event) => void getOne(event)}>
        <label>
          profile id
          <input name="id" defaultValue={defaultId} required />
        </label>
        <button type="submit">GET user</button>
      </form>

      <form className="card" onSubmit={(event) => void patchOne(event)}>
        <div className="row">
          <label>
            profile id
            <input name="id" defaultValue={defaultId} required />
          </label>
          <label>
            firstName
            <input name="firstName" />
          </label>
          <label>
            lastName
            <input name="lastName" />
          </label>
        </div>
        <button type="submit">PATCH user</button>
      </form>

      <form className="card" onSubmit={(event) => void removeOne(event)}>
        <label>
          profile id
          <input name="id" defaultValue={defaultId} required />
        </label>
        <button className="danger" type="submit">
          DELETE user
        </button>
      </form>
      <JsonPanel value={result} />
    </>
  );
}
