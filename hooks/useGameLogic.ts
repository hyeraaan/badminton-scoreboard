import { useReducer, useEffect } from "react";

export type Player = "player1" | "player2";

export interface GameState {
    scores: {
        player1: number;
        player2: number;
    };
    sets: {
        player1: number;
        player2: number;
    };
    currentSet: number;
    server: Player | null;
    isGameFinished: boolean;
    isSetFinished: boolean; // New: pauses game between sets
    setWinner: Player | null; // New: allows displaying set winner
    winner: Player | null;
    setScoresHistory: { player1: number; player2: number }[]; // Track each set's final score
    playerNames: {
        player1: string;
        player2: string;
    };
    isMatchStarted: boolean;
    language: "ko" | "en";
    scoresMode: "bwf" | "simple";
    history: GameState[];
}

type Action =
    | { type: "INCREMENT_SCORE"; player: Player }
    | { type: "DECREMENT_SCORE"; player: Player }
    | { type: "UNDO" }
    | { type: "RESET_GAME" }
    | { type: "NEXT_SET" } // New action
    | { type: "SET_SERVER"; player: Player }
    | { type: "SET_PLAYER_NAME"; player: Player; name: string }
    | { type: "START_MATCH" }
    | { type: "SET_LANGUAGE"; language: "ko" | "en" }
    | { type: "SET_SCORES_MODE"; mode: "bwf" | "simple" }
    | { type: "LOAD_GAME"; state: GameState };

const MAX_POINTS = 21;
const MAX_SETS = 3;

const initialState: GameState = {
    scores: { player1: 0, player2: 0 },
    sets: { player1: 0, player2: 0 },
    currentSet: 1,
    server: null,
    isGameFinished: false,
    isSetFinished: false,
    setWinner: null,
    winner: null,
    setScoresHistory: [],
    playerNames: { player1: "Player 1", player2: "Player 2" },
    isMatchStarted: false,
    language: "ko",
    scoresMode: "bwf",
    history: [],
};

function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case "INCREMENT_SCORE": {
            if (state.isGameFinished || state.isSetFinished) return state;

            const { player } = action;
            const opponent = player === "player1" ? "player2" : "player1";

            const newScores = { ...state.scores, [player]: state.scores[player] + 1 };
            let newIsGameFinished = false;
            let newIsSetFinished = false;
            let newWonSetPlayer: Player | null = null;
            let newWinner = state.winner;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { history: _, ...currentStateSnapshot } = state;
            const history = [...state.history, currentStateSnapshot as GameState];

            // Deuce Logic
            const isDeuce = newScores[player] >= 20 && newScores[opponent] >= 20;
            const hasWonSet = isDeuce
                ? newScores[player] - newScores[opponent] >= 2
                : newScores[player] >= MAX_POINTS;

            const hasWonSetMax = newScores[player] === 30;

            if (hasWonSet || hasWonSetMax) {
                newIsSetFinished = true;
                newWonSetPlayer = player;

                // Check for Game Win immediately (so we can show Game Over screen instead of Next Set)
                const p1Sets = state.sets.player1 + (player === 'player1' ? 1 : 0);
                const p2Sets = state.sets.player2 + (player === 'player2' ? 1 : 0);

                if (p1Sets > (MAX_SETS / 2) || p2Sets > (MAX_SETS / 2)) {
                    newIsGameFinished = true;
                    newWinner = p1Sets > p2Sets ? "player1" : "player2";
                    newIsSetFinished = false; // Skip intermediate screen if game is over
                }
            }

            // If game is over, we apply sets immediately. If set is just finished (and not game), we wait for NEXT_SET.
            // Actually, we should update sets count immediately so UI reflects it, 
            // OR we can keep old sets count and update on NEXT_SET.
            // Let's update sets count immediately to show "1-0" in the sets dots.
            let newSets = { ...state.sets };
            let newSetScoresHistory = [...state.setScoresHistory];
            if (newIsSetFinished || newIsGameFinished) {
                newSets[player] += 1;
                // Record this set's final score
                newSetScoresHistory.push({ ...newScores });
            }

            return {
                ...state,
                scores: newScores,
                sets: newSets,
                setScoresHistory: newSetScoresHistory,
                isSetFinished: newIsSetFinished,
                isGameFinished: newIsGameFinished,
                setWinner: newWonSetPlayer,
                winner: newWinner,
                server: player,
                history: history.length > 50 ? history.slice(1) : history,
            };
        }
        case "NEXT_SET": {
            if (!state.isSetFinished || state.isGameFinished) return state;

            // Start next set
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { history: _, ...currentStateSnapshot } = state;
            const history = [...state.history, currentStateSnapshot as GameState];

            return {
                ...state,
                currentSet: state.currentSet + 1,
                scores: { player1: 0, player2: 0 },
                isSetFinished: false,
                setWinner: null,
                server: null, // Reset server or rule: winner of prev set serves? usually winner serves.
                // Let's keep the server as the winner of the previous set for now, or null to let them pick? 
                // BWF rule: Winner of previous set serves.
                // 'server' is currently set to the person who scored last (the winner). So we keep it.
                history: history
            };
        }
        case "UNDO": {
            if (state.history.length === 0) return state;
            const previousState = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);
            return {
                ...previousState,
                language: state.language,
                scoresMode: state.scoresMode,
                playerNames: state.playerNames,
                history: newHistory
            };
        }
        case "DECREMENT_SCORE": {
            if (state.history.length === 0) return state;
            const previousState = state.history[state.history.length - 1];

            const scoreDiffPlayer1 = state.scores.player1 - previousState.scores.player1;
            const scoreDiffPlayer2 = state.scores.player2 - previousState.scores.player2;

            const isLastActionIncrementForTarget =
                (action.player === 'player1' && scoreDiffPlayer1 === 1 && scoreDiffPlayer2 === 0) ||
                (action.player === 'player2' && scoreDiffPlayer1 === 0 && scoreDiffPlayer2 === 1);

            if (isLastActionIncrementForTarget) {
                const newHistory = state.history.slice(0, -1);
                return {
                    ...previousState,
                    language: state.language,
                    scoresMode: state.scoresMode,
                    playerNames: state.playerNames,
                    history: newHistory
                };
            } else {
                if (state.scores[action.player] <= 0) return state;

                const newScores = {
                    ...state.scores,
                    [action.player]: state.scores[action.player] - 1
                };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { history: _, ...currentStateSnapshot } = state;
                const history = [...state.history, currentStateSnapshot as GameState];

                return {
                    ...state,
                    scores: newScores,
                    history: history,
                };
            }
        }
        case "RESET_GAME":
            return {
                ...initialState,
                language: state.language,
                scoresMode: state.scoresMode,
                playerNames: state.playerNames,
                history: [] // Clear history on full reset
            };
        case "SET_SERVER":
            return { ...state, server: action.player };
        case "SET_PLAYER_NAME":
            return {
                ...state,
                playerNames: {
                    ...state.playerNames,
                    [action.player]: action.name,
                },
            };
        case "START_MATCH":
            return { ...state, isMatchStarted: true };
        case "SET_LANGUAGE":
            return { ...state, language: action.language };
        case "SET_SCORES_MODE":
            return { ...state, scoresMode: action.mode };
        case "LOAD_GAME":
            return {
                ...initialState,
                ...action.state,
                playerNames: { ...initialState.playerNames, ...action.state?.playerNames },
                language: action.state?.language || initialState.language,
                scoresMode: action.state?.scoresMode || initialState.scoresMode
            };
        default:
            return state;
    }
}

export function useGameLogic() {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        const saved = localStorage.getItem("badminton-score-v1");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                dispatch({ type: "LOAD_GAME", state: parsed } as any);
            } catch (e) {
                console.error("Failed to load game state", e);
            }
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("badminton-score-v1", JSON.stringify(state));
        } catch (e) {
            console.error("Storage limit reached", e);
        }
    }, [state]);

    const incrementScore = (player: Player) => dispatch({ type: "INCREMENT_SCORE", player });
    const undo = () => dispatch({ type: "UNDO" });
    const resetGame = () => dispatch({ type: "RESET_GAME" });
    const nextSet = () => dispatch({ type: "NEXT_SET" }); // New export
    const setServer = (player: Player) => dispatch({ type: "SET_SERVER", player });
    const setPlayerName = (player: Player, name: string) => dispatch({ type: "SET_PLAYER_NAME", player, name });
    const startMatch = () => dispatch({ type: "START_MATCH" });
    const setLanguage = (language: "ko" | "en") => dispatch({ type: "SET_LANGUAGE", language });
    const setScoresMode = (mode: "bwf" | "simple") => dispatch({ type: "SET_SCORES_MODE", mode });
    const decrementScore = (player: Player) => dispatch({ type: "DECREMENT_SCORE", player });

    return {
        state,
        incrementScore,
        undo,
        resetGame,
        nextSet,
        setServer,
        setPlayerName,
        startMatch,
        setLanguage,
        setScoresMode,
        decrementScore
    };
}
