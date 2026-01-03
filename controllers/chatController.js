const { Conversation, Message, ConversationParticipant, Utilisateur } = require('../database/models');
const { Op } = require('sequelize');

exports.getConversations = async (req, res) => {
    try {
        const userId = req.utilisateur.id;
        console.log(`DEBUG CHAT: fetching conversations for user ${userId}`);

        const userConversations = await ConversationParticipant.findAll({
            where: { utilisateur_id: userId },
            attributes: ['conversation_id', 'unread_count', 'last_read_at']
        });
        console.log(`DEBUG CHAT: User ${userId} has ${userConversations.length} participations`);

        const conversationIds = userConversations.map(uc => uc.conversation_id);
        console.log(`DEBUG CHAT: Conv IDs: ${conversationIds.join(', ')}`);

        if (conversationIds.length === 0) {
            console.log(`DEBUG CHAT: No conversations for user ${userId}`);
            return res.json([]);
        }

        const fullConversations = await Conversation.findAll({
            where: { id: conversationIds },
            include: [
                {
                    model: Utilisateur,
                    as: 'participants',
                    attributes: ['id', 'nom', 'prenom', 'photo_url', 'role'],
                    through: { attributes: [] }
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['created_at', 'DESC']]
                }
            ],
            order: [['last_message_at', 'DESC']]
        });
        console.log(`DEBUG CHAT: Found ${fullConversations.length} full conversations`);

        // Merge participant metadata (unread count)
        const result = [];
        for (const conv of fullConversations) {
            try {
                const userMeta = (userConversations || []).find(uc => uc.conversation_id === conv.id);
                const convParticipants = conv.participants || [];
                const otherParticipants = convParticipants.filter(p =>
                    p.id && userId && p.id.toString().toLowerCase() !== userId.toString().toLowerCase()
                );

                const lastMessage = (conv.messages && conv.messages.length > 0) ? conv.messages[0] : null;

                // Determiner le nom de la conversation (si DIRECT, c'est le nom de l'autre)
                let name = "Discussion";
                let photo = null;
                if (conv.type === 'DIRECT' && otherParticipants.length > 0) {
                    const other = otherParticipants[0];
                    name = `${other.prenom} ${other.nom}`;
                    photo = other.photo_url;
                } else if (conv.type === 'GROUP') {
                    name = conv.name || "Groupe";
                }

                result.push({
                    id: conv.id,
                    type: conv.type,
                    name: name,
                    photo: photo,
                    unread_count: userMeta ? userMeta.unread_count : 0,
                    last_message: lastMessage ? {
                        content: lastMessage.content,
                        created_at: lastMessage.created_at,
                        sender_id: lastMessage.sender_id,
                        is_read: lastMessage.is_read
                    } : null,
                    participants: convParticipants,
                    updated_at: conv.updated_at
                });
            } catch (err) {
                console.error(`ERROR formatting conversation ${conv.id}:`, err);
            }
        }

        console.log(`DEBUG CHAT: Returning ${result.length} conversations for user ${userId}`);
        res.json(result);
    } catch (error) {
        console.error('ERROR in getConversations:', error);
        res.status(500).json({
            error: 'Erreur serveur lors de la récupération des conversations',
            details: error.message,
            stack: error.stack,
            errorObject: error
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const messages = await Message.findAndCountAll({
            where: { conversation_id: id },
            include: [
                {
                    model: Utilisateur,
                    as: 'sender',
                    attributes: ['id', 'nom', 'prenom', 'photo_url']
                }
            ],
            order: [['created_at', 'DESC']], // Plus récents d'abord pour le chat (pagination inverse)
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            messages: messages.rows.reverse(), // On renvoie dans l'ordre chronologique pour l'affichage
            total: messages.count,
            page: parseInt(page),
            totalPages: Math.ceil(messages.count / limit)
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            error: 'Erreur serveur lors de la récupération des messages',
            details: error.message,
            stack: error.stack
        });
    }
};

exports.startConversation = async (req, res) => {
    try {
        const senderId = req.utilisateur.id;
        const { targetUserId } = req.body;
        console.log(`DEBUG CHAT: User ${senderId} wants to start conversation with ${targetUserId}`);

        if (!targetUserId) {
            return res.status(400).json({ error: 'ID utilisateur cible requis' });
        }

        if (senderId === targetUserId) {
            return res.status(400).json({ error: 'Impossible de démarrer une discussion avec soi-même via cette méthode' });
        }

        // Logic refined: search for existing direct conversation with BOTH participants
        const candidates = await Conversation.findAll({
            where: { type: 'DIRECT' },
            include: [{
                model: ConversationParticipant,
                as: 'participants_meta',
                where: { utilisateur_id: [senderId, targetUserId] }
            }]
        });

        // A DIRECT conversation must have EXACTLY these 2 participants.
        // The include with where [senderId, targetUserId] will return meta records for those two.
        // We find the conversation that has meta records for BOTH.
        const found = candidates.find(c => c.participants_meta.length === 2);

        if (found) {
            console.log(`DEBUG CHAT: Found existing conversation: ${found.id} for users ${senderId} and ${targetUserId}`);
            console.log(`DEBUG CHAT: Participants matching were:`, found.participants_meta.map(p => p.utilisateur_id));
            return res.json({ id: found.id, isNew: false });
        }

        console.log(`DEBUG CHAT: Creating new DIRECT conversation`);
        const newConv = await Conversation.create({ type: 'DIRECT' });

        await ConversationParticipant.bulkCreate([
            { conversation_id: newConv.id, utilisateur_id: senderId },
            { conversation_id: newConv.id, utilisateur_id: targetUserId }
        ]);

        console.log(`DEBUG CHAT: New conversation created: ${newConv.id}`);
        res.status(201).json({ id: newConv.id, isNew: true });

    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({
            error: 'Erreur serveur lors de l\'initiation de la discussion',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.utilisateur.id;
        const { id: conversationId } = req.params;
        const { content, type = 'TEXT' } = req.body;

        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            type
        });

        // Update conversation timestamp
        await Conversation.update(
            { last_message_at: new Date() },
            { where: { id: conversationId } }
        );

        // Increment unread counts for OTHERS
        // 1. Get other participants
        const others = await ConversationParticipant.findAll({
            where: {
                conversation_id: conversationId,
                utilisateur_id: { [Op.ne]: senderId }
            }
        });

        // 2. Update their unread count
        for (const p of others) {
            await p.increment('unread_count');
        }

        // Fetch full message with sender info for emission and response
        const fullMessage = await Message.findOne({
            where: { id: message.id },
            include: [{ model: Utilisateur, as: 'sender', attributes: ['id', 'nom', 'prenom', 'photo_url'] }]
        });


        // Socket.io emission
        if (req.io) {
            console.log(`DEBUG CHAT: Emitting message to conversation_${conversationId}`);
            req.io.to(`conversation_${conversationId}`).emit('receive_message', fullMessage);

            // Also emit notification to each user's personal room to update their conversation list
            for (const p of others) {
                console.log(`DEBUG CHAT: Emitting notification to user_${p.utilisateur_id}`);
                req.io.to(`user_${p.utilisateur_id}`).emit('new_message_notification', {
                    conversationId,
                    message: fullMessage
                });
            }
        } else {
            console.log('DEBUG CHAT: req.io is MISSING');
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('ERROR in sendMessage:', error);
        res.status(500).json({
            error: 'Erreur serveur lors de l\'envoi du message',
            details: error.message,
            stack: error.stack,
            errorObject: error
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.utilisateur.id;
        const { id } = req.params; // conversationId

        await ConversationParticipant.update(
            { unread_count: 0, last_read_at: new Date() },
            { where: { conversation_id: id, utilisateur_id: userId } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({
            error: 'Erreur serveur lors du marquage comme lu',
            details: error.message,
            stack: error.stack
        });
    }
};
