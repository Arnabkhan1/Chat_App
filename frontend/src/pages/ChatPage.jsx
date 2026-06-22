import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex h-screen overflow-hidden bg-nebula-bg">
      <div
        className={`w-full md:w-[380px] md:flex-shrink-0 md:border-r md:border-nebula-border ${
          selectedUser ? 'hidden md:block' : 'block'
        }`}
      >
        <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      </div>

      <div
        className={`flex-1 min-w-0 ${
          selectedUser ? 'block' : 'hidden md:block'
        }`}
      >
        <ChatWindow selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    </div>
  );
};

export default ChatPage;