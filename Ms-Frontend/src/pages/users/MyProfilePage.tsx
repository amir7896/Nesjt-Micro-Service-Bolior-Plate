import { FormEvent, useState } from 'react';
import { api } from '../../api/client';
import type { UserProfile } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function MyProfilePage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setResult(await api<UserProfile>('/users/me'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    for (const key of ['firstName', 'lastName', 'phone', 'bio', 'avatar', 'dateOfBirth']) {
      const value = String(form.get(key) ?? '').trim();
      if (value) {
        body[key] = value;
      }
    }
    try {
      setResult(
        await api<UserProfile>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>My profile</h1>
      <p className="lead">GET /api/users/me and PATCH /api/users/me</p>
      <div className="card">
        <button type="button" onClick={() => void load()}>
          Load profile
        </button>
      </div>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <div className="row">
          <label>
            firstName
            <input name="firstName" />
          </label>
          <label>
            lastName
            <input name="lastName" />
          </label>
          <label>
            phone
            <input name="phone" />
          </label>
        </div>
        <div className="row">
          <label>
            bio
            <input name="bio" />
          </label>
          <label>
            avatar URL
            <input name="avatar" />
          </label>
          <label>
            dateOfBirth
            <input name="dateOfBirth" placeholder="1994-04-12" />
          </label>
        </div>
        <button type="submit">Save profile</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
