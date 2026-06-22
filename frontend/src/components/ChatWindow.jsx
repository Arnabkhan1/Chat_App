import { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import useAuthStore from '../context/authStore';
import { getMessages, sendMessage, deleteMessage, editMessage } from '../services/messageService';

const ChatWindow = ({ selectedUser }) => {
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


    const avatarColors = [
        'bg-pink-600', 'bg-purple-600', 'bg-indigo-600',
        'bg-blue-600', 'bg-teal-600', 'bg-orange-600', 'bg-rose-600',
    ];

    const getAvatarColor = (username) => {
        const index = username.charCodeAt(0) % avatarColors.length;
        return avatarColors[index];
    };

    // Selected user change hole purono messages fetch koro
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

    // Real-time: notun message, delete, edit listen koro
    // NOTE: shudhu EKTA useEffect e shob socket listener rakha hocche,
    // duplicate useEffect thakle same event duibar register hoy -> duplicate message bug
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            // Shudhu OPPOSITE user-er pathano message socket theke add koro
            // Nijer pathano message already handleSend-e API response theke add hoye geche
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

    // Real-time: opposite user typing korche kina listen koro
    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = ({ senderId }) => {
            if (senderId === selectedUser?._id) {
                setOtherUserTyping(true);
            }
        };

        const handleUserStopTyping = ({ senderId }) => {
            if (senderId === selectedUser?._id) {
                setOtherUserTyping(false);
            }
        };

        socket.on('userTyping', handleUserTyping);
        socket.on('userStopTyping', handleUserStopTyping);

        return () => {
            socket.off('userTyping', handleUserTyping);
            socket.off('userStopTyping', handleUserStopTyping);
        };
    }, [socket, selectedUser]);

    // Selected user change hole otherUserTyping reset koro
    useEffect(() => {
        setOtherUserTyping(false);
    }, [selectedUser]);

    // Notun message ashle auto scroll niche
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleTyping = (e) => {
        setText(e.target.value);

        if (!socket || !selectedUser) return;

        socket.emit('typing', {
            receiverId: selectedUser._id,
            senderId: currentUser._id,
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', {
                receiverId: selectedUser._id,
                senderId: currentUser._id,
            });
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
            socket.emit('stopTyping', {
                receiverId: selectedUser._id,
                senderId: currentUser._id,
            });
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
            <div className="hidden md:flex flex-1 items-center justify-center bg-whatsapp-dark">
                <p className="text-gray-400 text-lg">
                    Select a chat to start messaging
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-whatsapp-dark">
            {/* Header */}
            <div className="p-4 bg-whatsapp-panel flex items-center gap-3 border-b border-gray-700">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedUser.username)} flex items-center justify-center text-white font-semibold`}>
                    {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-white font-medium">{selectedUser.username}</p>
                    {otherUserTyping && (
                        <div className="flex items-center gap-1">
                            <span className="typing-dot w-1.5 h-1.5 bg-whatsapp-lightgreen rounded-full"></span>
                            <span className="typing-dot w-1.5 h-1.5 bg-whatsapp-lightgreen rounded-full"></span>
                            <span className="typing-dot w-1.5 h-1.5 bg-whatsapp-lightgreen rounded-full"></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading && (
                    <p className="text-gray-400 text-center">Loading messages...</p>
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
                            >
                                <div className="relative max-w-xs md:max-w-md">
                                    {isEditing ? (
                                        <form onSubmit={(e) => handleEditSubmit(e, msg._id)} className="flex gap-1">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="p-2 rounded bg-gray-600 text-white outline-none text-sm flex-1"
                                                autoFocus
                                            />
                                            <button type="submit" className="text-whatsapp-lightgreen text-sm px-2">
                                                ✓
                                            </button>
                                            <button type="button" onClick={cancelEdit} className="text-red-400 text-sm px-2">
                                                ✕
                                            </button>
                                        </form>
                                    ) : (
                                        <div
                                            className={`p-2 px-3 rounded-lg text-white ${isMine ? 'bg-whatsapp-bubble' : 'bg-gray-700'
                                                }`}
                                        >
                                            {msg.image && (
                                                <img
                                                    src={msg.image}
                                                    alt="shared"
                                                    className="rounded-lg mb-1 max-w-full max-h-60 object-cover"
                                                />
                                            )}
                                            {msg.text && <p>{msg.text}</p>}
                                            <p className="text-xs text-gray-300 mt-1 text-right">
                                                {msg.edited && <span className="italic mr-1">edited</span>}
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Hover korle Edit/Delete option (shudhu nijer message-e) */}
                                    {isMine && hoveredId === msg._id && !isEditing && (
                                        <div className="absolute -top-3 right-2 flex gap-1 bg-gray-800 rounded px-1">
                                            <button
                                                onClick={() => startEdit(msg)}
                                                className="text-gray-300 hover:text-white text-xs px-1"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(msg._id)}
                                                className="text-gray-300 hover:text-red-400 text-xs px-1"
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
            <form
                onSubmit={handleSend}
                className="bg-whatsapp-panel"
            >
                {/* Image preview, thakले */}
                {imagePreview && (
                    <div className="p-2 px-3 flex items-center gap-2 border-b border-gray-700">
                        <img src={imagePreview} alt="preview" className="h-16 rounded" />
                        <button
                            type="button"
                            onClick={removeImagePreview}
                            className="text-red-400 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                )}

                <div className="p-3 flex items-center gap-2">
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
                        className="text-gray-300 hover:text-white text-xl px-2"
                        title="Send image"
                    >
                        📎
                    </button>
                    <input
                        type="text"
                        value={text}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 p-3 rounded-full bg-gray-700 text-white outline-none focus:ring-2 focus:ring-whatsapp-green"
                    />
                    <button
                        type="submit"
                        className="bg-whatsapp-green text-white p-3 rounded-full px-5 hover:bg-whatsapp-lightgreen transition"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;