import React from 'react';
import { Badge, Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 20,
    flexGrow: 1,
  },
  username: {
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  previewText: {
    fontSize: 12,
    color: '#9CADC8',
    letterSpacing: -0.17,
  },
  unReadText: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    letterSpacing: -0.17,
  },
  details: {
    flexGrow: 3,
  },
  badge: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    flexGrow: 1,
    paddingRight: '1rem',
  },
}));

const ChatContent = ({ conversation, activeConversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;
  const unreadMessages = conversation.messages.filter(
    (message) => message.isRead === false && message.senderId === otherUser.id
  ).length;
  return (
    <Box className={classes.root}>
      <Box className={classes.details}>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography
          className={unreadMessages ? classes.unReadText : classes.previewText}
        >
          {latestMessageText}
        </Typography>
      </Box>
      <Box className={classes.badge}>
        <Badge badgeContent={unreadMessages} color="primary" />
      </Box>
    </Box>
  );
};

export default ChatContent;
