import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';
import useAuthStore from './context/authStore';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={user ? <ChatPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;