'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Message = Database['public']['Tables']['trip_messages']['Row']

type ProfileMini = {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
}

interface Props {
  tripId: string
  currentUserId: string
  initialMessages: Message[]
  members: ProfileMini[]
}

export function ChatClient({ tripId, currentUserId, initialMessages, members }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const profileMap = Object.fromEntries(members.map(m => [m.id, m]))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === (payload.new as Message).id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    const supabase = createClient()
    await supabase.from('trip_messages').insert({
      trip_id: tripId,
      user_id: currentUserId,
      content,
    })
    setSending(false)
    textareaRef.current?.focus()
  }

  async function handleDelete(messageId: string) {
    const supabase = createClient()
    await supabase.from('trip_messages').delete().eq('id', messageId)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getInitials(p: ProfileMini) {
    if (p.full_name) {
      return p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    }
    return p.email[0].toUpperCase()
  }

  function getDisplayName(p: ProfileMini) {
    return p.full_name || p.email.split('@')[0]
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateLabel(dateKey: string) {
    const d = new Date(dateKey + 'T12:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  // Group messages by date
  const groups: { dateKey: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const dateKey = msg.created_at.slice(0, 10)
    const g = groups.find(x => x.dateKey === dateKey)
    if (g) g.msgs.push(msg)
    else groups.push({ dateKey, msgs: [msg] })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto px-4 sm:px-6">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Start chatting with your travel crew — share ideas, coordinate plans, or just say hi!
            </p>
          </div>
        )}

        {groups.map(({ dateKey, msgs }) => (
          <div key={dateKey} className="mb-4">
            {/* Date separator */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-semibold px-2 uppercase tracking-wide">
                {formatDateLabel(dateKey)}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-0.5">
              {msgs.map((msg, idx) => {
                const isOwn = msg.user_id === currentUserId
                const sender = profileMap[msg.user_id]
                const prevMsg = msgs[idx - 1]
                const nextMsg = msgs[idx + 1]
                const isFirst = !prevMsg || prevMsg.user_id !== msg.user_id
                const isLast = !nextMsg || nextMsg.user_id !== msg.user_id

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
                  >
                    {/* Avatar */}
                    {!isOwn && (
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isLast
                            ? 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-sm'
                            : 'invisible'
                        }`}
                      >
                        {sender ? getInitials(sender) : '?'}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Sender name */}
                      {!isOwn && isFirst && sender && (
                        <span className="text-[11px] text-gray-400 font-semibold mb-1 ml-1">
                          {getDisplayName(sender)}
                        </span>
                      )}

                      <div className={`relative group/msg flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Bubble */}
                        <div
                          className={`px-3.5 py-2 text-sm leading-relaxed break-words ${
                            isOwn
                              ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-violet-100 rounded-2xl rounded-br-md'
                              : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-2xl rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Delete (own messages only, hover) */}
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover/msg:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all shrink-0"
                            aria-label="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Timestamp (last in group) */}
                      {isLast && (
                        <span className="text-[10px] text-gray-300 mt-1 mx-1">
                          {formatTime(msg.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 py-3 shrink-0">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your crew..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all overflow-y-auto max-h-28"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md hover:shadow-violet-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none transition-all duration-200 shrink-0 mb-0.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-300 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
