/**
 * Universal Chat Helper
 * Use this function anywhere in the app to open a chat with any user
 */

export async function openChat(userId: string, userInfo?: {
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Please log in to send messages');
    }

    // Create or get existing chat
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'DIRECT',
        participants: [userId],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to open chat');
    }

    const data = await response.json();
    const chatId = data.data?.id || data.id;

    // Store user info for chat page to use
    if (userInfo) {
      sessionStorage.setItem('pendingChatUser', JSON.stringify(userInfo));
    }

    // Navigate to chat
    window.location.href = `/chat?id=${chatId}`;
    
    return { success: true, chatId };
  } catch (error: any) {
    console.error('Open chat error:', error);
    return { success: false, error: error.message };
  }
}
