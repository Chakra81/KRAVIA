import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Check, CheckCheck, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Animated typing indicator component
const TypingIndicator = ({ name }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className="flex justify-start"
  >
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
        {name?.charAt(0) || '?'}
      </div>
      <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-indigo-300 mr-1">{name} is typing</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400 block"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const Chat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatTheme, setChatTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [contactIsTyping, setContactIsTyping] = useState(false); // contact typing indicator
  const [isSending, setIsSending] = useState(false); // sending state
  const typingTimeoutRef = useRef(null); // debounce timer for typing signal
  const ws = useRef(null);
  const selectedContactRef = useRef(selectedContact);

  // Role-aware contact list
  const isStudent = user?.role === 'student';
  const isTrainer = user?.role === 'trainer';
  const [filterType, setFilterType] = useState('all'); // 'all', 'student', 'trainer', 'admin'

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [adminsRes, trainersRes, studentsRes] = await Promise.all([
        axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-admins/`),
        axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-trainers/`),
        axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-students/`)
      ]);

      let allContacts = [
        ...adminsRes.data.map(a => ({ ...a, userType: 'admin' }))
      ];

      // Students shouldn't chat with other students
      if (!isStudent) {
        allContacts.push(...studentsRes.data.map(s => ({ ...s, userType: 'student' })));
      }

      // Trainers shouldn't chat with other trainers
      if (!isTrainer) {
        allContacts.push(...trainersRes.data.map(t => ({ ...t, userType: 'trainer' })));
      }

      // Filter out the currently logged-in user
      setContacts(allContacts.filter(c => c.email !== user?.email));
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isStudent, isTrainer]);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/unread-counts/`, {
        params: { user_email: user.email }
      });
      setUnreadCounts(response.data);
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !user) return;
    try {
      const response = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/get-messages/`, {
        params: {
          sender_email: user.email,
          receiver_email: selectedContact.email
        }
      });
      setMessages(response.data);
      // After fetching messages (which marks them as read), refresh unread counts
      fetchUnreadCounts();
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [selectedContact, user, fetchUnreadCounts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
    if (selectedContact) {
      fetchMessages();
    }
  }, [selectedContact, fetchMessages]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // WebSocket connection
  useEffect(() => {
    if (!user || !user.id) return; // Guard: don't connect if user.id is missing
    
    console.log('Connecting WebSocket for user id:', user.id);
    // Use ws:// for local development
    const socket = new WebSocket(`wss://kravia.onrender.com/ws/chat/${user.id}/`);
    ws.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      if (data.type === 'new_message') {
        const newMsg = data.message;
        const currentContact = selectedContactRef.current;
        
        if (currentContact && (newMsg.sender === currentContact.email || newMsg.receiver === currentContact.email)) {
          // Hide typing indicator when message arrives
          setContactIsTyping(false);
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // If we received a message from the currently selected contact, mark it as read via WS
          if (newMsg.receiver === user.email) {
            socket.send(JSON.stringify({
              action: 'status_update',
              message_ids: [newMsg.id],
              status: 'read',
              sender_id: currentContact.id
            }));
          }
        } else {
          // If message is from someone else, update unread badge
          fetchUnreadCounts();
        }
      } else if (data.type === 'status_update') {
        setMessages(prev => prev.map(m => 
          data.message_ids.includes(m.id) ? { ...m, status: data.status } : m
        ));
      } else if (data.type === 'typing') {
        // Show typing indicator when contact is typing
        const currentContact = selectedContactRef.current;
        // Case-insensitive email comparison to avoid missed matches
        if (currentContact && data.sender_email &&
            data.sender_email.toLowerCase() === currentContact.email.toLowerCase()) {
          setContactIsTyping(true);
          // Auto-hide after 3 seconds if no more typing signals
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setContactIsTyping(false), 3000);
        }
      }
    };
    
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    
    return () => {
      if (socket) socket.close();
    };
  }, [user, fetchUnreadCounts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || c.userType === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [contacts, searchTerm, filterType]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send typing signal to contact over WebSocket
  const sendTypingSignal = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && selectedContact) {
      ws.current.send(JSON.stringify({
        action: 'typing',
        receiver_email: selectedContact.email
      }));
    }
  }, [selectedContact]);

  // Handle input change — send typing signal with debounce
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    sendTypingSignal();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact || !user) return;

    setIsSending(true);
    try {
      const response = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/send-message/`, {
        sender_email: user.email,
        receiver_email: selectedContact.email,
        text: message
      });
      setMessages(prev => [...prev, response.data]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex h-screen p-6 gap-6 transition-colors duration-300 bg-[var(--glass)] text-[var(--text-main)]`}>
      {/* Contact List (Sidebar) */}
      <div className={`w-80 glass-card flex flex-col border hidden lg:flex overflow-hidden border-[var(--border)]`}>
        <div className={`p-6 border-b border-[var(--border)]`}>
            <h2 className={`text-xl font-bold mb-4 text-[var(--text-main)]`}>Contacts</h2>
            <div className="relative mb-3">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 bg-[var(--glass)] text-[var(--text-main)]`} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..." 
                    className={`w-full border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-indigo-500`}
                />
            </div>
            <div className="flex gap-2">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`w-full border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] rounded-xl px-4 py-2 text-sm outline-none transition-all cursor-pointer focus:ring-1 focus:ring-indigo-500`}
                >
                    <option value="all" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">All Contacts</option>
                    {!isStudent && <option value="student" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Students</option>}
                    {!isTrainer && <option value="trainer" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Trainers</option>}
                    <option value="admin" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Admins</option>
                </select>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Loading contacts...</div>
            ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                    <div 
                        key={contact.id} 
                        onClick={() => setSelectedContact(contact)}
                        className={`p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer border-l-4 transition-all ${selectedContact?.id === contact.id ? 'bg-white/5 border-indigo-500' : 'border-transparent'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                            {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-[var(--text-main)] font-semibold text-sm truncate`}>{contact.name}</h4>
                            <p className="text-slate-500 text-xs truncate capitalize">{contact.role || contact.course || contact.userType}</p>
                        </div>
                        {Object.keys(unreadCounts).some(email => email.toLowerCase() === contact.email.toLowerCase() && unreadCounts[email] > 0) && (
                            <div className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg ml-auto animate-pulse">
                                {unreadCounts[Object.keys(unreadCounts).find(email => email.toLowerCase() === contact.email.toLowerCase())]}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                    No contacts found.
                </div>
            )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-card flex flex-col border border-white/10 overflow-hidden relative">
        {/* Chat Header */}
        <div className={`p-4 border-b flex justify-between items-center border-[var(--border)] bg-[var(--glass)]`}>
            {selectedContact ? (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                        {selectedContact.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={`font-bold text-[var(--text-main)]`}>{selectedContact.name}</h3>
                        <span className={`text-[var(--text-muted)] text-xs flex items-center gap-1 capitalize`}>
                            {selectedContact.role || selectedContact.course || selectedContact.userType}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-slate-400 italic">Select a contact to start chatting</div>
            )}
            <div className="flex items-center gap-4 text-slate-400 relative">
                <div className="relative">
                  <Palette 
                    size={20} 
                    className="hover:text-indigo-500 cursor-pointer transition-colors" 
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                  />
                  {showThemeMenu && (
                    <div className="absolute right-0 mt-4 w-40 bg-[var(--glass)] border border-[var(--border)] rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-3 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Select Theme</div>
                      {['default', 'whatsapp', 'discord', 'telegram'].map(theme => (
                        <button
                          key={theme}
                          onClick={() => { setChatTheme(theme); setShowThemeMenu(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 capitalize ${chatTheme === theme ? 'text-indigo-400 font-bold' : 'text-[var(--text-main)]'}`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Phone size={20} className="hover:text-indigo-500 cursor-pointer transition-colors" />
                <Video size={20} className="hover:text-indigo-500 cursor-pointer transition-colors" />
                <MoreVertical size={20} className="hover:text-indigo-500 cursor-pointer transition-colors" />
            </div>
        </div>

        {/* Messages List */}
        <div 
          className={`flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative ${
            chatTheme === 'whatsapp' ? 'bg-[#efeae2] dark:bg-[#0b141a]' :
            chatTheme === 'discord' ? 'bg-[#36393f] dark:bg-[#36393f]' :
            chatTheme === 'telegram' ? 'bg-[#e4ebf0] dark:bg-[#0f1f2e]' :
            'bg-transparent'
          }`}
        >
            {chatTheme === 'whatsapp' && (
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>
            )}
            <div className="relative z-10 space-y-4 flex flex-col h-full">
            <AnimatePresence initial={false}>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-xl ${
                                msg.isMe 
                                ? (chatTheme === 'whatsapp' ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-800 dark:text-slate-100 rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none')
                                : (chatTheme === 'whatsapp' ? 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-tl-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none')
                            }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                        {msg.isMe ? 'You' : selectedContact.name}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <span className="text-[9px] mt-2 flex justify-end items-center gap-1 opacity-70">
                                    {msg.time}
                                    {msg.isMe && (
                                        <span>
                                            {msg.status === 'read' ? <CheckCheck size={14} className="text-blue-300" /> :
                                             msg.status === 'delivered' ? <CheckCheck size={14} className="text-slate-300" /> :
                                             <Check size={14} className="text-slate-300" />}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Send size={24} className="rotate-12" />
                        </div>
                        <p className="italic text-sm">No messages yet</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {contactIsTyping && selectedContact && (
                <TypingIndicator name={selectedContact.name} />
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t border-[var(--border)] bg-[var(--glass)]`}>
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                <input 
                    type="text" 
                    value={message}
                    onChange={handleMessageChange}
                    placeholder={selectedContact ? `Message ${selectedContact.name}...` : "Select a contact..."}
                    disabled={!selectedContact}
                    className={`flex-1 border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] placeholder-[var(--text-muted)] rounded-xl px-5 py-3 text-sm outline-none transition-all disabled:opacity-50 focus:ring-2 focus:ring-indigo-500/50`}
                />
                <button 
                    type="submit"
                    disabled={!selectedContact || !message.trim() || isSending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 relative"
                >
                  {isSending ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
