// API configuration - uses environment variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  dailyLog: `${API_BASE_URL}/api/daily-log`,
  chat: `${API_BASE_URL}/api/chat`,
  logMeal: `${API_BASE_URL}/api/log-meal`,
  tdee: `${API_BASE_URL}/api/tdee`,
  profile: `${API_BASE_URL}/api/profile`,
  mealPlan: `${API_BASE_URL}/api/meal-plan`,
  progressReport: `${API_BASE_URL}/api/progress-report`,
  nutritionAdvice: `${API_BASE_URL}/api/nutrition-advice`,
};

export default API_BASE_URL;