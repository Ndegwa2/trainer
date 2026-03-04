import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Dumbbell, Activity, Moon, AlertCircle, Send, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';
import { Slider } from './components/ui/slider';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import './App.css';

function App() {
  const [stats, setStats] = useState({
    gender: 'male',
    weight: 70,
    equipment: ['Dumbbell', 'Bodyweight'],
    targetParts: ['Chest', 'Arms'],
    sleep_hours: 8,
    knee_pain: 0,
    back_stiffness: 0
  });

  const [workoutData, setWorkoutData] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI personal trainer. Ask me anything about workouts, nutrition, or fitness!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Convert array equipment to object for UI
  const [equipmentState, setEquipmentState] = useState({
    dumbbell: true,
    barbell: false,
    bodyweight: true,
    machine: false,
    cable: false,
  });

  // Convert array muscle groups to object for UI
  const [muscleGroupsState, setMuscleGroupsState] = useState({
    chest: true,
    back: false,
    arms: true,
    shoulders: false,
    legs: false,
    chestArms: false,
    backLegs: false,
  });

  const [sleepHours, setSleepHours] = useState([8]);
  const [kneePain, setKneePain] = useState([0]);
  const [backStiffness, setBackStiffness] = useState([0]);

  const equipmentOptions = {
    dumbbell: 'Dumbbell',
    barbell: 'Barbell',
    bodyweight: 'Bodyweight',
    machine: 'Machine',
    cable: 'Cable',
  };

  const muscleGroupOptions = {
    chest: 'Chest',
    back: 'Back',
    arms: 'Arms',
    shoulders: 'Shoulders',
    legs: 'Legs',
    chestArms: 'Chest/Arms',
    backLegs: 'Back/Legs',
  };

  // Split into individual and combination groups for display
  const individualMuscleGroups = ['chest', 'back', 'arms', 'shoulders', 'legs'];
  const combinationMuscleGroups = ['chestArms', 'backLegs'];

  const handleEquipmentChange = (key) => {
    setEquipmentState((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      // Convert to array format for API
      const selectedEquipment = Object.entries(newState)
        .filter(([_, value]) => value)
        .map(([key]) => {
          const mapping = {
            dumbbell: 'Dumbbell',
            barbell: 'Barbell',
            bodyweight: 'Bodyweight',
            machine: 'Machine',
            cable: 'Cable',
          };
          return mapping[key];
        });
      setStats((prevStats) => ({ ...prevStats, equipment: selectedEquipment }));
      return newState;
    });
  };

  const handleMuscleGroupChange = (key) => {
    setMuscleGroupsState((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      // Convert to array format for API
      const selectedParts = Object.entries(newState)
        .filter(([_, value]) => value)
        .map(([key]) => {
          const mapping = {
            chest: 'Chest',
            back: 'Back',
            arms: 'Arms',
            shoulders: 'Shoulders',
            legs: 'Legs',
            chestArms: 'Chest/Arms',
            backLegs: 'Back/Legs',
          };
          return mapping[key];
        });
      setStats((prevStats) => ({ ...prevStats, targetParts: selectedParts }));
      return newState;
    });
  };

  const handleSleepHoursChange = (value) => {
    setSleepHours(value);
    setStats((prevStats) => ({ ...prevStats, sleep_hours: value[0] }));
  };

  const handleKneePainChange = (value) => {
    setKneePain(value);
    setStats((prevStats) => ({ ...prevStats, knee_pain: value[0] }));
  };

  const handleBackStiffnessChange = (value) => {
    setBackStiffness(value);
    setStats((prevStats) => ({ ...prevStats, back_stiffness: value[0] }));
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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: userMessage,
        context: stats
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble responding right now. Please try again!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getSelectedCount = (obj) => {
    return Object.values(obj).filter(Boolean).length;
  };

  const getPainLevel = (value) => {
    if (value === 0) return { label: 'None', color: 'bg-green-500' };
    if (value <= 3) return { label: 'Mild', color: 'bg-yellow-500' };
    if (value <= 6) return { label: 'Moderate', color: 'bg-orange-500' };
    return { label: 'Severe', color: 'bg-red-500' };
  };

  const getSleepQuality = (hours) => {
    if (hours >= 8) return { label: 'Excellent', color: 'bg-green-500' };
    if (hours >= 6) return { label: 'Good', color: 'bg-blue-500' };
    if (hours >= 4) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Workout Planner</h1>
          </div>
          <p className="text-slate-400">Customize your workout based on available equipment and current condition</p>
        </div>

        {/* Equipment Available */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  Equipment Available
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Select all equipment you have access to
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                {getSelectedCount(equipmentState)} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(equipmentOptions).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={equipmentState[key]}
                    onCheckedChange={() => handleEquipmentChange(key)}
                    className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <Label
                    htmlFor={key}
                    className="text-sm text-slate-200 cursor-pointer select-none"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Muscle Groups */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Target Muscle Groups</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose which muscle groups to focus on
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                {getSelectedCount(muscleGroupsState)} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {individualMuscleGroups.map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={muscleGroupsState[key]}
                      onCheckedChange={() => handleMuscleGroupChange(key)}
                      className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <Label
                      htmlFor={key}
                      className="text-sm text-slate-200 cursor-pointer select-none"
                    >
                      {muscleGroupOptions[key]}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-3">Combination Groups</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {combinationMuscleGroups.map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={muscleGroupsState[key]}
                        onCheckedChange={() => handleMuscleGroupChange(key)}
                        className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Label
                        htmlFor={key}
                        className="text-sm text-slate-200 cursor-pointer select-none"
                      >
                        {muscleGroupOptions[key]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Condition */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Moon className="h-5 w-5 text-emerald-400" />
              Daily Condition
            </CardTitle>
            <CardDescription className="text-slate-400">
              Help us personalize your workout intensity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Sleep Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200">Sleep Hours</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{sleepHours[0]}</span>
                  <span className="text-sm text-slate-400">hours</span>
                  <Badge className={`${getSleepQuality(sleepHours[0]).color} text-white`}>
                    {getSleepQuality(sleepHours[0]).label}
                  </Badge>
                </div>
              </div>
              <Slider
                value={sleepHours}
                onValueChange={handleSleepHoursChange}
                min={0}
                max={12}
                step={0.5}
                className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-400"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Knee Pain */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Knee Pain
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{kneePain[0]}</span>
                  <span className="text-sm text-slate-400">/ 10</span>
                  <Badge className={`${getPainLevel(kneePain[0]).color} text-white`}>
                    {getPainLevel(kneePain[0]).label}
                  </Badge>
                </div>
              </div>
              <Slider
                value={kneePain}
                onValueChange={handleKneePainChange}
                min={0}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>No pain</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Back Stiffness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Back Stiffness
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{backStiffness[0]}</span>
                  <span className="text-sm text-slate-400">/ 10</span>
                  <Badge className={`${getPainLevel(backStiffness[0]).color} text-white`}>
                    {getPainLevel(backStiffness[0]).label}
                  </Badge>
                </div>
              </div>
              <Slider
                value={backStiffness}
                onValueChange={handleBackStiffnessChange}
                min={0}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>No stiffness</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/50 transition-all"
        >
          <Dumbbell className="mr-2 h-5 w-5" />
          Generate Today's Workout
        </Button>

        {/* Workout Results */}
        {workoutData?.trainerAdvice && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 font-semibold">💡 {workoutData.trainerAdvice}</p>
          </div>
        )}

        {workoutData?.exercises && workoutData.exercises.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-emerald-400">
                {workoutData.workoutTitle || "Today's Workout Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workoutData.exercises.map((ex, index) => (
                <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-emerald-400">{ex.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-slate-300"><strong className="text-slate-400">Sets:</strong> {ex.sets}</span>
                    <span className="text-slate-300"><strong className="text-slate-400">Reps:</strong> {ex.reps}</span>
                  </div>
                  <p className="text-slate-400 mt-2 text-sm">{ex.instruction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {workoutData?.exercises && workoutData.exercises.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400">No exercises match your criteria. Try adjusting your equipment or target muscle groups.</p>
            </CardContent>
          </Card>
        )}

        {/* AI Chatbox */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              AI Trainer Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-1">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'ml-auto bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {isChatLoading && (
                <div className="bg-slate-800 text-slate-500 p-3 rounded-lg max-w-[80%]">
                  Typing...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about workouts, nutrition..."
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-500 pb-4">
          Customize your preferences and click generate to create a personalized workout plan
        </div>
      </div>
    </div>
  );
}

export default App;
