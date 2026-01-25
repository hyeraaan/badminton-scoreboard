"use client";

import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useVoiceAnnouncer } from "@/hooks/useVoiceAnnouncer";
import styles from "./ScoreBoard.module.css";
import { Globe, Settings, Volume2, VolumeX, Undo2, RefreshCw, MinusCircle, Download, Search, Maximize, Minimize } from "lucide-react";
import { BadmintonCock } from "@/components/icons/BadmintonCock";

// Extend native types to support vendor prefixes
interface DocumentWithFullscreen extends Document {
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
    mozCancelFullScreen?: () => void;
    msExitFullscreen?: () => void;
    webkitExitFullscreen?: () => void;
}

interface HTMLElementWithFullscreen extends HTMLElement {
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
}

export default function ScoreBoard() {
    const { state, incrementScore, resetGame, undo, setPlayerName, setLanguage, setScoresMode, decrementScore, nextSet, startMatch } = useGameLogic();
    const { isMuted, toggleMute, speak, getScoreAnnouncement } = useVoiceAnnouncer(state);
    const [isMounted, setIsMounted] = React.useState(false);
    const [showHelp, setShowHelp] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        // Listen for fullscreen change events to sync state
        const handleFullscreenChange = () => {
            const doc = document as DocumentWithFullscreen;
            setIsFullscreen(!!doc.fullscreenElement || !!doc.webkitFullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            const doc = document as DocumentWithFullscreen;
            const docEl = document.documentElement as HTMLElementWithFullscreen;

            const requestFullScreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
            const exitFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen;

            if (!requestFullScreen) {
                // API not supported (e.g. iPhone Safari)
                alert(state.language === 'ko'
                    ? "이 기기에서는 전체 화면 모드를 지원하지 않습니다.\n브라우저 메뉴의 '홈 화면에 추가'를 이용해 주세요."
                    : "Fullscreen mode is not supported on this device.\nPlease use 'Add to Home Screen' from browser menu.");
                return;
            }

            if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
                await requestFullScreen.call(docEl);
            } else {
                if (exitFullScreen) {
                    await exitFullScreen.call(doc);
                }
            }
        } catch (err) {
            console.log("Fullscreen toggle ignored:", err);
            // Ignore benign errors (e.g. user cancelled)
        }
    };

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
                backgroundColor: '#0f172a', // Match Deep Navy background
                scale: 2, // Higher quality
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert(state.language === 'ko' ? '이미지 생성 실패' : 'Failed to create image');
                    return;
                }

                const date = new Date().toISOString().slice(0, 10);
                const p1Name = state.playerNames.player1.replace(/\s/g, '_');
                const p2Name = state.playerNames.player2.replace(/\s/g, '_');
                const filename = `badminton_${p1Name}_vs_${p2Name}_${date}.png`;
                const file = new File([blob], filename, { type: 'image/png' });

                // Try native sharing (Mobile "Save to Photos" support)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Badminton Match Result',
                            text: `${state.playerNames.player1} vs ${state.playerNames.player2} Result`,
                        });
                        return; // Successfully shared
                    } catch (shareError) {
                        console.log('Share canceled or failed, falling back to download', shareError);
                        // Fallthrough to download if share fails (or user cancels)
                    }
                }

                // Fallback: Direct Download or Clipboard (Desktop)
                try {
                    // Create Download Link
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (err) {
                    console.error("Download failed", err);
                }

            }, 'image/png');

        } catch (error) {
            console.error('Failed to capture image:', error);
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

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowHelp(true)}
                        className={styles.helpButton}
                        title="Help"
                    >
                        <Search strokeWidth={2} size={18} />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className={styles.iconButton}
                        title={state.language === 'ko' ? "전체 화면" : "Toggle Fullscreen"}
                    >
                        {isFullscreen ? <Minimize strokeWidth={2} size={18} /> : <Maximize strokeWidth={2} size={18} />}
                    </button>
                    <button
                        onClick={() => setScoresMode(state.scoresMode === 'bwf' ? 'simple' : 'bwf')}
                        className={`${styles.iconButton} ${state.scoresMode === 'bwf' ? styles.activeBwf : ''}`}
                        title={state.scoresMode === 'bwf' ? "BWF Rules" : "Simple Rules"}
                    >
                        <Settings style={iconStyle} strokeWidth={2} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>
                            {state.scoresMode === 'bwf' ? "BWF RULE" : "SIMPLE RULE"}
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
                        style={{ zIndex: 5 }} // Ensure accessible
                    >
                        <MinusCircle size={24} strokeWidth={2} />
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
                        style={{ zIndex: 5 }}
                    >
                        <MinusCircle size={24} strokeWidth={2} />
                    </button>

                    <div className={styles.setsContainer}>
                        {Array.from({ length: state.sets.player2 }).map((_, i) => (
                            <BadmintonCock key={i} size={24} />
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.controls}>


                <button
                    onClick={() => {
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
                    {isMuted ? <VolumeX strokeWidth={2} /> : <Volume2 strokeWidth={2} />}
                </button>
                <button onClick={undo} className={styles.controlButton} title="Undo">
                    <Undo2 strokeWidth={2} />
                </button>
                <button onClick={resetGame} className={styles.controlButton} title="Reset">
                    <RefreshCw strokeWidth={2} />
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 hyeraaan</p>
            </footer>

            {/* Help Overlay */}
            {showHelp && (
                <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
                    <div className={styles.helpItem} style={{ top: '80px', right: '20px', alignItems: 'flex-end', textAlign: 'right' }}>
                        <div className={styles.helpText}>
                            {state.language === 'ko' ? '도움말 / 전체 화면 / 설정 / 언어' : 'Help / Fullscreen / Settings / Language'}
                        </div>
                        <div className={styles.helpArrow}>↑</div>
                    </div>

                    <div className={styles.helpItem} style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', alignItems: 'center' }}>
                        <div className={styles.helpText} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {state.language === 'ko' ? '화면을 터치하여 득점' : 'Tap screen to Score'}
                        </div>
                        <div className={styles.helpText} style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            {state.language === 'ko' ? '(이름을 눌러 수정하세요)' : '(Click name to edit)'}
                        </div>
                    </div>

                    <div className={styles.helpItem} style={{ bottom: '100px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }}>
                        <div className={styles.helpArrow}>↓</div>
                        <div className={styles.helpText}>
                            {state.language === 'ko' ? '음소거 / 되돌리기 / 초기화' : 'Mute / Undo / Reset'}
                        </div>
                    </div>


                </div>
            )}

            {/* Set Result / Game Result Overlays */}
            {((state.isSetFinished && !state.isGameFinished) || state.winner) && (
                <div className={styles.winnerOverlay}>
                    {state.isSetFinished && !state.isGameFinished ? (
                        <>
                            {/* Set Result Content */}
                            <div className={styles.overlayContent}>
                                <div className={styles.overlayHeaderRow}>
                                    <BadmintonCock size={48} className="text-primary" />
                                    <h2 className={styles.overlayTitle}>
                                        {state.setWinner === "player1" ? state.playerNames.player1 : state.playerNames.player2}
                                    </h2>
                                    <BadmintonCock size={48} className="text-primary" />
                                </div>
                                <div className={styles.overlaySubtitle}>{t.setWinner}</div>

                                <div className={styles.overlayBigScore}>
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
                        </>
                    ) : (
                        <>
                            {/* Game Result Content */}
                            <div ref={resultRef} className={styles.overlayContent}>
                                <div className={styles.overlayHeaderRow}>
                                    <BadmintonCock size={64} className="text-primary" />
                                    <h1 className={styles.overlayTitle}>
                                        {state.winner === "player1" ? state.playerNames.player1 : state.playerNames.player2}
                                    </h1>
                                    <BadmintonCock size={64} className="text-primary" />
                                </div>
                                <h2 className={styles.overlaySubtitle}>{t.wins}</h2>

                                <div className={styles.overlaySectionTitle}>
                                    {state.language === 'ko' ? '세트별 점수' : 'Set Scores'}
                                </div>

                                <div className={styles.setScoresList}>
                                    {state.setScoresHistory.map((setScore, index) => {
                                        const p1Won = setScore.player1 > setScore.player2;
                                        const p2Won = setScore.player2 > setScore.player1;
                                        return (
                                            <div key={index} className={styles.setScoreItem}>
                                                <span className={`${styles.setScoreName} ${p1Won ? styles.setWinnerName : ''}`}>
                                                    {p1Won && <BadmintonCock size={20} />}
                                                    {setScore.player1}
                                                </span>
                                                <span className={styles.setLabel}>Set {index + 1}</span>
                                                <span className={`${styles.setScoreName} ${p2Won ? styles.setWinnerName : ''}`}>
                                                    {setScore.player2}
                                                    {p2Won && <BadmintonCock size={20} />}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.overlayFinalScore}>
                                    {state.language === 'ko' ? '최종' : 'Final'}: {state.sets.player1} - {state.sets.player2}
                                </div>

                                <div className={styles.overlayButtonsRow}>
                                    <button onClick={saveResultAsImage} className={styles.newGameButton} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Download size={20} />
                                        {state.language === 'ko' ? '저장' : 'Save'}
                                    </button>
                                    <button onClick={resetGame} className={styles.newGameButton}>
                                        {t.newGame}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {!state.isMatchStarted && (
                <div className={`${styles.winnerOverlay} ${styles.startScreenOverlay}`} style={{ backgroundColor: 'hsl(var(--background) / 0.95)' }}>
                    <div className={styles.startContent}>
                        <BadmintonCock size={100} className="text-foreground" />
                        <h1 className={styles.startTitle}>
                            {t.title}
                        </h1>
                        <button
                            onClick={() => {
                                if (!isMuted) speak(state.language === 'ko' ? "경기를 시작합니다" : "Match Start");
                                startMatch();
                            }}
                            className={styles.startButton}
                        >
                            {t.startMatch}
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}
