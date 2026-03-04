import React, { useState } from 'react';
import axios from 'axios';
import './App.css';


function App(){
    const [stats, setStats] = useState({
        gender: 'male',
        weight: 70,
        equipment: ['Dumbbell', 'Bodyweight'],
        targetParts: ['Chest', 'Arms'],
        sleep_hours: 8,
        knee_pain: 0,
        back_stifness: 0
    });

    const [ workout, setWorkout] = useState(null);
    const [advice, setAdvice] = useState('');

    const equipmentOptions = ['Dumbbell', 'Barbell', 'Bodyweight', 'Machine', 'Cable'];
    const partOptions = ['Chest', 'Back', 'Arms', 'Shoulders', 'Legs', 'Chest/Arms', 'Back/Legs'];

    const handleEquipmentChange = (equip) => {
        const newEquipment = stats.equipment.includes(equip)
            ? stats.equipment.filter(e => e !== equip)
            : [...stats.equipment, equip];
        setStats({ ...stats, equipment: newEquipment });
    };

    const handlePartChange = (part) => {
        const newParts = stats.targetParts.includes(part)
            ? stats.targetParts.filter(p => p !== part)
            : [...stats.targetParts, part];
        setStats({ ...stats, targetParts: newParts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/daily-log', {
                ...stats,
                date: new Date().toISOString().split('T')[0]
            });
            setWorkout(response.data.workout);
            setAdvice(response.data.advice);
        } catch (err) {
            console.error("Error fetching workout:", err);
            alert("Make sure your backend server is running on port 5000!");
        }
    };

    return (<div className="App" style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', padding: '20px' }}>
        <h1>Auto-Trainer Control Center</h1>
        
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
            
            <h3>Profile</h3>
            <div>
                <label>Gender: </label>
                <select value={stats.gender} onChange={(e) => setStats({...stats, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            
            <div>
                <label>Weight (kg): {stats.weight}</label>
                <input type="range" min="40" max="150" value={stats.weight}
                    onChange={(e) => setStats({...stats, weight: parseInt(e.target.value)})} />
            </div>

            <h3>Equipment Available</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {equipmentOptions.map(equip => (
                    <label key={equip} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={stats.equipment.includes(equip)}
                            onChange={() => handleEquipmentChange(equip)} />
                        {equip}
                    </label>
                ))}
            </div>

            <h3>Target Muscle Groups</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {partOptions.map(part => (
                    <label key={part} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={stats.targetParts.includes(part)}
                            onChange={() => handlePartChange(part)} />
                        {part}
                    </label>
                ))}
            </div>

            <h3>Daily Condition</h3>
            <div>
                <label>Sleep Hours: {stats.sleep_hours}</label>
                <input type="range" min="0" max="12" value={stats.sleep_hours}
                    onChange={(e) => setStats({...stats, sleep_hours: parseInt(e.target.value)})} />
            </div>
            
            <div>
                <label>Knee Pain (0-10): {stats.knee_pain}</label>
                <input type="range" min="0" max="10" value={stats.knee_pain}
                    onChange={(e) => setStats({...stats, knee_pain: parseInt(e.target.value)})} />
            </div>

            <div>
                <label>Back Stiffness (0-10): {stats.back_stifness}</label>
                <input type="range" min="0" max="10" value={stats.back_stifness}
                    onChange={(e) => setStats({...stats, back_stifness: parseInt(e.target.value)})} />
            </div>

            <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
                Generate Today's Workout
            </button>
        </form>

        {advice && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '10px' }}>
                <p style={{ color: '#ffaa00', fontWeight: 'bold' }}>💡 {advice}</p>
            </div>
        )}

        {workout && workout.length > 0 && (
            <div style={{ marginTop: '40px', border: '1px solid #333', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e' }}>
                <h2 style={{ color: '#00ff88' }}>Today's Workout Plan</h2>
                {workout.map((ex, index) => (
                    <div key={index} style={{ marginTop: '15px', padding: '10px', background: '#333', borderRadius: '5px' }}>
                        <h3 style={{ color: '#00ff88' }}>{ex.name}</h3>
                        <p><strong>Muscle Group:</strong> {ex.part}</p>
                        <p><strong>Equipment:</strong> {ex.equip}</p>
                        <p><strong>Reps:</strong> {ex.reps}</p>
                    </div>
                ))}
            </div>
        )}

        {workout && workout.length === 0 && (
            <div style={{ marginTop: '40px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e' }}>
                <p>No exercises match your criteria. Try adjusting your equipment or target muscle groups.</p>
            </div>
        )}
    </div>
  );
}

export default App;
