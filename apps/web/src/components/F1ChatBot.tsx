'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Chip,
  Fade,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Flag as RaceIcon,
} from '@mui/icons-material';
import { f1Colors } from '@/theme/f1Theme';
import { apiPost } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  typing?: boolean;
}

const suggestedQuestions = [
  "What are Max Verstappen's chances at Singapore?",
  "Show me the championship standings",
  "Who won the last race?",
  "Predict Hamilton's performance in Brazil",
];

export default function F1ChatBot() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🏁 Hey there! I\'m your F1 AI assistant. Ask me about race predictions, championship standings, or any F1 question you have!',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      text: '',
      isBot: true,
      timestamp: new Date(),
      typing: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await apiPost('chat/message', { query: text.trim() });
      const responseText = typeof response === 'string' ? response : response?.content || response?.message || "Sorry, I couldn't process your request.";

      // Remove typing indicator and add actual response
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [
          ...withoutTyping,
          {
            id: Date.now().toString(),
            text: responseText,
            isBot: true,
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [
          ...withoutTyping,
          {
            id: Date.now().toString(),
            text: 'Sorry, I encountered an error. Please try again.',
            isBot: true,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isBot = message.isBot;

    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isBot ? 'flex-start' : 'flex-end',
            mb: 1.5,
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          {isBot && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: f1Colors.ferrari.main,
                fontSize: '0.875rem',
              }}
            >
              <BotIcon fontSize="small" />
            </Avatar>
          )}

          <Box
            sx={{
              maxWidth: '75%',
              position: 'relative',
            }}
          >
            {message.typing ? (
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: alpha(f1Colors.mercedes.main, 0.1),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(f1Colors.mercedes.main, 0.2)}`,
                  borderRadius: isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: f1Colors.mercedes.main }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Thinking...
                </Typography>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: isBot
                    ? alpha(f1Colors.mercedes.main, 0.1)
                    : alpha(f1Colors.ferrari.main, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: isBot
                    ? `1px solid ${alpha(f1Colors.mercedes.main, 0.2)}`
                    : `1px solid ${alpha(f1Colors.ferrari.main, 0.3)}`,
                  borderRadius: isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.text}
                </Typography>
              </Paper>
            )}

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.5,
                mx: 1,
                textAlign: isBot ? 'left' : 'right',
                fontSize: '0.75rem',
              }}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>

          {!isBot && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: f1Colors.redBull.main,
                fontSize: '0.875rem',
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
          )}
        </Box>
      </Fade>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: alpha('#000000', 0.6),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha('#ffffff', 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
          backgroundColor: alpha('#1a1a1a', 0.4),
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar sx={{ bgcolor: f1Colors.ferrari.main }}>
          <RaceIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            F1 AI Assistant
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Ask me about races, predictions & standings
          </Typography>
        </Box>
      </Box>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha('#ffffff', 0.05)}` }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            Try asking:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedQuestions.map((question, index) => (
              <Chip
                key={index}
                label={question}
                size="small"
                onClick={() => handleSend(question)}
                sx={{
                  backgroundColor: alpha(f1Colors.alpine.main, 0.1),
                  border: `1px solid ${alpha(f1Colors.alpine.main, 0.2)}`,
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: alpha(f1Colors.alpine.main, 0.2),
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Messages */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha('#ffffff', 0.05),
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha('#ffffff', 0.2),
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.3),
            },
          },
        }}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha('#ffffff', 0.1)}`,
          backgroundColor: alpha('#1a1a1a', 0.4),
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask about F1 predictions, standings, or race results..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: alpha('#000000', 0.3),
                '& fieldset': {
                  borderColor: alpha('#ffffff', 0.2),
                },
                '&:hover fieldset': {
                  borderColor: alpha('#ffffff', 0.4),
                },
                '&.Mui-focused fieldset': {
                  borderColor: f1Colors.ferrari.main,
                },
              },
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            sx={{
              bgcolor: inputText.trim() ? f1Colors.ferrari.main : alpha('#ffffff', 0.1),
              color: 'white',
              '&:hover': {
                bgcolor: inputText.trim() ? f1Colors.ferrari.dark : alpha('#ffffff', 0.2),
              },
              '&.Mui-disabled': {
                bgcolor: alpha('#ffffff', 0.05),
                color: alpha('#ffffff', 0.3),
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ color: 'currentColor' }} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}