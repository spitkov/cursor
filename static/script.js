const socket = io();
let cursorSpace;
let nameForm;
let chatContainer;
let chatInput;
let chatMessages;

document.addEventListener('DOMContentLoaded', () => {
    cursorSpace = document.getElementById('cursor-space');
    nameForm = document.getElementById('name-form');
    chatContainer = document.getElementById('chat-container');
    chatInput = document.getElementById('chat-input');
    chatMessages = document.getElementById('chat-messages');

    // Hide chat container initially
    chatContainer.style.display = 'none';

    // Add enter key listener for chat
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

function registerName() {
    const nameInput = document.getElementById('name-input');
    const name = nameInput.value.trim();
    
    if (name) {
        socket.emit('register', name);
        nameForm.classList.add('hidden');
        cursorSpace.classList.remove('hidden');
        
        // Start tracking mouse movement
        document.addEventListener('mousemove', handleMouseMove);

        // Show chat container after a short delay
        setTimeout(() => {
            chatContainer.style.display = 'flex';
        }, 1000);
    }
}

function handleMouseMove(e) {
    const data = {
        x: e.clientX,
        y: e.clientY
    };
    socket.emit('mouse_move', data);
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chat_message', { message: message });
        chatInput.value = '';
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('chat_message', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <span class="username">${data.username}</span>
        <span class="timestamp">${data.timestamp}</span>
        <span class="message">${data.message}</span>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
});

// Existing cursor-related socket listeners
socket.on('cursor_move', (data) => {
    let cursor = document.getElementById(`cursor-${data.name}`);
    let label = document.getElementById(`label-${data.name}`);
    
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${data.name}`;
        cursor.className = 'cursor';
        cursorSpace.appendChild(cursor);
        
        label = document.createElement('div');
        label.id = `label-${data.name}`;
        label.className = 'cursor-label';
        label.textContent = data.name;
        cursorSpace.appendChild(label);
    }
    
    cursor.style.left = `${data.x}px`;
    cursor.style.top = `${data.y}px`;
    label.style.left = `${data.x}px`;
    label.style.top = `${data.y}px`;
});

socket.on('user_disconnected', (data) => {
    const cursor = document.getElementById(`cursor-${data.name}`);
    const label = document.getElementById(`label-${data.name}`);
    
    if (cursor) cursor.remove();
    if (label) label.remove();
}); 