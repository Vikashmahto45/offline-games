// Sudoku validation logic

// Check if a move is valid
export const isValidMove = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (x !== col && board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (x !== row && board[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const r = i + startRow;
            const c = j + startCol;
            if ((r !== row || c !== col) && board[r][c] === num) {
                return false;
            }
        }
    }

    return true;
};

// Check if puzzle is complete and correct
export const checkWin = (board, solution) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== solution[row][col]) {
                return false;
            }
        }
    }
    return true;
};

// Get all conflicts for a specific cell
export const getCellConflicts = (board, row, col) => {
    const conflicts = [];
    const num = board[row][col];

    if (num === 0) return conflicts;

    // Check row conflicts
    for (let x = 0; x < 9; x++) {
        if (x !== col && board[row][x] === num) {
            conflicts.push({ row, col: x });
        }
    }

    // Check column conflicts
    for (let x = 0; x < 9; x++) {
        if (x !== row && board[x][col] === num) {
            conflicts.push({ row: x, col });
        }
    }

    // Check 3x3 box conflicts
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const r = i + startRow;
            const c = j + startCol;
            if ((r !== row || c !== col) && board[r][c] === num) {
                conflicts.push({ row: r, col: c });
            }
        }
    }

    return conflicts;
};
