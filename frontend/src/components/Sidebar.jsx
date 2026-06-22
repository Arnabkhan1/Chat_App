import { useState, useEffect } from 'react';
import { getUsers } from '../services/messageService';
import { useSocketContext } from '../context/SocketContext';
import useAuthStore from '../context/authStore';

const avatarColors = [
    'bg-pink-600', 'bg-purple-600', 'bg-indigo-600',
    'bg-blue-600', 'bg-teal-600', 'bg-orange-600', 'bg-rose-600',
];

const getAvatarColor = (username) => {
    const index = username.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
};

const formatLastSeen = (date) => {
    if (!date) return 'recently';
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const Sidebar = ({ selectedUser, setSelectedUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { onlineUsers } = useSocketContext();
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Search term diye user list filter koro
    const filteredUsers = users.filter((u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full bg-whatsapp-panel flex flex-col h-screen">
            {/* Header */}
            <div className="p-4 bg-whatsapp-dark flex justify-between items-center sticky top-0 z-10 flex-shrink-0">
                <h2 className="text-white font-bold text-xl">Chats</h2>
                <button
                    onClick={logout}
                    className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-gray-700 active:bg-gray-600 transition"
                >
                    Logout
                </button>
            </div>

            {/* Search bar */}
            <div className="p-2 px-3 bg-whatsapp-panel flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search or start a new chat"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2.5 px-4 rounded-lg bg-gray-700/60 text-white text-base outline-none focus:ring-1 focus:ring-whatsapp-green placeholder-gray-400"
                />
            </div>

            {/* User List */}
            <div className="overflow-y-auto flex-1">
                {loading && (
                    <p className="text-gray-400 text-center p-4">Loading...</p>
                )}

                {!loading && filteredUsers.length === 0 && (
                    <p className="text-gray-400 text-center p-4">
                        {searchTerm ? 'No matching users' : 'No users found'}
                    </p>
                )}

                {filteredUsers.map((u) => {
                    const isOnline = onlineUsers.includes(u._id);
                    const isSelected = selectedUser?._id === u._id;

                    return (
                        <div
                            key={u._id}
                            onClick={() => setSelectedUser(u)}
                            className={`flex items-center gap-3 p-4 cursor-pointer active:bg-gray-700/70 hover:bg-gray-700/50 transition ${isSelected ? 'bg-gray-700/70' : ''
                                }`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full ${getAvatarColor(u.username)} flex items-center justify-center text-white font-semibold text-lg`}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-whatsapp-lightgreen rounded-full border-2 border-whatsapp-panel"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{u.username}</p>
                                <p className="text-gray-400 text-sm truncate">
                                    {isOnline ? 'Online' : `Last seen ${formatLastSeen(u.lastSeen)}`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;