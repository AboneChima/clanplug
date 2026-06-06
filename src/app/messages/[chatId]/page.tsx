'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  IoSendOutline,
  IoArrowBack,
  IoEllipsisVertical,
  IoImageOutline,
  IoMicOutline,
  IoStopCircleOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authApi } from '@/lib/auth-api';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  attachments?: string[];
  type?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Chat {
  id: string;
  participants: {
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  }[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPressedDown, setIsPressedDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatId = params.chatId as string;

  const otherParticipant = chat?.participants.find(p => p.user.id !== user?.id)?.user;

  useEffect(() => {
    if (chatId) {
      loadChat();
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      const response = await authApi.get(`/api/chats/${chatId}`);
      if (response.success) {
        setChat(response.data);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await authApi.get(`/api/chats/${chatId}/messages`);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Could not access microphone', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleMouseDown = () => {
    setIsPressedDown(true);
    startRecording();
  };

  const handleMouseUp = async () => {
    if (!isPressedDown) return;
    setIsPressedDown(false);
    
    if (isRecording) {
      stopRecording();
      // Auto-send after recording stops
      setTimeout(() => {
        sendAudioMessage();
      }, 500);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) {
      console.log('No audio blob available');
      return;
    }
    
    try {
      setSending(true);
      console.log('Sending audio message...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('content', ''); // Empty content for audio-only

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        console.log('Audio message sent successfully');
        setAudioBlob(null);
        setRecordingTime(0);
        await loadMessages();
        showToast('Voice message sent!', 'success');
      } else {
        const errorData = await response.json();
        console.error('Failed to send audio:', errorData);
        showToast(errorData.message || 'Failed to send voice message', 'error');
      }
    } catch (error: any) {
      console.error('Send audio error:', error);
      showToast(error.message || 'Failed to send voice message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    try {
      setSending(true);
      
      // Create form data for the message
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      } else {
        formData.append('content', ''); // Empty content for image-only messages
      }
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        await loadMessages();
        showToast('Message sent!', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to send message', 'error');
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      showToast(error.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppShell>
      <div className="h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b border-[#2f3336] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/feed?tab=inbox&section=messages')}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <IoArrowBack className="w-5 h-5 text-white" />
          </button>

          {otherParticipant && (
            <>
              {otherParticipant.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-white font-semibold">
                  {otherParticipant.firstName} {otherParticipant.lastName}
                </h2>
                <p className="text-gray-400 text-sm">@{otherParticipant.username}</p>
              </div>
            </>
          )}

          <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
            <IoEllipsisVertical className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 mb-2">No messages yet</p>
                <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    message.user.avatar ? (
                      <img
                        src={message.user.avatar}
                        alt={message.user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {message.user.firstName[0]}{message.user.lastName[0]}
                        </span>
                      </div>
                    )
                  )}
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Image attachments */}
                    {message.attachments && message.attachments.length > 0 && (message.type === 'IMAGE' || !message.type) && (
                      <div className="mb-2 rounded-2xl overflow-hidden max-w-[250px]">
                        {message.attachments.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Attachment"
                            className="w-full h-auto rounded-2xl"
                            onError={(e) => {
                              console.error('Image load error:', url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Audio message */}
                    {message.type === 'AUDIO' && message.attachments?.[0] && (
                      <div className={`rounded-2xl px-2 py-2 ${isOwn ? 'bg-blue-600' : 'bg-[#2a2a2a]'}`}>
                        <audio controls className="max-w-full" style={{ height: '32px' }}>
                          <source src={message.attachments[0]} type="audio/webm" />
                          <source src={message.attachments[0]} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    {/* Text content */}
                    {message.content && (
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-[#1a1a1a] border-t border-[#2f3336] p-3">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <IoCloseOutline className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Audio Recording UI - WhatsApp Style */}
        {isRecording && (
          <div className="bg-[#1a1a1a] border-t border-[#2f3336] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-mono text-sm">
                    {formatRecordingTime(recordingTime)}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-gray-400 text-xs">Slide to cancel →</span>
            </div>
          </div>
        )}

        {/* Audio Preview */}
        {audioBlob && !isRecording && (
          <div className="bg-[#1a1a1a] border-t border-[#2f3336] p-3">
            <div className="flex items-center gap-3">
              <audio ref={audioRef} controls className="flex-1 h-8">
                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
              </audio>
              <button
                onClick={sendAudioMessage}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <IoSendOutline className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={cancelRecording}
                className="p-2 hover:bg-red-500/10 rounded-full transition-colors"
              >
                <IoCloseOutline className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="bg-[#1a1a1a] border-t border-[#2f3336] p-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              disabled={sending || isRecording}
            >
              <IoImageOutline className="w-6 h-6 text-gray-400" />
            </button>
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className={`p-2 rounded-lg transition-colors ${
                isRecording ? 'bg-red-500' : 'hover:bg-[#2a2a2a]'
              }`}
              disabled={sending}
            >
              <IoMicOutline className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-400'}`} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#2a2a2a] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage && !audioBlob) || sending}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <IoSendOutline className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
