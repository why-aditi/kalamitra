'use client'

import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export function QnAChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m here to help you with any questions about Kalamitra. What would you like to know?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const contextPrompt = `You are a helpful assistant for Kalamitra, a platform that connects artisans with art lovers. 
      You help users with questions about:
      - How to use the platform
      - Artisan services and products
      - Marketplace features
      - Account management
      - Orders and purchases
      - General support
      
      Please provide helpful, friendly, and concise responses. If you don't know something specific about Kalamitra, acknowledge it and offer general helpful guidance.
      
      User question: ${inputValue.trim()}`

      const result = await model.generateContent(contextPrompt)
      const response = await result.response
      const botResponseText = response.text()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again or contact support if the problem persists.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false)
      setIsMinimized(false)
    } else {
      setIsOpen(true)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Interface */}
      {isOpen && (
        <div className={cn(
          "transition-all duration-300 ease-out mb-4",
          isMinimized ? "scale-95 opacity-95" : "scale-100 opacity-100"
        )}>
          <Card className="w-80 shadow-2xl border border-border/50 bg-white/98 backdrop-blur-md overflow-hidden">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-5 w-5" />
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                Kalamitra Assistant
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-7 w-7 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 transition-colors"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="h-7 w-7 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            {/* Chat Content */}
            <div className={cn(
              "transition-all duration-200 ease-in-out overflow-hidden",
              isMinimized ? "h-0" : "h-96"
            )}>
              <CardContent className="p-0 flex flex-col h-full">
                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4 py-3" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                          message.isUser ? "justify-end" : "justify-start"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {!message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "group max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200",
                            message.isUser
                              ? "bg-primary text-primary-foreground rounded-br-md shadow-md"
                              : "bg-muted/80 hover:bg-muted transition-colors"
                          )}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                          <p className={cn(
                            "text-xs mt-2 transition-opacity duration-200",
                            message.isUser 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground/70",
                            "opacity-0 group-hover:opacity-100"
                          )}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Input Area */}
                <div className="border-t border-border/30 p-4 bg-muted/20">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        placeholder="Ask me anything about Kalamitra..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="pr-12 border-border/50 bg-background/80 backdrop-blur-sm focus:bg-background transition-colors rounded-full"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!inputValue.trim() || isLoading}
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2 text-center">
                    Powered by AI • Press Enter to send
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Chat Button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95",
          "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
          "relative overflow-hidden group",
          isOpen && "rotate-0"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className={cn(
          "transition-all duration-300",
          isOpen ? "rotate-45 scale-90" : "rotate-0 scale-100"
        )}>
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </div>
        
        {/* Notification dot for unread messages */}
        {!isOpen && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </Button>
    </div>
  )
}