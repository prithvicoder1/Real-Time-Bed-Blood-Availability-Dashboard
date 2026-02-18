import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Activity } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm CareBot 🏥 I have access to real-time data. Ask me about hospital beds, blood availability, or ambulances near you!", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);



    const toggleChat = () => setIsOpen(!isOpen);

    const getResponse = async (userInput) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput })
            });

            if (!res.ok) throw new Error('Failed to fetch response');

            const data = await res.json();
            return data.response;
        } catch (err) {
            console.error("Chatbot API error:", err);
            return "I'm having trouble connecting to my brain right now. Please try again later. 🧠💤";
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput('');
        setIsTyping(true);

        try {
            const botResponseText = await getResponse(userInput);
            setMessages(prev => [...prev, { text: botResponseText, sender: 'bot' }]);
        } catch {
            setMessages(prev => [...prev, { text: "Sorry, something went wrong.", sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const QuickReply = ({ text, icon }) => (
        <button
            onClick={() => {
                setInput(text);
                setTimeout(() => {
                    const userMsg = { text, sender: 'user' };
                    setMessages(prev => [...prev, userMsg]);
                    setIsTyping(true);
                    setTimeout(() => {
                        const botResponse = getResponse(text);
                        setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
                        setIsTyping(false);
                    }, 800);
                }, 100);
            }}
            style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
            }}
            onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                e.target.style.transform = 'translateY(0)';
            }}
        >
            {icon && <span>{icon}</span>}
            {text}
        </button>
    );

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {isOpen && (
                <div className="card" data-aos="fade-up" style={{
                    width: '380px',
                    height: '550px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    marginBottom: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        padding: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: 'white',
                                borderRadius: '50%',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Activity size={20} color="#3b82f6" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>CareBridge AI</h3>
                                <span style={{ fontSize: '0.75rem', opacity: 0.95 }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#4ade80',
                                        marginRight: '5px',
                                        animation: 'pulse 2s infinite'
                                    }}></span>
                                    Online • Real-Time Data
                                </span>
                            </div>
                        </div>
                        <X size={22} cursor="pointer" onClick={() => setIsOpen(false)} style={{ opacity: 0.9 }} />
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '15px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: '#0f172a'
                    }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                background: msg.sender === 'user'
                                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                    : 'rgba(30, 41, 59, 0.9)',
                                color: 'white',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-line',
                                boxShadow: msg.sender === 'user'
                                    ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                                    : '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{
                                alignSelf: 'flex-start',
                                background: 'rgba(30, 41, 59, 0.9)',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                borderTopLeftRadius: '4px'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>●●●</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div style={{
                        padding: '12px 15px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        background: '#0f172a',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <QuickReply text="Check ICU beds" icon="🏥" />
                        <QuickReply text="Need O+ blood" icon="🩸" />
                        <QuickReply text="Call ambulance" icon="🚑" />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{
                        padding: '15px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: '#1e293b',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '24px',
                                border: 'none',
                                outline: 'none',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={toggleChat}
                className="btn-primary"
                style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)',
                    animation: isOpen ? 'none' : 'pulse 2s infinite',
                    background: isOpen
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                }}
            >
                {isOpen ? <X size={32} /> : <MessageCircle size={32} />}
            </button>

            {!isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    animation: 'bounce 1s infinite',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
                }}>
                    AI
                </div>
            )}
        </div>
    );
};

export default Chatbot;
