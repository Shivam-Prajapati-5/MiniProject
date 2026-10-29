import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { io } from 'socket.io-client'
import api, { SOCKET_URL } from '../api'
import { useAuth } from './AuthContext'

const ChatContext = createContext(null)
const TYPING_IDLE_MS = 3500

export const ChatProvider = ({ children }) => {
  const { authUser } = useAuth()
  const currentUserId = authUser?._id ? String(authUser._id) : null

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [isFindingContacts, setIsFindingContacts] = useState(false)

  const [selectedUser, setSelectedUser] = useState(null)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const [convMap, setConvMap] = useState({})
  const [connected, setConnected] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set())
  const [typingUserIds, setTypingUserIds] = useState([])

  const convMapRef = useRef({})
  const selectedUserRef = useRef(null)
  const selectedConversationRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimersRef = useRef(new Map())
  const messagesRequestRef = useRef(0)
  const loadingOlderRef = useRef(false)

  const setConversationMapping = useCallback((updates) => {
    setConvMap(prev => {
      const next = { ...prev, ...updates }
      convMapRef.current = next
      return next
    })
  }, [])

  /* ── Load contacts (friends + existing conversations) and pending requests ── */
  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return
    setLoadingUsers(true)
    try {
      const [friendsRes, conversationsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/message/conversations', { params: { limit: 100 } }),
        api.get('/friends/requests'),
      ])

      const friendsList = friendsRes.data.friends ?? []
      const conversationsList = conversationsRes.data.conversations ?? []
      setPendingRequests(requestsRes.data.requests ?? [])

      // Map conversation IDs
      const mapping = {}
      const conversationUsers = []
      for (const conversation of conversationsList) {
        if (conversation.otherParticipant?._id) {
          mapping[String(conversation.otherParticipant._id)] = String(conversation._id)
          conversationUsers.push(conversation.otherParticipant)
        }
      }
      setConversationMapping(mapping)

      // Merge friends and conversation participants without duplicates
      const seenIds = new Set()
      const combinedUsers = []

      for (const u of [...friendsList, ...conversationUsers]) {
        const id = String(u._id)
        if (!seenIds.has(id)) {
          seenIds.add(id)
          combinedUsers.push(u)
        }
      }

      setUsers(combinedUsers)
    } catch (err) {
      console.error('Load friends/chat data failed:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [currentUserId, setConversationMapping])

  const fetchPendingRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/friends/requests')
      setPendingRequests(data.requests ?? [])
    } catch (err) {
      console.error('Fetch pending requests failed:', err)
    }
  }, [])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const searchUsers = useCallback(async (query) => {
    const { data } = await api.get('/friends/search', { params: { q: query } })
    return data.users ?? []
  }, [])

  const sendFriendRequest = useCallback(async (targetUserId) => {
    const { data } = await api.post(`/friends/request/${targetUserId}`)
    return data
  }, [])

  const acceptFriendRequest = useCallback(async (requestId) => {
    const { data } = await api.post(`/friends/accept/${requestId}`)
    await fetchFriends()
    return data
  }, [fetchFriends])

  const declineFriendRequest = useCallback(async (requestId) => {
    const { data } = await api.post(`/friends/decline/${requestId}`)
    await fetchPendingRequests()
    return data
  }, [fetchPendingRequests])

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/message/conversations', { params: { limit: 100 } })
      const mapping = {}

      for (const conversation of data.conversations ?? []) {
        if (conversation.otherParticipant?._id) {
          mapping[String(conversation.otherParticipant._id)] = String(conversation._id)
        }
      }

      setConversationMapping(mapping)
    } catch (err) {
      console.error('Refresh conversations failed:', err)
    }
  }, [setConversationMapping])

  /* ── Fetch the latest page of messages ── */
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return

    const requestId = messagesRequestRef.current + 1
    messagesRequestRef.current = requestId
    setLoadingMessages(true)
    setHasMoreMessages(false)
    setNextCursor(null)

    try {
      const { data } = await api.get(`/message/${conversationId}`, {
        params: { limit: 50 },
      })

      if (requestId !== messagesRequestRef.current) return

      setMessages(data.messages ?? [])
      setNextCursor(data.pagination?.nextCursor ?? null)
      setHasMoreMessages(Boolean(data.pagination?.hasMore))
    } catch (err) {
      if (requestId !== messagesRequestRef.current) return

      console.error('Load messages failed:', err)
      setMessages([])
    } finally {
      if (requestId === messagesRequestRef.current) {
        setLoadingMessages(false)
      }
    }
  }, [])

  /* ── Select a contact ── */
  const selectUser = useCallback((user) => {
    if (!user) {
      selectedUserRef.current = null
      selectedConversationRef.current = null
      setSelectedUser(null)
      setActiveConversationId(null)
      setMessages([])
      return
    }

    setIsFindingContacts(false)
    const userId = String(user._id)
    const conversationId = convMapRef.current[userId] ?? null

    for (const timer of typingTimersRef.current.values()) clearTimeout(timer)
    typingTimersRef.current.clear()
    setTypingUserIds([])

    messagesRequestRef.current += 1
    selectedUserRef.current = userId
    selectedConversationRef.current = conversationId
    setSelectedUser(user)
    setActiveConversationId(conversationId)
    setMessages([])
    setHasMoreMessages(false)
    setNextCursor(null)
    setLoadingMessages(false)

    if (conversationId) {
      fetchMessages(conversationId)
    }
  }, [fetchMessages])

  /* ── Conversations can arrive after the user clicks a contact ── */
  useEffect(() => {
    if (!selectedUser || selectedConversationRef.current) return

    const conversationId = convMap[String(selectedUser._id)]

    if (conversationId) {
      selectedConversationRef.current = conversationId
      setActiveConversationId(conversationId)
      fetchMessages(conversationId)
    }
  }, [convMap, selectedUser, fetchMessages])

  /* ── Load older messages (cursor pagination) ── */
  const loadOlderMessages = useCallback(async () => {
    const conversationId = selectedConversationRef.current

    if (!conversationId || !nextCursor || loadingOlderRef.current) return

    loadingOlderRef.current = true
    setLoadingOlder(true)

    try {
      const { data } = await api.get(`/message/${conversationId}`, {
        params: { limit: 50, before: nextCursor },
      })

      if (selectedConversationRef.current !== conversationId) return

      setMessages(prev => {
        const existingIds = new Set(prev.map(message => String(message._id)))
        const olderMessages = (data.messages ?? []).filter(message => (
          !existingIds.has(String(message._id))
        ))
        return [...olderMessages, ...prev]
      })
      setNextCursor(data.pagination?.nextCursor ?? null)
      setHasMoreMessages(Boolean(data.pagination?.hasMore))
    } catch (err) {
      console.error('Load older messages failed:', err)
    } finally {
      loadingOlderRef.current = false
      setLoadingOlder(false)
    }
  }, [nextCursor])

  /* ── Send a message through REST, then let Socket.IO fan it out ── */
  const sendMessage = useCallback(async (text) => {
    if (!selectedUser || !text.trim()) return undefined

    const receiverId = String(selectedUser._id)
    const { data } = await api.post(`/message/send/${receiverId}`, {
      message: text.trim(),
    })
    const newMessage = data.data

    if (!newMessage) return undefined

    const conversationId = String(newMessage.conversationId)
    setConversationMapping({ [receiverId]: conversationId })

    if (selectedUserRef.current === receiverId) {
      if (selectedConversationRef.current !== conversationId) {
        selectedConversationRef.current = conversationId
        setActiveConversationId(conversationId)
      }

      setMessages(prev => (
        prev.some(message => String(message._id) === String(newMessage._id))
          ? prev
          : [...prev, newMessage]
      ))
    }

    return newMessage
  }, [selectedUser, setConversationMapping])

  /* ── Realtime connection ── */
  useEffect(() => {
    if (!currentUserId) return undefined

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      path: '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // The API is reached through the Vercel same-origin proxy, so the
      // HttpOnly cookie is not available on the Render socket origin.
      // Mint a short-lived handshake token for every (re)connect instead.
      auth: (callback) => {
        api.get('/auth/socket-token')
          .then(({ data }) => callback({ token: data.token }))
          .catch((err) => {
            console.error('Socket token request failed:', err)
            callback({ token: '' })
          })
      },
    })
    socketRef.current = socket

    const clearTypingUser = (conversationId, userId) => {
      const key = `${conversationId}:${userId}`
      const timer = typingTimersRef.current.get(key)

      if (timer) {
        clearTimeout(timer)
        typingTimersRef.current.delete(key)
      }

      setTypingUserIds(prev => prev.filter(id => id !== String(userId)))
    }

    const handleConnect = () => {
      setConnected(true)
      loadConversations()

      // On every (re)connect, re-fetch messages for the currently open
      // conversation so any messages missed during a disconnect are shown
      // without needing a full page refresh.
      const conversationId = selectedConversationRef.current
      if (conversationId) {
        fetchMessages(conversationId)
      }
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    const handleConnectError = (err) => {
      setConnected(false)
      console.error('Realtime connection failed:', err.message)
      // When Socket.io encounters an auth error during connection, it deactivates auto-reconnect.
      // Retry connecting after a brief delay so a fresh handshake token is acquired:
      if (!socket.active) {
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect()
          }
        }, 2500)
      }
    }

    const handlePresenceState = (payload = {}) => {
      setOnlineUserIds(new Set((payload.userIds ?? []).map(String)))
    }

    const handlePresenceUpdate = (payload = {}) => {
      if (!payload.userId) return

      setOnlineUserIds(prev => {
        const next = new Set(prev)

        if (payload.online) {
          next.add(String(payload.userId))
        } else {
          next.delete(String(payload.userId))
        }

        return next
      })
    }

    const handleNewMessage = (payload = {}) => {
      const message = payload.message
      const conversationId = payload.conversationId

      if (!message?._id || !conversationId) return

      const senderId = String(message.senderId?._id || message.senderId || '')
      const receiverId = String(message.reciverId?._id || message.reciverId || message.receiverId?._id || message.receiverId || '')
      const otherUserId = senderId === currentUserId ? receiverId : senderId

      setConversationMapping({ [otherUserId]: String(conversationId) })

      // Check if message belongs to active conversation or selected user
      const isCurrentChat =
        (selectedConversationRef.current && selectedConversationRef.current === String(conversationId)) ||
        (selectedUserRef.current && selectedUserRef.current === otherUserId)

      if (isCurrentChat) {
        if (selectedConversationRef.current !== String(conversationId)) {
          selectedConversationRef.current = String(conversationId)
          setActiveConversationId(String(conversationId))
        }

        setMessages(prev => (
          prev.some(item => String(item._id) === String(message._id))
            ? prev
            : [...prev, message]
        ))
      }

      loadConversations()
      clearTypingUser(String(conversationId), otherUserId)
    }

    const handleTyping = (payload = {}) => {
      const { conversationId, userId, typing } = payload

      if (!conversationId || !userId || String(userId) === currentUserId) return
      if (selectedConversationRef.current !== String(conversationId)) return

      if (!typing) {
        clearTypingUser(String(conversationId), userId)
        return
      }

      const key = `${conversationId}:${userId}`
      const existingTimer = typingTimersRef.current.get(key)

      if (existingTimer) clearTimeout(existingTimer)

      setTypingUserIds(prev => (
        prev.includes(String(userId)) ? prev : [...prev, String(userId)]
      ))

      const timer = setTimeout(() => {
        typingTimersRef.current.delete(key)
        setTypingUserIds(prev => prev.filter(id => id !== String(userId)))
      }, TYPING_IDLE_MS)

      typingTimersRef.current.set(key, timer)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    const handleFriendRequestReceived = (request) => {
      setPendingRequests(prev => [request, ...prev.filter(r => r._id !== request._id)])
    }

    const handleFriendRequestAccepted = ({ friend, conversationId }) => {
      setUsers(prev => {
        if (prev.some(u => String(u._id) === String(friend._id))) return prev
        return [friend, ...prev]
      })
      if (conversationId && friend._id) {
        setConversationMapping({ [String(friend._id)]: String(conversationId) })
      }
    }

    socket.on('connect_error', handleConnectError)
    socket.on('presence:state', handlePresenceState)
    socket.on('presence:update', handlePresenceUpdate)
    socket.on('message:new', handleNewMessage)
    socket.on('typing:update', handleTyping)
    socket.on('friend:request_received', handleFriendRequestReceived)
    socket.on('friend:request_accepted', handleFriendRequestAccepted)

    // Connect AFTER all listeners are registered so no events are missed,
    // especially 'presence:state' which fires immediately on connection.
    socket.connect()

    return () => {
      for (const timer of typingTimersRef.current.values()) clearTimeout(timer)
      typingTimersRef.current.clear()
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('presence:state', handlePresenceState)
      socket.off('presence:update', handlePresenceUpdate)
      socket.off('message:new', handleNewMessage)
      socket.off('typing:update', handleTyping)
      socket.off('friend:request_received', handleFriendRequestReceived)
      socket.off('friend:request_accepted', handleFriendRequestAccepted)
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [
    currentUserId,
    loadConversations,
    fetchMessages,
    setConversationMapping,
  ])

  const emitTyping = useCallback((typing) => {
    const socket = socketRef.current
    const conversationId = selectedConversationRef.current

    if (!socket?.connected || !conversationId) return

    socket.emit(typing ? 'typing:start' : 'typing:stop', {
      conversationId,
    })
  }, [])

  return (
    <ChatContext.Provider value={{
      users,
      loadingUsers,
      pendingRequests,
      fetchFriends,
      fetchPendingRequests,
      searchUsers,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      selectedUser,
      selectUser,
      isFindingContacts,
      setIsFindingContacts,
      activeConversationId,
      messages,
      loadingMessages,
      hasMoreMessages,
      loadingOlder,
      loadOlderMessages,
      sendMessage,
      connected,
      onlineUserIds,
      typingUserIds,
      emitTyping,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => useContext(ChatContext)
