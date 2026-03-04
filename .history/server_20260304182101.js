const express = require('express');
const sqlite3=require('sqlite3').verbose();
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with explicit API version
const genAI = new GoogleGenerativeAI({
    apiKey: "AIzaSyAmk5iQKw3ezYQYbBQ75lY8IgDs_FWaZpg"
});

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

// POST: Submit daily habits and get today's tailored workout
app.post('/api/daily-log', async (req, res) => {
    const {
        gender, weight, targetParts, equipment,
        sleep_hours, knee_pain, back_stiffness
    } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // This prompt forces the AI to be a professional trainer
    const prompt = `
        You are an expert personal trainer. Create a workout for a ${gender} weighing ${weight}kg.
        Available Equipment: ${equipment.join(", ")} and bodyweight.
        Target Muscle Groups: ${targetParts.join(", ")}.
        Physical Constraints: Knee pain is ${knee_pain}/10, Back stiffness is ${back_stiffness}/10.
        
        Rules:
        1. If back stiffness is > 5, avoid any unsupported bending or heavy spinal loading.
        2. If knee pain is > 5, avoid lunges or heavy squats; focus on seated or floor work.
        3. Prioritize chest and arms as requested.
        
        Return the response strictly as a JSON object with this structure:
        {
            "workoutTitle": "string",
            "exercises": [{"name": "string", "sets": "string", "reps": "string", "instruction": "string"}],
            "trainerAdvice": "string"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response (Gemini sometimes adds markdown blocks)
        const jsonContent = text.replace(/```json|```/g, "");
        const workoutData = JSON.parse(jsonContent);

        // Save the log to SQLite (optional, for your history)
        db.run(`INSERT INTO Daily_Logs (date, sleep_hours, knee_pain, back_stiffness) VALUES (?, ?, ?, ?)`,
               [new Date().toISOString().split('T')[0], sleep_hours, knee_pain, back_stiffness]);

        res.status(200).json(workoutData);
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "AI trainer is currently offline." });
    }
});

// POST: Chat with AI Trainer
app.post('/api/chat', async (req, res) => {
    const { message, context } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        You are an expert personal trainer named Auto-Trainer. Be friendly, motivational, and provide helpful fitness advice.
        Current user context: ${JSON.stringify(context)}
        
        User message: ${message}
        
        Respond helpfully to the user's question about fitness, workouts, nutrition, or general health.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chat is currently offline." });
    }
});