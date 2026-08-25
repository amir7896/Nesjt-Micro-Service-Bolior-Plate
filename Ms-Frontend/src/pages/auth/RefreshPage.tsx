import { useState } from 'react';
import { refreshSession } from '../../api/client';
import { getSession } from '../../auth/session';
import { JsonPanel } from '../../components/JsonPanel';

export function RefreshPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setMessage('');
    const ok = await refreshSession();
    if (ok) {
      setMessage('Access token refreshed and stored.');
    } else {
      setError('Refresh failed. Log in again.');
    }
  }

  return (
    <>
      <h1>Refresh token</h1>
      <p className="lead">POST /api/auth/refresh — public, uses stored refresh token.</p>
      <div className="card">
        <button type="button" onClick={() => void run()}>
          Refresh session
        </button>
        {message ? <p className="ok">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
      <JsonPanel title="Current session" value={getSession()} />
    </>
  );
}
