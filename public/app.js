/* eslint-disable no-undef */
// Establish a socket.io connection
const socket = io('http://localhost:3030');

// Initialize the feathers client through socket.io
const client = feathers();
client.configure(feathers.socketio(socket));

const setup = async () => {
  setUser(await client.service('users').create({ online: true }));
  client.service('messages').on('created', addMessage);
  client.service('users').on('created', handleUser);
  client.service('users').on('patched', handleUser);

  // Show the last message first, add all the messages
  const messages = await client.service('messages').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 200,
    },
  });
  messages.data.reverse().forEach(addMessage);

  // Set up the user list
  const users = await client.service('users').find({
    query: {
      _id: {
        $ne: '__usernum__',
      },
      online: true,
      $limit: 200,
    },
  });
  users.data.forEach(handleUser);

  window.addEventListener('beforeunload', leavePage);
};

let user;

const setUser = newUser => {
  user = newUser;
  const title = document.getElementById('chat-title');
  title.innerHTML = 'You are ' + user.name;
};

const addMessage = message => {
  const chat = document.getElementById('chat');
  const time = moment(message.createdAt).format('HH:mm');
  const sender = message.user;
  const isUser = checkUser(sender, user);

  const messageHTML = `<span class="message ${isUser}">
        <span class="time">${time}</span>
        <span class="text">
          <span style="color: #${sender.color}">${sender.name}</span>: ${message.text}
        </span>
      </span>`;
  chat.insertAdjacentHTML('beforeend', messageHTML);
  scrollToBottom(chat);
};

const handleUser = newUser => {
  if (!newUser.online) {
    removeUser(newUser);
    return;
  }

  // Get the user list and potential old user node
  const userlist = document.getElementById('userlist');
  const oldUser = document.getElementById(newUser._id);

  // Generate the user node
  const isUser = checkUser(newUser, user);
  const userHTML =
    `<span id="${newUser._id}" class="${isUser}" style="color: #${newUser.color}">${newUser.name}</span>`;
  const template = document.createElement("template");
  template.innerHTML = userHTML;
  const userNode = template.content.cloneNode(true);

  // If oldUser existed replace it, otherwise append the newuser
  if (oldUser !== null) {
    userlist.replaceChild(userNode, oldUser);
  } else {
    userlist.insertAdjacentHTML('beforeend', userHTML);
  }
  scrollToBottom(userlist);
};

const leavePage = async () => {
  // Set user as offline when leaving page
  socket.emit('patch', 'users', user._id, { online: false }, () => { /* Noop */ });
};

function checkUser(u1, u2) {
  if (u1._id === u2._id) {
    return 'user';
  } else {
    return '';
  }
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

function removeUser(maybeUser) {
  const user = document.getElementById(maybeUser._id);
  if (user !== null) {
    user.remove();
  }
}

setup();
