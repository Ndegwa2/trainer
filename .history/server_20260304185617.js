const express = require('express');
const sqlite3=require('sqlite3').verbose();
const cors = require('cors');

const API_KEY = "AIzaSyAmk5iQKw3ezYQYbBQ75lY8IgDs_FWaZpg";

const app = express();
const PORT= 5000;

//middleware
app.use(cors());
app.use(express.json());

//connect to database
const db=new sqlite3.Database('./fitness.db',(err) =>{
    if(err)console.error("Database connection error:", err.message);
    else console.log("Connected to the fitness database.");
});

//create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Daily_Logs(
        date TEXT PRIMARY KEY,
            sleep_hours INTEGER,
            knee_pain INTEGER,
            back_stiffness INTEGER,
            stress_level INTEGER )
        `);
    });

//API endpoints
app.listen(PORT, () => {
    console.log('Auto-Trainer API is running on port', PORT);
});

// Helper function to call Gemini API using fetch
async function callGemini(prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048
            }
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    return data.candidates[0].content.parts[0].text;
}

// POST: Submit daily habits and get today's tailored workout
app.post('/api/daily-log', async (req, res) => {
    // Destructure with defaults to prevent undefined errors
    const { 
        gender = "male", 
        weight = 80, 
        targetParts = ["chest", "arms"], 
        equipment = ["dumbbells"],
        sleep_hours = 8, 
        knee_pain = 0, 
        back_stiffness = 0 
    } = req.body;

    const prompt = `You are a professional trainer. Create a workout for a ${gender}, ${weight}kg. 
    Equipment: ${equipment.join(", ")}. Targets: ${targetParts.join(", ")}. 
    Knee Pain: ${knee_pain}/10, Back Stiffness: ${back_stiffness}/10.
    Output ONLY a raw JSON object: {"workoutTitle": "name", "exercises": [{"name": "ex", "sets": "3", "reps": "10", "instruction": "how-to"}], "trainerAdvice": "tips"}`;

    try {
        const text = await callGemini(prompt);
        
        // Clean the response
        const jsonString = text.replace(/```json|```/g, "").trim();
        const workoutData = JSON.parse(jsonString);

        // Save the log to SQLite
        db.run(`INSERT INTO Daily_Logs (date, sleep_hours, knee_pain, back_stiffness) VALUES (?, ?, ?, ?)`,
               [new Date().toISOString().split('T')[0], sleep_hours, knee_pain, back_stiffness]);

        res.status(200).json(workoutData);

    } catch (error) {
        console.error("DETAILED SERVER ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Chat with AI Trainer
app.post('/api/chat', async (req, res) => {
    const { message, context } = req.body;
    
    const prompt = `
        You are an expert personal trainer named Auto-Trainer. Be friendly, motivational, and provide helpful fitness advice.
        Current user context: ${JSON.stringify(context)}
        
        User message: ${message}
        
        Respond helpfully to the user's question about fitness, workouts, nutrition, or general health.
    `;

    try {
        const text = await callGemini(prompt);
        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("DETAILED CHAT ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});