import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Video, ChevronDown, Plus, Paperclip,
  Image, Smile, Send, Search, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { getSocket } from "../utils/socket";
import { formatDistanceToNow, format } from "date-fns";

// ─── Avatar component ────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className={`${sz} rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center shrink-0 overflow-hidden`}>
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// ─── ChatListItem ─────────────────────────────────────────────────────────────
function ChatListItem({ chat, active, onClick }) {
  const isGroup = chat.isGroup;
  const name = isGroup ? chat.name : chat._id?.fullName;
  const lastMsg = chat.lastMessage;
  const time = lastMsg?.createdAt
    ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${active ? "bg-primary-50 border-r-2 border-primary-700" : ""}`}
    >
      <div className="relative shrink-0">
        {isGroup
          ? <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center"><Users className="w-4 h-4 text-primary-700" /></div>
          : <Avatar user={chat._id} />
        }
        {!isGroup && chat._id?.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
          <span className="text-xs text-gray-400 shrink-0 ml-1">{time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {lastMsg?.content || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

// ─── ChatMessage ──────────────────────────────────────────────────────────────
function ChatMessage({ message, isOwn, showAvatar }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} fade-in`}>
      {!isOwn && showAvatar && <Avatar user={message.sender} size="sm" />}
      {!isOwn && !showAvatar && <div className="w-7" />}
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-400 mb-1 px-1">{message.sender?.fullName}</span>
        )}
        <div className={isOwn ? "chat-bubble-mine" : "chat-bubble-theirs"}>
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {format(new Date(message.createdAt), "h:mm a")}
        </span>
      </div>
    </div>
  );
}

// ─── Main Messages Page ───────────────────────────────────────────────────────
export default function MessagesPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = getSocket();

  const [chats, setChats] = useState([]);
  const [communityChats, setCommunityChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimer = useRef(null);
  const bottomRef = useRef(null);

  // Fetch recent chats
  useEffect(() => {
    const load = async () => {
      try {
        const [chatRes, communityRes] = await Promise.all([
          api.get("/messages/chats"),
          api.get("/communities/my"),
        ]);
        setChats(chatRes.data.chats || []);
        setCommunityChats(communityRes.data.communities || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingChats(false);
      }
    };
    load();
  }, []);

  // Open chat from URL param
  useEffect(() => {
    if (chatId && chats.length) {
      const found = chats.find(c => c._id?._id === chatId);
      if (found) setActiveChat({ type: "direct", data: found });
    }
  }, [chatId, chats]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) return;
    const load = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const endpoint = activeChat.type === "direct"
          ? `/messages/direct/${activeChat.data._id._id}`
          : `/messages/community/${activeChat.data._id}`;
        const res = await api.get(endpoint);
        setMessages(res.data.messages || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
    // Join socket room for community
    if (activeChat.type === "community" && socket) {
      socket.emit("room:join", { roomId: activeChat.data._id });
    }
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onDirectMsg = (msg) => {
      const otherId = msg.sender._id === user._id ? msg.recipient._id : msg.sender._id;
      if (activeChat?.type === "direct" && activeChat.data._id._id === otherId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const onCommunityMsg = ({ communityId, message }) => {
      if (activeChat?.type === "community" && activeChat.data._id === communityId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const onTyping = ({ userId: uid, conversationId, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [conversationId]: isTyping ? uid : undefined }));
    };

    socket.on("message:new-direct", onDirectMsg);
    socket.on("message:new-community", onCommunityMsg);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("message:new-direct", onDirectMsg);
      socket.off("message:new-community", onCommunityMsg);
      socket.off("typing:update", onTyping);
    };
  }, [socket, activeChat, user._id]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !activeChat || !socket) return;

    if (activeChat.type === "direct") {
      socket.emit("message:send-direct", {
        recipientId: activeChat.data._id._id,
        content: newMessage.trim(),
      });
    } else {
      socket.emit("message:send-community", {
        communityId: activeChat.data._id,
        content: newMessage.trim(),
      });
    }
    setNewMessage("");
  }, [newMessage, activeChat, socket]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChat) return;
    const conversationId = activeChat.type === "direct"
      ? activeChat.data._id._id : activeChat.data._id;
    socket.emit("typing:start", { conversationId, isGroup: activeChat.type === "community" });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId, isGroup: activeChat.type === "community" });
    }, 1500);
  };

  const activeName = activeChat?.type === "direct"
    ? activeChat.data._id?.fullName
    : activeChat?.data?.name;
  const isOnline = activeChat?.type === "direct" && activeChat.data._id?.isOnline;

  // Community spotlight (mock for sidebar)
  const upcomingEvents = [
    { title: "Graphic Design Meetup", date: "Oct 13 – 20, 1:00 AM – 3:00 PM" },
  ];
  const popularPosts = [
    { title: "Exam Tips Thread", desc: "Find list events, interactive feed and resource sharing" },
    { title: "Exam Tips Thread", desc: "The exam tips thread on the interactive feed and resource sharing in circles" },
  ];

  return (
    <div className="flex h-full">
      {/* ── Chat List ── */}
      <div className="w-64 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-base text-gray-800 mb-3">Messages</h2>
          <button className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg py-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loadingChats
            ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
            : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">Recent Chats</p>
                {chats.map((chat, i) => (
                  <ChatListItem
                    key={i}
                    chat={chat}
                    active={activeChat?.type === "direct" && activeChat.data._id?._id === chat._id?._id}
                    onClick={() => setActiveChat({ type: "direct", data: chat })}
                  />
                ))}
                {communityChats.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mt-2">Communities</p>
                    {communityChats.map((c) => (
                      <ChatListItem
                        key={c._id}
                        chat={{ _id: c, isGroup: true, name: c.name, lastMessage: null }}
                        active={activeChat?.type === "community" && activeChat.data._id === c._id}
                        onClick={() => setActiveChat({ type: "community", data: c })}
                      />
                    ))}
                  </>
                )}
              </>
            )
          }
        </div>
      </div>

      {/* ── Chat Window ── */}
      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white">
            <div className="relative">
              {activeChat.type === "community"
                ? <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center"><Users className="w-4 h-4 text-primary-700" /></div>
                : <Avatar user={activeChat.data._id} />
              }
              {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight">{activeName}</h3>
              <p className="text-xs text-gray-400">{isOnline ? "Online" : activeChat.type === "community" ? `${activeChat.data.members?.length || 0} members` : "Offline"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-primary-700"><Phone className="w-4 h-4" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-primary-700"><Video className="w-4 h-4" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-primary-700"><ChevronDown className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages
              ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
              : messages.length === 0
                ? <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <MessageSquareDots className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No messages yet — say hello!</p>
                  </div>
                : messages.map((msg, i) => {
                    const isOwn = msg.sender._id === user._id;
                    const prevSender = messages[i - 1]?.sender._id;
                    const showAvatar = !isOwn && prevSender !== msg.sender._id;
                    return <ChatMessage key={msg._id} message={msg} isOwn={isOwn} showAvatar={showAvatar} />;
                  })
            }
            {/* Typing indicator */}
            {Object.values(typingUsers).some(Boolean) && (
              <div className="flex items-center gap-2">
                <div className="chat-bubble-theirs flex gap-1 items-center py-3">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <button className="text-gray-400 hover:text-primary-700 transition"><Plus className="w-4 h-4" /></button>
              <button className="text-gray-400 hover:text-primary-700 transition"><Paperclip className="w-4 h-4" /></button>
              <button className="text-gray-400 hover:text-primary-700 transition"><Image className="w-4 h-4" /></button>
              <input
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Type your message…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
              />
              <button className="text-gray-400 hover:text-primary-700 transition"><Smile className="w-4 h-4" /></button>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="bg-primary-700 hover:bg-primary-800 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">Select a conversation</p>
          <p className="text-sm mt-1">Choose from your recent chats or start a new one</p>
        </div>
      )}

    </div>
  );
}

// Placeholder icon
function MessageSquareDots(props) {
  return <MessageSquare {...props} />;
}
import { MessageSquare } from "lucide-react";