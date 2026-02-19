
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { BOARD_SIZE, CELL_SIZE, COLORS, TURN_ORDER, MAIN_PATH, HOME_STRETCH, SAFE_SQUARES, getXY, START_OFFSET } from './ludoConstants';

const LudoScreen = () => {
  // --- STATE ---
  const [pieces, setPieces] = useState({
    RED: [-1, -1, -1, -1],
    GREEN: [-1, -1, -1, -1],
    YELLOW: [-1, -1, -1, -1],
    BLUE: [-1, -1, -1, -1],
  });

  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [phase, setPhase] = useState('SETUP'); // SETUP | ROLL | MOVE | WAITING
  const [gameMode, setGameMode] = useState('CPU'); // CPU | LOCAL
  const [numPlayers, setNumPlayers] = useState(4); // 2 | 3 | 4
  const [activeColors, setActiveColors] = useState(TURN_ORDER); // Current active players array
  const [rolling, setRolling] = useState(false);
  const [validMoves, setValidMoves] = useState([]); // Array of piece indices [0, 2]
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Refs for async operations
  const piecesRef = useRef(pieces);
  const intervalRef = useRef(null);
  const timeoutsRef = useRef([]);
  const botActiveRef = useRef(false);

  piecesRef.current = pieces; // Sync ref

  const currentColor = activeColors[turn];
  const isBot = gameMode === 'CPU' && currentColor !== 'RED';

  // --- CLEANUP ---
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // --- BOT LOOP ---
  useEffect(() => {
    if (gameOver) return;
    if (isBot && phase === 'ROLL' && !rolling && !botActiveRef.current) {
      botActiveRef.current = true;
      const t = setTimeout(botTurnRoutine, 800);
      timeoutsRef.current.push(t);
    }
  }, [turn, phase, gameOver, rolling]);

  const botTurnRoutine = async () => {
    const roll = await performDiceRoll();
    const myPieces = piecesRef.current[currentColor];
    const validIndices = getValidMovesForColor(currentColor, roll, myPieces);

    if (validIndices.length === 0) {
      const t = setTimeout(() => {
        botActiveRef.current = false;
        nextTurn();
      }, 1000);
      timeoutsRef.current.push(t);
      return;
    }

    const bestIdx = pickBestBotMove(validIndices, roll);

    const t = setTimeout(() => {
      botActiveRef.current = false;
      doMove(currentColor, bestIdx, roll);
    }, 600);
    timeoutsRef.current.push(t);
  };

  const pickBestBotMove = (indices, roll) => {
    const myPieces = piecesRef.current[currentColor];
    let bestScore = -1;
    let bestIdx = indices[0];

    indices.forEach(idx => {
      let score = 0;
      const pos = myPieces[idx];
      const targetPos = pos === -1 ? 0 : pos + roll;

      // Priority 1: Finish piece (highest)
      if (targetPos === 56) { score = 100; }
      // Priority 2: Capture opponent
      else if (targetPos <= 50) {
        const globalIdx = (START_OFFSET[currentColor] + targetPos) % 52;
        if (!SAFE_SQUARES.includes(globalIdx)) {
          for (const opp of activeColors) {
            if (opp === currentColor) continue;
            piecesRef.current[opp].forEach(p => {
              if (p >= 0 && p <= 50) {
                const g = (START_OFFSET[opp] + p) % 52;
                if (g === globalIdx) score = Math.max(score, 80);
              }
            });
          }
        }
        // Priority 3: Land on safe square
        if (SAFE_SQUARES.includes(globalIdx)) score = Math.max(score, 50);
      }
      // Priority 4: Advance (further is better)
      score = Math.max(score, targetPos);

      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    return bestIdx;
  };

  // --- GAME LOGIC ---

  const performDiceRoll = () => {
    return new Promise(resolve => {
      setRolling(true);
      let count = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setDice(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 8) {
          clearInterval(intervalRef.current);
          intervalRef.current = null; // Clean up ref
          const final = Math.floor(Math.random() * 6) + 1;
          setDice(final);
          setRolling(false);
          resolve(final);
        }
      }, 80);
    });
  };

  const onUserRoll = async () => {
    if (phase !== 'ROLL' || isBot || rolling) return;

    const roll = await performDiceRoll();

    // Use REF to get latest pieces state safely
    // Use REF to get latest pieces state safely
    const currentPieces = piecesRef.current[currentColor];
    const valid = getValidMovesForColor(currentColor, roll, currentPieces);

    if (valid.length === 0) {
      setTimeout(() => nextTurn(), 800);
    } else {
      setPhase('MOVE');
      setValidMoves(valid);
    }
  };

  const getValidMovesForColor = (color, roll, currentPieces) => {
    const indices = [];
    currentPieces.forEach((pos, idx) => {
      if (isValidMove(color, pos, roll)) {
        indices.push(idx);
      }
    });
    return indices;
  };

  const isValidMove = (color, pos, roll) => {
    // 1. Leaving Home — need 6 and start not blocked
    if (pos === -1) {
      return roll === 6 && !isStartBlocked(color);
    }

    // 2. Overshoot check
    const newPos = pos + roll;
    if (newPos > 56) return false;

    // 3. Own stacking check (max 2 on any square, main path AND home stretch)
    const myPieces = piecesRef.current[color];
    let ownCount = 0;
    myPieces.forEach(p => { if (p === newPos) ownCount++; });
    if (ownCount >= 2) return false;

    // 4. Opponent blocking on main path (stack of 2+ blocks landing)
    if (newPos <= 50) {
      const globalIdx = (START_OFFSET[color] + newPos) % 52;
      for (const oppColor of activeColors) {
        if (oppColor === color) continue;
        let oppCount = 0;
        piecesRef.current[oppColor].forEach(p => {
          if (p >= 0 && p <= 50) {
            const g = (START_OFFSET[oppColor] + p) % 52;
            if (g === globalIdx) oppCount++;
          }
        });
        if (oppCount >= 2) return false; // Blocked by opponent stack
      }
    }

    return true;
  };

  const isStartBlocked = (color) => {
    const globalStart = START_OFFSET[color];

    // Check own pieces at relative pos 0
    let ownCount = 0;
    piecesRef.current[color].forEach(p => { if (p === 0) ownCount++; });
    if (ownCount >= 2) return true;

    // Check opponent stacks at same global square
    for (const oppColor of activeColors) {
      if (oppColor === color) continue;
      let oppCount = 0;
      piecesRef.current[oppColor].forEach(p => {
        if (p >= 0 && p <= 50) {
          const g = (START_OFFSET[oppColor] + p) % 52;
          if (g === globalStart) oppCount++;
        }
      });
      if (oppCount >= 2) return true;
    }

    return false;
  };

  const doMove = (color, pieceIdx, roll) => {
    setPhase('WAITING');
    setValidMoves([]);

    const newPieces = {
      RED: [...piecesRef.current.RED],
      GREEN: [...piecesRef.current.GREEN],
      YELLOW: [...piecesRef.current.YELLOW],
      BLUE: [...piecesRef.current.BLUE],
    };
    const currentPos = newPieces[color][pieceIdx];

    // 1. Calculate Target
    let targetPos;
    if (currentPos === -1) targetPos = 0; // Move to Start
    else targetPos = currentPos + roll;

    // 2. Commit Move (CRITICAL FIX: Update State Object BEFORE Capture Check)
    newPieces[color][pieceIdx] = targetPos; // <--- This was missing!

    // 3. Capture Logic
    let captured = false;
    if (targetPos <= 50) { // Only on main path
      const globalIdx = (START_OFFSET[color] + targetPos) % 52;

      if (!SAFE_SQUARES.includes(globalIdx)) {
        // Check opponents
        activeColors.forEach(oppColor => {
          if (oppColor === color) return;

          // Find opponent pieces at this globalIdx
          const oppArr = newPieces[oppColor];
          let oppAtSq = []; // Indices of opp pieces at this square
          oppArr.forEach((p, i) => {
            if (p >= 0 && p <= 50) {
              const g = (START_OFFSET[oppColor] + p) % 52;
              if (g === globalIdx) oppAtSq.push(i);
            }
          });

          // Rule: Capture if exactly 1 piece? Or can capture stack?
          // User said: "capture... if land on square occupied by exactly one opponent piece... Stack of 2... cannot capture".
          if (oppAtSq.length === 1) {
            // KAPOW!
            const idxToCapture = oppAtSq[0];
            newPieces[oppColor][idxToCapture] = -1; // Send Home
            captured = true;
          }
        });
      }
    }

    // 4. Update State & Ref
    setPieces(newPieces);
    piecesRef.current = newPieces; // Sync Ref immediately for next logic step

    // 5. Check Win (CRITICAL FIX: Check only if all pieces are EXACTLY 56)
    // -1 means home, so they are not 56. Safe to just check every value.
    if (newPieces[color].every(p => p === 56)) {
      setGameOver(true);
      setWinner(color);
      Alert.alert("WINNER!", `${color} won the game!`);
      return;
    }

    // 6. Next Turn Logic
    const finished = (targetPos === 56);
    if (roll === 6 || captured || finished) {
      // Extra turn — same player rolls again
      // CRITICAL: fully normalize state before re-entering ROLL phase
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

      // Use a timeout to ensure state batching doesn't merge phase 'WAITING' -> 'ROLL'
      const t = setTimeout(() => {
        botActiveRef.current = false;
        setRolling(false);
        setPhase('ROLL');
      }, 500);
      timeoutsRef.current.push(t);
    } else {
      const t = setTimeout(() => nextTurn(), 600);
      timeoutsRef.current.push(t);
    }
  };

  const nextTurn = () => {
    // Clear ALL pending timeouts to prevent race conditions
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    botActiveRef.current = false;

    setTurn(prev => (prev + 1) % activeColors.length);
    setPhase('ROLL');
    setDice(1);
    setValidMoves([]);
  };

  const onPiecePress = (idx) => {
    if (phase !== 'MOVE' || isBot) return;
    if (validMoves.includes(idx)) {
      doMove(currentColor, idx, dice);
    }
  };

  // --- RENDERING ---

  const Dice = ({ value }) => {
    // Dice dots positions
    const dots = [];
    if ([1, 3, 5].includes(value)) dots.push(<View key="c" style={[s.dot, s.dotCenter]} />);
    if ([2, 3, 4, 5, 6].includes(value)) {
      dots.push(<View key="tl" style={[s.dot, s.dotTL]} />);
      dots.push(<View key="br" style={[s.dot, s.dotBR]} />);
    }
    if ([4, 5, 6].includes(value)) {
      dots.push(<View key="tr" style={[s.dot, s.dotTR]} />);
      dots.push(<View key="bl" style={[s.dot, s.dotBL]} />);
    }
    if (value === 6) {
      dots.push(<View key="ml" style={[s.dot, s.dotML]} />);
      dots.push(<View key="mr" style={[s.dot, s.dotMR]} />);
    }

    return (
      <View style={s.diceContainer}>
        {dots}
      </View>
    );
  };

  // ... (Keep existing layout renderers)
  const renderCell = (x, y, color = COLORS.WHITE, border = true) => (
    <View key={`${x}-${y}`} style={[s.cell, { left: x * CELL_SIZE, top: y * CELL_SIZE, backgroundColor: color, borderWidth: border ? 0.5 : 0 }]} />
  );

  const renderBoardLayout = () => {
    const cells = [];
    // Bases
    cells.push(<View key="b1" style={[s.base, { bottom: 0, left: 0, backgroundColor: COLORS.RED }]} />);
    cells.push(<View key="b2" style={[s.base, { top: 0, left: 0, backgroundColor: COLORS.GREEN }]} />);
    cells.push(<View key="b3" style={[s.base, { top: 0, right: 0, backgroundColor: COLORS.YELLOW }]} />);
    cells.push(<View key="b4" style={[s.base, { bottom: 0, right: 0, backgroundColor: COLORS.BLUE }]} />);

    // Path
    MAIN_PATH.forEach((pos, idx) => {
      let bg = COLORS.WHITE;
      if (SAFE_SQUARES.includes(idx)) bg = COLORS.SAFE;
      if (idx === 0) bg = COLORS.RED;
      if (idx === 13) bg = COLORS.GREEN;
      if (idx === 26) bg = COLORS.YELLOW;
      if (idx === 39) bg = COLORS.BLUE;
      cells.push(renderCell(pos.x, pos.y, bg));
    });
    // Home Stretches
    HOME_STRETCH.RED.forEach(p => cells.push(renderCell(p.x, p.y, COLORS.RED)));
    HOME_STRETCH.GREEN.forEach(p => cells.push(renderCell(p.x, p.y, COLORS.GREEN)));
    HOME_STRETCH.YELLOW.forEach(p => cells.push(renderCell(p.x, p.y, COLORS.YELLOW)));
    HOME_STRETCH.BLUE.forEach(p => cells.push(renderCell(p.x, p.y, COLORS.BLUE)));
    // Center
    cells.push(<View key="c" style={[s.center, { left: 6 * CELL_SIZE, top: 6 * CELL_SIZE }]} />);
    return cells;
  };

  const renderPieces = () => {
    const els = [];
    activeColors.forEach(color => {
      pieces[color].forEach((pos, idx) => {
        let x, y;
        if (pos === -1) {
          const offset = (idx % 2 === 0) ? 1.5 : 3.5;
          const offset2 = (idx < 2) ? 1.5 : 3.5;
          if (color === 'RED') { x = offset; y = 9 + offset2; }
          if (color === 'GREEN') { x = offset; y = offset2; }
          if (color === 'YELLOW') { x = 9 + offset; y = offset2; }
          if (color === 'BLUE') { x = 9 + offset; y = 9 + offset2; }
        } else {
          const coords = getXY(color, pos);
          if (coords) { x = coords.x + 0.5; y = coords.y + 0.5; }
          else { x = 7.5; y = 7.5; }
        }

        const isMine = color === currentColor;
        const canMove = isMine && phase === 'MOVE' && validMoves.includes(idx);

        els.push(
          <TouchableOpacity
            key={`${color}-${idx}`}
            disabled={!canMove}
            onPress={() => onPiecePress(idx)}
            style={[
              s.piece,
              {
                left: (x * CELL_SIZE) - 10,
                top: (y * CELL_SIZE) - 10,
                backgroundColor: COLORS[color],
                zIndex: 10 + idx,
                opacity: (phase === 'MOVE' && isMine && !canMove) ? 0.5 : 1 // Dim invalid options
              },
              canMove && s.highlight
            ]}
          />
        );
      });
    });
    return els;
  };

  const getDiceStyle = () => {
    const base = { position: 'absolute', zIndex: 200, alignItems: 'center' };
    switch (currentColor) {
      case 'RED': return { ...base, bottom: -65, left: 30 };
      case 'GREEN': return { ...base, top: -65, left: 30 };
      case 'YELLOW': return { ...base, top: -65, right: 30 };
      case 'BLUE': return { ...base, bottom: -65, right: 30 };
      default: return { ...base, bottom: -65, left: 30 };
    }
  };

  // --- ACTIONS ---
  const startGame = (mode, count) => {
    setGameMode(mode);
    setNumPlayers(count);

    // Config players
    let newColors = [];
    if (count === 2) newColors = ['RED', 'YELLOW']; // Opposite corners for 2p
    else if (count === 3) newColors = ['RED', 'GREEN', 'YELLOW'];
    else newColors = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

    setActiveColors(newColors);

    // Reset game state
    setPieces({
      RED: [-1, -1, -1, -1],
      GREEN: [-1, -1, -1, -1],
      YELLOW: [-1, -1, -1, -1],
      BLUE: [-1, -1, -1, -1],
    });
    setTurn(0);
    setDice(1);
    setGameOver(false);
    setWinner(null);
    setValidMoves([]);
    setPhase('ROLL');
  };

  const resetGame = () => {
    setPhase('SETUP');
    // Clear any timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    botActiveRef.current = false;
  };

  return (
    <LinearGradient colors={['#1A2980', '#26D0CE']} style={s.container}>
      <StatusBar hidden={true} />
      {phase === 'SETUP' ? (
        <View style={s.setupScreen}>
          <Text style={s.setupTitle}>LUDO KING</Text>

          <View style={s.modeSection}>
            <Text style={s.sectionTitle}>SELECT MODE</Text>
            <TouchableOpacity style={s.modeBtn} onPress={() => startGame('CPU', 4)}>
              <Text style={s.modeBtnText}>🤖 VS COMPUTER</Text>
              <Text style={s.modeSub}>1 Player</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.modeBtn, { marginTop: 15 }]} onPress={() => setPhase('SETUP_LOCAL')}>
              <Text style={s.modeBtnText}>👥 PLAY WITH FRIENDS</Text>
              <Text style={s.modeSub}>Local Multiplayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : phase === 'SETUP_LOCAL' ? (
        <View style={s.setupScreen}>
          <Text style={s.setupTitle}>PLAYERS?</Text>

          <TouchableOpacity style={s.modeBtn} onPress={() => startGame('LOCAL', 2)}>
            <Text style={s.modeBtnText}>2 PLAYERS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modeBtn} onPress={() => startGame('LOCAL', 3)}>
            <Text style={s.modeBtnText}>3 PLAYERS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modeBtn} onPress={() => startGame('LOCAL', 4)}>
            <Text style={s.modeBtnText}>4 PLAYERS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.backBtn]} onPress={() => setPhase('SETUP')}>
            <Text style={s.backBtnText}>↩ BACK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ position: 'relative' }}>
          <View style={[s.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
            {renderBoardLayout()}
            {renderPieces()}
          </View>

          {/* Dice near current player's base - Visible during ROLL, MOVE, WAITING */}
          {!isBot && (
            <TouchableOpacity onPress={onUserRoll} disabled={phase !== 'ROLL' || rolling} style={getDiceStyle()}>
              <Dice value={dice} />
            </TouchableOpacity>
          )}

          {isBot && (
            <View style={getDiceStyle()}>
              <Dice value={dice} />
            </View>
          )}


        </View>
      )}
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { color: 'white', fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  board: {
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#fff', // White frame
    borderRadius: 12,
    elevation: 20, // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cell: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE },
  base: { position: 'absolute', width: 6 * CELL_SIZE, height: 6 * CELL_SIZE },
  center: { position: 'absolute', width: 3 * CELL_SIZE, height: 3 * CELL_SIZE, backgroundColor: '#eee' }, // 3x3 center
  piece: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderColor: 'white', borderWidth: 2 },
  highlight: { borderColor: '#00FF00', borderWidth: 4 },
  btn: { marginTop: 20, backgroundColor: '#444', padding: 15, borderRadius: 8, minWidth: 150, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Custom Dice Styles
  diceBtn: { marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  diceContainer: {
    width: 50, height: 50, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', position: 'relative'
  },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: 'black' },
  dotCenter: { top: 21, left: 21 },
  dotTL: { top: 6, left: 6 },
  dotTR: { top: 6, right: 6 },
  dotML: { top: 21, left: 6 }, // middle left
  dotMR: { top: 21, right: 6 }, // middle right
  dotBL: { bottom: 6, left: 6 },
  dotBR: { bottom: 6, right: 6 },

  rollingText: { color: 'white', marginTop: 5, fontSize: 16 },

  // Setup Screen
  setupScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  setupTitle: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginBottom: 40, letterSpacing: 2 },
  sectionTitle: { fontSize: 16, color: '#aaa', marginBottom: 15, letterSpacing: 1 },
  modeBtn: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 15
  },
  modeBtnText: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  modeSub: { color: '#666', fontSize: 12, marginTop: 2 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: '#fff', fontSize: 16 },


});

export default LudoScreen;
