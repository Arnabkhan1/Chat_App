import { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import useAuthStore from '../context/authStore';
import { getMessages, sendMessage, deleteMessage, editMessage } from '../services/messageService';

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

const ChatWindow = ({ selectedUser, onBack }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [hoveredId, setHoveredId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    const { socket } = useSocketContext();
    const currentUser = useAuthStore((state) => state.user);

    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const data = await getMessages(selectedUser._id);
                setMessages(data);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (newMessage.senderId === selectedUser?._id) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        };

        const handleMessageEdited = (updatedMessage) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
            );
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('messageDeleted', handleMessageDeleted);
        socket.on('messageEdited', handleMessageEdited);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('messageDeleted', handleMessageDeleted);
            socket.off('messageEdited', handleMessageEdited);
        };
    }, [socket, selectedUser, currentUser]);

    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = ({ senderId }) => {
            if (senderId === selectedUser?._id) setOtherUserTyping(true);
        };
        const handleUserStopTyping = ({ senderId }) => {
            if (senderId === selectedUser?._id) setOtherUserTyping(false);
        };

        socket.on('userTyping', handleUserTyping);
        socket.on('userStopTyping', handleUserStopTyping);

        return () => {
            socket.off('userTyping', handleUserTyping);
            socket.off('userStopTyping', handleUserStopTyping);
        };
    }, [socket, selectedUser]);

    useEffect(() => {
        setOtherUserTyping(false);
    }, [selectedUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket || !selectedUser) return;

        socket.emit('typing', { receiverId: selectedUser._id, senderId: currentUser._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { receiverId: selectedUser._id, senderId: currentUser._id });
        }, 2000);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImagePreview = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imageFile) return;

        try {
            const newMessage = await sendMessage(selectedUser._id, text, imageFile);
            setMessages((prev) => [...prev, newMessage]);
            setText('');
            removeImagePreview();

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.emit('stopTyping', { receiverId: selectedUser._id, senderId: currentUser._id });
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleDelete = async (messageId) => {
        try {
            await deleteMessage(messageId);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const startEdit = (msg) => {
        setEditingId(msg._id);
        setEditText(msg.text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleEditSubmit = async (e, messageId) => {
        e.preventDefault();
        if (!editText.trim()) return;

        try {
            const updatedMessage = await editMessage(messageId, editText);
            setMessages((prev) =>
                prev.map((m) => (m._id === messageId ? updatedMessage : m))
            );
            setEditingId(null);
            setEditText('');
        } catch (error) {
            console.error('Failed to edit message:', error);
        }
    };

    if (!selectedUser) {
        return (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-nebula-bg h-screen gap-3">
                <div className="w-16 h-16 rounded-full bg-nebula-elevated flex items-center justify-center text-3xl">
                    💬
                </div>
                <p className="text-nebula-muted text-lg">Select a chat to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-nebula-bg">
            {/* Header */}
            <div className="p-3 md:p-4 bg-nebula-panel flex items-center gap-3 border-b border-nebula-border flex-shrink-0">
                <button
                    onClick={onBack}
                    className="md:hidden text-nebula-muted hover:text-white text-2xl px-1 -ml-1 flex-shrink-0"
                    aria-label="Back to chats"
                >
                    ←
                </button>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedUser.username)} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md`}>
                    {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-white font-medium truncate">{selectedUser.username}</p>
                    {otherUserTyping && (
                        <div className="flex items-center gap-1">
                            <span className="typing-dot w-1.5 h-1.5 bg-nebula-glow rounded-full"></span>
                            <span className="typing-dot w-1.5 h-1.5 bg-nebula-glow rounded-full"></span>
                            <span className="typing-dot w-1.5 h-1.5 bg-nebula-glow rounded-full"></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
                {loading && (
                    <p className="text-nebula-muted text-center">Loading messages...</p>
                )}

                {!loading &&
                    messages.map((msg) => {
                        const isMine = msg.senderId === currentUser._id;
                        const isEditing = editingId === msg._id;

                        return (
                            <div
                                key={msg._id}
                                className={`flex message-bubble ${isMine ? 'justify-end' : 'justify-start'}`}
                                onMouseEnter={() => setHoveredId(msg._id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onTouchStart={() => setHoveredId(msg._id)}
                            >
                                <div className="relative max-w-[80%] md:max-w-md">
                                    {isEditing ? (
                                        <form onSubmit={(e) => handleEditSubmit(e, msg._id)} className="flex gap-1">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="p-2 rounded-lg bg-nebula-elevated text-white outline-none border border-nebula-primary text-sm flex-1"
                                                autoFocus
                                            />
                                            <button type="submit" className="text-nebula-glow text-sm px-2">✓</button>
                                            <button type="button" onClick={cancelEdit} className="text-rose-400 text-sm px-2">✕</button>
                                        </form>
                                    ) : (
                                        <div
                                            className={`p-3 px-4 rounded-2xl text-white ${
                                                isMine
                                                    ? 'bubble-gradient rounded-tr-sm'
                                                    : 'bg-nebula-elevated rounded-tl-sm'
                                            }`}
                                        >
                                            {msg.image && (
                                                <img
                                                    src={msg.image}
                                                    alt="shared"
                                                    className="rounded-xl mb-1 max-w-full max-h-60 object-cover"
                                                />
                                            )}
                                            {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}
                                            <p className={`text-xs mt-1 text-right ${isMine ? 'text-purple-200/80' : 'text-nebula-muted'}`}>
                                                {msg.edited && <span className="italic mr-1">edited</span>}
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {isMine && hoveredId === msg._id && !isEditing && (
                                        <div className="absolute -top-3 right-2 flex gap-1 bg-nebula-panel border border-nebula-border rounded-lg px-1 shadow-lg">
                                            <button
                                                onClick={() => startEdit(msg)}
                                                className="text-nebula-muted hover:text-white text-xs px-2 py-1"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(msg._id)}
                                                className="text-nebula-muted hover:text-rose-400 text-xs px-2 py-1"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                <div ref={messagesEndRef}></div>
            </div>

            {/* Input box */}
            <form onSubmit={handleSend} className="bg-nebula-panel border-t border-nebula-border flex-shrink-0">
                {imagePreview && (
                    <div className="p-2 px-3 flex items-center gap-2 border-b border-nebula-border">
                        <img src={imagePreview} alt="preview" className="h-16 rounded-lg" />
                        <button type="button" onClick={removeImagePreview} className="text-rose-400 text-sm">
                            Remove
                        </button>
                    </div>
                )}

                <div className="p-2 md:p-3 flex items-center gap-2 safe-area-bottom">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-nebula-muted hover:text-white text-2xl px-2 flex-shrink-0 transition"
                        title="Send image"
                    >
                        📎
                    </button>
                    <input
                        type="text"
                        value={text}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 p-3 rounded-full bg-nebula-elevated text-white outline-none border border-transparent focus:border-nebula-primary text-base min-w-0 transition"
                    />
                    <button
                        type="submit"
                        className="bubble-gradient text-white p-3 rounded-full px-5 font-medium hover:opacity-90 active:opacity-80 transition flex-shrink-0"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;