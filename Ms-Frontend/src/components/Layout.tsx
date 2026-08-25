import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { clearSession, getSession } from '../auth/session';

const link = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'active' : undefined;

export function Layout() {
  const navigate = useNavigate();
  const session = getSession();

  async function logout() {
    try {
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session?.refreshToken }),
      });
    } catch {
      // still clear local session
    }
    clearSession();
    navigate('/auth/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          MS-<span>Frontend</span>
        </div>
        <p>Test UI for the NestJS gateway</p>

        <div className="nav-group">
          <h3>App</h3>
          <NavLink to="/" className={link} end>
            Home / all routes
          </NavLink>
          <NavLink to="/health" className={link}>
            GET /health
          </NavLink>
        </div>

        <div className="nav-group">
          <h3>Auth</h3>
          <NavLink to="/auth/register" className={link}>
            POST /auth/register
          </NavLink>
          <NavLink to="/auth/login" className={link}>
            POST /auth/login
          </NavLink>
          <NavLink to="/auth/refresh" className={link}>
            POST /auth/refresh
          </NavLink>
          <NavLink to="/auth/me" className={link}>
            GET /auth/me
          </NavLink>
          <NavLink to="/auth/password" className={link}>
            PATCH /auth/password
          </NavLink>
        </div>

        <div className="nav-group">
          <h3>Users</h3>
          <NavLink to="/users/me" className={link}>
            GET/PATCH /users/me
          </NavLink>
          <NavLink to="/users" className={link} end>
            GET /users (admin)
          </NavLink>
          <NavLink to="/users/lookup" className={link}>
            GET/PATCH/DELETE /users/:id
          </NavLink>
        </div>

        <div className="nav-group">
          <h3>Chat</h3>
          <NavLink to="/chat" className={link} end>
            GET /chat/conversations
          </NavLink>
          <NavLink to="/chat/private" className={link}>
            POST /chat/private
          </NavLink>
          <NavLink to="/chat/groups" className={link}>
            POST /chat/groups
          </NavLink>
          <NavLink to="/chat/presence" className={link}>
            GET /chat/presence/:userId
          </NavLink>
        </div>

        <div className="session">
          {session ? (
            <>
              <div>
                Signed in as <strong>{session.user.email}</strong>
              </div>
              <div>
                role <strong>{session.user.role}</strong>
              </div>
              <div>
                id <strong>{session.user.id}</strong>
              </div>
              <button className="secondary" type="button" onClick={() => void logout()}>
                POST /auth/logout
              </button>
            </>
          ) : (
            <div>Not signed in</div>
          )}
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
