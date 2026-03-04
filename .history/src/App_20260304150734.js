import React, { useState} from 'react';
import axios from 'axios';
import './App.css';


function App(){
    const [stats, setStats] = useState({

        sleep_hours: 8,
        knee_pain: 0,
        back_stifness:0,
        stress_level:0
    });


    const [ workout, setWorkout] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
      const response = await axios.post('http://localhost:5000/api/daily-log', {
        ...stats,
        date: new Date().toISOString().split('T')[0]
      });
      setWorkout(response.data.todaysWorkout);
    } catch (err) {
      console.error("Error fetching workout:", err);
      alert("Make sure your backend server is running on port 5000!");
    }
  };

  return (<div className="App" style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1>Auto-Trainer Control Center</h1>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
        <div>
          <label>Sleep Hours: {stats.sleep_hours}</label>
          <input type="range" min="0" max="12" value={stats.sleep_hours} 
            onChange={(e) => setStats({...stats, sleep_hours: e.target.value})} />
        </div>
        
        <div>
          <label>Knee Pain (0-10): {stats.knee_pain}</label>
          <input type="range" min="0" max="10" value={stats.knee_pain} 
            onChange={(e) => setStats({...stats, knee_pain: e.target.value})} />
        </div>

        <div>
          <label>Back Stiffness (0-10): {stats.back_stiffness}</label>
          <input type="range" min="0" max="10" value={stats.back_stiffness} 
            onChange={(e) => setStats({...stats, back_stiffness: e.target.value})} />
        </div>

        <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Generate Today's Workout
        </button>
      </form>

      {workout && (
        <div style={{ marginTop: '40px', border: '1px solid #333', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e' }}>
          <h2 style={{ color: '#00ff88' }}>{workout.title}</h2>
          <p><strong>Type:</strong> {workout.type}</p>
          <p><strong>Focus:</strong> {workout.focus}</p>
          <div style={{ padding: '10px', background: '#333', borderRadius: '5px' }}>
            <p>{workout.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
3. Quick Styling (App.css)
To make those sliders actually look like a "pro" app, add this to your src/App.css:

CSS
input[type="range"] {
  width: 100%;
  margin: 10px 0 20px 0;
  cursor: pointer;
}

label {
  display: block;
  font-weight: bold;
  margin-top: 10px;
}

button {
  background-color: #00ff88;
  border: none;
  color: #121212;
  font-weight: bold;
  border-radius: 5px;
}

button:hover {
  background-color: #00cc6e;
})