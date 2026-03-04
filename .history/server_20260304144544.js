const express = require('express');
const sqlite3=require('sqlite3').verbose;
const cors = require('cors');

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
    db.run('
        CREATE TABLE IF NOT EXISTS Daily_Logs(
        date TEXT PRIMARY KEY,
            sleep_hours INTEGER,
            knee_pain INTEGER,
            back_stiffness INTEGER,
            stress_level INTEGER )
        '));
    });

//API endpoints
app.listen(PORT, () => {
    console.log('Auto-Trainer API is running on port', PORT);
});

// POST: Submit daily habits and get today's tailored workout
app.post('/api/daily-log', (req, res) => {
    const { date, sleep_hours, knee_pain, back_stiffness, stress_level } = req.body;

    // 1. The Trainer Logic Engine
    let assignedWorkout = {
        title: "Day 1: Push (Chest & Triceps)",
        type: "Weights",
        focus: "Upper Body Muscle",
        notes: "Standard floor presses and controlled push-ups. Protect the joints."
    }; // Default heavy day

    if (sleep_hours < 6 || stress_level > 8) {
        assignedWorkout = {
            title: "Day 4: Active Recovery & Flexibility",
            type: "No Weights",
            focus: "CNS Recovery",
            notes: "Your body is stressed. Stick to a 30-min brisk walk and chest stretches."
        };
    } else if (back_stiffness >= 6) {
        assignedWorkout = {
            title: "Day 2: Core & Back Mobility",
            type: "No Weights",
            focus: "Spinal Armor",
            notes: "Back is tight today. Focus on Bird-Dogs, Planks, and Cat-Cows."
        };
    } else if (knee_pain >= 5) {
        assignedWorkout = {
            title: "Day 5: Arm Armor Pump",
            type: "Weights",
            focus: "Biceps & Triceps",
            notes: "Knee is acting up. Stay seated or on the floor. Concentration curls and overhead extensions."
        };
    }

    // 2. Save the Daily Log to the Database
    const sql = `INSERT OR REPLACE INTO Daily_Logs 
                 (date, sleep_hours, knee_pain, back_stiffness, stress_level) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [date, sleep_hours, knee_pain, back_stiffness, stress_level], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // 3. Return the generated workout to the frontend
        res.status(200).json({
            message: "Daily stats logged successfully.",
            todaysWorkout: assignedWorkout
        });
    });
});