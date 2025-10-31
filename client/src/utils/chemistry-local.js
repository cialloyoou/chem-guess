/**
 * Local chemistry utilities - works without backend
 * Implements all chemistry logic client-side
 */

let chemistryData = [];
let chemBag = [];
let loadPromise = null;
const BAG_SIZE = 30;

/**
 * Load chemistry questions from local JSON
 */
export async function loadChemistryData() {
  if (chemistryData.length > 0) {
    return chemistryData;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const response = await fetch('/data/chemistry_questions.json');
      if (!response.ok) {
        throw new Error('Failed to load chemistry data');
      }
      const data = await response.json();
      chemistryData = Array.isArray(data) ? data : [];
      chemBag = [];
      console.log(`[chemistry-local] Loaded ${chemistryData.length} questions`);
      return chemistryData;
    } catch (error) {
      console.error('[chemistry-local] Error loading chemistry data:', error);
      throw error;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * Shuffle array in place
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Refill the bag with shuffled questions
 */
function refillBag() {
  const pool = [...chemistryData];
  shuffle(pool);
  chemBag = pool.slice(0, Math.min(BAG_SIZE, pool.length));
}

/**
 * Get a random chemistry question
 */
export async function getRandomChemistry() {
  if (chemistryData.length === 0) {
    await loadChemistryData();
  }

  if (chemBag.length === 0) {
    refillBag();
  }

  if (chemBag.length === 0) {
    throw new Error('No chemistry questions available');
  }

  const question = chemBag.pop();
  return {
    formula: question.formula,
    initialHint: question.labels.state
  };
}

/**
 * Find question by formula
 */
export async function findQuestionByFormula(formula) {
  if (chemistryData.length === 0) {
    await loadChemistryData();
  }

  return chemistryData.find(
    q => q.formula.toLowerCase() === formula.toLowerCase()
  ) || null;
}

/**
 * Get all chemistry questions
 */
export async function getAllChemistry() {
  if (chemistryData.length === 0) {
    await loadChemistryData();
  }
  return chemistryData;
}

/**
 * Search for chemistry compounds
 */
export async function searchChemistry(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  if (chemistryData.length === 0) {
    await loadChemistryData();
  }

  const searchLower = query.toLowerCase().trim();
  const results = chemistryData.filter(q =>
    q.formula.toLowerCase().includes(searchLower) ||
    q.name.toLowerCase().includes(searchLower)
  );

  return results.slice(0, 20).map(q => ({
    formula: q.formula,
    name: q.name,
    state: q.labels.state
  }));
}

/**
 * Get compound detail by exact formula
 */
export async function getCompoundDetail(formula) {
  if (!formula) return null;

  if (chemistryData.length === 0) {
    await loadChemistryData();
  }

  return findQuestionByFormula(formula);
}

/**
 * Compare two label values and return feedback
 */
function compareLabelValue(guessValue, correctValue) {
  if (!guessValue || !correctValue) {
    return 'wrong';
  }

  const norm = (s) => String(s).toLowerCase().trim();
  const guessLower = norm(guessValue);
  const correctLower = norm(correctValue);

  // Exact match
  if (guessLower === correctLower) {
    return 'correct';
  }

  // Special handling: 酸碱性
  const isAcidBase = /(酸|碱|中性|两性)/.test(guessLower + correctLower);
  if (isAcidBase) {
    const isAcid = (s) => /酸/.test(s) && !/两性|中性/.test(s);
    const isBase = (s) => /碱/.test(s) && !/两性|中性/.test(s);
    if ((isAcid(guessLower) && isAcid(correctLower)) || 
        (isBase(guessLower) && isBase(correctLower))) {
      return 'partial';
    }
  }

  // Check for keyword overlap
  const keywords = ['水解', '电解', '固体', '液体', '气体', '晶体', '溶液'];
  const hasKeywordOverlap = keywords.some(
    kw => guessLower.includes(kw) && correctLower.includes(kw)
  );
  if (hasKeywordOverlap) {
    return 'partial';
  }

  // Generic partial: token intersection
  const filterToken = (w) => w.length > 1 || ['酸', '碱'].includes(w);
  const guessWords = guessLower.split(/[\s\/]+/).map(w => w.trim()).filter(filterToken);
  const correctWords = correctLower.split(/[\s\/]+/).map(w => w.trim()).filter(filterToken);
  const sharedWords = guessWords.filter(word => correctWords.includes(word));
  
  if (sharedWords.length > 0) {
    return 'partial';
  }

  return 'wrong';
}

/**
 * Compare reaction arrays
 */
function compareReactions(guessReactions, correctReactions) {
  if (!Array.isArray(guessReactions) || !Array.isArray(correctReactions)) {
    return [];
  }

  return guessReactions.map(guessReaction => {
    // Check for exact match
    if (correctReactions.includes(guessReaction)) {
      return 'correct';
    }

    // Check for partial match
    const guessLower = guessReaction.toLowerCase();
    const hasPartialMatch = correctReactions.some(correctReaction => {
      const correctLower = correctReaction.toLowerCase();
      return guessLower.includes(correctLower.substring(0, correctLower.length / 2)) ||
             correctLower.includes(guessLower.substring(0, guessLower.length / 2));
    });

    return hasPartialMatch ? 'partial' : 'wrong';
  });
}

/**
 * Get overall feedback for reactions
 */
function getOverallReactionFeedback(reactionFeedbacks) {
  if (!reactionFeedbacks || reactionFeedbacks.length === 0) {
    return 'wrong';
  }

  const correctCount = reactionFeedbacks.filter(f => f === 'correct').length;
  const partialCount = reactionFeedbacks.filter(f => f === 'partial').length;

  if (correctCount === reactionFeedbacks.length) {
    return 'correct';
  }
  if (correctCount > 0 || partialCount > 0) {
    return 'partial';
  }
  return 'wrong';
}

/**
 * Submit a guess and get feedback (local version)
 */
export async function submitGuess(guessFormula, answerFormula) {
  if (chemistryData.length === 0) {
    await loadChemistryData();
  }

  const guessQuestion = await findQuestionByFormula(guessFormula);
  const answerQuestion = await findQuestionByFormula(answerFormula);

  if (!guessQuestion) {
    throw new Error('Guess formula not found in database');
  }

  if (!answerQuestion) {
    throw new Error('Answer formula not found in database');
  }

  // Compare labels and generate feedback
  const feedback = {
    acidBase: compareLabelValue(
      guessQuestion.labels.acidBase,
      answerQuestion.labels.acidBase
    ),
    hydrolysisElectrolysis: compareLabelValue(
      guessQuestion.labels.hydrolysisElectrolysis,
      answerQuestion.labels.hydrolysisElectrolysis
    ),
    state: compareLabelValue(
      guessQuestion.labels.state,
      answerQuestion.labels.state
    ),
    other: compareLabelValue(
      guessQuestion.labels.other,
      answerQuestion.labels.other
    )
  };

  // Compare reactions
  const reactionFeedbacks = compareReactions(
    guessQuestion.labels.reactions,
    answerQuestion.labels.reactions
  );
  feedback.reactions = reactionFeedbacks;
  feedback.reactionsOverall = getOverallReactionFeedback(reactionFeedbacks);

  return {
    formula: answerQuestion.formula,
    name: answerQuestion.name,
    correctLabels: answerQuestion.labels,
    guessLabels: guessQuestion.labels,
    guessName: guessQuestion.name,
    guessFormula: guessQuestion.formula,
    feedback,
    isCorrect: guessFormula.toLowerCase() === answerFormula.toLowerCase()
  };
}
