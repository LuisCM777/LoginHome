const STORAGE_KEY = 'users';

function getUsers() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Invalid JSON in storage, resetting users');
    }
  }
  const defaultUsers = [
    { username: 'admin', password: 'admin123', email: 'admin@example.com' }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function showMessage(msg, isError = true) {
  let container = document.getElementById('message');
  if (!container) {
    container = document.createElement('div');
    container.id = 'message';
    document.body.prepend(container);
  }
  container.textContent = msg;
  container.style.color = isError ? 'red' : 'green';
}

function login(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    showMessage('Login successful!', false);
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } else {
    showMessage('Invalid username or password.');
  }
}

function register(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const email = document.getElementById('email').value.trim();

  if (!username || !password || !email) {
    showMessage('All fields are required.');
    return;
  }

  const users = getUsers();
  const exists = users.some(u => u.username === username);
  if (exists) {
    showMessage('Username already exists. Choose another.');
    return;
  }

  users.push({ username, password, email });
  saveUsers(users);
  showMessage('Registration successful! Redirecting to login...', false);
  setTimeout(() => { window.location.href = 'login.html'; }, 1000);
}
