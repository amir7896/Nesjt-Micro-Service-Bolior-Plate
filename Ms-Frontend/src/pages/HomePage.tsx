import { Link } from 'react-router-dom';

const routes = [
  { path: '/health', api: 'GET /api/health', auth: false },
  { path: '/auth/register', api: 'POST /api/auth/register', auth: false },
  { path: '/auth/login', api: 'POST /api/auth/login', auth: false },
  { path: '/auth/refresh', api: 'POST /api/auth/refresh', auth: false },
  { path: '/auth/me', api: 'GET /api/auth/me', auth: true },
  { path: '/auth/password', api: 'PATCH /api/auth/password', auth: true },
  { path: '/users/me', api: 'GET + PATCH /api/users/me', auth: true },
  { path: '/users', api: 'GET /api/users', auth: true, note: 'admin' },
  {
    path: '/users/lookup',
    api: 'GET + PATCH + DELETE /api/users/:id',
    auth: true,
    note: 'admin, :id is profile id',
  },
  { path: '/chat', api: 'GET /api/chat/conversations', auth: true },
  { path: '/chat/private', api: 'POST /api/chat/private', auth: true },
  { path: '/chat/groups', api: 'POST /api/chat/groups', auth: true },
  { path: '/chat/presence', api: 'GET /api/chat/presence/:userId', auth: true },
  {
    path: '/chat/conversations/:id',
    api: 'messages, typing, seen, members, leave, rename + Socket.IO /chat',
    auth: true,
  },
];

export function HomePage() {
  return (
    <>
      <h1>MS Frontend</h1>
      <p className="lead">
        Vite + React 18.3 test app for the NestJS API Gateway on port 3002. Vite
        proxies <code>/api</code> and <code>/socket.io</code>. Sign in with two
        browsers (or two accounts) to test typing, seen, and online/offline.
      </p>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Frontend route</th>
              <th>Backend</th>
              <th>JWT</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((item) => (
              <tr key={item.path}>
                <td>
                  {item.path.includes(':id') && item.path.startsWith('/chat') ? (
                    <span>{item.path}</span>
                  ) : (
                    <Link to={item.path.split(':')[0]}>{item.path}</Link>
                  )}
                </td>
                <td>
                  {item.api}
                  {item.note ? ` (${item.note})` : ''}
                </td>
                <td>{item.auth ? 'yes' : 'public'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
