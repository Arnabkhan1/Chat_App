import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile: sidebar full-screen jokhon kono user select kora nei.
          Desktop (md+): sidebar always dekhabe, chat window pashe */}
      <div
        className={`w-full md:w-[380px] md:flex-shrink-0 ${
          selectedUser ? 'hidden md:block' : 'block'
        }`}
      >
        <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      </div>

      {/* Mobile: chat window full-screen jokhon user select kora ache.
          Desktop: always dekhabe (placeholder na hole) */}
      <div
        className={`flex-1 ${
          selectedUser ? 'block' : 'hidden md:block'
        }`}
      >
        <ChatWindow selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    </div>
  );
};

export default ChatPage;