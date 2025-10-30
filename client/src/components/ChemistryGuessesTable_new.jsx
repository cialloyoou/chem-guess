import '../styles/GuessesTable.css';
import { useState } from 'react';

function ChemistryGuessesTable({ guesses, answerCompound, gameEnd }) {
  const [expandedReactions, setExpandedReactions] = useState(new Set());

  const handleReactionClick = (guessIndex, reactionIndex) => {
    const key = `${guessIndex}-${reactionIndex}`;
    setExpandedReactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getFeedbackClass = (feedback) => {
    switch (feedback) {
      case 'correct':
        return 'correct';
      case 'partial':
        return 'partial';
      case 'wrong':
      default:
        return '';
    }
  };

  const splitTags = (value, type) => {
    if (!value) return [];
    let items = [];
    if (type === 'hydEl') {
      items = String(value).split('/');
    } else if (type === 'state') {
      items = String(value).split(/\s+/);
    } else if (type === 'other') {
      items = String(value).split('/');
    } else {
      items = [String(value)];
    }
    return items.map(s => s.replace(/[\u3000\s]/g, '').replace(/^\/*|\/*$/g, '')).map(s=>s.trim()).filter(Boolean);
  };

  const tokenFeedback = (token, answerValue, type) => {
    const answerTokens = splitTags(answerValue, type);
    if (answerTokens.includes(token)) return 'correct';

    if (type === 'hydEl') {
      return 'wrong';
    }

    if (type === 'state') {
      if ((token === '液体' && answerTokens.includes('溶液')) || (token === '溶液' && answerTokens.includes('液体'))) return 'partial';
      if ((token === '固体' && answerTokens.includes('晶体')) || (token === '晶体' && answerTokens.includes('固体'))) return 'partial';
      return 'wrong';
    }

    if (type === 'other') {
      const hasApprox = answerTokens.some(t => {
        const setA = new Set(token);
        const setB = new Set(t);
        let common = 0;
        setA.forEach(ch => { if (setB.has(ch)) common++; });
        return common >= 2;
      });
      return hasApprox ? 'partial' : 'wrong';
    }

    if (type === 'acidBase') {
      const isAcid = (s) => /酸/.test(s) && !/中性|两性/.test(s);
      const isBase = (s) => /碱/.test(s) && !/中性|两性/.test(s);
      const answerStr = answerTokens[0] || '';
      if ((isAcid(token) && isAcid(answerStr)) || (isBase(token) && isBase(answerStr))) return 'partial';
      return 'wrong';
    }

    return 'wrong';
  };

  const showAnswerRow = gameEnd && guesses.length > 0 && !guesses[guesses.length - 1]?.isCorrect;

  return (
    <div className="table-container">
      <table className="guesses-table chemistry-table">
        <thead>
          <tr>
            <th>化学式</th>
            <th>名称</th>
            <th>酸碱性</th>
            <th>水解/电解</th>
            <th>状态</th>
            <th>反应</th>
            <th>其他性质</th>
          </tr>
        </thead>
        <tbody>
          {guesses.map((guess, guessIndex) => (
            <tr key={guessIndex}>
              <td>
                <div className={`formula-container ${guess.isAnswer ? 'correct' : ''}`}>
                  <div className="formula-text">{guess.formula}</div>
                </div>
              </td>

              <td>
                <div className={`name-container ${guess.isAnswer ? 'correct' : ''}`}>
                  <div className="name-text">{guess.name}</div>
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {(() => {
                    const v = guess.acidBase || '';
                    const ans = answerCompound?.labels?.acidBase || '';
                    const fb = v === ans ? 'correct' : tokenFeedback(v, ans, 'acidBase');
                    return (
                      <span className={`tag-chip ${getFeedbackClass(fb)}`}>{v || '无'}</span>
                    );
                  })()}
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(guess.hydrolysisElectrolysis, 'hydEl').map((t, i) => {
                    const fb = tokenFeedback(t, answerCompound?.labels?.hydrolysisElectrolysis || '', 'hydEl');
                    return <span key={i} className={`tag-chip ${getFeedbackClass(fb)}`}>{t}</span>;
                  })}
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(guess.state, 'state').map((t, i) => {
                    const fb = tokenFeedback(t, answerCompound?.labels?.state || '', 'state');
                    return <span key={i} className={`tag-chip ${getFeedbackClass(fb)}`}>{t}</span>;
                  })}
                </div>
              </td>

              <td>
                <div className="reactions-container">
                  {guess.reactions && guess.reactions.length > 0 ? (
                    <>
                      {guess.reactions.slice(0, 2).map((reaction, reactionIndex) => {
                        const feedbackClass = guess.reactionsFeedback && guess.reactionsFeedback[reactionIndex]
                          ? getFeedbackClass(guess.reactionsFeedback[reactionIndex])
                          : '';
                        const key = `${guessIndex}-${reactionIndex}`;
                        const isExpanded = expandedReactions.has(key);

                        return (
                          <div
                            key={reactionIndex}
                            className={`reaction-item ${feedbackClass}`}
                            onClick={() => handleReactionClick(guessIndex, reactionIndex)}
                            style={{ cursor: 'pointer' }}
                            title="点击查看完整反应"
                          >
                            {isExpanded ? reaction : (reaction.length > 20 ? reaction.substring(0, 20) + '...' : reaction)}
                          </div>
                        );
                      })}
                      {guess.reactions.length > 2 && (
                        <div className="reaction-more">
                          +{guess.reactions.length - 2} 更多
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="no-data">无</span>
                  )}
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(guess.other, 'other').map((t, i) => {
                    const fb = tokenFeedback(t, answerCompound?.labels?.other || '', 'other');
                    return <span key={i} className={`tag-chip ${getFeedbackClass(fb)}`}>{t}</span>;
                  })}
                </div>
              </td>
            </tr>
          ))}

          {showAnswerRow && answerCompound && (
            <tr style={{ backgroundColor: '#dcfce7', fontWeight: 'bold' }}>
              <td>
                <div className="formula-container">
                  <div className="formula-text">{answerCompound.formula}</div>
                </div>
              </td>

              <td>
                <div className="name-container">
                  <div className="name-text">{answerCompound.name}</div>
                  <div style={{ fontSize: '12px', color: '#16a34a' }}>正确答案</div>
                </div>
              </td>

              <td>
                <div className="chips-container">
                  <span className="tag-chip correct">{answerCompound.labels?.acidBase || '无'}</span>
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(answerCompound.labels?.hydrolysisElectrolysis, 'hydEl').map((t, i) => (
                    <span key={i} className="tag-chip correct">{t}</span>
                  ))}
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(answerCompound.labels?.state, 'state').map((t, i) => (
                    <span key={i} className="tag-chip correct">{t}</span>
                  ))}
                </div>
              </td>

              <td>
                <div className="reactions-container">
                  {answerCompound.labels?.reactions && answerCompound.labels.reactions.length > 0 ? (
                    <>
                      {answerCompound.labels.reactions.slice(0, 2).map((reaction, idx) => (
                        <div key={idx} className="reaction-item correct">
                          {reaction.length > 20 ? reaction.substring(0, 20) + '...' : reaction}
                        </div>
                      ))}
                      {answerCompound.labels.reactions.length > 2 && (
                        <div className="reaction-more">
                          +{answerCompound.labels.reactions.length - 2} 更多
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="no-data">无</span>
                  )}
                </div>
              </td>

              <td>
                <div className="chips-container">
                  {splitTags(answerCompound.labels?.other, 'other').map((t, i) => (
                    <span key={i} className="tag-chip correct">{t}</span>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ChemistryGuessesTable;

