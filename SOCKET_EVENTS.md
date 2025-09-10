# Socket.IO Events Documentation

## User Status Events

### Client to Server Events

#### `joinUserStatus`
- **Purpose**: Join the user status tracking system
- **Data**: `{ userId: string }`
- **Response**: 
  - `onlineUsers`: Array of currently online user IDs
  - `userOnline`: Broadcast to other users when this user comes online

#### `userOnline`
- **Purpose**: Manually mark user as online (optional)
- **Data**: `{ userId: string }`
- **Response**: `userOnline` broadcast to all other users

#### `userOffline`
- **Purpose**: Manually mark user as offline (optional)
- **Data**: `{ userId: string }`
- **Response**: `userOffline` broadcast to all other users

### Server to Client Events

#### `onlineUsers`
- **Purpose**: Send list of currently online users
- **Data**: `Array<string>` (array of user IDs)

#### `userOnline`
- **Purpose**: Notify that a user has come online
- **Data**: `string` (user ID)

#### `userOffline`
- **Purpose**: Notify that a user has gone offline
- **Data**: `string` (user ID)

## Chat Events (Existing)

### `joinChat`
- **Purpose**: Join a chat room
- **Data**: `{ firstName: string, userId: string, targetUserId: string }`

### `sendMessage`
- **Purpose**: Send a message in a chat
- **Data**: `{ firstName: string, lastName: string, userId: string, targetUserId: string, text: string }`

### `messageReceived`
- **Purpose**: Receive a message in a chat
- **Data**: `{ firstName: string, lastName: string, text: string }`

## Implementation Notes

1. **Multiple Connections**: Users can have multiple socket connections (e.g., multiple browser tabs)
2. **Automatic Cleanup**: When a socket disconnects, the user is marked offline only if they have no other active connections
3. **Real-time Updates**: All status changes are broadcast in real-time to all connected clients
4. **Error Handling**: Invalid or missing userId parameters are logged and ignored

## Usage Example

```javascript
// Frontend (React)
const socket = io('http://localhost:7777');

// Join status tracking
socket.emit('joinUserStatus', { userId: currentUser._id });

// Listen for status updates
socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
});

socket.on('userOnline', (userId) => {
  console.log('User came online:', userId);
});

socket.on('userOffline', (userId) => {
  console.log('User went offline:', userId);
});
```

## API Endpoints

### GET `/user/online`
- **Purpose**: Get list of currently online users (for debugging/admin)
- **Auth**: Required
- **Response**: 
```json
{
  "message": "Online users fetched successfully",
  "data": ["userId1", "userId2", "userId3"],
  "count": 3
}
```
