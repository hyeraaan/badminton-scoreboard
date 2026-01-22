"use client";

import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useVoiceAnnouncer } from "@/hooks/useVoiceAnnouncer";
import styles from "./ScoreBoard.module.css";
import { Globe, BookOpen, Volume2, VolumeX, Undo2, RefreshCw, MinusCircle, Download } from "lucide-react";
import { BadmintonCock } from "@/components/icons/BadmintonCock";

export default function ScoreBoard() {
    const { state, incrementScore, resetGame, undo, setPlayerName, setLanguage, setScoresMode, decrementScore, nextSet, startMatch } = useGameLogic();
    const { isMuted, toggleMute, speak, getScoreAnnouncement } = useVoiceAnnouncer(state);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleNameClick = (player: "player1" | "player2", e: React.MouseEvent) => {
        e.stopPropagation();
        const promptText = state.language === 'ko' ? "선수 이름을 입력하세요:" : "Enter player name:";
        const newName = prompt(promptText, state.playerNames[player]);
        if (newName) {
            setPlayerName(player, newName);
        }
    };

    // Handler for adding points - speaks BEFORE incrementing to stay in click context
    const handleScore = (player: "player1" | "player2") => {
        const newP1 = player === "player1" ? state.scores.player1 + 1 : state.scores.player1;
        const newP2 = player === "player2" ? state.scores.player2 + 1 : state.scores.player2;
        const newServer = player; // Server is the one who scored

        const announcement = getScoreAnnouncement(newP1, newP2, newServer);
        speak(announcement);

        incrementScore(player);
    };

    // Reference for the result screen to capture
    const resultRef = useRef<HTMLDivElement>(null);

    // Save result as image
    const saveResultAsImage = async () => {
        if (!resultRef.current) return;

        try {
            const canvas = await html2canvas(resultRef.current, {
                backgroundColor: '#1a1a2e',
                scale: 2, // Higher quality
            });

            const link = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            const p1Name = state.playerNames.player1.replace(/\s/g, '_');
            const p2Name = state.playerNames.player2.replace(/\s/g, '_');
            link.download = `badminton_${p1Name}_vs_${p2Name}_${date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to save image:', error);
            alert(state.language === 'ko' ? '이미지 저장에 실패했습니다.' : 'Failed to save image.');
        }
    };

    if (!isMounted) return null;

    const t = {
        title: state.language === 'ko' ? "배드민턴 점수판" : "Badminton Match",
        set: state.language === 'ko' ? "세트" : "Set",
        serving: state.language === 'ko' ? "서브" : "SERVING",
        wins: state.language === 'ko' ? "승리!" : "Wins!",
        newGame: state.language === 'ko' ? "새 게임" : "New Game",
        undo: state.language === 'ko' ? "되돌리기" : "Undo",
        reset: state.language === 'ko' ? "초기화" : "Reset",
        mute: state.language === 'ko' ? "음소거" : "Mute",
        unmute: state.language === 'ko' ? "소리 켜기" : "Unmute",
        rulesIntl: state.language === 'ko' ? "국제 룰" : "BWF Rules",
        rulesSimple: state.language === 'ko' ? "일반 룰" : "Simple",
        lang: state.language === 'ko' ? "English" : "한국어",
        nextSet: state.language === 'ko' ? "다음 세트 시작" : "Start Next Set",
        setWinner: state.language === 'ko' ? "세트 승리!" : "Set Won!",
        startMatch: state.language === 'ko' ? "경기 시작" : "Match Start",
    };

    const iconStyle = { width: '20px', height: '20px' };

    return (
        <div className={styles.boardContainer}>
            <header className={styles.header}>
                <div className={styles.title}>{t.title}</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setScoresMode(state.scoresMode === 'bwf' ? 'simple' : 'bwf')}
                        className={styles.iconButton}
                        title={state.scoresMode === 'bwf' ? "BWF Rules" : "Simple Rules"}
                        style={{
                            background: state.scoresMode === 'bwf' ? 'rgba(255, 165, 0, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                            border: state.scoresMode === 'bwf' ? '1px solid orange' : '1px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        <BookOpen style={iconStyle} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                            {state.scoresMode === 'bwf' ? "BWF" : "Sim-"}
                        </span>
                    </button>
                    <button
                        onClick={() => setLanguage(state.language === 'ko' ? 'en' : 'ko')}
                        className={styles.iconButton}
                        title={state.language === 'ko' ? "Switch to English" : "한국어로 변경"}
                    >
                        <Globe style={iconStyle} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                            {state.language === 'ko' ? "KO" : "EN"}
                        </span>
                    </button>
                    <div className={styles.setIndicator}>{t.set} {state.currentSet}</div>
                </div>
            </header>

            <div className={styles.scoresArea}>
                {/* Player 1 Section */}
                <div
                    className={`${styles.playerSection} ${styles.player1}`}
                    onClick={() => handleScore("player1")}
                >
                    {state.server === "player1" && (
                        <div className={styles.serverIndicator}>{t.serving}</div>
                    )}
                    <div
                        className={styles.playerName}
                        onClick={(e) => handleNameClick("player1", e)}
                        role="button"
                        title={state.language === 'ko' ? "이름 수정" : "Click to edit name"}
                    >
                        {state.playerNames.player1} ✎
                    </div>
                    <div className={styles.score}>{state.scores.player1}</div>

                    <button
                        onClick={(e) => { e.stopPropagation(); decrementScore("player1"); }}
                        className={styles.decrementButton}
                        title={state.language === 'ko' ? "점수 취소 (Undo)" : "Undo Point"}
                    >
                        <MinusCircle size={24} />
                    </button>

                    <div className={styles.setsContainer}>
                        {Array.from({ length: state.sets.player1 }).map((_, i) => (
                            <BadmintonCock key={i} size={24} color="#ffd700" />
                        ))}
                    </div>
                </div>

                {/* Player 2 Section */}
                <div
                    className={`${styles.playerSection} ${styles.player2}`}
                    onClick={() => handleScore("player2")}
                >
                    {state.server === "player2" && (
                        <div className={styles.serverIndicator}>{t.serving}</div>
                    )}
                    <div
                        className={styles.playerName}
                        onClick={(e) => handleNameClick("player2", e)}
                        role="button"
                        title={state.language === 'ko' ? "이름 수정" : "Click to edit name"}
                    >
                        {state.playerNames.player2} ✎
                    </div>
                    <div className={styles.score}>{state.scores.player2}</div>

                    <button
                        onClick={(e) => { e.stopPropagation(); decrementScore("player2"); }}
                        className={styles.decrementButton}
                        title={state.language === 'ko' ? "점수 취소 (Undo)" : "Undo Point"}
                    >
                        <MinusCircle size={24} />
                    </button>

                    <div className={styles.setsContainer}>
                        {Array.from({ length: state.sets.player2 }).map((_, i) => (
                            <BadmintonCock key={i} size={24} color="#ffd700" />
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                <button
                    onClick={() => {
                        // Priming the audio engine
                        if (window.speechSynthesis) {
                            const u = new SpeechSynthesisUtterance("");
                            u.volume = 0;
                            window.speechSynthesis.speak(u);
                        }
                        toggleMute();
                    }}
                    className={styles.controlButton}
                    title="Mute/Unmute"
                >
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </button>
                <button onClick={undo} className={styles.controlButton} title="Undo">
                    <Undo2 />
                </button>
                <button onClick={resetGame} className={styles.controlButton} title="Reset">
                    <RefreshCw />
                </button>
            </div>



            {state.isSetFinished && !state.isGameFinished && (
                <div className={styles.winnerOverlay}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                        <BadmintonCock size={48} color="#ffd700" />
                        <h2 style={{ fontSize: '2rem' }}>
                            {state.setWinner === "player1" ? state.playerNames.player1 : state.playerNames.player2}
                        </h2>
                        <BadmintonCock size={48} color="#ffd700" />
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#ffd700', marginBottom: '20px' }}>{t.setWinner}</div>

                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '30px' }}>
                        {state.scores.player1} : {state.scores.player2}
                    </div>

                    <button
                        onClick={() => {
                            const loveAll = state.language === 'ko'
                                ? (state.scoresMode === 'bwf' ? "러브 올" : "영 대 영")
                                : (state.scoresMode === 'bwf' ? "Love All" : "Zero - Zero");
                            speak(loveAll);
                            nextSet();
                        }}
                        className={styles.newGameButton}
                    >
                        {t.nextSet}
                    </button>
                </div>
            )}

            {state.winner && (
                <div className={styles.winnerOverlay}>
                    <div ref={resultRef} style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <BadmintonCock size={64} color="#ffd700" />
                            <h1>
                                {state.winner === "player1" ? state.playerNames.player1 : state.playerNames.player2}
                            </h1>
                            <BadmintonCock size={64} color="#ffd700" />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginTop: '1rem', color: '#ccc' }}>{t.wins}</h2>

                        <div style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '10px', color: '#888' }}>
                            {state.language === 'ko' ? '세트별 점수' : 'Set Scores'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {state.setScoresHistory.map((setScore, index) => {
                                const p1Won = setScore.player1 > setScore.player2;
                                const p2Won = setScore.player2 > setScore.player1;
                                return (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '15px',
                                        fontSize: '1.5rem',
                                        padding: '10px 20px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ width: '80px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                            {p1Won && <BadmintonCock size={20} color="#ffd700" />}
                                            <span style={{ fontWeight: p1Won ? 'bold' : 'normal', color: p1Won ? '#ffd700' : '#fff' }}>
                                                {setScore.player1}
                                            </span>
                                        </span>
                                        <span style={{ color: '#666' }}>Set {index + 1}</span>
                                        <span style={{ width: '80px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: p2Won ? 'bold' : 'normal', color: p2Won ? '#ffd700' : '#fff' }}>
                                                {setScore.player2}
                                            </span>
                                            {p2Won && <BadmintonCock size={20} color="#ffd700" />}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ fontSize: '2rem', marginBottom: '20px', fontWeight: 'bold' }}>
                            {state.language === 'ko' ? '최종' : 'Final'}: {state.sets.player1} - {state.sets.player2}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={saveResultAsImage} className={styles.newGameButton} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={20} />
                            {state.language === 'ko' ? '저장' : 'Save'}
                        </button>
                        <button onClick={resetGame} className={styles.newGameButton}>
                            {t.newGame}
                        </button>
                    </div>
                </div>
            )}

            {!state.isMatchStarted && (
                <div className={styles.winnerOverlay} style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    <BadmintonCock size={120} color="#ffd700" style={{ marginBottom: '2rem' }} />
                    <h1 style={{ fontSize: '3rem', marginBottom: '3rem', textAlign: 'center' }}>
                        {t.title}
                    </h1>
                    <button
                        onClick={() => {
                            if (!isMuted) speak(state.language === 'ko' ? "경기를 시작합니다" : "Match Start");
                            startMatch();
                        }}
                        className={styles.newGameButton}
                        style={{ fontSize: '2rem', padding: '1.5rem 4rem' }}
                    >
                        {t.startMatch}
                    </button>
                    <div style={{ marginTop: '2rem', color: '#888' }}>
                        {state.language === 'ko' ? "음성 안내를 위해 버튼을 눌러주세요" : "Click to enable voice guidance"}
                    </div>
                </div>
            )}
        </div>
    );
}
