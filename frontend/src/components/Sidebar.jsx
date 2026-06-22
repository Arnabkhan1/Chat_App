import { useState, useEffect } from 'react';
import { getUsers } from '../services/messageService';
import { useSocketContext } from '../context/SocketContext';
import useAuthStore from '../context/authStore';

// Gradient avatar pairs - more premium than flat colors
const avatarGradients = [
    'from-purple-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-blue-500 to-cyan-500',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-fuchsia-500 to-purple-600',
    'from-indigo-500 to-blue-600',
];

const getAvatarGradient = (username) => {
    const index = username.charCodeAt(0) % avatarGradients.length;
    return avatarGradients[index];
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

    const filteredUsers = users.filter((u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full bg-nebula-panel flex flex-col h-screen">
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-nebula-border flex-shrink-0">
                <h2 className="text-white font-bold text-xl tracking-tight">Chats</h2>
                <button
                    onClick={logout}
                    className="text-nebula-muted hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-nebula-elevated active:bg-nebula-elevated transition"
                >
                    Logout
                </button>
            </div>

            {/* Search bar */}
            <div className="p-3 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search or start a new chat"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2.5 px-4 rounded-xl bg-nebula-elevated text-white text-base outline-none border border-transparent focus:border-nebula-primary placeholder-nebula-muted transition"
                />
            </div>

            {/* User List */}
            <div className="overflow-y-auto flex-1 px-2 pb-2 space-y-0.5">
                {loading && (
                    <p className="text-nebula-muted text-center p-4">Loading...</p>
                )}

                {!loading && filteredUsers.length === 0 && (
                    <p className="text-nebula-muted text-center p-4">
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
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                                isSelected
                                    ? 'bg-nebula-elevated'
                                    : 'active:bg-nebula-elevated/70 hover:bg-nebula-elevated/50'
                            }`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(u.username)} flex items-center justify-center text-white font-semibold text-lg shadow-md`}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-nebula-glow rounded-full border-2 border-nebula-panel glow-dot"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{u.username}</p>
                                <p className="text-nebula-muted text-sm truncate">
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