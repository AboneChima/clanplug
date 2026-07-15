# Group Chat Frontend Implementation - Changes Needed

## ✅ Completed:
1. socket.io-client installed
2. SocketProvider added to layout
3. Group service created (`web/src/services/group.service.ts`)
4. GroupDiscoveryModal component created (`web/src/components/GroupDiscoveryModal.tsx`)

## 🔄 Changes Needed in `web/src/app/chat/page.tsx`:

### 1. Add Imports at Top:
```typescript
import { useSocket } from '@/contexts/SocketContext';
import { groupService, GroupMessage } from '@/services/group.service';
import GroupDiscoveryModal from '@/components/GroupDiscoveryModal';
import { IoPeople, IoAddCircleOutline } from 'react-icons/io5';
```

### 2. Add State Variables (after existing useState declarations):
```typescript
const [showGroupDiscovery, setShowGroupDiscovery] = useState(false);
const [isGroupChat, setIsGroupChat] = useState(false);
const { socket, isConnected: socketConnected, joinChat, leaveChat } = useSocket();
```

### 3. Replace/Update the Real-time Connection useEffect:
Replace the existing SSE-based real-time effect with Socket.IO:

```typescript
// Setup Socket.IO real-time for group chats
useEffect(() => {
  if (currentChat && socket && socketConnected) {
    const isGroup = currentChat.type === 'GROUP';
    setIsGroupChat(isGroup);
    
    if (isGroup) {
      console.log('📥 Joining group chat room:', currentChat.id);
      joinChat(currentChat.id);
      
      // Listen for new messages
      const handleNewMessage = (newMessage: any) => {
        console.log('📨 New group message received:', newMessage);
        if (newMessage.chatId === currentChat.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      };

      socket.on('message:new', handleNewMessage);

      return () => {
        console.log('📤 Leaving group chat room:', currentChat.id);
        socket.off('message:new', handleNewMessage);
        leaveChat(currentChat.id);
      };
    } else {
      // Keep existing SSE connection for 1-on-1 chats
      chatService.connectRealtime(accessToken!);
      
      const unsubscribeMessage = chatService.onMessage((newMessage) => {
        if (newMessage.chatId === currentChat.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      });

      const unsubscribeConnection = chatService.onConnectionChange((connected) => {
        setIsConnected(connected);
      });

      return () => {
        unsubscribeMessage();
        unsubscribeConnection();
        chatService.disconnectRealtime();
      };
    }
  }
}, [currentChat?.id, socket, socketConnected, accessToken]);
```

### 4. Update loadMessages Function:
Add group message loading support:

```typescript
const loadMessages = async (chatId: string) => {
  if (!accessToken) return;
  try {
    setLoading(true);
    
    // Check if it's a group chat
    const chat = chats.find(c => c.id === chatId);
    if (chat?.type === 'GROUP') {
      const msgs = await groupService.getGroupMessages(chatId, accessToken);
      setMessages(msgs as any);
    } else {
      const msgs = await chatService.getMessages(chatId, accessToken);
      const hiddenMessages = JSON.parse(localStorage.getItem('hiddenMessages') || '{}');
      const filteredMsgs = msgs.filter(m => !m.isDeleted && !hiddenMessages[m.id]);
      setMessages(filteredMsgs);
    }
    
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    markChatAsRead(chatId);
  } catch (error) {
    console.error('Load messages error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 5. Update handleSend Function:
Add support for group message sending:

```typescript
const handleSend = async () => {
  if ((!messageText.trim() && !imageFile) || !currentChat || !accessToken || sending) return;
  
  setSending(true);
  
  try {
    let imageUrl = '';
    
    // Upload image if present
    if (imageFile) {
      console.log('📤 Uploading image...', imageFile.name);
      const formData = new FormData();
      formData.append('media', imageFile);
      
      const token = localStorage.getItem('accessToken');
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data.data?.urls && data.data.urls.length > 0) {
          imageUrl = data.data.urls[0];
        } else if (data.data?.url) {
          imageUrl = data.data.url;
        } else if (data.url) {
          imageUrl = data.url;
        }
        
        if (!imageUrl) {
          showToast('Failed to get image URL', 'error');
          setSending(false);
          return;
        }
      } else {
        showToast('Failed to upload image', 'error');
        setSending(false);
        return;
      }
    }
    
    const content = messageText.trim() || (imageUrl ? 'Image' : '');
    
    if (!content && !imageUrl) {
      showToast('Please enter a message or select an image', 'error');
      setSending(false);
      return;
    }
    
    const messageData: any = { 
      content, 
      type: imageUrl ? 'IMAGE' : 'TEXT'
    };
    
    if (imageUrl) {
      messageData.attachments = [imageUrl];
    }

    if (replyToMessage) {
      messageData.replyTo = replyToMessage.id;
    }
    
    setMessageText('');
    setImageFile(null);
    setImagePreview('');
    setReplyToMessage(null);
    
    // Use group service for groups, chat service for 1-on-1
    let newMsg;
    if (currentChat.type === 'GROUP') {
      newMsg = await groupService.sendMessage(
        currentChat.id,
        content,
        messageData.type,
        messageData.attachments,
        accessToken
      );
    } else {
      newMsg = await chatService.sendMessage(currentChat.id, messageData, accessToken);
    }
    
    // Don't add to messages array immediately for groups (Socket.IO will handle it)
    if (currentChat.type !== 'GROUP') {
      setMessages(prev => [...prev, newMsg]);
    }
    
    setChats(prevChats => {
      const updatedChat = { ...currentChat, lastMessageAt: newMsg.createdAt };
      const otherChats = prevChats.filter(c => c.id !== currentChat.id);
      return [updatedChat, ...otherChats];
    });
    
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  } catch (error: any) {
    console.error('❌ Send error:', error);
    showToast(error.message || 'Failed to send', 'error');
  } finally {
    setSending(false);
  }
};
```

### 6. Add Group Discovery Button in Chat List:
In the Chat List section (where `!currentChat`), add a button after the "Game Communities" section:

```typescript
{/* Groups Section - Add after Game Communities */}
<div className="px-4 py-3 border-b border-[#2f3336]">
  <button
    onClick={() => setShowGroupDiscovery(true)}
    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
  >
    <IoAddCircleOutline className="w-5 h-5" />
    <span>Join a Group</span>
  </button>
</div>
```

### 7. Update Message Display to Show User Colors for Groups:
In the message rendering section, add color support for group messages:

```typescript
{messages.map((msg) => {
  const isOwn = msg.userId === user?.id;
  const messageData = msg as any; // Cast to access userColor
  const userColor = messageData.userColor;
  const userName = messageData.user 
    ? `${messageData.user.firstName || ''} ${messageData.user.lastName || ''}`.trim() || messageData.user.username
    : 'User';
  
  return (
    <div
      key={msg.id}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      onTouchStart={(e) => handleLongPressStart(e, msg)}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => handleLongPressStart(e, msg)}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Show user name and color for group chats */}
        {isGroupChat && !isOwn && (
          <div className="flex items-center gap-2 mb-1 px-2">
            <span 
              className="text-sm font-semibold"
              style={{ color: userColor }}
            >
              {userName}
            </span>
          </div>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white'
              : isGroupChat 
                ? 'bg-[#2a2a2a] text-white'
                : 'bg-[#2a2a2a] text-white'
          }`}
          style={!isOwn && isGroupChat && userColor ? {
            borderLeft: `3px solid ${userColor}`
          } : {}}
        >
          {/* Rest of message content */}
          {msg.type === 'IMAGE' && msg.attachments && msg.attachments.length > 0 && (
            <img 
              src={msg.attachments[0]} 
              alt="Shared" 
              className="max-w-full rounded-lg mb-2"
            />
          )}
          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs opacity-70">
              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <IoCheckmarkDoneOutline className="w-4 h-4 text-blue-300" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
})}
```

### 8. Add GroupDiscoveryModal Before Closing Tags:
At the end of ChatContent component, before the final closing tags:

```typescript
{/* Group Discovery Modal */}
<GroupDiscoveryModal
  isOpen={showGroupDiscovery}
  onClose={() => setShowGroupDiscovery(false)}
  onGroupJoined={() => {
    loadChats(); // Reload chats to show newly joined groups
    setShowGroupDiscovery(false);
  }}
  accessToken={accessToken}
/>
```

### 9. Update Chat Header for Groups:
In the chat header section, update to show group info:

```typescript
<div className="flex items-center gap-3 flex-1 min-w-0 text-left">
  {isGroupChat ? (
    <>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <IoPeople className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-white truncate">{currentChat.name}</h2>
        <p className="text-xs text-gray-400">Group Chat</p>
      </div>
    </>
  ) : (
    /* Existing 1-on-1 chat header */
  )}
</div>
```

## 📝 Summary of Changes:

1. ✅ Socket.IO client installed
2. ✅ SocketProvider integrated in layout
3. ✅ Group service created
4. ✅ GroupDiscoveryModal component created
5. ⏳ Update chat page imports
6. ⏳ Add Socket.IO hooks and state
7. ⏳ Replace real-time connection logic
8. ⏳ Update message loading for groups
9. ⏳ Update message sending for groups
10. ⏳ Add group discovery button
11. ⏳ Update message display with colors
12. ⏳ Add GroupDiscoveryModal to page
13. ⏳ Update chat header for groups

## 🚀 Next Step:

Apply all the changes marked with ⏳ to `web/src/app/chat/page.tsx`

The changes are designed to:
- Keep existing 1-on-1 chat functionality intact
- Add group chat support with WhatsApp-style colors
- Use Socket.IO for real-time group messages
- Allow users to discover and join groups
- Display user names with colors in groups
- Work seamlessly with existing features
