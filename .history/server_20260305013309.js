require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//connect to database
const db = new sqlite3.Database('./fitness.db', (err) => {
    if (err) console.error("Database connection error:", err.message);
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
            stress_level INTEGER,
            weight REAL,
            calories INTEGER,
            protein REAL,
            carbs REAL,
            fats REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS User_Profile(
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT DEFAULT 'User',
            gender TEXT DEFAULT 'male',
            weight REAL DEFAULT 70,
            height REAL DEFAULT 170,
            age INTEGER DEFAULT 25,
            activity_level TEXT DEFAULT 'moderate',
            goal TEXT DEFAULT 'maintain',
            target_weight REAL
        )
    `);

    // Insert default user profile if not exists
    db.run(`INSERT OR IGNORE INTO User_Profile (id, name, gender, weight, height, age, activity_level, goal)
            VALUES (1, 'User', 'male', 70, 170, 25, 'moderate', 'maintain')`);
});

// Helper function to calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight, height, age, gender) {
    // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5 (male) or -161 (female)
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
    return gender.toLowerCase() === 'male' ? baseBMR + 5 : baseBMR - 161;
}

// Get activity multiplier
function getActivityMultiplier(activityLevel) {
    const multipliers = {
        sedentary: 1.2,      // Little to no exercise
        light: 1.375,        // Light exercise 1-3 days/week
        moderate: 1.55,      // Moderate exercise 3-5 days/week
        active: 1.725,       // Hard exercise 6-7 days/week
        very_active: 1.9    // Very hard exercise, physical job
    };
    return multipliers[activityLevel] || 1.55;
}

// Calculate TDEE
function calculateTDEE(weight, height, age, gender, activityLevel, goal) {
    const bmr = calculateBMR(weight, height, age, gender);
    let tdee = bmr * getActivityMultiplier(activityLevel);

    // Adjust based on goal
    switch (goal) {
        case 'lose_tummy':
            tdee -= 500;  // Fat loss
            break;
        case 'lose_weight':
            tdee -= 750;  // Aggressive fat loss
            break;
        case 'buff_arms':
        case 'build_muscle':
            tdee += 200;  // Surplus for muscle gain
            break;
        case 'bulk':
            tdee += 300;  // Aggressive bulk
            break;
        case 'maintain':
        default:
            // No change
            break;
    }

    return Math.round(tdee);
}

// Calculate macros based on goal
function calculateMacros(tdee, weight, goal) {
    let protein, carbs, fats;

    switch (goal) {
        case 'buff_arms':
        case 'build_muscle':
            // High protein: 2.0g per kg
            protein = weight * 2.0;
            fats = (tdee * 0.25) / 9;
            carbs = (tdee - (protein * 4) - (fats * 4)) / 4;
            break;
        case 'lose_tummy':
        case 'lose_weight':
            // Moderate protein: 1.6g per kg
            protein = weight * 1.6;
            fats = (tdee * 0.25) / 9;
            carbs = (tdee - (protein * 4) - (fats * 4)) / 4;
            break;
        default:
            // Balanced: 1.2g per kg
            protein = weight * 1.2;
            fats = (tdee * 0.30) / 9;
            carbs = (tdee - (protein * 4) - (fats * 4)) / 4;
    }

    return {
        protein: Math.round(protein),
        carbs: Math.round(Math.max(carbs, 50)), // Minimum 50g carbs
        fats: Math.round(Math.max(fats, 20))    // Minimum 20g fats
    };
}

// Helper function to call Gemini API using fetch
async function callGemini(prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
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
        back_stiffness = 0,
        calories = 0,
        protein = 0,
        carbs = 0,
        fats = 0
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

        // Save the log to SQLite (ignore if already exists)
        const today = new Date().toISOString().split('T')[0];
        db.run(`INSERT OR REPLACE INTO Daily_Logs (date, sleep_hours, knee_pain, back_stiffness, weight, calories, protein, carbs, fats)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [today, sleep_hours, knee_pain, back_stiffness, weight, calories, protein, carbs, fats]);

        // Update user profile with latest weight
        db.run(`UPDATE User_Profile SET weight = ? WHERE id = 1`, [weight]);

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

// POST: Log a meal and get nutrition info
app.post('/api/log-meal', async (req, res) => {
    const { mealDescription } = req.body;

    const prompt = `Act as a nutritionist. Analyze this meal: "${mealDescription}".
    Estimate the Calories, Protein, Carbs, and Fats.
    Return strictly JSON: {"meal": "name", "calories": 500, "protein": 30, "carbs": 50, "fats": 10, "advice": "short tip"}`;

    try {
        const text = await callGemini(prompt);
        const mealData = JSON.parse(text.replace(/```json|```/g, ""));
        
        res.status(200).json(mealData);
    } catch (error) {
        console.error("DETAILED MEAL ERROR:", error);
        res.status(500).json({ error: "Failed to analyze meal" });
    }
});

// GET: Calculate TDEE and get user profile
app.get('/api/tdee', async (req, res) => {
    db.get(`SELECT * FROM User_Profile WHERE id = 1`, [], (err, profile) => {
        if (err) {
            console.error("TDEE Error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (!profile) {
            return res.status(404).json({ error: "User profile not found" });
        }

        const tdee = calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level, profile.goal);
        const macros = calculateMacros(tdee, profile.weight, profile.goal);

        res.status(200).json({
            profile: {
                name: profile.name,
                gender: profile.gender,
                weight: profile.weight,
                height: profile.height,
                age: profile.age,
                activity_level: profile.activity_level,
                goal: profile.goal,
                target_weight: profile.target_weight
            },
            tdee: tdee,
            bmr: Math.round(calculateBMR(profile.weight, profile.height, profile.age, profile.gender)),
            macros: macros,
            goal_adjustment: profile.goal === 'lose_tummy' ? '-500 cal (fat loss)' :
                              profile.goal === 'buff_arms' ? '+200 cal (muscle gain)' :
                              profile.goal === 'build_muscle' ? '+200 cal (muscle gain)' :
                              profile.goal === 'bulk' ? '+300 cal (bulking)' : 'None (maintenance)'
        });
    });
});

// POST: Update user profile
app.post('/api/profile', async (req, res) => {
    const { name, gender, weight, height, age, activity_level, goal, target_weight } = req.body;

    db.run(`UPDATE User_Profile SET
            name = COALESCE(?, name),
            gender = COALESCE(?, gender),
            weight = COALESCE(?, weight),
            height = COALESCE(?, height),
            age = COALESCE(?, age),
            activity_level = COALESCE(?, activity_level),
            goal = COALESCE(?, goal),
            target_weight = COALESCE(?, target_weight)
            WHERE id = 1`,
        [name, gender, weight, height, age, activity_level, goal, target_weight],
        function(err) {
            if (err) {
                console.error("Profile Update Error:", err);
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: "Profile updated successfully" });
        }
    );
});

// GET: Dynamic Meal Plan based on TDEE
app.get('/api/meal-plan', async (req, res) => {
    db.get(`SELECT * FROM User_Profile WHERE id = 1`, async (err, profile) => {
        if (err || !profile) {
            return res.status(500).json({ error: "Profile not found" });
        }

        const tdee = calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level, profile.goal);
        const macros = calculateMacros(tdee, profile.weight, profile.goal);

        const prompt = `Create a complete daily meal plan for someone with:
        - Target calories: ${tdee} kcal
        - Protein: ${macros.protein}g
        - Carbs: ${macros.carbs}g
        - Fats: ${macros.fats}g
        - Goal: ${profile.goal}
        
        The meals should be practical and realistic. Include breakfast, lunch, dinner, and snacks.
        Return ONLY a raw JSON object with this exact format:
        {"meals": [{"time": "Breakfast", "food": "description", "calories": 500, "protein": 30, "carbs": 50, "fats": 15, "tips": "advice"}, ...], "daily_totals": {"calories": 2000, "protein": 150, "carbs": 200, "fats": 60}, "nutritionist_notes": "overall advice"}`;

        try {
            const text = await callGemini(prompt);
            const mealPlan = JSON.parse(text.replace(/```json|```/g, ""));
            res.status(200).json({
                tdee: tdee,
                target_macros: macros,
                ...mealPlan
            });
        } catch (error) {
            console.error("Meal Plan Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

// GET: Progress Report with Growth Forecasting
app.get('/api/progress-report', async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    
    db.all(`SELECT * FROM Daily_Logs ORDER BY date DESC LIMIT ?`, [days], async (err, rows) => {
        if (err) {
            console.error("Progress Report Error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (rows.length === 0) {
            return res.status(200).json({
                message: "No data available yet. Start logging your daily habits!",
                forecast: null
            });
        }

        // Calculate statistics
        const totalCalories = rows.reduce((acc, row) => acc + (row.calories || 0), 0);
        const avgSleep = rows.reduce((acc, row) => acc + (row.sleep_hours || 0), 0) / rows.length;
        const avgProtein = rows.reduce((acc, row) => acc + (row.protein || 0), 0) / rows.length;
        
        // Get latest weight
        const latestWeight = rows[0]?.weight || 70;
        
        // Get user profile for goal context
        db.get(`SELECT * FROM User_Profile WHERE id = 1`, async (err, profile) => {
            if (err || !profile) {
                return res.status(500).json({ error: "Profile not found" });
            }

            const tdee = calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level, profile.goal);
            
            // Calculate growth velocity based on consistency
            let growthVelocity = "Optimal";
            let velocityEmoji = "🚀";
            
            if (avgSleep < 6) {
                growthVelocity = "Slow - Poor Sleep";
                velocityEmoji = "😴";
            } else if (totalCalories < tdee * days * 0.8 && profile.goal.includes('build')) {
                growthVelocity = "Stalled - Under-eating";
                velocityEmoji = "⚠️";
            } else if (avgProtein < profile.weight * 1.5) {
                growthVelocity = "Suboptimal - Low Protein";
                velocityEmoji = "🥩";
            }

            // Project 30-day outcomes
            let predictedWeight = latestWeight;
            let muscleGain = 0;
            let fatLoss = 0;

            if (profile.goal === 'lose_tummy' || profile.goal === 'lose_weight') {
                // In deficit: ~0.5kg fat loss per week
                const avgDailyDeficit = tdee - (totalCalories / days);
                fatLoss = avgDailyDeficit > 0 ? (avgDailyDeficit / 500) * 4 : 0; // 4 weeks
                fatLoss = Math.min(fatLoss, 2); // Cap at 2kg
                predictedWeight = latestWeight - fatLoss;
            } else if (profile.goal === 'buff_arms' || profile.goal === 'build_muscle' || profile.goal === 'bulk') {
                // Muscle gain: 0.5-1kg per month for beginners
                muscleGain = avgProtein >= profile.weight * 1.8 ? 1 : 0.5;
                predictedWeight = latestWeight + muscleGain;
            }

            const prompt = `Analyze this fitness data and provide strategic advice:
            
            User: ${profile.name}, ${profile.weight}kg, Goal: ${profile.goal}
            Last ${days} days:
            - Total Calories: ${totalCalories} (avg ${Math.round(totalCalories/days)}/day)
            - Target TDEE: ${tdee}
            - Avg Sleep: ${Math.round(avgSleep*10)/10} hours
            - Avg Protein: ${Math.round(avgProtein)}g
            
            Current Growth Velocity: ${growthVelocity}
            
            Provide a JSON with:
            {"growth_velocity": "Slow/Optimal/Stalled", "velocity_reason": "why", "nutritional_course_correction": "advice", "predicted_weight_30days": number, "predicted_muscle_gain": number, "key_insights": ["point1", "point2"]}`;

            try {
                const text = await callGemini(prompt);
                const analysis = JSON.parse(text.replace(/```json|```/g, ""));

                res.status(200).json({
                    summary: {
                        days_tracked: rows.length,
                        total_calories: totalCalories,
                        avg_daily_calories: Math.round(totalCalories / rows.length),
                        avg_sleep: Math.round(avgSleep * 10) / 10,
                        avg_protein: Math.round(avgProtein),
                        tdee: tdee
                    },
                    current_status: {
                        weight: latestWeight,
                        goal: profile.goal,
                        growth_velocity: growthVelocity,
                        velocity_emoji: velocityEmoji
                    },
                    forecast: {
                        predicted_weight_30days: analysis.predicted_weight_30days || Math.round(predictedWeight * 10) / 10,
                        predicted_muscle_gain: analysis.predicted_muscle_gain || muscleGain,
                        fat_change: -fatLoss
                    },
                    analysis: analysis,
                    recent_logs: rows.slice(0, 7).reverse()
                });
            } catch (error) {
                console.error("AI Analysis Error:", error);
                res.status(200).json({
                    summary: {
                        days_tracked: rows.length,
                        total_calories: totalCalories,
                        avg_daily_calories: Math.round(totalCalories / rows.length),
                        avg_sleep: Math.round(avgSleep * 10) / 10,
                        tdee: tdee
                    },
                    forecast: {
                        predicted_weight_30days: Math.round(predictedWeight * 10) / 10,
                        predicted_muscle_gain: muscleGain
                    },
                    growth_velocity: growthVelocity
                });
            }
        });
    });
});

// GET: AI Nutritionist Advice - Course Correction
app.get('/api/nutrition-advice', async (req, res) => {
    db.get(`SELECT * FROM User_Profile WHERE id = 1`, async (err, profile) => {
        if (err || !profile) {
            return res.status(500).json({ error: "Profile not found" });
        }

        const tdee = calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level, profile.goal);
        const targetMacros = calculateMacros(tdee, profile.weight, profile.goal);

        // Get last 3 days of meal logs
        db.all(`SELECT * FROM Daily_Logs ORDER BY date DESC LIMIT 3`, async (err, rows) => {
            if (err) {
                console.error("Nutrition Advice Error:", err);
                return res.status(500).json({ error: err.message });
            }

            const recentCalories = rows.reduce((acc, row) => acc + (row.calories || 0), 0);
            const recentProtein = rows.reduce((acc, row) => acc + (row.protein || 0), 0);
            const recentCarbs = rows.reduce((acc, row) => acc + (row.carbs || 0), 0);
            const recentFats = rows.reduce((acc, row) => acc + (row.fats || 0), 0);

            const avgDailyCalories = rows.length > 0 ? Math.round(recentCalories / rows.length) : 0;
            const avgDailyProtein = rows.length > 0 ? Math.round(recentProtein / rows.length) : 0;

            // Calculate gaps
            const calorieGap = tdee - avgDailyCalories;
            const proteinGap = targetMacros.protein - avgDailyProtein;

            let statusMessage = "";
            let courseCorrection = "";
            let dinnerSuggestion = "";

            if (proteinGap > 30) {
                statusMessage = `Samuel, your protein intake has been ${proteinGap}g below target for ${rows.length} days. This will stall your arm growth.`;
                courseCorrection = "For dinner tonight, swap the extra portion of rice for 3 boiled eggs or 150g of chicken to hit your synthesis window.";
                dinnerSuggestion = "Grilled chicken breast (150g) + steamed vegetables + 1 cup brown rice (swap half for extra protein)";
            } else if (calorieGap > 300) {
                statusMessage = `You're averaging ${avgDailyCalories} calories, but your target is ${tdee}. You're under-eating by ${Math.abs(calorieGap)} calories daily.`;
                courseCorrection = "Add a protein shake with banana or a handful of nuts to close the gap.";
            } else if (calorieGap < -300) {
                statusMessage = `You're averaging ${avgDailyCalories} calories, which is ${Math.abs(calorieGap)} above your target of ${tdee}.`;
                courseCorrection = "Consider reducing portion sizes or skipping the extra snack.";
            } else {
                statusMessage = "Your nutrition is on track! Keep up the good work.";
                courseCorrection = "Stay consistent with your current meal patterns.";
            }

            const prompt = `As an expert nutritionist, provide personalized advice for:
            
            User: ${profile.name}, ${profile.weight}kg, Goal: ${profile.goal}
            Target: ${tdee} calories, ${targetMacros.protein}g protein, ${targetMacros.carbs}g carbs, ${targetMacros.fats}g fats
            
            Last 3 days average: ${avgDailyCalories} cal, ${avgDailyProtein}g protein
            
            Provide a JSON with:
            {"overall_assessment": "summary", "specific_issues": ["issue1"], "course_corrections": ["action1"], "today_dinner_suggestion": "meal description with macros", "snack_ideas": ["idea1"], "motivation": "encouraging message"}`;

            try {
                const text = await callGemini(prompt);
                const advice = JSON.parse(text.replace(/```json|```/g, ""));

                res.status(200).json({
                    user: {
                        name: profile.name,
                        weight: profile.weight,
                        goal: profile.goal
                    },
                    targets: {
                        calories: tdee,
                        protein: targetMacros.protein,
                        carbs: targetMacros.carbs,
                        fats: targetMacros.fats
                    },
                    recent_average: {
                        days: rows.length,
                        calories: avgDailyCalories,
                        protein: avgDailyProtein,
                        carbs: Math.round(recentCarbs / rows.length || 0),
                        fats: Math.round(recentFats / rows.length || 0)
                    },
                    gaps: {
                        calories: calorieGap,
                        protein: proteinGap
                    },
                    quick_analysis: {
                        status: statusMessage,
                        correction: courseCorrection,
                        dinner_suggestion: dinnerSuggestion
                    },
                    detailed_advice: advice
                });
            } catch (error) {
                console.error("Nutrition Advice Error:", error);
                res.status(200).json({
                    user: { name: profile.name, weight: profile.weight, goal: profile.goal },
                    targets: { calories: tdee, protein: targetMacros.protein },
                    recent_average: { calories: avgDailyCalories, protein: avgDailyProtein },
                    gaps: { calories: calorieGap, protein: proteinGap },
                    quick_analysis: {
                        status: statusMessage,
                        correction: courseCorrection,
                        dinner_suggestion: dinnerSuggestion
                    }
                });
            }
        });
    });
});

// POST: Log a meal with full macro tracking
app.post('/api/log-meal', async (req, res) => {
    const { mealDescription, calories, protein, carbs, fats } = req.body;

    // If macros provided directly, use them
    if (calories !== undefined) {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's existing logs
        db.get(`SELECT * FROM Daily_Logs WHERE date = ?`, [today], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const existingCalories = row?.calories || 0;
            const existingProtein = row?.protein || 0;
            const existingCarbs = row?.carbs || 0;
            const existingFats = row?.fats || 0;

            // Update with cumulative totals
            db.run(`INSERT OR REPLACE INTO Daily_Logs (date, sleep_hours, knee_pain, back_stiffness, weight, calories, protein, carbs, fats)
                    SELECT date, sleep_hours, knee_pain, back_stiffness, weight, ?, ?, ?, ?
                    FROM Daily_Logs WHERE date = ?
                    UNION ALL
                    SELECT ?, 8, 0, 0, 70, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM Daily_Logs WHERE date = ?)`,
                [existingCalories + calories, existingProtein + protein, existingCarbs + carbs, existingFats + fats,
                 today, calories, protein, carbs, fats, today],
                function(err) {
                    if (err) {
                        console.error("Meal Log Error:", err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({
                        message: "Meal logged successfully",
                        meal: mealDescription,
                        added: { calories, protein, carbs, fats },
                        daily_total: {
                            calories: existingCalories + calories,
                            protein: existingProtein + protein,
                            carbs: existingCarbs + carbs,
                            fats: existingFats + fats
                        }
                    });
                }
            );
        });
        return;
    }

    // Otherwise, use AI to estimate
    const prompt = `Act as a nutritionist. Analyze this meal: "${mealDescription}".
    Estimate the Calories, Protein, Carbs, and Fats.
    Return strictly JSON: {"meal": "name", "calories": 500, "protein": 30, "carbs": 50, "fats": 10, "advice": "short tip"}`;

    try {
        const text = await callGemini(prompt);
        const mealData = JSON.parse(text.replace(/```json|```/g, ""));
        
        // Also save to database
        const today = new Date().toISOString().split('T')[0];
        db.get(`SELECT * FROM Daily_Logs WHERE date = ?`, [today], (err, row) => {
            const existingCalories = row?.calories || 0;
            const existingProtein = row?.protein || 0;
            const existingCarbs = row?.carbs || 0;
            const existingFats = row?.fats || 0;

            db.run(`INSERT OR REPLACE INTO Daily_Logs (date, sleep_hours, knee_pain, back_stiffness, weight, calories, protein, carbs, fats)
                    SELECT date, sleep_hours, knee_pain, back_stiffness, weight, ?, ?, ?, ?
                    FROM Daily_Logs WHERE date = ?
                    UNION ALL
                    SELECT ?, 8, 0, 0, 70, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM Daily_Logs WHERE date = ?)`,
                [existingCalories + mealData.calories, existingProtein + mealData.protein, existingCarbs + mealData.carbs, existingFats + mealData.fats,
                 today, mealData.calories, mealData.protein, mealData.carbs, mealData.fats, today]);
        });
        
        res.status(200).json(mealData);
    } catch (error) {
        console.error("DETAILED MEAL ERROR:", error);
        res.status(500).json({ error: "Failed to analyze meal" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('Auto-Trainer API is running on port', PORT);
});