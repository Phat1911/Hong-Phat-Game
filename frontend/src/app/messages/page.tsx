'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { messageApi, userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, Send, ArrowLeft, User } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

type UserResult = {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
};

export default function MessagesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [inbox, setInbox] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInbox();
  }, [isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const fetchInbox = async () => {
    try {
      const response = await messageApi.getInbox();
      setInbox(response.data || []);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (userId: string) => {
    try {
      const response = await messageApi.getConversation(userId);
      setConversation(response.data || []);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userApi.search(query);
      setSearchResults((response.data || []).filter((u: UserResult) => u.id !== user?.id));
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const selectUser = (selectedUserData: UserResult) => {
    setSelectedUser(selectedUserData);
    setSearchQuery('');
    setSearchResults([]);
    fetchConversation(selectedUserData.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await messageApi.send({
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchConversation(selectedUser.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-8">
          <MessageCircle className="w-10 h-10 text-primary" />
          Messages
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="card-gradient rounded-2xl p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="input-field pl-10 py-2 text-sm"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="mb-4 space-y-1">
                  <p className="text-xs text-white/40 mb-2">Search Results</p>
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{u.username}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-white/40 mb-2">Recent Conversations</p>
                {loading ? (
                  <p className="text-white/40 text-sm text-center py-4">Loading...</p>
                ) : inbox.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-4">No conversations yet</p>
                ) : (
                  inbox.map((msg) => {
                    const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => selectUser({ id: otherId, username: otherId.slice(0, 8), email: '', avatar_url: '' })}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left ${
                          selectedUser?.id === otherId ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{otherId.slice(0, 8)}...</p>
                          <p className="text-xs text-white/40 truncate">{msg.content}</p>
                        </div>
                        {!msg.read && msg.receiver_id === user?.id && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="card-gradient rounded-2xl h-[600px] flex flex-col">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="md:hidden p-2 hover:bg-white/10 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{selectedUser.username}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {conversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-white rounded-br-md'
                              : 'bg-white/10 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-[10px] opacity-60 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="input-field flex-1"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="btn-primary p-3 disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Select a conversation or search for a user</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
