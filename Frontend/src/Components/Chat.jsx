import { useState, useRef, useEffect } from "react";
import { createSocketConnection } from "../utils/socket";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../config";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [attachments, setattachments] = useState(null);
  const isFetchingRef = useRef(false);
  const [modalImage, setModalImage] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);



  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageRefs = useRef({});
  messageRefs.current = false;

  const { toUserId: targetUserId } = useParams();
  const location = useLocation();
  const userState = useSelector((s) => s.user);
  const senderUser = userState?.user;
  const senderUserId = senderUser?._id;
  const senderFirstName = senderUser?.firstName;
  const { profilePhoto: targetProfilePhoto, firstName: targetFirstName } = location.state || {};

  const socketRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setattachments(file);
      setAttachmentName(file.name)
    };
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socketRef.current) return;
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", { targetUserId, senderUserId });
    }

    // stop typing after user stops input for 1s
    clearTimeout(handleTyping.timeout);
    handleTyping.timeout = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit("stopTyping", { targetUserId, senderUserId });
    }, 1000);
  };


  // Setup socket
  useEffect(() => {
    if (!senderUserId || !targetUserId) return;

    if (!socketRef.current) socketRef.current = createSocketConnection();
    const socket = socketRef.current;

    socket.emit("userConnected", senderUserId);
    socket.emit("joinChat", { targetUserId, senderUserId });

    socket.on("onlineUserUpdate", (users) => {
      setOnlineUsers(users.map(String));
    });

    socket.on("messageReceived", (msg) => {
      setMessages((prev) => [...prev, msg]);
      isFetchingRef.current = false;
    });

    socket.on("userTyping", (userId) => {
      if (String(userId) === String(targetUserId)) setOtherUserTyping(true);
    });

    socket.on("userStopTyping", (userId) => {
      if (String(userId) === String(targetUserId)) setOtherUserTyping(false);
    });


    return () => {
      socket.off("messageReceived");
      socket.off("onlineUserUpdate");
      socket.off("messageReceived");
      socket.off("onlineUserUpdate");
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [targetUserId, senderUserId]);

  // Fetch old messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!senderUserId || !targetUserId) return;

      try {
        isFetchingRef.current = true;
        setIsLoadingPrev(true);
        const resp = await axios.post(
          "/api/chat",
          { targetUserId, skip, limit: 20 },
          { withCredentials: true }
        );
        const { chatId, messages: msgs, hasMore } = resp.data;
        setHasMore(hasMore);

        if (msgs.length > 0) {
          const formatted = msgs.map((m) => ({
            _id: m._id,
            chatId,
            firstName:
              String(m.sender) === String(senderUserId)
                ? senderFirstName
                : m.senderName,
            newMessage: m.text,
            timestamp: m.createdAt,
            seen: m.seenBy?.includes(senderUserId),
            attachments: m.attachments || [],
          }));

          if (messages.length <= 0) {
            isFetchingRef.current = false;
          }

          const container = chatContainerRef.current;
          const oldHeight = container?.scrollHeight || 0;
          const oldTop = container?.scrollTop || 0;

          setMessages((prev) => [...formatted, ...prev]);

          setTimeout(() => {
            if (container) {
              const delta = container.scrollHeight - oldHeight;
              container.scrollTop = oldTop + delta;
            }
          }, 0);
        }
      } catch (err) {
        console.error("Error fetching chat:", err);
      } finally {
        setIsLoadingPrev(false);
      }
    };
    fetchMessages();
  }, [skip, targetUserId, senderUserId]);

  // Infinite scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (container.scrollTop === 0 && hasMore) {
        setSkip((prev) => prev + 20);
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isFetchingRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !attachments) return;
    const socket = socketRef.current;
    if (!socket) return;

    let uploadedUrl = null;
    if (attachments) {
      const formData = new FormData();
      formData.append("file", attachments);
      const uploadResp = await axios.post("/api/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploadedUrl = uploadResp.data.url;
      setattachments(null);
      setAttachmentName("");
    }

    const now = new Date().toISOString();
    const payload = {
      firstName: senderFirstName,
      senderUserId,
      targetUserId,
      newMessage: newMessage ? newMessage : " ",
      timestamp: now,
      attachments: uploadedUrl ? [uploadedUrl] : []
    };

    socket.emit("sendMessage", payload);
    setNewMessage("");
  };

  const formatMessageTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();

    const pad2 = (n) => n.toString().padStart(2, "0");

    const formatDate = (date) =>
      `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;

    const formatTime = (date) =>
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const isYesterday = (date) => {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return isSameDay(date, y);
    };

    if (isSameDay(d, now)) {
      // Today → show only time
      return formatTime(d);
    } else if (isYesterday(d)) {
      // Yesterday → show “Yesterday” (you can append time if desired)
      const timePart = formatTime(d);
      return `Yesterday ${timePart}`;
    } else {
      // Older → show full date + time
      return `${formatDate(d)} ${formatTime(d)}`;
    }
  };


  return (
    <div className="card  h-[410px] sm:h-96 w-[90%] md:w-2/3 mt-10 mx-auto border border-gray-600 flex flex-col bg-black text-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-600 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={`${BASE_URL}${targetProfilePhoto}`} alt={targetFirstName} className="w-8 h-8 rounded-full" />
          <span className="text-xl font-semibold">{targetFirstName || "Chat Partner"}</span>
        </div>
        <span className={`text-sm ${onlineUsers.includes(targetUserId) ? "text-green-500" : "text-gray-400"}`}>
          {onlineUsers.includes(targetUserId) ? "Online" : "Offline"}
        </span>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        {isLoadingPrev && (
          <div className="w-10 h-10 border-4 mx-auto border-white border-b-transparent rounded-full animate-spin" />
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.firstName === senderFirstName ? "justify-end" : "justify-start"}`}>
            <div className="max-w-xs text-sm">

              {modalImage && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 caret-transparent"
                  onClick={() => setModalImage(null)}
                >
                  <img
                    src={modalImage}
                    alt="attachment modal"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="text-xs text-gray-400 mb-1">
                {msg.firstName === senderFirstName ? "You" : msg.firstName}
              </div>
              <div
                className={`px-4 py-2 rounded-2xl ${msg.firstName === senderFirstName
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
              >
                {msg.newMessage && <p>{msg.newMessage}</p>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2">
                    {msg.attachments.map((url, idx) => (
                      url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          key={idx}
                          src={`${BASE_URL}${url}`}
                          alt={`attachment ${idx}`}
                          className="max-w-[200px] rounded-lg cursor-pointer"
                          onClick={() => setModalImage(`${BASE_URL}${url}`)}
                        />
                      ) : (
                        <a
                          key={idx}
                          href={`${BASE_URL}${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white-300 font-bold underline cursor-pointer"
                        >
                          📎 View File
                        </a>
                      )
                    ))}
                  </div>
                )}

              </div>
              <div className="text-xs text-gray-400 mt-1 text-right">
                {formatMessageTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {otherUserTyping && (
  <div className="text-sm text-gray-400 px-4 pb-1 italic">Typing...</div>
)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-600 flex items-center gap-2">
        <label className="cursor-pointer font-extrabold text-3xl caret-transparent">
          +
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.docx,.txt" />
        </label>
        <input
          className="flex-1 border border-gray-600 bg-gray-900 text-white rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            attachmentName
              ? `Attachment: ${attachmentName}`
              : "Type a message..."
          }
        />
        <button
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-2xl transition cursor-pointer"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
