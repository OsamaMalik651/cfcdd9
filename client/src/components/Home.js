import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [checkForUnreadMessage, setCheckForUnreadMessage] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      const newConversations = conversations.map((convo) => {
        if (convo.otherUser.id === recipientId) {
          const newConvo = { ...convo };
          newConvo.messages = [...newConvo.messages, message];
          newConvo.latestMessageText = message.text;
          newConvo.id = message.conversationId;
          return newConvo;
        }
        return convo;
      });
      setConversations(newConversations);
    },
    [setConversations, conversations]
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      let { message, sender = null } = data;
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
        };
        newConvo.latestMessageText = message.text;
        setConversations((prev) => [newConvo, ...prev]);
      }
      //Check if a message is received for an active conversation.
      //If Yes, change the isRead property to True and update at the server as well
      //before adding to local conversation state.
      if (
        activeConversation &&
        message.conversationId ===
          getActiveConversation(activeConversation).id &&
        message.senderId !== user.id
      ) {
        message = { ...message, isRead: true };
        const data = {
          conversationId: message.conversationId,
          senderId: message.senderId,
        };
        clearUnreadMessages(data);
        chatOpened(data);
      }
      const newConversations = conversations.map((convo) => {
        if (convo.id === message.conversationId) {
          const newConvo = { ...convo };
          newConvo.messages = [...newConvo.messages, message];
          newConvo.latestMessageText = message.text;
          newConvo.id = message.conversationId;
          return newConvo;
        }
        return convo;
      });

      setConversations(newConversations);
    },
    [setConversations, conversations, activeConversation]
  );

  const chatOpened = (data) => {
    const { conversationId, senderId } = data;
    socket.emit('chat-opened', {
      conversationId,
      senderId,
    });
  };

  const setActiveChat = useCallback((data) => {
    const { username } = data;
    setActiveConversation(username);
    if (data.conversationId) {
      const data1 = {
        conversationId: data.conversationId,
        senderId: data.senderId,
      };
      clearUnreadMessages(data1);
      chatOpened(data);
    }
  });

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/conversations');
      data.forEach((conversation) => {
        conversation.messages.sort((a, b) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      });
      setConversations(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const chatOpenedbyReciepient = useCallback(
    (data) => {
      const data1 = {
        conversationId: data.data.conversationId,
        senderId: data.data.senderId,
      };
      clearUnreadMessages(data1);
      fetchConversations();
    },
    [fetchConversations]
  );
  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);
    socket.on('chat-opened', chatOpenedbyReciepient);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
      socket.off('chat-opened', chatOpenedbyReciepient);
    };
  }, [
    addMessageToConversation,
    addOnlineUser,
    removeOfflineUser,
    chatOpenedbyReciepient,
    socket,
  ]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const clearUnreadMessages = useCallback(async (data) => {
    const response = await axios.put('/api/messages', data);
    if (response.status === 204) {
      await fetchConversations();
    }
  }, []);

  const checkForUnreadMessagesfromOtherUser = useCallback(async (data) => {
    const { conversationId, senderId } = data;
    try {
      let response = await axios.get('/api/messages/', {
        params: {
          senderId,
          conversationId,
        },
      });
      setCheckForUnreadMessage(response.data);
    } catch (error) {}
  });
  const getActiveConversation = useCallback(
    (activeConversation) => {
      return conversations.find(
        (conversation) => conversation.otherUser.username === activeConversation
      );
    },
    [conversations]
  );

  useEffect(() => {
    if (!activeConversation) return;
    const conversation = getActiveConversation(activeConversation);
    setCurrentConversation(conversation);
    const data = {
      conversationId: conversation.id,
      senderId: conversation.otherUser.id,
    };
    if (activeConversation && !currentConversation) {
      checkForUnreadMessagesfromOtherUser(data);
    }
  }, [
    activeConversation,
    getActiveConversation,
    conversations,
    currentConversation,
    checkForUnreadMessagesfromOtherUser,
  ]);

  useEffect(() => {
    if (activeConversation && currentConversation) {
      const conversation = currentConversation;
      const data = {
        conversationId: conversation.id,
        senderId: conversation.otherUser.id,
      };
      if (checkForUnreadMessage === true) {
        clearUnreadMessages(data);
      }
    }
  }, [
    activeConversation,
    currentConversation,
    clearUnreadMessages,
    checkForUnreadMessage,
  ]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };
  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
          activeConversation={activeConversation}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
