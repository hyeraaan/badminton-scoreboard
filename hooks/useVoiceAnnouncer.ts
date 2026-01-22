import { useState, useCallback } from 'react';
import { GameState } from './useGameLogic';

export function useVoiceAnnouncer(state: GameState) {
    const [isMuted, setIsMuted] = useState(false);

    const speak = useCallback((text: string) => {
        if (isMuted) return;
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn("[TTS] Speech Synthesis not supported.");
            return;
        }
        if (!text || text.trim() === '') return;

        console.log(`[TTS] Speaking: "${text}"`);

        // Force resume (Chrome bug workaround)
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Find a matching voice for the language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.toLowerCase().includes(state.language === 'ko' ? 'ko' : 'en'));

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.lang = state.language === 'ko' ? 'ko-KR' : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => console.log(`[TTS] Playing: "${text}"`);
        utterance.onend = () => console.log(`[TTS] Success: Finished.`);
        utterance.onerror = (e) => {
            if (e.error === 'canceled') return;
            console.error(`[TTS] Error: "${e.error}"`);
        };

        window.speechSynthesis.speak(utterance);
    }, [isMuted, state.language]);

    // Helper function to generate score announcement text
    const getScoreAnnouncement = useCallback((
        p1Score: number,
        p2Score: number,
        server: 'player1' | 'player2' | null
    ): string => {
        const serverScore = server === 'player2' ? p2Score : p1Score;
        const receiverScore = server === 'player2' ? p1Score : p2Score;

        const formatPoint = (point: number) => {
            if (state.scoresMode === 'bwf') {
                if (point === 0) return state.language === 'ko' ? "러브" : "Love";
                return String(point);
            }
            return String(point);
        };

        if (serverScore === receiverScore) {
            if (state.scoresMode === 'bwf') {
                if (serverScore === 0) return state.language === 'ko' ? "러브 올" : "Love All";
                return `${formatPoint(serverScore)} ${state.language === 'ko' ? "올" : "All"}`;
            } else {
                if (state.language === 'ko') return `${serverScore} 대 ${receiverScore}`;
                return `${serverScore} All`;
            }
        } else {
            if (state.scoresMode === 'bwf') {
                return `${formatPoint(serverScore)} - ${formatPoint(receiverScore)}`;
            } else {
                if (state.language === 'ko') return `${serverScore} 대 ${receiverScore}`;
                return `${serverScore} - ${receiverScore}`;
            }
        }
    }, [state.language, state.scoresMode]);

    const toggleMute = () => setIsMuted(!isMuted);

    return { isMuted, toggleMute, speak, getScoreAnnouncement };
}
