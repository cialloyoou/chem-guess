import { useEffect, useMemo, useState } from 'react';
import { getRandomChemistry, submitGuess, generateFeedback, searchChemistry } from '../utils/chemistry';
import ChemistrySearchBar from '../components/ChemistrySearchBar';
import ChemistryGuessesTable from '../components/ChemistryGuessesTable_new';
import '../styles/game.css';
import '../styles/SinglePlayer.css';
import { addTestLog, loadTestLogs } from '../utils/testLogs';
import { submitScore, computeStatsFromLogs } from '../utils/leaderboard';

function ChemistrySinglePlayer() {
  const [answerCompound, setAnswerCompound] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [guessesLeft, setGuessesLeft] = useState(10);
  const [isGuessing, setIsGuessing] = useState(false);
  const [gameEnd, setGameEnd] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialHint, setInitialHint] = useState('');

  // Timer & log
  const maxAttempts = 10;
  const maxSeconds = 120;
  const [timeLeft, setTimeLeft] = useState(maxSeconds);
  const [startTime, setStartTime] = useState(null);


  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRandomChemistry();
      // 预先补全答案名称，避免括号为空
      let enriched = { ...data };
      try {
        const res = await searchChemistry(data.formula);
        const exact = (res || []).find(x => String(x.formula).toUpperCase() === String(data.formula).toUpperCase());
        if (exact) enriched = { ...enriched, name: exact.name };
      } catch {}
      setAnswerCompound(enriched);
      setInitialHint(enriched.initialHint);
      setGuesses([]);
      setGuessesLeft(maxAttempts);
      setGameEnd(false);
      setWasSuccess(false);
      setTimeLeft(maxSeconds);
      setStartTime(Date.now());
      setLoading(false);
    } catch (err) {
      console.error('Error starting new game:', err);
      setError('无法加载题目，请刷新页面重试');
      setLoading(false);
    }
  };

  const endGame = async (isSuccess, reason) => {
    setWasSuccess(isSuccess);
    setGameEnd(true);
    if (answerCompound) {
      const now = Date.now();
      // 若名称缺失，兜底查询一次
      let name = answerCompound.name;
      if (!name) {
        try {
          const res = await searchChemistry(answerCompound.formula);
          const exact = (res || []).find(x => String(x.formula).toUpperCase() === String(answerCompound.formula).toUpperCase());
          if (exact) name = exact.name;
        } catch {}
      }
      const log = {
        startTime,
        endTime: now,
        durationSec: startTime ? Math.round((now - startTime)/1000) : undefined,
        answer: { formula: answerCompound.formula, name },
        guesses: guesses.map(g => ({ formula: g.formula, name: g.name })),
        result: isSuccess ? 'success' : 'fail',
        reason: isSuccess ? 'correct' : (reason || (timeLeft <= 0 ? 'timer' : 'attempts'))
      };
      try {
        addTestLog(log);
        const logs = loadTestLogs();
        const stats = computeStatsFromLogs(logs);
        await submitScore(stats);
      } catch {}
    }
  };

  const handleGuess = async (compound) => {
    if (isGuessing || gameEnd || !answerCompound) return;

    setIsGuessing(true);

    try {
      const result = await submitGuess(compound.formula, answerCompound.formula);
      const guessData = generateFeedback(result, answerCompound);

      setAnswerCompound(prev => ({
        ...(prev || {}),
        formula: prev?.formula || result.formula,
        name: result.name,
        labels: result.correctLabels,
      }));

      setGuesses(prev => [...prev, guessData]);
      const newLeft = guessesLeft - 1;
      setGuessesLeft(newLeft);

      if (result.isCorrect) {
        endGame(true, 'correct');
      } else if (newLeft <= 0) {
        endGame(false, 'attempts');
      }
    } catch (err) {
      console.error('Error submitting guess:', err);
      alert('提交猜测失败，请重试');
    } finally {
      setIsGuessing(false);
    }
  };

  // Timer effect: 基于绝对时间，避免后台挂起导致计时不准
  useEffect(() => {
    if (!answerCompound || gameEnd || !startTime) return;
    const tick = () => {
      const deadline = startTime + maxSeconds * 1000;
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        endGame(false, 'timer');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [answerCompound, gameEnd, startTime]);

  const timeDisplay = useMemo(() => {
    const t = Math.max(0, timeLeft);
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [timeLeft]);

  if (loading) {
    return (
      <div className="single-player-container">
        <div className="container">
          <div className="game-info" style={{ textAlign: 'center', fontSize: '24px' }}>
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="single-player-container">
        <div className="container">
          <div className="game-info" style={{ textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={startNewGame} className="restart-button">
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="single-player-container">
      <div className="search-bar">
        <ChemistrySearchBar
          onSelect={handleGuess}
          disabled={isGuessing || gameEnd}
        />
      </div>

      <div className="container">
        <div className="game-info-container">
          <div className="hint-container">
            <span className="hint-label">初始提示：</span>
            <span className="hint-text">{initialHint}</span>
          </div>

          <div className="game-controls">
            <div className="game-info">
              剩余次数: {guessesLeft} / {maxAttempts}
            </div>
            <div className="timer"><span>{timeDisplay}</span></div>
            <button
              onClick={startNewGame}
              className="restart-button"
            >
              重新开始
            </button>
          </div>

          {gameEnd && (
            <div className="hint-container" style={{
              background: wasSuccess ? '#dcfce7' : '#fee2e2',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {wasSuccess ? (
                <>
                  🎉 恭喜你猜对了！答案是 <strong>{answerCompound.formula}</strong> ({answerCompound.name})
                </>
              ) : (
                <>
                  😢 很遗憾，测试失败！正确答案是 <strong>{answerCompound.formula}</strong> ({answerCompound.name})
                </>
              )}
            </div>
          )}
        </div>

        <ChemistryGuessesTable
          guesses={guesses}
          answerCompound={answerCompound}
          gameEnd={gameEnd}
        />
        {/* 记录抽屉已移至 /records 页面；此处不再展示 */}
      </div>
    </div>
  );
}

export default ChemistrySinglePlayer;

