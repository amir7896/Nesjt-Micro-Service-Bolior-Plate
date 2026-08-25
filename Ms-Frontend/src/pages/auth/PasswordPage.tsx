import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { clearSession } from '../../auth/session';
import { JsonPanel } from '../../components/JsonPanel';

export function PasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await api('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: form.get('currentPassword'),
          newPassword: form.get('newPassword'),
        }),
      });
      setResult(response);
      clearSession();
      navigate('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <>
      <h1>Change password</h1>
      <p className="lead">
        PATCH /api/auth/password — current access token is revoked; you must log
        in again.
      </p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <div className="row">
          <label>
            currentPassword
            <input name="currentPassword" type="password" required />
          </label>
          <label>
            newPassword
            <input name="newPassword" type="password" required minLength={8} />
          </label>
        </div>
        <button type="submit">Update password</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
