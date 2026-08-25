import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Protected } from './components/Protected';
import { HealthPage } from './pages/HealthPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { MePage } from './pages/auth/MePage';
import { PasswordPage } from './pages/auth/PasswordPage';
import { RefreshPage } from './pages/auth/RefreshPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ChatHomePage } from './pages/chat/ChatHomePage';
import { ConversationPage } from './pages/chat/ConversationPage';
import { GroupChatPage } from './pages/chat/GroupChatPage';
import { PresencePage } from './pages/chat/PresencePage';
import { PrivateChatPage } from './pages/chat/PrivateChatPage';
import { MyProfilePage } from './pages/users/MyProfilePage';
import { UserAdminPage } from './pages/users/UserAdminPage';
import { UsersListPage } from './pages/users/UsersListPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/refresh" element={<RefreshPage />} />
          <Route element={<Protected />}>
            <Route path="/auth/me" element={<MePage />} />
            <Route path="/auth/password" element={<PasswordPage />} />
            <Route path="/users/me" element={<MyProfilePage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/lookup" element={<UserAdminPage />} />
            <Route path="/chat" element={<ChatHomePage />} />
            <Route path="/chat/private" element={<PrivateChatPage />} />
            <Route path="/chat/groups" element={<GroupChatPage />} />
            <Route path="/chat/presence" element={<PresencePage />} />
            <Route path="/chat/conversations/:id" element={<ConversationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
