import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../../api/client';
import type {
  ChatMessage,
  Conversation,
  Paginated,
  SeenResult,
} from '../../api/types';
import { getAccessToken, getSession } from '../../auth/session';
import { JsonPanel } from '../../components/JsonPanel';

type SocketEvent = { event: string; payload: unknown };

export function ConversationPage() {
  const { id = '' } = useParams();
  const me = getSession()?.user.id;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const socketRef = useRef<Socket | null>(null);

  const title = useMemo(() => {
    if (!conversation) {
      return 'Conversation';
    }
    return conversation.name ?? `Private ${conversation.id.slice(0, 8)}`;
  }, [conversation]);

  async function load() {
    setError('');
    const [conv, history] = await Promise.all([
      api<Conversation>(`/chat/conversations/${id}`),
      api<Paginated<ChatMessage>>(`/chat/conversations/${id}/messages?page=1&limit=50`),
    ]);
    setConversation(conv.data);
    setMessages([...history.data.items].reverse());
    await api(`/chat/conversations/${id}/seen`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
    });

    const token = getAccessToken();
    const socket = io('/chat', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { conversationId: id });
      socket.emit('chat:heartbeat');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', (payload: ChatMessage) => {
      if (payload.conversationId === id) {
        setMessages((current) =>
          current.some((item) => item.id === payload.id)
            ? current
            : [...current, payload],
        );
      }
      setEvents((current) => [...current.slice(-20), { event: 'chat:message', payload }]);
    });
    socket.on('chat:typing', (payload: { conversationId: string; userId: string; typing: boolean }) => {
      if (payload.conversationId === id && payload.userId !== me) {
        setTyping(payload.typing ? `${payload.userId} is typing…` : '');
      }
      setEvents((current) => [...current.slice(-20), { event: 'chat:typing', payload }]);
    });
    socket.on('chat:seen', (payload: SeenResult) => {
      setEvents((current) => [...current.slice(-20), { event: 'chat:seen', payload }]);
    });
    socket.on('chat:presence', (payload: unknown) => {
      setEvents((current) => [...current.slice(-20), { event: 'chat:presence', payload }]);
    });
    const beat = window.setInterval(() => {
      socket.emit('chat:heartbeat');
    }, 20_000);

    return () => {
      window.clearInterval(beat);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, me]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') ?? '').trim();
    if (!body) {
      return;
    }
    const response = await api<ChatMessage>(`/chat/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, type: 'text' }),
    });
    setMessages((current) =>
      current.some((item) => item.id === response.data.id)
        ? current
        : [...current, response.data],
    );
    form.reset();
  }

  async function sendTyping(isTyping: boolean) {
    await api(`/chat/conversations/${id}/typing`, {
      method: 'POST',
      body: JSON.stringify({ typing: isTyping }),
    });
    socketRef.current?.emit('chat:typing', {
      conversationId: id,
      typing: isTyping,
    });
  }

  async function markSeen() {
    const last = messages.at(-1);
    setResult(
      await api(`/chat/conversations/${id}/seen`, {
        method: 'POST',
        body: JSON.stringify(last ? { messageId: last.id } : {}),
      }),
    );
    socketRef.current?.emit('chat:seen', {
      conversationId: id,
      messageId: last?.id,
    });
  }

  async function addMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const memberIds = String(new FormData(event.currentTarget).get('memberIds') ?? '')
      .split(/[\s,]+/)
      .filter(Boolean);
    setResult(
      await api(`/chat/conversations/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ memberIds }),
      }),
    );
    await load();
  }

  async function removeMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = String(new FormData(event.currentTarget).get('userId') ?? '');
    setResult(
      await api(`/chat/conversations/${id}/members/${userId}`, {
        method: 'DELETE',
      }),
    );
    await load();
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') ?? '');
    setResult(
      await api(`/chat/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    );
    await load();
  }

  async function leave() {
    setResult(
      await api(`/chat/conversations/${id}/leave`, { method: 'POST' }),
    );
  }

  return (
    <>
      <h1>{title}</h1>
      <p className="lead">
        REST + Socket.IO namespace <code>/chat</code>. Socket{' '}
        <span className={connected ? 'badge' : 'badge off'}>
          {connected ? 'online' : 'offline'}
        </span>
      </p>
      {error ? <p className="error">{error}</p> : null}

      <div className="grid-2">
        <div className="card">
          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.senderId === me ? 'bubble mine' : 'bubble'}
              >
                <div>{message.body}</div>
                <small>
                  {message.type} · seenBy {message.seenBy.length}
                </small>
              </div>
            ))}
          </div>
          {typing ? <p className="ok">{typing}</p> : null}
          <form onSubmit={(event) => void send(event)}>
            <label>
              message
              <input
                name="body"
                required
                onFocus={() => void sendTyping(true)}
                onBlur={() => void sendTyping(false)}
              />
            </label>
            <div className="row">
              <button type="submit">POST /messages</button>
              <button className="secondary" type="button" onClick={() => void markSeen()}>
                POST /seen
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Members</h3>
          {conversation?.members.map((member) => (
            <div key={member.userId}>
              {member.userId.slice(0, 8)}…{' '}
              <span className={member.status === 'online' ? 'badge' : 'badge off'}>
                {member.status}
              </span>{' '}
              {member.role}
            </div>
          ))}
        </div>
      </div>

      {conversation?.type === 'group' ? (
        <>
          <form className="card" onSubmit={(event) => void rename(event)}>
            <label>
              PATCH name
              <input name="name" required />
            </label>
            <button type="submit">Rename group</button>
          </form>
          <form className="card" onSubmit={(event) => void addMembers(event)}>
            <label>
              POST members (auth ids)
              <input name="memberIds" required />
            </label>
            <button type="submit">Add members</button>
          </form>
          <form className="card" onSubmit={(event) => void removeMember(event)}>
            <label>
              DELETE member userId
              <input name="userId" required />
            </label>
            <button className="danger" type="submit">
              Remove member
            </button>
          </form>
          <div className="card">
            <button className="danger" type="button" onClick={() => void leave()}>
              POST /leave
            </button>
          </div>
        </>
      ) : null}

      <JsonPanel title="Socket.IO events" value={events} />
      <JsonPanel title="Last REST result" value={result} />
    </>
  );
}
