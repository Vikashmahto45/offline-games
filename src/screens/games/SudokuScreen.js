import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import { generatePuzzle } from './sudoku/PuzzleGenerator';
import { isValidMove, checkWin, getCellConflicts } from './sudoku/Validator';

export default function SudokuScreen({ navigation }) {
    const [difficulty, setDifficulty] = useState('medium');
    const [puzzle, setPuzzle] = useState(null);
    const [solution, setSolution] = useState(null);
    const [board, setBoard] = useState(null);
    const [initialBoard, setInitialBoard] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [mistakes, setMistakes] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [hasWon, setHasWon] = useState(false);

    // Timer
    useEffect(() => {
        let interval;
        if (isRunning && !hasWon) {
            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, hasWon]);

    // Start new game
    const startNewGame = (diff = difficulty) => {
        const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(diff);
        setPuzzle(newPuzzle);
        setSolution(newSolution);
        setBoard(newPuzzle.map(row => [...row]));
        setInitialBoard(newPuzzle.map(row => [...row]));
        setSelectedCell(null);
        setMistakes(0);
        setTimer(0);
        setIsRunning(true);
        setHasWon(false);
    };

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, []);

    // Handle cell selection
    const selectCell = (row, col) => {
        if (initialBoard && initialBoard[row][col] === 0) {
            setSelectedCell({ row, col });
        }
    };

    // Handle number input
    const inputNumber = (num) => {
        if (!selectedCell || hasWon) return;

        const { row, col } = selectedCell;
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = num;

        // Check if valid
        if (num !== 0 && !isValidMove(newBoard, row, col, num)) {
            setMistakes(m => m + 1);
        }

        setBoard(newBoard);

        // Check win
        if (checkWin(newBoard, solution)) {
            setHasWon(true);
            setIsRunning(false);
        }
    };

    // Format timer
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const renderCell = (row, col) => {
        const value = board ? board[row][col] : 0;
        const isInitial = initialBoard ? initialBoard[row][col] !== 0 : false;
        const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
        const conflicts = board && value !== 0 ? getCellConflicts(board, row, col) : [];
        const hasError = conflicts.length > 0;

        return (
            <TouchableOpacity
                key={`${row}-${col}`}
                style={[
                    styles.cell,
                    isSelected && styles.selectedCell,
                    hasError && styles.errorCell,
                    (col === 2 || col === 5) && styles.rightBorder,
                    (row === 2 || row === 5) && styles.bottomBorder,
                ]}
                onPress={() => selectCell(row, col)}
            >
                <Text style={[
                    styles.cellText,
                    isInitial && styles.initialCellText,
                    hasError && styles.errorText,
                ]}>
                    {value !== 0 ? value : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderGrid = () => {
        if (!board) return null;

        return (
            <View style={styles.grid}>
                {board.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
                    </View>
                ))}
            </View>
        );
    };

    const renderNumberPad = () => {
        return (
            <View style={styles.numberPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <TouchableOpacity
                        key={num}
                        style={styles.numberButton}
                        onPress={() => inputNumber(num)}
                    >
                        <Text style={styles.numberText}>{num}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={[styles.numberButton, styles.clearButton]}
                    onPress={() => inputNumber(0)}
                >
                    <Text style={styles.numberText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Sudoku</Text>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Time</Text>
                    <Text style={styles.statValue}>{formatTime(timer)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Mistakes</Text>
                    <Text style={styles.statValue}>{mistakes}</Text>
                </View>
            </View>

            {/* Difficulty */}
            <View style={styles.difficultyContainer}>
                {['easy', 'medium', 'hard'].map(diff => (
                    <TouchableOpacity
                        key={diff}
                        style={[
                            styles.difficultyButton,
                            difficulty === diff && styles.difficultyButtonActive
                        ]}
                        onPress={() => {
                            setDifficulty(diff);
                            startNewGame(diff);
                        }}
                    >
                        <Text style={[
                            styles.difficultyText,
                            difficulty === diff && styles.difficultyTextActive
                        ]}>
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Grid */}
            {renderGrid()}

            {/* Number Pad */}
            {!hasWon && renderNumberPad()}

            {/* Win Screen */}
            {hasWon && (
                <View style={styles.winContainer}>
                    <Text style={styles.winText}>🎉 You Won!</Text>
                    <Text style={styles.winStats}>Time: {formatTime(timer)} | Mistakes: {mistakes}</Text>
                    <TouchableOpacity style={styles.newGameButton} onPress={() => startNewGame()}>
                        <Text style={styles.newGameText}>New Game</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 10,
    },
    backText: {
        color: '#FFF',
        fontSize: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#AAA',
        fontSize: 14,
    },
    statValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    difficultyButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#2a2a3e',
    },
    difficultyButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    difficultyText: {
        color: '#AAA',
        fontSize: 14,
        fontWeight: 'bold',
    },
    difficultyTextActive: {
        color: '#FFF',
    },
    grid: {
        alignSelf: 'center',
        backgroundColor: '#2a2a3e',
        padding: 2,
        borderRadius: 10,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        margin: 1,
    },
    selectedCell: {
        backgroundColor: '#3a3a5e',
    },
    errorCell: {
        backgroundColor: '#5e1a1a',
    },
    rightBorder: {
        borderRightWidth: 2,
        borderRightColor: '#4a4a6e',
    },
    bottomBorder: {
        borderBottomWidth: 2,
        borderBottomColor: '#4a4a6e',
    },
    cellText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    initialCellText: {
        color: '#FFF',
    },
    errorText: {
        color: '#E53935',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 10,
    },
    numberButton: {
        width: 55,
        height: 55,
        margin: 5,
        backgroundColor: '#2a2a3e',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButton: {
        backgroundColor: '#E53935',
    },
    numberText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    winContainer: {
        alignItems: 'center',
        marginTop: 20,
        padding: 20,
        backgroundColor: '#2a2a3e',
        borderRadius: 10,
    },
    winText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 10,
    },
    winStats: {
        fontSize: 16,
        color: '#AAA',
        marginBottom: 20,
    },
    newGameButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    newGameText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
