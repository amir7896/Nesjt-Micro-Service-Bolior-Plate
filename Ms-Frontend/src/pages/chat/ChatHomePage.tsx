import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation, Paginated } from '../../api/types';
import { JsonPanel } from '../../components/JsonPanel';

export function ChatHomePage() {
  const [result, setResult] = useState<Paginated<Conversation> | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const response = await api<Paginated<Conversation>>(
        '/chat/conversations?page=1&limit=50',
      );
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <h1>Conversations</h1>
      <p className="lead">GET /api/chat/conversations</p>
      <div className="card row">
        <button type="button" onClick={() => void load()}>
          Refresh
        </button>
        <Link to="/chat/private">
          <button className="secondary" type="button">
            New private
          </button>
        </Link>
        <Link to="/chat/groups">
          <button className="secondary" type="button">
            New group
          </button>
        </Link>
        {error ? <p className="error">{error}</p> : null}
      </div>
      <div className="card">
        {result?.items.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>name / type</th>
                <th>unread</th>
                <th>members</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/chat/conversations/${item.id}`}>
                      {item.name ?? 'Private chat'}
                    </Link>{' '}
                    <span className="badge">{item.type}</span>
                  </td>
                  <td>{item.unreadCount}</td>
                  <td>
                    {item.members
                      .map(
                        (member) =>
                          `${member.userId.slice(0, 8)}… (${member.status})`,
                      )
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="lead">No conversations yet.</p>
        )}
      </div>
      <JsonPanel value={result} />
    </>
  );
}
