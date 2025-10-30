import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

/**
 * Get a random chemistry question
 * @returns {Promise<Object>} Random chemistry question with formula and initialHint
 */
async function getRandomChemistry() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chemistry/random`);
    return response.data;
  } catch (error) {
    console.error('Error fetching random chemistry question:', error);
    throw error;
  }
}

/**
 * Submit a guess and get feedback
 * @param {string} guessFormula - The chemical formula guessed by user
 * @param {string} answerFormula - The correct chemical formula
 * @returns {Promise<Object>} Comparison result with feedback
 */
async function submitGuess(guessFormula, answerFormula) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/chemistry/guess`, {
      guessFormula,
      answerFormula
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
}

/**
 * Get all chemistry questions
 * @returns {Promise<Array>} All chemistry questions
 */
async function getAllChemistry() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chemistry/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all chemistry questions:', error);
    throw error;
  }
}

/**
 * Search for chemistry compounds
 * @param {string} query - Search query (formula or name)
 * @returns {Promise<Array>} Search results
 */
async function searchChemistry(query) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const response = await axios.get(`${API_BASE_URL}/api/chemistry/search`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching chemistry:', error);
    return [];
  }
}

/**
 * Get full details for a compound by exact formula
 * @param {string} formula
 * @returns {Promise<Object|null>}
 */
async function getCompoundDetail(formula){
  try{
    if(!formula) return null;
    const res = await axios.get(`${API_BASE_URL}/api/chemistry/by-formula`,{params:{q:formula}});
    return res.data || null;
  }catch(e){
    console.error('Error getCompoundDetail:', e);
    return null;
  }
}


/**
 * Generate feedback for display in the guesses table
 * @param {Object} guessData - The guess data from API
 * @param {Object} answerData - The answer data
 * @returns {Object} Formatted feedback for UI
 */
function generateFeedback(guessData, answerData) {
  const result = {
    formula: guessData.guessFormula || '',
    name: guessData.guessName || '',
    isAnswer: guessData.isCorrect || false,
    isCorrect: guessData.isCorrect || false
  };

  // Acid-Base property
  result.acidBase = guessData.guessLabels?.acidBase || '';
  result.acidBaseFeedback = guessData.feedback?.acidBase || 'wrong';

  // Hydrolysis/Electrolysis property
  result.hydrolysisElectrolysis = guessData.guessLabels?.hydrolysisElectrolysis || '';
  result.hydrolysisElectrolysisFeedback = guessData.feedback?.hydrolysisElectrolysis || 'wrong';

  // State property
  result.state = guessData.guessLabels?.state || '';
  result.stateFeedback = guessData.feedback?.state || 'wrong';

  // Reactions (array)
  result.reactions = guessData.guessLabels?.reactions || [];
  result.reactionsFeedback = guessData.feedback?.reactions || [];
  result.reactionsOverallFeedback = guessData.feedback?.reactionsOverall || 'wrong';

  // Other properties
  result.other = guessData.guessLabels?.other || '';
  result.otherFeedback = guessData.feedback?.other || 'wrong';

  // Shared reactions (for display)
  if (guessData.guessLabels?.reactions && answerData?.reactions) {
    const sharedReactions = guessData.guessLabels.reactions.filter(r =>
      answerData.reactions.includes(r)
    );
    result.sharedReactions = {
      first: sharedReactions[0] || '',
      count: sharedReactions.length
    };
  } else {
    result.sharedReactions = { first: '', count: 0 };
  }

  return result;
}

/**
 * Format a chemistry compound for display
 * @param {Object} compound - Chemistry compound object
 * @returns {Object} Formatted compound for UI
 */
function formatCompound(compound) {
  return {
    formula: compound.formula,
    name: compound.name,
    state: compound.labels?.state || compound.state || '',
    acidBase: compound.labels?.acidBase || '',
    hydrolysisElectrolysis: compound.labels?.hydrolysisElectrolysis || '',
    reactions: compound.labels?.reactions || [],
    other: compound.labels?.other || ''
  };
}

/**
 * Validate chemical formula format (basic validation)
 * @param {string} formula - Chemical formula to validate
 * @returns {boolean} True if valid format
 */
function validateFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return false;
  }

  // Basic validation: should contain at least one letter
  // and only contain letters, numbers, parentheses, and common symbols
  const validPattern = /^[A-Za-z0-9()\[\]·\-\+]+$/;
  return validPattern.test(formula.trim());
}

/**
 * Get CSS class for feedback
 * @param {string} feedback - Feedback value ('correct', 'partial', 'wrong')
 * @returns {string} CSS class name
 */
function getFeedbackClass(feedback) {
  switch (feedback) {
    case 'correct':
      return 'correct';
    case 'partial':
      return 'partial';
    case 'wrong':
    default:
      return 'wrong';
  }
}

/**
 * Get display text for acid-base property
 * @param {string} acidBase - Acid-base property value
 * @returns {string} Display text
 */
function getAcidBaseDisplay(acidBase) {
  const displayMap = {
    '强酸': '强酸',
    '弱酸': '弱酸',
    '强碱': '强碱',
    '弱碱': '弱碱',
    '中性': '中性',
    '两性': '两性',
    '弱酸性': '弱酸性',
    '弱碱性': '弱碱性'
  };
  return displayMap[acidBase] || acidBase;
}

export {
  getRandomChemistry,
  submitGuess,
  getAllChemistry,
  searchChemistry,
  generateFeedback,
  formatCompound,
  validateFormula,
  getFeedbackClass,
  getAcidBaseDisplay,
  getCompoundDetail
};

