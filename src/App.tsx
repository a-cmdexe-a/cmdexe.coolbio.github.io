/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { MessageCircle, ExternalLink, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSound = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    try {
      // 1. Write to Firestore
      await addDoc(collection(db, 'messages'), {
        text: message,
        createdAt: serverTimestamp(),
      });

      // 2. Notify Discord via API route
      await fetch('/api/notify-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      setStatus('sent');
      setMessage('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setStatus('error');
    }
  };

  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com/a-cmdexe-a' },
    { name: 'Discord', url: 'cd_cmdexe' },
  ];

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: 'url(/assets/3cbb8.webp)' }}>
      {/* Background music */}
      <audio ref={audioRef} autoPlay loop>
        <source src="/assets/anthem.mp3" type="audio/mpeg" />
      </audio>

      {/* Sound toggle button */}
      <button 
        onClick={toggleSound}
        className="absolute top-4 right-4 p-3 bg-white/50 rounded-full hover:bg-white transition-colors"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-lg w-full max-w-lg border border-red-500/20 bg-red-50/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-4xl font-light overflow-hidden border-4 border-red-500/20 shadow-md">
            <img src="/assets/c47db.webp" alt="Аватар" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">cmdexe</h1>
        </div>

        <div className="space-y-3 mb-8">
          {socialLinks.map((link) => {
            if (link.name === 'GitHub') {
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-4 bg-white/30 hover:bg-white/70 hover:scale-[1.02] border border-red-500/20 rounded-2xl transition-all font-medium text-neutral-900 shadow-sm"
                >
                  <span>{link.name}</span>
                  <ExternalLink size={18} className="text-neutral-500" />
                </a>
              );
            } else {
              return (
                <button
                  key={link.name}
                  onClick={() => handleCopy(link.url)}
                  className="flex items-center justify-between w-full p-4 bg-white/30 hover:bg-white/70 hover:scale-[1.02] border border-red-500/20 rounded-2xl transition-all font-medium text-neutral-900 shadow-sm"
                >
                  <span>{link.name}</span>
                  {copied === link.url ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-neutral-500" />}
                </button>
              );
            }
          })}
        </div>

        <div className="border-t border-red-500/20 pt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-neutral-900">
            <MessageCircle size={20} />
            Анонимное сообщение
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full p-4 border border-red-500/20 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none resize-none transition-all bg-white"
              rows={4}
              placeholder="Напиши мне что угодно..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-sm text-neutral-500">
              <span>{message.length}/1000</span>
              <button
                type="submit"
                disabled={status === 'sending' || !message.trim()}
                className="bg-neutral-900 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
              >
                {status === 'sending' ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>

          {status === 'sent' && (
            <p className="mt-4 text-emerald-600 text-center font-medium bg-emerald-50 py-2 rounded-xl">
              Сообщение отправлено!
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-red-600 text-center font-medium bg-red-50 py-2 rounded-xl">
              Ошибка. Попробуй позже.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
