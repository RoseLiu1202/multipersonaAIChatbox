import React, { useState, useEffect,useRef } from 'react';
import { Send, Heart, Brain, Zap, Eye, EyeOff } from 'lucide-react';
import { apiService } from './services/apiService'; // CHANGED: use apiService instead

export default function ReflectionCouncil() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [visiblePanels, setVisiblePanels] = useState({
        supporter: true,
        analyst: true,
        challenger: true
    });
    const [conversations, setConversations] = useState({
        supporter: [],
        analyst: [],
        challenger: []
    });

    const voices = [
        {
            id: 'supporter',
            name: 'The Supporter',
            icon: Heart,
            role: 'Emotional validation'
        },
        {
            id: 'analyst',
            name: 'The Analyst',
            icon: Brain,
            role: 'Objective clarity'
        },
        {
            id: 'challenger',
            name: 'The Challenger',
            icon: Zap,
            role: 'Questions & tensions'
        }
    ];

    const togglePanel = (voiceId) => {
        setVisiblePanels(prev => ({
            ...prev,
            [voiceId]: !prev[voiceId]
        }));
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        setLoading(true);
        const userMessage = input;
        setInput('');

        try {
            // Add user message to all conversations immediately
            const userMsg = { type: 'user', text: userMessage, timestamp: Date.now() };
            const updatedConversations = {
                supporter: [...conversations.supporter, userMsg],
                analyst: [...conversations.analyst, userMsg],
                challenger: [...conversations.challenger, userMsg]
            };
            setConversations(updatedConversations);

            // Get AI responses from backend
            const { responses } = await apiService.sendMessage(conversations, userMessage);

            // Add AI responses
            const finalConversations = { ...updatedConversations };
            Object.keys(responses).forEach(voiceId => {
                finalConversations[voiceId].push({
                    type: 'ai',
                    text: responses[voiceId].text,
                    timestamp: Date.now(),
                    error: !responses[voiceId].success
                });
            });

            setConversations(finalConversations);
        } catch (error) {
            console.error('Error sending message:', error);
            // Add error messages to all conversations
            const errorConversations = { ...conversations };
            Object.keys(errorConversations).forEach(voiceId => {
                errorConversations[voiceId].push({
                    type: 'ai',
                    text: 'Sorry, I encountered an error. Please try again.',
                    timestamp: Date.now(),
                    error: true
                });
            });
            setConversations(errorConversations);
        } finally {
            setLoading(false);
        }
    };

    // ... rest of your component code stays the same ...
    // (ChatPanel, InputPanel, etc.)

    const ChatPanel = ({ voice, messages, isVisible }) => {
        const Icon = voice.icon;
        const messagesEndRef = useRef(null);

        // Auto-scroll effect using ref (more reliable than getElementById)
        useEffect(() => {
            if (messages.length > 0 && messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, [messages]);

        if (!isVisible) return null;

        return (
            <div className="h-full bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Icon size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="font-medium text-slate-200 text-sm">{voice.name}</div>
                            <div className="text-xs text-slate-400">{voice.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => togglePanel(voice.id)}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                    >
                        <EyeOff size={16} className="text-slate-400" />
                    </button>
                </div>

                {/* Messages */}
                <div
                    id={`chat-${voice.id}`}
                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 hover:scrollbar-thumb-slate-600"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#475569 #1e293b'
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-slate-500 text-sm">
                                <Icon size={32} className="mx-auto mb-2 opacity-30" />
                                <p>Waiting for your first message...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, idx) => (
                                <div key={idx} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.type === 'user' ? (
                                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                                            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{message.text}</div>
                                        </div>
                                    ) : (
                                        <div className={`bg-slate-800 border ${message.error ? 'border-red-500/30' : 'border-slate-700/50'} rounded-lg rounded-tl-sm px-4 py-2.5 max-w-[85%]`}>
                                            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{message.text}</div>
                                            {message.error && (
                                                <div className="text-xs text-red-400 mt-1">Failed to get response</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* Invisible element at the bottom for smooth auto-scroll */}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </div>
        );
    };
    const InputPanel = () => {
        const [isComposing, setIsComposing] = useState(false);
        const isComposingRef = useRef(false);
        const inputRef = useRef(null);

        const handleKeyDown = (e) => {
            if (e.nativeEvent.isComposing || e.isComposing || isComposingRef.current) {
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
            }
        };

        const handleCompositionStart = (e) => {
            isComposingRef.current = true;
            setIsComposing(true);
        };

        const handleCompositionEnd = (e) => {
            isComposingRef.current = false;
            setIsComposing(false);
            // Sync state with actual input value after composition
            if (inputRef.current) {
                setInput(inputRef.current.value);
            }
        };

        const handleChange = (e) => {
            // Only update state if NOT composing
            if (!isComposingRef.current) {
                setInput(e.target.value);
            }
        };

        // Update input value when state changes (e.g., after sending)
        useEffect(() => {
            if (inputRef.current && !isComposingRef.current) {
                inputRef.current.value = input;
            }
        }, [input]);

        return (
            <div className="h-full bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="text-sm font-medium text-slate-200 mb-2">Your Reflection</div>
                    <div className="text-xs text-slate-400">
                        {Object.values(visiblePanels).filter(Boolean).length} perspective
                        {Object.values(visiblePanels).filter(Boolean).length !== 1 ? "s" : ""} listening
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 flex flex-col p-4">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            defaultValue={input}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            placeholder="Share what's on your mind..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            <span className="font-medium">{loading ? "Sending..." : "Send"}</span>
                        </button>
                    </div>
                </div>

                {/* Panel Visibility Controls */}
                <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="text-xs text-slate-400 mb-2">Visible Perspectives</div>
                    <div className="flex gap-2">
                        {voices.map((voice) => {
                            const Icon = voice.icon;
                            const isVisible = visiblePanels[voice.id];
                            return (
                                <button
                                    key={voice.id}
                                    onClick={() => togglePanel(voice.id)}
                                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-xs font-medium flex items-center justify-center gap-2 ${
                                        isVisible
                                            ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                                            : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                                    }`}
                                >
                                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {voice.name.replace("The ", "")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };


    const visibleCount = Object.values(visiblePanels).filter(Boolean).length;

    return (
        <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-light text-slate-100">Reflection Council</h1>
                        <p className="text-xs text-slate-400">Multiple perspectives, integrated insight</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-xs text-slate-400">Session active</span>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className={`flex-1 grid gap-3 p-3 overflow-hidden ${
                visibleCount === 3 ? 'grid-cols-2 grid-rows-2' :
                    visibleCount === 2 ? 'grid-cols-2 grid-rows-1' :
                        visibleCount === 1 ? 'grid-cols-2 grid-rows-1' :
                            'grid-cols-1 grid-rows-1'
            }`}>
                <ChatPanel voice={voices[0]} messages={conversations.supporter} isVisible={visiblePanels.supporter} />
                <ChatPanel voice={voices[1]} messages={conversations.analyst} isVisible={visiblePanels.analyst} />
                <ChatPanel voice={voices[2]} messages={conversations.challenger} isVisible={visiblePanels.challenger} />
                <InputPanel />
            </div>
        </div>
    );
}