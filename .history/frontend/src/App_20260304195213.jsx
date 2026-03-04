
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Dumbbell, Activity, Moon, AlertCircle, Send, MessageSquare, Utensils, TrendingUp, Target, Flame, User, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';
import { Slider } from './components/ui/slider';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('workout');
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'User',
    gender: 'male',
    weight: 70,
    height: 170,
    age: 25,
    activity_level: 'moderate',
    goal: 'maintain',
    target_weight: 70
  });
  
  // TDEE data
  const [tdeeData, setTdeeData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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
  
  // Meal logging state
  const [mealInput, setMealInput] = useState('');
  const [dailyTotal, setDailyTotal] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [isMealLoading, setIsMealLoading] = useState(false);
  const [lastMeal, setLastMeal] = useState(null);

  // Meal Plan state
  const [mealPlan, setMealPlan] = useState(null);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);

  // Progress Report state
  const [progressReport, setProgressReport] = useState(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  // Nutrition Advice state
  const [nutritionAdvice, setNutritionAdvice] = useState(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

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

  const individualMuscleGroups = ['chest', 'back', 'arms', 'shoulders', 'legs'];
  const combinationMuscleGroups = ['chestArms', 'backLegs'];

  // Fetch TDEE on mount
  useEffect(() => {
    fetchTDEE();
  }, []);

  const fetchTDEE = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tdee');
      setTdeeData(response.data);
      if (response.data.profile) {
        setProfile(response.data.profile);
        setStats(prev => ({ ...prev, weight: response.data.profile.weight }));
      }
    } catch (err) {
      console.error("Error fetching TDEE:", err);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setIsLoadingProfile(true);
    try {
      await axios.post('http://localhost:5000/api/profile', profile);
      await fetchTDEE();
      alert('Profile saved successfully!');
    } catch (err) {
      console.error("Error saving profile:", err);
      alert('Failed to save profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleEquipmentChange = (key) => {
    setEquipmentState((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      const selectedEquipment = Object.entries(newState)
        .filter(([, value]) => value)
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
      const selectedParts = Object.entries(newState)
        .filter(([, value]) => value)
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
      const response = await axios.post('http://localhost:5000/api/daily-log', {
        ...stats,
        calories: dailyTotal.calories,
        protein: dailyTotal.protein,
        carbs: dailyTotal.carbs,
        fats: dailyTotal.fats
      });
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
        context: { ...stats, ...tdeeData }
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble responding right now. Please try again!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleMealSubmit = async () => {
    if (!mealInput.trim() || isMealLoading) return;
    
    setIsMealLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/log-meal', {
        mealDescription: mealInput
      });
      const mealData = response.data;
      setLastMeal(mealData);
      setDailyTotal(prev => ({
        calories: prev.calories + (mealData.calories || 0),
        protein: prev.protein + (mealData.protein || 0),
        carbs: prev.carbs + (mealData.carbs || 0),
        fats: prev.fats + (mealData.fats || 0)
      }));
      setMealInput('');
    } catch (err) {
      console.error("Meal logging error:", err);
      alert("Failed to log meal. Make sure the server is running!");
    } finally {
      setIsMealLoading(false);
    }
  };

  const fetchMealPlan = async () => {
    setIsMealPlanLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/meal-plan');
      setMealPlan(response.data);
    } catch (err) {
      console.error("Error fetching meal plan:", err);
      alert("Failed to generate meal plan!");
    } finally {
      setIsMealPlanLoading(false);
    }
  };

  const fetchProgressReport = async () => {
    setIsProgressLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/progress-report?days=7');
      setProgressReport(response.data);
    } catch (err) {
      console.error("Error fetching progress report:", err);
    } finally {
      setIsProgressLoading(false);
    }
  };

  const fetchNutritionAdvice = async () => {
    setIsAdviceLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/nutrition-advice');
      setNutritionAdvice(response.data);
    } catch (err) {
      console.error("Error fetching nutrition advice:", err);
    } finally {
      setIsAdviceLoading(false);
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

  const getGoalLabel = (goal) => {
    const goals = {
      'lose_tummy': 'Lose Belly Fat',
      'lose_weight': 'Lose Weight',
      'buff_arms': 'Build Buff Arms',
      'build_muscle': 'Build Muscle',
      'bulk': 'Bulk Up',
      'maintain': 'Maintain'
    };
    return goals[goal] || goal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with Tabs */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Auto-Trainer</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Button
              variant={activeTab === 'workout' ? 'default' : 'outline'}
              onClick={() => setActiveTab('workout')}
              className={activeTab === 'workout' ? 'bg-emerald-500' : 'border-slate-700 text-slate-300'}
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              Workout
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
              className={activeTab === 'profile' ? 'bg-emerald-500' : 'border-slate-700 text-slate-300'}
            >
              <User className="h-4 w-4 mr-2" />
              Profile & TDEE
            </Button>
            <Button
              variant={activeTab === 'meals' ? 'default' : 'outline'}
              onClick={() => { setActiveTab('meals'); fetchMealPlan(); }}
              className={activeTab === 'meals' ? 'bg-emerald-500' : 'border-slate-700 text-slate-300'}
            >
              <Utensils className="h-4 w-4 mr-2" />
              Meal Plan
            </Button>
            <Button
              variant={activeTab === 'progress' ? 'default' : 'outline'}
              onClick={() => { setActiveTab('progress'); fetchProgressReport(); fetchNutritionAdvice(); }}
              className={activeTab === 'progress' ? 'bg-emerald-500' : 'border-slate-700 text-slate-300'}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Status Report
            </Button>
          </div>
        </div>

        {/* WORKOUT TAB */}
        {activeTab === 'workout' && (
          <>
            {/* Meal Logger */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-orange-400" />
                      Meal Logger
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Log what you ate - AI will estimate calories and macros
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                    {dailyTotal.calories} kcal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Calories</p>
                    <p className="text-lg font-bold text-white">{dailyTotal.calories}</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Protein</p>
                    <p className="text-lg font-bold text-red-400">{dailyTotal.protein}g</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Carbs</p>
                    <p className="text-lg font-bold text-yellow-400">{dailyTotal.carbs}g</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Fats</p>
                    <p className="text-lg font-bold text-blue-400">{dailyTotal.fats}g</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mealInput}
                    onChange={(e) => setMealInput(e.target.value)}
                    placeholder="e.g., 2 chapatis, ndengu, 1 glass milk"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleMealSubmit()}
                  />
                  <Button
                    onClick={handleMealSubmit}
                    disabled={isMealLoading || !mealInput.trim()}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isMealLoading ? 'Analyzing...' : 'Log Meal'}
                  </Button>
                </div>

                {lastMeal && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-orange-400">{lastMeal.meal}</span>: {lastMeal.calories} kcal
                      (P: {lastMeal.protein}g | C: {lastMeal.carbs}g | F: {lastMeal.fats}g)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">💡 {lastMeal.advice}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TDEE Summary Card */}
            {tdeeData && (
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-400" />
                    Your Daily Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-slate-400">TDEE</p>
                      <p className="text-2xl font-bold text-red-400">{tdeeData.tdee}</p>
                      <p className="text-xs text-slate-500">kcal/day</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-slate-400">Protein</p>
                      <p className="text-2xl font-bold text-red-400">{tdeeData.macros.protein}g</p>
                      <p className="text-xs text-slate-500">{tdeeData.goal_adjustment}</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-slate-400">Carbs</p>
                      <p className="text-2xl font-bold text-yellow-400">{tdeeData.macros.carbs}g</p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-slate-400">Fats</p>
                      <p className="text-2xl font-bold text-blue-400">{tdeeData.macros.fats}g</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sleep-hours" className="text-slate-200">Sleep Hours</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{sleepHours[0]}</span>
                      <span className="text-sm text-slate-400">hours</span>
                      <Badge className={`${getSleepQuality(sleepHours[0]).color} text-white`}>
                        {getSleepQuality(sleepHours[0]).label}
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    id="sleep-hours"
                    value={sleepHours}
                    onValueChange={handleSleepHoursChange}
                    min={0}
                    max={12}
                    step={0.5}
                    className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="knee-pain" className="text-slate-200 flex items-center gap-2">
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
                    id="knee-pain"
                    value={kneePain}
                    onValueChange={handleKneePainChange}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="back-stiffness" className="text-slate-200 flex items-center gap-2">
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
                    id="back-stiffness"
                    value={backStiffness}
                    onValueChange={handleBackStiffnessChange}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
                  />
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
                    id="chat-input"
                    name="chatInput"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about workouts, nutrition..."
                    autoComplete="off"
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
          </>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-400" />
                  Profile Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Update your details for accurate TDEE calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Name</Label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Gender</Label>
                    <select
                      value={profile.gender}
                      onChange={(e) => handleProfileChange('gender', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Weight (kg)</Label>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Height (cm)</Label>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => handleProfileChange('height', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Age</Label>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Activity Level</Label>
                    <select
                      value={profile.activity_level}
                      onChange={(e) => handleProfileChange('activity_level', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    >
                      <option value="sedentary">Sedentary (little exercise)</option>
                      <option value="light">Light (1-3 days/week)</option>
                      <option value="moderate">Moderate (3-5 days/week)</option>
                      <option value="active">Active (6-7 days/week)</option>
                      <option value="very_active">Very Active (physical job)</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-200">Fitness Goal</Label>
                    <select
                      value={profile.goal}
                      onChange={(e) => handleProfileChange('goal', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                    >
                      <option value="lose_tummy">Lose Belly Fat (-500 cal)</option>
                      <option value="lose_weight">Lose Weight (-750 cal)</option>
                      <option value="buff_arms">Build Buff Arms (+200 cal, high protein)</option>
                      <option value="build_muscle">Build Muscle (+200 cal)</option>
                      <option value="bulk">Bulk Up (+300 cal)</option>
                      <option value="maintain">Maintain Weight</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={saveProfile}
                  disabled={isLoadingProfile}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  {isLoadingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* TDEE Results */}
            {tdeeData && (
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-400" />
                    Your TDEE Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400">Basal Metabolic Rate (BMR)</p>
                      <p className="text-2xl font-bold text-white">{tdeeData.bmr}</p>
                      <p className="text-xs text-slate-500">Calories burned at rest</p>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400">Total Daily Energy Expenditure</p>
                      <p className="text-2xl font-bold text-red-400">{tdeeData.tdee}</p>
                      <p className="text-xs text-slate-500">Calories to {getGoalLabel(tdeeData.profile.goal).toLowerCase()}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-3">Daily Macro Targets</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-slate-700 rounded">
                        <p className="text-lg font-bold text-white">{tdeeData.macros.protein}g</p>
                        <p className="text-xs text-slate-400">Protein</p>
                      </div>
                      <div className="p-2 bg-slate-700 rounded">
                        <p className="text-lg font-bold text-white">{tdeeData.macros.carbs}g</p>
                        <p className="text-xs text-slate-400">Carbs</p>
                      </div>
                      <div className="p-2 bg-slate-700 rounded">
                        <p className="text-lg font-bold text-white">{tdeeData.macros.fats}g</p>
                        <p className="text-xs text-slate-400">Fats</p>
                      </div>
                      <div className="p-2 bg-slate-700 rounded">
                        <p className="text-lg font-bold text-white">{tdeeData.tdee}</p>
                        <p className="text-xs text-slate-400">Calories</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-400 text-sm">
                      <Zap className="inline h-4 w-4 mr-1" />
                      {tdeeData.goal_adjustment}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* MEAL PLAN TAB */}
        {activeTab === 'meals' && (
          <>
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-orange-400" />
                      Dynamic Meal Plan
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      AI-generated daily meal plan based on your TDEE and goals
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchMealPlan}
                    disabled={isMealPlanLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isMealPlanLoading ? 'Generating...' : 'Generate New Plan'}
                  </Button>
                </div>
              </CardHeader>
              {mealPlan && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-800 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400">Calories</p>
                      <p className="text-lg font-bold text-white">{mealPlan.daily_totals?.calories || mealPlan.tdee}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Protein</p>
                      <p className="text-lg font-bold text-red-400">{mealPlan.daily_totals?.protein || mealPlan.target_macros?.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Carbs</p>
                      <p className="text-lg font-bold text-yellow-400">{mealPlan.daily_totals?.carbs || mealPlan.target_macros?.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Fats</p>
                      <p className="text-lg font-bold text-blue-400">{mealPlan.daily_totals?.fats || mealPlan.target_macros?.fats}g</p>
                    </div>
                  </div>

                  {mealPlan.meals?.map((meal, index) => (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-orange-400">{meal.time}</h3>
                        <Badge variant="secondary" className="bg-slate-700">{meal.calories} kcal</Badge>
                      </div>
                      <p className="text-white">{meal.food}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fats}g</span>
                      </div>
                      {meal.tips && <p className="text-xs text-slate-500 mt-2">💡 {meal.tips}</p>}
                    </div>
                  ))}

                  {mealPlan.nutritionist_notes && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-400 text-sm">{mealPlan.nutritionist_notes}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Quick Add Calories */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Quick Calorie Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Calories</Label>
                    <input
                      type="number"
                      id="quick-cal"
                      className="w-full px-2 py-1 text-sm rounded border border-slate-700 bg-slate-800 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Protein (g)</Label>
                    <input
                      type="number"
                      id="quick-pro"
                      className="w-full px-2 py-1 text-sm rounded border border-slate-700 bg-slate-800 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
