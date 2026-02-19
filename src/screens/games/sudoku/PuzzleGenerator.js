// Simple Sudoku puzzle generator using backtracking

// Check if number is valid at position
const isValid = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }

    return true;
};

// Solve sudoku using backtracking
const solveSudoku = (board) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

// Fill diagonal 3x3 boxes first (they don't conflict)
const fillDiagonal = (board) => {
    for (let box = 0; box < 9; box += 3) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }

        let idx = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                board[box + i][box + j] = nums[idx++];
            }
        }
    }
};

// Copy board
const copyBoard = (board) => {
    return board.map(row => [...row]);
};

// Generate a complete valid board
const generateCompleteBoard = () => {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    fillDiagonal(board);
    solveSudoku(board);
    return board;
};

// Remove numbers based on difficulty
const removeNumbers = (board, difficulty) => {
    const cellsToRemove = {
        easy: 40,
        medium: 50,
        hard: 60
    };

    const count = cellsToRemove[difficulty] || 40;
    const puzzle = copyBoard(board);
    let removed = 0;

    while (removed < count) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removed++;
        }
    }

    return puzzle;
};

// Main generator function
export const generatePuzzle = (difficulty = 'medium') => {
    const solution = generateCompleteBoard();
    const puzzle = removeNumbers(solution, difficulty);

    return {
        puzzle,
        solution,
    };
};
