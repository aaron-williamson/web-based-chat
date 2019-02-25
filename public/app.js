/* eslint-disable no-undef */
// ESLint doesn't pick up on the imports from HTML so disable it here

// Establish a socket.io connection
const socket = io();

// Initialize the feathers client through socket.io
const client = feathers();
client.configure(feathers.socketio(socket));

// Global variable to store the current user in
let user;

// Function to perform web application setup
const setup = async () => {
  await getOrSetUser();
  document.addEventListener('submit', handleSubmit);
  client.service('messages').on('created', addMessage);
  client.service('users').on('created', user => handleUser(user, true));
  client.service('users').on('patched', user => handleUser(user, true));

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
      onlineCount: { $gt: 0 },
      $limit: 200,
    },
  });
  users.data.forEach(user => handleUser(user, false));

  window.addEventListener('beforeunload', leavePage);
  addSystemMessage(`Welcome to the chat! You are ${user.name}.`);

  document.getElementById('toggle-userlist').addEventListener('click', toggleUserList);
};

// Either set an existing user stored in the chat_user cookie or get a new user
const getOrSetUser = async () => {
  const cookieUser = Cookies.get('chat_user');

  // If there is no user cookie, create a new user
  if (cookieUser === undefined) {
    setUser(await client.service('users').create({}));
    return;
  }

  try { // Try to get the previous user
    const previousUser = await client.service('users').get(cookieUser);
    setUser(previousUser);
  } catch (e) { // If the previous user fails, create a new user
    setUser(await client.service('users').create({}));
  }

  // Tell the server we're online
  socket.emit('login', user._id);
};

// Set the current user
const setUser = newUser => {
  user = newUser;
  const title = document.getElementById('chat-title');
  title.innerHTML = 'You are ' + user.name;

  // Cookie stores user and expires in 1 day
  Cookies.set('chat_user', newUser._id, { expires: 1 });
};

// Handle submitting a new message
const handleSubmit = async event => {
  // Return if we're not sending a message
  if (event.target.id !== 'send-message') {
    return;
  }

  // Get the message text input field
  const input = document.querySelector('[name="text"]');

  // Don't actually submit
  event.preventDefault();

  // Send the message if it wasn't a command
  if (!(await handleCommands(input.value))) {
    await client.service('messages').create({
      text: input.value,
      user: user._id,
    });
  }

  // Reset the input field
  input.value = '';
};

// Handle a new message
const addMessage = message => {
  const chat = document.getElementById('chat');
  const time = moment(message.createdAt).format('HH:mm');
  const longTime = moment(message.createdAt).format();
  const sender = message.user;
  const isUser = usersEqual(sender, user) ? 'user' : '';

  const messageHTML = `<span class="message ${isUser}">
        <span class="time" title="${longTime}">${time}</span>
        <span class="text">
          <span style="color: #${sender.color}">${sender.name}</span>: ${message.text}
        </span>
      </span>`;
  chat.insertAdjacentHTML('beforeend', messageHTML);
  scrollToBottom(chat);
};

// Handle a new user or a modified user, optionally showing a join message from the system
const handleUser = (newUser, showJoinMessage = false) => {
  if (newUser.onlineCount < 1) {
    removeUser(newUser);
    return;
  }

  // Get the user list and potential old user node
  const userlist = document.getElementById('userlist');
  const oldUser = document.getElementById(newUser._id);

  // Generate the user node
  let isUser = '';
  if (usersEqual(newUser, user)) {
    isUser = 'user';
  }
  const userHTML =
    `<span id="${newUser._id}" class="${isUser}" style="color: #${newUser.color}">${newUser.name}</span>`;
  const template = document.createElement('template');
  template.innerHTML = userHTML;
  const userNode = template.content.cloneNode(true);

  // If oldUser existed replace it, otherwise append the newuser
  if (oldUser !== null) {
    userlist.replaceChild(userNode, oldUser);
  } else {
    userlist.insertAdjacentHTML('beforeend', userHTML);

    if (showJoinMessage && newUser._id != user._id) {
      addSystemMessage(`${newUser.name} has joined the chat.`);
    }
  }
  scrollToBottom(userlist);
};

// Executed upon leaving the page, used for "logging off"
const leavePage = async () => {
  // Try to gracefully close the socket
  socket.disconnect();
};

// Handle input as a command instead of a message if it starts with '/'
const handleCommands = async text => {
  // Return if it's not a command
  if (text[0] !== '/') {
    return false;
  }

  const sliceEnd = text.indexOf(' ');
  let command;
  let arg = '';
  if (sliceEnd === -1) {
    command = text.slice(1);
  } else {
    command = text.slice(1, sliceEnd);
    arg = text.slice(text.indexOf(' ') + 1);
  }

  switch (command) {
  case 'nick':
    try {
      const newUser = await client.service('users').patch(user._id, { name: arg });
      addSystemMessage(`Username successfully changed to: ${arg}.`);
      setUser(newUser);
    } catch (e) {
      let errorMessage;
      if (e.data && e.data[0]) {
        errorMessage = `Error changing username: ${e.data[0].message}`;
      } else {
        errorMessage = `Error changing username: ${e.message}`;
      }

      addSystemMessage(errorMessage);
    }
    break;
  case 'nickcolor':
    try {
      await client.service('users').patch(user._id, { color: arg });
      addSystemMessage('User color successfully changed.');
    } catch (e) {
      let errorMessage;
      if (e.data && e.data[0]) {
        errorMessage = `Error changing user color: ${e.data[0].message}`;
      } else {
        errorMessage = `Error changing user color ${e.message}`;
      }

      addSystemMessage(errorMessage);
    }
    break;
  case 'clear-system': {
    const systemMessages = document.querySelectorAll('.system-message');
    systemMessages.forEach(elem => elem.remove());
    break;
  }
  default:
    addSystemMessage(`Unknown command: "${command}"`);
  }

  return true;
};

// Compare two users
function usersEqual(u1, u2) {
  return u1._id === u2._id;
}

// Scroll to the bottom of the given element
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

// Remove a user from the userlist, show a 'has left the chat' message
function removeUser(maybeUser) {
  const user = document.getElementById(maybeUser._id);
  if (user !== null) {
    user.remove();

    if (maybeUser.onlineCount < 1) {
      addSystemMessage(`${maybeUser.name} has left the chat.`);
    }
  }
}

// Add a message from the system
function addSystemMessage(messageText) {
  const chat = document.getElementById('chat');

  const messageHTML = `<span class="message system-message">${messageText}</span>`;
  chat.insertAdjacentHTML('beforeend', messageHTML);
  scrollToBottom(chat);
}

// Toggle the userlist for mobile UI
function toggleUserList() {
  const userlist = document.getElementById('userlist');
  const arrow = document.querySelector('#toggle-userlist > i');
  const button = document.getElementById('toggle-userlist');

  if (userlist.classList.contains('mobile-hidden')) {
    userlist.classList.remove('mobile-hidden');
    arrow.classList.remove('left');
    button.classList.remove('padding-arrow-left');
    arrow.classList.add('right');
    button.classList.add('padding-arrow-right');
  } else {
    userlist.classList.add('mobile-hidden');
    arrow.classList.remove('right');
    button.classList.remove('padding-arrow-right');
    arrow.classList.add('left');
    button.classList.add('padding-arrow-left');
  }
}

// After declaring all the functions, finally set up the application
setup();
