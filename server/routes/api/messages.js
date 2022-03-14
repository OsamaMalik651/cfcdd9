const router = require("express").Router();
const { Op } = require("sequelize");
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");

router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { senderId, conversationId } = req.query;
    const userId = req.user.id;
    const userBelongsToConversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
    });
    if (!userBelongsToConversation) {
      return res.sendStatus(403);
    }
    const count = await Message.count({
      where: {
        senderId: senderId,
        conversationId: conversationId,
        isRead: false,
      },
    });
    const response = count > 0 ? true : false;
    res.send(response);
  } catch (error) {
    console.log(error);
  }
});
// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      const message = await Message.create({
        senderId,
        text,
        conversationId,
        isRead: false,
      });
      return res.json({ message, sender });
    }
    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    let conversation = await Conversation.findConversation(
      senderId,
      recipientId
    );

    if (!conversation) {
      // create conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
    }
    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
      isRead: false,
    });
    res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { conversationId, senderId } = req.body;
    const response = await Message.update(
      {
        isRead: true,
      },
      {
        where: {
          senderId: senderId,
          conversationId: conversationId,
        },
      }
    );
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
