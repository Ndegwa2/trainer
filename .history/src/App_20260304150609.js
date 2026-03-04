import React, { useState} from 'react';
import axios from 'axios';
import './App.css';


function App(){
    const [stats, setStats] = useState({

        sleep_hours: 8,
        knee_pain:onabort,
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

  return (<div className="App">