import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Paginated, UserProfile } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function UsersListPage() {
  const [result, setResult] = useState<Paginated<UserProfile> | null>(null);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const page = form.get('page') || '1';
    const limit = form.get('limit') || '20';
    const search = String(form.get('search') ?? '').trim();
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) {
      query.set('search', search);
    }
    try {
      const response = await api<Paginated<UserProfile>>(`/users?${query.toString()}`);
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin only');
    }
  }

  return (
    <>
      <h1>Users (admin)</h1>
      <p className="lead">GET /api/users — requires role admin.</p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <div className="row">
          <label>
            page
            <input name="page" type="number" defaultValue={1} min={1} />
          </label>
          <label>
            limit
            <input name="limit" type="number" defaultValue={20} min={1} max={100} />
          </label>
          <label>
            search
            <input name="search" />
          </label>
        </div>
        <button type="submit">List users</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      {result ? (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>profile id</th>
                <th>userId (auth)</th>
                <th>email</th>
                <th>name</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link to={`/users/lookup?id=${user.id}`}>{user.id}</Link>
                  </td>
                  <td>{user.userId}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <JsonPanel value={result} />
    </>
  );
}
