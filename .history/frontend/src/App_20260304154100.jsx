import React, { useState, useRef } from 'react';
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
        back_stiffness: 0
    });

    const [ workoutData, setWorkoutData] = useState(null);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your AI personal trainer. Ask me anything about workouts, nutrition, or fitness!' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

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
            const response = await axios.post('http://localhost:5000/api/daily-log', stats);
            setWorkoutData(response.data);
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
                <label>Back Stiffness (0-10): {stats.back_stiffness}</label>
                <input type="range" min="0" max="10" value={stats.back_stiffness}
                    onChange={(e) => setStats({...stats, back_stiffness: parseInt(e.target.value)})} />
            </div>

            <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
                Generate Today's Workout
            </button>
        </form>

        {workoutData?.trainerAdvice && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '10px' }}>
                <p style={{ color: '#ffaa00', fontWeight: 'bold' }}>💡 {workoutData.trainerAdvice}</p>
            </div>
        )}

        {workoutData?.exercises && workoutData.exercises.length > 0 && (
            <div style={{ marginTop: '40px', border: '1px solid #333', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e' }}>
                <h2 style={{ color: '#00ff88' }}>{workoutData.workoutTitle || "Today's Workout Plan"}</h2>
                {workoutData.exercises.map((ex, index) => (
                    <div key={index} style={{ marginTop: '15px', padding: '10px', background: '#333', borderRadius: '5px' }}>
                        <h3 style={{ color: '#00ff88' }}>{ex.name}</h3>
                        <p><strong>Sets:</strong> {ex.sets}</p>
                        <p><strong>Reps:</strong> {ex.reps}</p>
                        <p><strong>Instructions:</strong> {ex.instruction}</p>
                    </div>
                ))}
            </div>
        )}

        {workoutData?.exercises && workoutData.exercises.length === 0 && (
            <div style={{ marginTop: '40px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e' }}>
                <p>No exercises match your criteria. Try adjusting your equipment or target muscle groups.</p>
            </div>
        )}

        {/* AI Chatbox */}
        <div style={{
            marginTop: '40px',
            maxWidth: '500px',
            margin: '40px auto',
            border: '1px solid #444',
            borderRadius: '10px',
            backgroundColor: '#1e1e1e',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '15px',
                backgroundColor: '#2d2d2d',
                borderBottom: '1px solid #444',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <h3 style={{ margin: 0, color: '#00ff88' }}>AI Trainer Chat</h3>
            </div>
            
            <div style={{
                height: '300px',
                overflowY: 'auto',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {chatMessages.map((msg, index) => (
                    <div key={index} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        padding: '10px 15px',
                        borderRadius: '15px',
                        backgroundColor: msg.role === 'user' ? '#00ff88' : '#333',
                        color: msg.role === 'user' ? '#000' : '#fff',
                    }}>
                        {msg.content}
                    </div>
                ))}
                {isChatLoading && (
                    <div style={{
                        alignSelf: 'flex-start',
                        padding: '10px 15px',
                        borderRadius: '15px',
                        backgroundColor: '#333',
                        color: '#888',
                    }}>
                        Typing...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} style={{
                display: 'flex',
                padding: '15px',
                borderTop: '1px solid #444',
                gap: '10px'
            }}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about workouts, nutrition..."
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '20px',
                        border: '1px solid #444',
                        backgroundColor: '#2d2d2d',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        border: 'none',
                        backgroundColor: '#00ff88',
                        color: '#000',
                        cursor: isChatLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    </div>
  );
}

export default App;
