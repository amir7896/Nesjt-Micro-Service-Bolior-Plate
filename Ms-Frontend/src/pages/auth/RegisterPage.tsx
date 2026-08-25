import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { AuthResult } from '../../api/types';
import { setSession } from '../../auth/session';
import { JsonPanel } from '../../components/JsonPanel';

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<AuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
        }),
      });
      setResult(response);
      setSession({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role,
        },
      });
      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    }
  }

  return (
    <>
      <h1>Register</h1>
      <p className="lead">
        POST /api/auth/register — password needs upper, lower, number, and a
        special character.
      </p>
      <form className="card" onSubmit={(event) => void onSubmit(event)}>
        <div className="row">
          <label>
            firstName
            <input name="firstName" required maxLength={80} />
          </label>
          <label>
            lastName
            <input name="lastName" required maxLength={80} />
          </label>
        </div>
        <div className="row">
          <label>
            email
            <input name="email" type="email" required />
          </label>
          <label>
            password
            <input name="password" type="password" required minLength={8} />
          </label>
        </div>
        <button type="submit">Create account</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <JsonPanel value={result} />
    </>
  );
}
