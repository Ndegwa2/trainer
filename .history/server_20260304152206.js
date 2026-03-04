const express = require('express');
const sqlite3=require('sqlite3').verbose();
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
app.post('/api/daily-log', (req, res) => {
    const {
        gender, weight, equipment, targetParts, // New inputs
        sleep_hours, knee_pain, back_stifness, date
    } = req.body;

    // 1. The Exercise Library (Simplified)
    const exerciseLibrary = [
        { name: "Dumbbell Floor Press", part: "Chest", equip: "Dumbbell", backSafe: true },
        { name: "Barbell Row (Supported)", part: "Back", equip: "Barbell", backSafe: false },
        { name: "Dumbbell Curls", part: "Arms", equip: "Dumbbell", backSafe: true },
        { name: "Barbell Overhead Press", part: "Shoulders", equip: "Barbell", backSafe: false },
        { name: "Diamond Pushups", part: "Chest/Arms", equip: "Bodyweight", backSafe: true },
        { name: "Leg Press", part: "Legs", equip: "Machine", backSafe: true },
        { name: "Romanian Deadlift", part: "Back/Legs", equip: "Barbell", backSafe: false },
        { name: "Push-ups", part: "Chest", equip: "Bodyweight", backSafe: true },
        { name: "Goblet Squat", part: "Legs", equip: "Dumbbell", backSafe: true },
        { name: "Face Pulls", part: "Shoulders", equip: "Cable", backSafe: true },
        { name: "Lateral Raises", part: "Shoulders", equip: "Dumbbell", backSafe: true },
        { name: "Bent Over Row", part: "Back", equip: "Dumbbell", backSafe: false }
    ];

    // 2. The Filter
    let todaysExercises = exerciseLibrary.filter(ex => {
        const matchesPart = targetParts.includes(ex.part);
        const matchesEquip = equipment.includes(ex.equip) || ex.equip === "Bodyweight";
        
        // Safety Filter: If back stiffness is high, remove non-safe exercises
        if (back_stifness > 5 && !ex.backSafe) return false;
        
        return matchesPart && matchesEquip;
    });

    // 3. Scale based on Weight/Gender
    // Logic: If user is heavier, we might focus on higher volume (reps) to burn fat.
    const repCount = weight > 90 ? "12-15 reps (Fat Burn Focus)" : "8-10 reps (Muscle Build Focus)";

    // Save the Daily Log to the Database
    const sql = `INSERT OR REPLACE INTO Daily_Logs
                 (date, sleep_hours, knee_pain, back_stiffness, stress_level)
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [date, sleep_hours, knee_pain, back_stifness, 0], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Return the generated workout to the frontend
        res.status(200).json({
            message: "Daily stats logged successfully.",
            todaysWorkout: todaysExercises.map(ex => ({ ...ex, reps: repCount })),
            advice: back_stifness > 5 ? "Back is sensitive. Stay supported!" : "Go heavy today."
        });
    });
});