const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const Group = require("./group");
const Members = require("./members");

// associations

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: "user1" });
Conversation.belongsTo(User, { as: "user2" });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);

Group.belongsTo(Conversation, { as: "conversationId" });
Members.belongsTo(Group, { as: "groupId" });
Group.hasMany(Members);
Members.belongsTo(User, { as: "userId" });
User.hasMany(Members);

module.exports = {
  User,
  Conversation,
  Message,
};
