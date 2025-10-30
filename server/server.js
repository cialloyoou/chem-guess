require('dotenv').config();
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const {startAutoClean} = require('./utils/autoClean');
const db = require('./utils/db');
const fs = require('fs');
const path = require('path');
const chemistryUtils = require('./seed/chemistry_seed');
const leaderboard = require('./utils/leaderboard');


const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CLIENT_URL_EN = process.env.CLIENT_URL_EN || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const cors_options = {
    origin: [CLIENT_URL, CLIENT_URL_EN, SERVER_URL],
    methods: ['GET', 'POST'],
    credentials: true
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: cors_options});
app.use(cors(cors_options));
app.use(express.json());

// Optional: preload chemistry from configured source (XLSX preferred > CSV > local XLSX)
if (process.env.CHEM_CSV_URL || process.env.CHEM_XLSX_URL || process.env.CHEM_XLSX_PATH) {
  chemistryUtils.reload().catch(e=>console.error('chem preload failed', e));
}


const rooms = new Map();
const setupSocket = require('./utils/socket');
setupSocket(io, rooms);

db.connect().catch(console.error);

app.get('/', (req, res) => {
    res.send(`Hello from the server!`);
});

app.get('/health', async (req, res) => {
    try {
        const client = db.getClient();
        await client.db("admin").command({ ping: 1 });
        res.json({ status: 'ok', mongodb: 'connected' });
            } catch (error) {
        res.status(500).json({ status: 'error', message: 'MongoDB connection failed' });
    }
});

app.get('/quick-join', (req, res) => {
    // Get all public rooms that are not in progress
    const publicRooms = Array.from(rooms.entries()).filter(([id, room]) => room.isPublic);

    if (publicRooms.length === 0) {
        return res.status(404).json({ error: '没有可用的公开房间' });
    }

    const [roomId] = publicRooms[Math.floor(Math.random() * publicRooms.length)];

    // Check language parameter and use appropriate client URL
    const lang = req.query.lang;
    const clientUrl = lang === 'en' ? 'https://vertikarl.github.io/anime-character-guessr-english/#' : CLIENT_URL;

    // Construct the URL for the client to join
    const url = `${clientUrl}/multiplayer/${roomId}`;
    res.json({ url });
});

app.get('/room-count', (req, res) => {
    res.json({count: rooms.size});
});

app.get('/clean-rooms', (req, res) => {
    const now = Date.now();
    let cleaned = 0;
    for (const [roomId, room] of rooms.entries()) {
        if (room.lastActive && now - room.lastActive > 300000 && !room.currentGame) {
            // Notify all players in the room
            io.to(roomId).emit('roomClosed', {message: '房间因长时间无活动已关闭'});
            // Delete the room
            rooms.delete(roomId);
            cleaned++;
            console.log(`Room ${roomId} closed due to inactivity.`);
        }
    }
    res.json({message: `已清理${cleaned}个房间`});
});

app.get('/list-rooms', (req, res) => {
    const roomsList = Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        isPublic: room.isPublic,
        playerCount: room.players.length,
        players: room.players.map(player => player.username)
    }));
    res.json(roomsList);
});

app.get('/room-info/:id', (req, res) => {
    const roomId = req.params.id;
    const room = rooms.get(roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
});

app.get('/roulette', (req, res) => {
    const characters = require('./data/character_images.json');
    if (!Array.isArray(characters) || characters.length < 10) {
        return res.status(500).json({ error: 'Not enough character images' });
    }
    function getRandomSample(arr, n) {
        const result = [];
        const used = new Set();
        while (result.length < n && used.size < arr.length) {
            const idx = Math.floor(Math.random() * arr.length);
            if (!used.has(idx)) {
                used.add(idx);
                result.push(arr[idx]);
            }
        }
        return result;
    }
    const selected = getRandomSample(characters, 10).map(char => ({
        id: char.id,
        tier: char.tier,
        image_medium: Array.isArray(char.image_medium) && char.image_medium.length > 0 ? char.image_medium[Math.floor(Math.random() * char.image_medium.length)] : null,
        image_grid: Array.isArray(char.image_grid) && char.image_grid.length > 0 ? char.image_grid[Math.floor(Math.random() * char.image_grid.length)] : null
    }));
    res.json(selected);
});

app.get('/redeem', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const client = db.getClient();
        const database = client.db('misc');
        const collection = database.collection('avatars');

        // Look up the code in the collection
        const result = await collection.findOne({ code: code });

        if (!result) {
            console.log(`[ERROR][redeem][${req.ip}] Invalid or expired code: ${code}`);
            return res.status(404).json({ error: 'Invalid or expired code' });
        }

        // Return the URL field
        res.json({
            avatarId: result.avatarId,
            avatarImage: result.avatarImage
        });
    } catch (error) {
        console.error('Error redeeming code:', error);
        res.status(500).json({ error: 'Failed to redeem code' });
    }
});

startAutoClean();

app.post('/api/character-tags', async (req, res) => {
    try {
        const { characterId, tags } = req.body;

        // Validate request body
        if (!characterId || !tags || !Array.isArray(tags)) {
            return res.status(400).json({
                error: 'Invalid request body. Required format: { characterId: number, tags: string[] }'
            });
        }

        const client = db.getClient();
        const database = client.db('tags');
        const collection = database.collection('character_tags');

        // Get existing document if it exists
        const existingDoc = await collection.findOne({ _id: characterId });

        // Initialize or get existing tagCounts
        let tagCounts = {};
        if (existingDoc && existingDoc.tagCounts) {
            tagCounts = existingDoc.tagCounts;
        }

        // Update tag counts
        for (const tag of tags) {
            if (tag in tagCounts) {
                tagCounts[tag]++;
            } else {
                tagCounts[tag] = 1;
            }
        }

        // Create or update document
        const document = {
            _id: characterId,
            tagCounts
        };

        // Use replaceOne with upsert to handle both insert and update cases
        const result = await collection.replaceOne(
            { _id: characterId },
            document,
            { upsert: true }
        );

        res.status(201).json({
            message: result.upsertedCount ? 'Character tags added successfully' : 'Character tags updated successfully',
            characterId,
            document
        });
    } catch (error) {
        console.error('Error inserting character tags:', error);
        res.status(500).json({ error: 'Failed to insert character tags' });
    }
});

app.post('/api/game-character-tags', async (req, res) => {
    try {
        const { characterId, subjectId, tags } = req.body;
        // Validate request body
        if (!characterId || !subjectId || !tags || typeof tags !== 'object' || Array.isArray(tags)) {
        return res.status(400).json({
            error: 'Invalid request body. Required format: { characterId: string|number, subjectId: string|number, tags: { [section]: tag } }'
        });
        }

        const client = db.getClient();
        const database = client.db('tags');
        const collection = database.collection('game_character_tags');

        // Build the $inc update object
        const incUpdate = {};
        for (const [section, tag] of Object.entries(tags)) {
        if (!section || !tag) continue;
        // Path: characters.characterId.section.tag
        const path = `characters.${characterId}.${section}.${tag}`;
        incUpdate[path] = 1;
        }

        if (Object.keys(incUpdate).length === 0) {
        return res.status(400).json({ error: 'No valid tags provided.' });
        }

        // Update the document for the subjectId
        const result = await collection.updateOne(
        { _id: subjectId },
        { $inc: incUpdate },
        { upsert: true }
        );

        res.status(201).json({
        message: result.upsertedCount ? 'Game character tags added successfully' : 'Game character tags updated successfully',
        subjectId,
        characterId,
        tags
        });
    } catch (error) {
        console.error('Error inserting game character tags:', error);
        res.status(500).json({ error: 'Failed to insert game character tags' });
    }
});

// Propose new tags for a character
app.post('/api/propose-tags', async (req, res) => {
    try {
        const { characterId, tags } = req.body;

        // Validate request body
        if (!characterId || !tags || !Array.isArray(tags)) {
            return res.status(400).json({
                error: 'Invalid request body. Required format: { characterId: number, tags: string[] }'
            });
        }

        const client = db.getClient();
        const database = client.db('tags');
        const collection = database.collection('new_tags');

        // Get existing document if it exists
        const existingDoc = await collection.findOne({ _id: characterId });

        // Initialize or get existing tagCounts
        let tagCounts = {};
        if (existingDoc && existingDoc.tagCounts) {
            tagCounts = existingDoc.tagCounts;
        }

        // Update tag counts
        for (const tag of tags) {
            if (tag in tagCounts) {
                tagCounts[tag]++;
            } else {
                tagCounts[tag] = 1;
            }
        }

        // Create or update document
        const document = {
            _id: characterId,
            tagCounts
        };

        // Use replaceOne with upsert to handle both insert and update cases
        const result = await collection.replaceOne(
            { _id: characterId },
            document,
            { upsert: true }
        );

        res.status(201).json({
            message: result.upsertedCount ? 'New tags added successfully' : 'New tags updated successfully',
            characterId,
            document
        });
    } catch (error) {
        console.error('Error proposing new tags:', error);
        res.status(500).json({ error: 'Failed to propose new tags' });
    }
});

// Feedback for character tags
app.post('/api/feedback-tags', async (req, res) => {
    try {
        const { characterId, upvotes, downvotes } = req.body;

        // Validate request body
        if (!characterId || !upvotes || !downvotes || !Array.isArray(upvotes) || !Array.isArray(downvotes)) {
            return res.status(400).json({
                error: 'Invalid request body. Required format: { characterId: number, upvotes: string[], downvotes: string[] }'
            });
        }

        const client = db.getClient();
        const database = client.db('tags');
        const collection = database.collection('character_tags');

        // Get existing document if it exists
        const existingDoc = await collection.findOne({ _id: characterId });
        // Initialize or get existing tagCounts
        let tagCounts = {};
        if (existingDoc && existingDoc.tagCounts) {
            tagCounts = { ...existingDoc.tagCounts };
        }

        // Increment upvoted tags
        for (const tag of upvotes) {
            if (tag in tagCounts) {
                tagCounts[tag]++;
            } else {
                tagCounts[tag] = 1;
            }
        }

        // Decrement downvoted tags
        for (const tag of downvotes) {
            if (tag in tagCounts) {
                tagCounts[tag]--;
            } else {
                tagCounts[tag] = -1;
            }
        }

        // Create or update document
        const document = {
            _id: characterId,
            tagCounts
        };

        // Use replaceOne with upsert to handle both insert and update cases
        const result = await collection.replaceOne(
            { _id: characterId },
            document,
            { upsert: true }
        );

        res.json({
            message: result.upsertedCount ? 'Tag feedback created successfully' : 'Tag feedback processed successfully',
            characterId,
            updated: result.modifiedCount > 0,
            tagCounts
        });
    } catch (error) {
        console.error('Error processing tag feedback:', error);
        res.status(500).json({ error: 'Failed to process tag feedback' });
    }
});

// Count character usage
app.post('/api/answer-character-count', async (req, res) => {
    try {
        const { characterId, characterName } = req.body;

        // Validate request body
        if (!characterId || !characterName || typeof characterId !== 'number' || typeof characterName !== 'string') {
        return res.status(400).json({
            error: 'Invalid request body. Required format: { characterId: number, characterName: string }'
        });
        }

        const client = db.getClient();
        let database = client.db('stats');
        let collection = database.collection('weekly_count');

        await collection.updateOne(
        { _id: characterId },
        {
            $inc: { count: 1 },
            $set: { characterName: characterName.trim() }
        },
        { upsert: true }
        );

        database = client.db('stats');
        collection = database.collection('answer_count');

        result = await collection.updateOne(
        { _id: characterId },
        {
            $inc: { count: 1 },
            $set: { characterName: characterName.trim() }
        },
        { upsert: true }
        );

        res.json({
        message: 'Character answer count updated successfully',
        characterId,
        updated: result.modifiedCount > 0,
        created: result.upsertedCount > 0
        });
    } catch (error) {
        console.error('Error updating character answer count:', error);
        res.status(500).json({ error: 'Failed to update character answer count' });
    }
});

app.post('/api/guess-character-count', async (req, res) => {
    try {
        const { characterId, characterName } = req.body;

        // Validate request body
        if (!characterId || !characterName || typeof characterId !== 'number' || typeof characterName !== 'string') {
        return res.status(400).json({
            error: 'Invalid request body. Required format: { characterId: number, characterName: string }'
        });
        }

        const client = db.getClient();
        let database = client.db('stats');
        let collection = database.collection('weekly_count');

        await collection.updateOne(
        { _id: characterId },
        {
            $inc: { count: 1 },
            $set: { characterName: characterName.trim() }
        },
        { upsert: true }
        );

        database = client.db('stats');
        collection = database.collection('guess_count');

        result = await collection.updateOne(
        { _id: characterId },
        {
            $inc: { count: 1 },
            $set: { characterName: characterName.trim() }
        },
        { upsert: true }
        );

        res.json({
        message: 'Character answer count updated successfully',
        characterId,
        updated: result.modifiedCount > 0,
        created: result.upsertedCount > 0
        });
    } catch (error) {
        console.error('Error updating character answer count:', error);
        res.status(500).json({ error: 'Failed to update character answer count' });
    }
});

// Get character usage by _id
app.get('/api/character-usage/:id', async (req, res) => {
    try {
        const characterId = Number(req.params.id);
        if (isNaN(characterId)) {
        return res.status(400).json({ error: 'Invalid character id' });
        }
        const client = db.getClient();
        const database = client.db('stats');
        const collection = database.collection('answer_count');

        const result = await collection.findOne({ _id: characterId });
        if (!result) {
        return res.status(404).json({ error: 'Character usage not found' });
        }
        res.json(result);
    } catch (error) {
        console.error('Error fetching character usage by id:', error);
        res.status(500).json({ error: 'Failed to fetch character usage by id' });
    }
});

app.post('/api/subject-added', async (req, res) => {
    try {
        const { addedSubjects } = req.body;
        if (!Array.isArray(addedSubjects) || addedSubjects.length === 0) {
            return res.status(400).json({ error: 'Invalid request body. Required format: { addedSubjects: [{ id, name, name_cn, type }] }' });
        }

        const client = db.getClient();
        const database = client.db('stats');
        const collection = database.collection('subject_count');

        const results = [];
        for (const subject of addedSubjects) {
            if (!subject.id || !subject.name || !subject.type) continue;
            const updateResult = await collection.updateOne(
                { _id: subject.id },
                {
                    $inc: { count: 1 },
                    $set: { name_cn: subject.name.trim(), type: subject.type }
                },
                { upsert: true }
            );
            results.push({
                id: subject.id,
                name_cn: subject.name_cn,
                updated: updateResult.modifiedCount > 0,
                created: updateResult.upsertedCount > 0
            });
        }
        res.json({ message: 'Subject counts updated', results });
    } catch (error) {
        console.error('Error updating subject count:', error);
        res.status(500).json({ error: 'Failed to update subject count' });
    }
});

// ============================================
// Chemistry Game API Endpoints
// ============================================

/**
 * GET /api/chemistry/random
 * Returns a random chemistry question with initial hint
 */
app.get('/api/chemistry/random', (req, res) => {
    try {
        const question = chemistryUtils.getRandomQuestion();

        // Return only formula and initial hint (state)
        res.json({
            formula: question.formula,
            initialHint: question.labels.state
        });
    } catch (error) {
        console.error('Error getting random chemistry question:', error);
        res.status(500).json({ error: 'Failed to get random question' });
    }
});

/**
 * POST /api/chemistry/guess
 * Compares user's guess with the correct answer
 * Request body: { guessFormula: string }
 * Response: { formula, correctLabels, guessLabels, feedback }
 */
app.post('/api/chemistry/guess', (req, res) => {
    try {
        const { guessFormula, answerFormula } = req.body;

        if (!guessFormula || !answerFormula) {
            return res.status(400).json({
                error: 'Missing required fields: guessFormula and answerFormula'
            });
        }

        // Find both questions
        const guessQuestion = chemistryUtils.findQuestionByFormula(guessFormula);
        const answerQuestion = chemistryUtils.findQuestionByFormula(answerFormula);

        if (!guessQuestion) {
            return res.status(404).json({
                error: 'Guess formula not found in database'
            });
        }

        if (!answerQuestion) {
            return res.status(404).json({
                error: 'Answer formula not found in database'
            });
        }

        // Compare labels and generate feedback
        const feedback = {
            acidBase: chemistryUtils.compareLabelValue(
                guessQuestion.labels.acidBase,
                answerQuestion.labels.acidBase
            ),
            hydrolysisElectrolysis: chemistryUtils.compareLabelValue(
                guessQuestion.labels.hydrolysisElectrolysis,
                answerQuestion.labels.hydrolysisElectrolysis
            ),
            state: chemistryUtils.compareLabelValue(
                guessQuestion.labels.state,
                answerQuestion.labels.state
            ),
            other: chemistryUtils.compareLabelValue(
                guessQuestion.labels.other,
                answerQuestion.labels.other
            )
        };

        // Compare reactions (array)
        const reactionFeedbacks = chemistryUtils.compareReactions(
            guessQuestion.labels.reactions,
            answerQuestion.labels.reactions
        );
        feedback.reactions = reactionFeedbacks;
        feedback.reactionsOverall = chemistryUtils.getOverallReactionFeedback(reactionFeedbacks);

        res.json({
            formula: answerQuestion.formula,
            name: answerQuestion.name,
            correctLabels: answerQuestion.labels,
            guessLabels: guessQuestion.labels,
            guessName: guessQuestion.name,
            guessFormula: guessQuestion.formula,
            feedback,
            isCorrect: guessFormula.toLowerCase() === answerFormula.toLowerCase()
        });
    } catch (error) {
        console.error('Error processing guess:', error);
        res.status(500).json({ error: 'Failed to process guess' });
    }
});

/**
 * GET /api/chemistry/all
 * Returns all chemistry questions
 */
app.get('/api/chemistry/all', (req, res) => {
    try {
        const questions = chemistryUtils.getAllQuestions();
        res.json(questions);
    } catch (error) {
        console.error('Error getting all chemistry questions:', error);
        res.status(500).json({ error: 'Failed to get all questions' });
    }
});

/**
 * GET /api/chemistry/search
 * Search for chemistry compounds by formula or name
 * Query params: q (search query)
 */
app.get('/api/chemistry/search', (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const allQuestions = chemistryUtils.getAllQuestions();
        const searchLower = query.toLowerCase().trim();

        // Search by formula or name
        const results = allQuestions.filter(q =>
            q.formula.toLowerCase().includes(searchLower) ||
            q.name.toLowerCase().includes(searchLower)
        );

        // Return limited results
        res.json(results.slice(0, 20).map(q => ({
            formula: q.formula,
            name: q.name,
            state: q.labels.state
        })));
    } catch (error) {
        console.error('Error searching chemistry questions:', error);
        res.status(500).json({ error: 'Failed to search questions' });
    }
  });

  /**
   * GET /api/chemistry/by-formula
   * Returns full compound details by exact formula
   */
  app.get('/api/chemistry/by-formula', (req, res) => {
    try {
      const q = (req.query.q||'').trim();
      if (!q) return res.status(400).json({error:'Missing query'});
      const item = chemistryUtils.findQuestionByFormula(q);
      if (!item) return res.json(null);


      res.json(item);
    } catch (err) {
      console.error('Error in by-formula:', err);
      res.status(500).json({error:'Failed'});
    }
  });

// ============================================
// Leaderboard API (no login; machine-bound profile)
// ============================================
app.post('/api/score/submit', (req, res) => {
  try {
    const { machineId, username, group, wins, total } = req.body || {};
    if (!machineId) return res.status(400).json({ error: 'machineId required' });
    const saved = leaderboard.upsertScore({ machineId, username, group, wins, total });
    res.json(saved);
  } catch (e) {
    console.error('score submit error', e);
    res.status(500).json({ error: 'submit failed' });
  }
});

app.get('/api/score/leaderboard', (req, res) => {
  try {
    const group = (req.query.group || 'ALL').trim();
    const list = leaderboard.getLeaderboard(group);
    res.json(list);
  } catch (e) {
    console.error('leaderboard error', e);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/score/leaderboard/groups', (req, res) => {
  try {
    const summary = leaderboard.getGroupSummary();
    res.json(summary);
  } catch (e) {
    console.error('group leaderboard error', e);
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/api/score/profile/:id', (req, res) => {
  try {


    const id = String(req.params.id || '').trim();
    if (!id) return res.json(null);
    res.json(leaderboard.getProfile(id));
  } catch (e) {
    console.error('profile error', e);
    res.status(500).json({ error: 'failed' });
  }
});

/**
 * POST /api/chemistry/reload
 * Manually reload data from configured source (XLSX > CSV > local XLSX)
 */
app.post('/api/chemistry/reload', async (req,res)=>{
  try{
    const ok = await chemistryUtils.reload();
    res.json({ ok });
  }catch(e){
    console.error('reload error', e);
    res.status(500).json({error:'reload failed'});
  }
});



server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


