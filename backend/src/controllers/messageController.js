const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getReceiverSocketId } = require('../sockets/socketManager');
const cloudinary = require('../config/cloudinary');



// Sob users list koro (sidebar e dekhanor jonno, nijeke chhara)
exports.getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      'username profilePic isOnline lastSeen'
    );
    res.status(200).json(users);
  } catch (error) {
    console.error('getUsersForSidebar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Specific user er sathe conversation er sob message fetch koro
exports.getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params; // jar sathe chat korbe tar id
    const myId = req.user._id;

    // Conversation ache kina khujo, duijoner moddhe
    const conversation = await Conversation.findOne({
      participants: { $all: [myId, otherUserId] },
    });

    if (!conversation) {
      return res.status(200).json([]); // conversation na thakle empty array
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 }); // purono theke notun order e

    res.status(200).json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Notun message send koro
exports.sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { text } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message text or image is required' });
    }

    let imageUrl = '';

    // Image thakले Cloudinary-e upload koro
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(base64Image);
      imageUrl = uploadResult.secure_url;
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      text: text || '',
      image: imageUrl,
    });

    conversation.lastMessage = text || '📷 Photo';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const io = req.app.get('io');
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Message delete koro
exports.deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Conversation theke receiver-er id ber koro (real-time emit korar jonno)
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    await Message.findByIdAndDelete(messageId);

    // Real-time delete emit koro
    const io = req.app.get('io');
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('messageDeleted', { messageId });
    }

    res.status(200).json({ message: 'Message deleted', messageId });
  } catch (error) {
    console.error('deleteMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Message edit koro
exports.editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.text = text;
    message.edited = true;
    await message.save();

    // Conversation theke receiver-er id ber koro
    const conversation = await Conversation.findById(message.conversationId);
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    // Real-time edit emit koro
    const io = req.app.get('io');
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('messageEdited', message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('editMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};