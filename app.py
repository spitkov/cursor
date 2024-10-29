from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit
from collections import deque
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app)

# Store active users and their cursor positions
active_users = {}
# Store last 15 messages
message_history = deque(maxlen=15)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('register')
def handle_register(name):
    session['name'] = name
    # Store the new user's initial position
    active_users[name] = {
        'x': 0,
        'y': 0
    }
    
    # Send all existing users' cursor positions to the new user only
    for user_name, position in active_users.items():
        emit('cursor_move', {
            'name': user_name,
            'x': position['x'],
            'y': position['y']
        })
    
    # Send message history to new user
    for msg in message_history:
        emit('chat_message', msg)

@socketio.on('mouse_move')
def handle_mouse_move(data):
    name = session.get('name')
    if name:
        active_users[name] = {
            'x': data['x'],
            'y': data['y']
        }
        data['name'] = name
        emit('cursor_move', data, broadcast=True)

@socketio.on('chat_message')
def handle_message(data):
    name = session.get('name')
    if name:
        message_data = {
            'username': name,
            'message': data['message'],
            'timestamp': datetime.now().strftime('%H:%M')
        }
        message_history.append(message_data)
        emit('chat_message', message_data, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    name = session.get('name')
    if name and name in active_users:
        del active_users[name]
        emit('user_disconnected', {'name': name}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True,port=3002) 