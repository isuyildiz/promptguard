import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const Chat = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]); // { type: 'user'|'bot', content: string, status?: string }
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { type: 'user', content: prompt };
    setMessages([...messages, userMessage]);
    setLoading(true);

    try {
      // Teknik Sözleşme Bölüm 10.2: POST /send isteği
      /*
      const response = await api.post('/send', { 
        prompt: prompt,
        session_id: "s123" // Geçici session_id
      });

      const { llm_response, final_action, user_message } = response.data;

      // Yanıtı ve sistem mesajını ekle
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: llm_response, 
        status: final_action,
        systemNote: user_message 
      }]);
      */

      // SAHTE CEVAP (Backend varmış gibi simüle ediyoruz):
        setTimeout(() => {
        const mockResponse = {
            llm_response: "Bu, backend henüz hazır olmadığı için üretilen sahte bir cevaptır.",
            final_action: "allow", // Test için 'mask_and_allow' veya 'block' da yazabilirsin
            user_message: "Prompt başarıyla analiz edildi."
        };

        setMessages(prev => [...prev, { 
            type: 'bot', 
            content: mockResponse.llm_response, 
            status: mockResponse.final_action,
            systemNote: mockResponse.user_message 
        }]);
        setLoading(false);
        setPrompt('');
        }, 1000);
        
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h1 className="text-xl font-bold text-purple-700">PromptGuard Chat</h1>
        <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
          {user?.mode === 'institutional' ? 'Kurumsal Mod' : 'Bireysel Mod'}
        </span>
      </header>

      {/* Mesaj Alanı */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.type === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
              {msg.systemNote && (
                <div className="mt-2 text-xs border-t pt-1 border-gray-300 italic">
                  Sistem Notu: {msg.systemNote}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Alanı */}
      <form onSubmit={handleSend} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? 'Analiz Ediliyor...' : 'Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;