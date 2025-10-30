// === NEW: LOGIN + MONGO + INSIGHTS ===
let token = localStorage.getItem('token') || null;
let userId = localStorage.getItem('userId') || null;
let userGoal = null;
const INSIGHTS_THRESHOLD = 3; // ← Change to 1, 5, 7, etc.

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');

async function login(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const res = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    token = data.token;
    userId = data.user._id;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    showApp();
    await loadGoalFromDB();
    await loadWorkoutsFromDB();
    renderWorkouts();
  } else {
    alert(data.message);
  }
}

async function register(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const res = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Registered! Now login.');
  } else {
    alert(data.message);
  }
}

function logout() {
  token = null;
  userId = null;
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  showAuth();
}

function showAuth() {
  authSection.style.display = 'block';
  appSection.style.display = 'none';
}
function showApp() {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
}

async function saveGoalToDB() {
  const goal = document.getElementById('goal').value;
  const level = document.getElementById('fitness-level').value;
  const bodyPart = document.getElementById('body-part').value;
  const height = parseFloat(document.getElementById('height').value);
  const heightUnit = document.getElementById('height-unit').value;
  const weight = parseFloat(document.getElementById('weight').value);
  const weightUnit = document.getElementById('weight-unit').value;
  const bmi = parseFloat(bmiOutput.value) || 0;
  const noEquipment = document.getElementById('no-equipment').checked;

  userGoal = { goal, level, bodyPart, height, heightUnit, weight, weightUnit, bmi, noEquipment };

  await fetch('https://fitness-tracker-backend-omega.vercel.app/api/goal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userGoal)
  });
}

async function loadGoalFromDB() {
  if (!token) return;
  const res = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/goal', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.goal) {
    userGoal = data;
    document.getElementById('goal').value = data.goal;
    document.getElementById('fitness-level').value = data.level;
    document.getElementById('body-part').value = data.bodyPart;
    document.getElementById('height').value = data.height;
    document.getElementById('height-unit').value = data.heightUnit || 'cm';
    document.getElementById('weight').value = data.weight;
    document.getElementById('weight-unit').value = data.weightUnit || 'kg';
    document.getElementById('no-equipment').checked = data.noEquipment || false;
    calculateBMI();
  }
}

async function loadWorkoutsFromDB() {
  if (!token) return;
  const res = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/workouts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dbWorkouts = await res.json();
  workouts = dbWorkouts.map(w => ({ ...w, completed: true }));
  completedWorkouts = workouts.map(w => w.timestamp);
  saveWorkouts();
  checkForInsights();
}

async function saveWorkoutToDB(text) {
  await fetch('https://fitness-tracker-backend-omega.vercel.app/api/workout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
}

async function checkForInsights() {
  if (!token || !userGoal) return;
  const completedCount = workouts.filter(w => w.completed).length;
  if (completedCount >= INSIGHTS_THRESHOLD) {
    const res = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/insights', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.insights) {
      suggestionOutput.textContent = data.insights;
      suggestionOutput.style.color = '#27ae60';
      suggestionOutput.style.fontWeight = 'bold';
    }
  }
}
// === END NEW ===

// Get DOM elements for interaction
const form = document.getElementById('workout-form');
const workoutList = document.getElementById('workout-list');
const clearButton = document.getElementById('clear-workouts');
const progressText = document.getElementById('progress-text');
const goalForm = document.getElementById('goal-form');
const suggestButton = document.getElementById('suggest-workout');
const suggestionOutput = document.getElementById('suggestion-output');
const ctx = document.getElementById('progressChart')?.getContext('2d');
const chartTypeSelect = document.getElementById('chart-type');
const timeViewSelect = document.getElementById('time-view');
const filterTypeSelect = document.getElementById('filter-type');
const goalProgressForm = document.getElementById('goal-progress-form');
const streakText = document.getElementById('streak-text');
const resetProgressButton = document.getElementById('reset-progress');
const exportProgressButton = document.getElementById('export-progress');
const heightInput = document.getElementById('height');
const heightUnitSelect = document.getElementById('height-unit');
const weightInput = document.getElementById('weight');
const weightUnitSelect = document.getElementById('weight-unit');
const bmiOutput = document.getElementById('bmi');
const bmiCategory = document.getElementById('bmi-category');

// Array of MHA-inspired motivational quotes
const quotes = [
    "The only bad workout is the one you didn’t do.",
    "Push harder than yesterday if you want a different tomorrow.",
    "Your body can do anything; it’s your mind you need to convince.",
    "You don’t rise from comfort. You rise from pressure that refuses to let you breathe until you change.",
    "In the Forge, pain isn’t punishment — it’s proof that you’re still alive and still capable of more.",
    "The world doesn’t care how tired you are. But the mirror will.",
    "Every rep is a question. Every drop of sweat is the answer.",
    "Be your own competition. You’ve already lost enough time trying to outshine others.",
    "When the mind breaks, the body follows. Forge both.",
    "You don’t chase strength; you build it one refusal to quit at a time.",
    "Pressure shapes metal. Resistance shapes men.",
    "You can’t beg for discipline, you either build it or stay broken.",
    "The pain that humbles you today will be the silence that makes others respect you tomorrow.",
    "Stop waiting for motivation. It’s a guest that never comes. Build a home for consistency instead.",
    "Every time you feel weak, remember: fire doesn’t fear being burned.",
    "The Forge doesn’t create the strong, it reveals them.",
    "You won’t always feel like it. But feelings don’t lift weights, discipline does.",
    "You are both the blacksmith and the blade. The hammer is life — swing it.",
    "There’s beauty in destruction when you’re tearing down your limits.",
    "Even steel trembles before it’s hardened.",
    "Don’t pray for lighter burdens. Pray for a stronger back.",
    "You can’t fake the fire in your eyes. The Forge knows.",
    "Every morning you rise is another chance to rewrite who you are.",
    "Go beyond, Plus Ultra!"
];

// Load data from localStorage
let workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
let completedWorkouts = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
let workoutsLog = JSON.parse(localStorage.getItem('workoutsLog') || '[]');
let lastResetDay = localStorage.getItem('lastResetDay') || null;
let lastResetWeek = localStorage.getItem('lastResetWeek') || null;
let chartType = localStorage.getItem('chartType') || 'bar';
let timeView = localStorage.getItem('timeView') || 'weekly';
let filterType = localStorage.getItem('filterType') || 'all';
let workoutGoal = JSON.parse(localStorage.getItem('workoutGoal')) || { value: null, period: 'weekly' };
let lastWorkoutDate = localStorage.getItem('lastWorkoutDate') || null;
let currentStreak = parseInt(localStorage.getItem('currentStreak')) || 0;
let editingIndex = -1;
let chartInstance = null;

// === NEW: Override saveWorkouts to sync with DB ===
const originalSaveWorkouts = saveWorkouts;
function saveWorkouts() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
  localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  localStorage.setItem('lastResetDay', lastResetDay);
  localStorage.setItem('lastResetWeek', lastResetWeek);
  localStorage.setItem('workoutsLog', JSON.stringify(workoutsLog));
  localStorage.setItem('chartType', chartType);
  localStorage.setItem('timeView', timeView);
  localStorage.setItem('filterType', filterType);
  localStorage.setItem('workoutGoal', JSON.stringify(workoutGoal));
  localStorage.setItem('lastWorkoutDate', lastWorkoutDate);
  localStorage.setItem('currentStreak', currentStreak);
  if (token) {
    workouts.filter(w => w.completed && !completedWorkouts.includes(w.timestamp))
      .forEach(w => saveWorkoutToDB(w.text));
  }
}
// === END NEW ===

// Calculate BMI and update display
function calculateBMI() {
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const heightUnit = heightUnitSelect.value;
    const weightUnit = weightUnitSelect.value;

    if (!height || !weight || height <= 0 || weight <= 0) {
        bmiOutput.value = '';
        bmiCategory.textContent = '';
        return;
    }

    let bmi;
    if (heightUnit === 'cm' && weightUnit === 'kg') {
        const heightMeters = height / 100;
        bmi = weight / (heightMeters * heightMeters);
    } else if (heightUnit === 'inches' && weightUnit === 'lbs') {
        bmi = 703 * weight / (height * height);
    } else {
        bmiOutput.value = '';
        bmiCategory.textContent = 'Please use consistent units (cm/kg or inches/lbs)';
        return;
    }

    bmi = bmi.toFixed(1);
    bmiOutput.value = bmi;
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 18.5 && bmi <= 24.9) category = 'Normal';
    else if (bmi >= 25 && bmi <= 29.9) category = 'Overweight';
    else category = 'Obese';
    bmiCategory.textContent = `Category: ${category}`;
}

// Clean completedWorkouts and reset counters if needed
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

completedWorkouts = [...new Set(completedWorkouts.filter(t => {
    try {
        const date = new Date(t);
        return date <= now && date >= monthStart;
    } catch (e) {
        return false;
    }
}))];

if (!lastResetDay || new Date(lastResetDay) < today) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < today);
    lastResetDay = now.toISOString();
}

if (!lastResetWeek || new Date(lastResetWeek) < weekStart) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < weekStart);
    lastResetWeek = now.toISOString();
}

// Categorize workouts for filtering
function categorizeWorkout(workoutText) {
    const lowerText = workoutText.toLowerCase();
    if (lowerText.includes('crunch') || lowerText.includes('plank') || lowerText.includes('leg raise')) return 'abs';
    if (lowerText.includes('push-up') || lowerText.includes('bench') || lowerText.includes('chest')) return 'chest';
    if (lowerText.includes('pull-up') || lowerText.includes('row') || lowerText.includes('deadlift')) return 'back';
    if (lowerText.includes('squat') || lowerText.includes('lunge') || lowerText.includes('leg press')) return 'legs';
    if (lowerText.includes('curl') || lowerText.includes('dip') || lowerText.includes('tricep')) return 'arms';
    if (lowerText.includes('press') || lowerText.includes('raise') || lowerText.includes('shoulder')) return 'shoulders';
    if (lowerText.includes('glute') || lowerText.includes('hip thrust') || lowerText.includes('kickback')) return 'glutes';
    if (lowerText.includes('run') || lowerText.includes('jog') || lowerText.includes('burpee')) return 'cardio';
    return 'other';
}

// Update streak based on completed workout
function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

    if (!lastWorkoutDate) {
        currentStreak = 1;
        lastWorkoutDate = today;
    } else if (lastWorkoutDate === today) {
        return;
    } else if (lastWorkoutDate === yesterday) {
        currentStreak += 1;
        lastWorkoutDate = today;
    } else {
        currentStreak = 1;
        lastWorkoutDate = today;
    }

    streakText.textContent = `Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`;
    saveWorkouts();
    if (typeof gtag !== 'undefined') {
        gtag('event', 'streak_updated', { 'event_category': 'Gym Tracker', 'event_label': `Streak: ${currentStreak}` });
    }
}

// Update goal progress display
function updateGoalProgress() {
    if (!workoutGoal.value) {
        document.getElementById('goal-progress-text').textContent = 'Goal: Not set';
        document.getElementById('goal-progress-fill').style.width = '0%';
        return;
    }

    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = workoutGoal.period === 'weekly' ? weekStart : monthStart;
    const uniqueTimestamps = [...new Set([
        ...workouts.filter(w => w.completed && new Date(w.timestamp) >= startDate).map(w => w.timestamp),
        ...completedWorkouts.filter(t => new Date(t) >= startDate)
    ])];
    const completedCount = uniqueTimestamps.length;
    const progressPercent = Math.min((completedCount / workoutGoal.value) * 100, 100);

    document.getElementById('goal-progress-text').textContent = `Goal: ${completedCount}/${workoutGoal.value} (${workoutGoal.period})`;
    const progressFill = document.getElementById('goal-progress-fill');
    progressFill.style.width = `${progressPercent}%`;
    progressFill.classList.toggle('completed', completedCount >= workoutGoal.value);

    if (typeof gtag !== 'undefined' && completedCount >= workoutGoal.value) {
        gtag('event', 'goal_achieved', { 'event_category': 'Gym Tracker', 'event_label': `${workoutGoal.value} workouts (${workoutGoal.period})` });
    }
}

// Update progress counts for completed workouts only
function updateProgress() {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTimestamps = [...new Set([
        ...workouts.filter(w => w.completed && new Date(w.timestamp) >= today).map(w => w.timestamp),
        ...completedWorkouts.filter(t => new Date(t) >= today)
    ])];
    const weekTimestamps = [...new Set([
        ...workouts.filter(w => w.completed && new Date(w.timestamp) >= weekStart).map(w => w.timestamp),
        ...completedWorkouts.filter(t => new Date(t) >= weekStart)
    ])];
    const monthTimestamps = [...new Set([
        ...workouts.filter(w => w.completed && new Date(w.timestamp) >= monthStart).map(w => w.timestamp),
        ...completedWorkouts.filter(t => new Date(t) >= monthStart)
    ])];

    const todayCount = todayTimestamps.length;
    const weekCount = weekTimestamps.length;
    const monthCount = monthTimestamps.length;

    progressText.textContent = `Today: ${todayCount} | Week: ${weekCount} | Month: ${monthCount}`;

    if (typeof gtag !== 'undefined') {
        gtag('event', 'progress_viewed', { 'event_category': 'Gym Tracker', 'event_label': 'Progress Update', 'value': todayCount });
    }
}

// Prepare chart data based on time view and filter
function getChartData() {
    const now = new Date();
    let labels = [];
    let data = [];

    const uniqueTimestamps = new Set([
        ...workouts.filter(w => w.completed && (filterType === 'all' || categorizeWorkout(w.text) === filterType)).map(w => w.timestamp),
        ...completedWorkouts
    ]);
    const filteredWorkouts = [...uniqueTimestamps].map(t => {
        const workout = workouts.find(w => w.timestamp === t) || { text: 'Workout', completed: true, timestamp: t };
        return { ...workout, text: workout.text || 'Workout' };
    }).filter(w => w.completed && (filterType === 'all' || categorizeWorkout(w.text) === filterType));

    if (timeView === 'weekly') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        data = Array(7).fill(0);
        filteredWorkouts.forEach(w => {
            const workoutDate = new Date(w.timestamp);
            if (workoutDate >= weekStart && workoutDate < weekEnd) {
                const dayIndex = (workoutDate.getDay() + 6) % 7;
                data[dayIndex]++;
            }
        });
    } else if (timeView === 'monthly') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
        data = labels.map((_, i) => {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), i + 1);
            const dayEnd = new Date(now.getFullYear(), now.getMonth(), i + 2);
            return filteredWorkouts.filter(w => {
                const workoutDate = new Date(w.timestamp);
                return workoutDate >= dayStart && workoutDate < dayEnd;
            }).length;
        });
    } else if (timeView === 'yearly') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data = labels.map((_, i) => {
            const monthStart = new Date(now.getFullYear(), i, 1);
            const monthEnd = new Date(now.getFullYear(), i + 1, 0);
            return filteredWorkouts.filter(w => {
                const workoutDate = new Date(w.timestamp);
                return workoutDate >= monthStart && workoutDate <= monthEnd;
            }).length;
        });
    }

    if (!labels.length || !data.length || data.every(val => val === 0)) {
        labels = ['No Data'];
        data = [0];
    }

    return { labels, data };
}

// Update Chart.js chart
function updateChart() {
    if (!ctx) return;
    try {
        const { labels, data } = getChartData();
        if (chartInstance) chartInstance.destroy();

        const config = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: `Workouts Completed (${filterType === 'all' ? 'All' : filterType})`,
                    data: data,
                    backgroundColor: chartType === 'pie' ? [
                        '#ff6f61', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#e91e63', '#00bcd4', '#cddc39', '#ffeb3b'
                    ] : '#ff6f61',
                    borderColor: chartType === 'pie' ? '#fff' : '#e55a50',
                    borderWidth: 1
                }]
            },
            options: {
                animation: { duration: 1000, easing: 'easeInOutQuad' },
                scales: chartType === 'bar' ? {
                    y: { beginAtZero: true, title: { display: true, text: 'Number of Workouts' } },
                    x: { title: { display: true, text: timeView.charAt(0).toUpperCase() + timeView.slice(1) } }
                } : {},
                plugins: { legend: { display: chartType === 'pie' } }
            }
        };

        chartInstance = new Chart(ctx, config);
        updateGoalProgress();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Render workouts to the DOM
function renderWorkouts() {
    workoutList.innerHTML = '';
    workouts.forEach((workout, index) => {
        const workoutItem = document.createElement('div');
        workoutItem.classList.add('workout-item');
        if (workout.completed) workoutItem.classList.add('completed');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = workout.completed;
        checkbox.addEventListener('change', async () => {
            workouts[index].completed = checkbox.checked;
            workoutItem.classList.toggle('completed', checkbox.checked);
            if (checkbox.checked) {
                if (!completedWorkouts.includes(workout.timestamp)) {
                    completedWorkouts.push(workout.timestamp);
                    updateStreak();
                    if (token) await saveWorkoutToDB(workout.text);
                }
            } else {
                completedWorkouts = completedWorkouts.filter(t => t !== workout.timestamp);
            }
            saveWorkouts();
            updateChart();
            updateProgress();
            checkForInsights();
            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_completed', { 'event_category': 'Gym Tracker', 'event_label': workout.text, 'value': checkbox.checked ? 1 : 0 });
            }
        });

        const textSpan = document.createElement('span');
        textSpan.textContent = workout.text;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.addEventListener('click', () => {
            if (workouts[index].completed) {
                completedWorkouts = completedWorkouts.filter(t => t !== workouts[index].timestamp);
            }
            const parts = workout.text.split(': ');
            const exercise = parts[0];
            const details = parts[1] ? parts[1].split(', ') : [];
            let sets = '', reps = '', weight = '', distance = '', time = '', timeUnit = 'seconds';
            details.forEach(detail => {
                if (detail.includes('set')) sets = detail.split(' ')[0];
                if (detail.includes('rep')) reps = detail.split(' ')[0];
                if (detail.includes('kg')) weight = detail.split(' ')[0];
                if (detail.includes('km')) distance = detail.split(' ')[0];
                if (detail.includes('second') || detail.includes('minute')) {
                    time = detail.split(' ')[0];
                    timeUnit = detail.includes('second') ? 'seconds' : 'minutes';
                }
            });

            document.getElementById('exercise').value = exercise;
            document.getElementById('sets').value = sets;
            document.getElementById('reps').value = reps;
            document.getElementById('weight').value = weight;
            document.getElementById('distance').value = distance;
            document.getElementById('time').value = time;
            document.getElementById('time-unit').value = timeUnit;
            editingIndex = index;

            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_edit_started', { 'event_category': 'Gym Tracker', 'event_label': workout.text });
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', () => {
            if (workouts[index].completed) {
                completedWorkouts = completedWorkouts.filter(t => t !== workouts[index].timestamp);
            }
            workouts.splice(index, 1);
            saveWorkouts();
            renderWorkouts();
            updateChart();
            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_deleted', { 'event_category': 'Gym Tracker', 'event_label': workout.text });
            }
        });

        workoutItem.appendChild(checkbox);
        workoutItem.appendChild(textSpan);
        workoutItem.appendChild(editButton);
        workoutItem.appendChild(deleteButton);
        workoutList.appendChild(workoutItem);
    });
    updateProgress();
    updateChart();
    updateGoalProgress();
}

// === MODIFIED: Goal Form Submit → Save to DB ===
goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const goal = document.getElementById('goal').value;
    const level = document.getElementById('fitness-level').value;
    const bodyPart = document.getElementById('body-part').value;
    const height = parseFloat(document.getElementById('height').value);
    const heightUnit = document.getElementById('height-unit').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const weightUnit = document.getElementById('weight-unit').value;

    if (!goal || !level || !bodyPart) {
        alert('Please select a goal, fitness level, and body part.');
        return;
    }
    if (height <= 0 || weight <= 0) {
        alert('Height and weight must be positive numbers.');
        return;
    }
    if ((heightUnit === 'cm' && weightUnit !== 'kg') || (heightUnit === 'inches' && weightUnit !== 'lbs')) {
        alert('Please use consistent units (cm/kg or inches/lbs).');
        return;
    }

    const bmi = parseFloat(bmiOutput.value) || 0;
    localStorage.setItem('userGoal', JSON.stringify({ goal, level, bodyPart, height, heightUnit, weight, weightUnit, bmi }));
    if (token) await saveGoalToDB();
    alert('Goal saved! Plus Ultra!');
    if (typeof gtag !== 'undefined') {
        gtag('event', 'goal_saved', { 'event_category': 'Gym Tracker', 'event_label': `${goal} (${level}, ${bodyPart}, BMI: ${bmi})` });
    }
});

// === MODIFIED: Suggest Button → Use DB Goal ===
suggestButton.addEventListener('click', async () => {
    const goal = userGoal?.goal || document.getElementById('goal').value;
    const level = userGoal?.level || document.getElementById('fitness-level').value;
    const bodyPart = userGoal?.bodyPart || document.getElementById('body-part').value;
    const bmi = parseFloat(bmiOutput.value) || 0;
    const noEquipment = document.getElementById('no-equipment')?.checked || false;

    if (!goal || !level || !bodyPart) {
        suggestionOutput.textContent = 'Please select a goal, fitness level, and body part first.';
        return;
    }

    try {
        const response = await fetch('https://fitness-tracker-backend-omega.vercel.app/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, fitnessLevel: level, bodyPart, bmi, noEquipment })
        });

        const data = await response.json();

        if (response.ok) {
            suggestionOutput.textContent = data.suggestions.join(', ');
        } else {
            suggestionOutput.textContent = `Error: ${data.message || 'Try again'}`;
        }
    } catch (err) {
        console.error('API Error:', err);
        suggestionOutput.textContent = 'Failed to connect to backend. Please try again later.';
    }

    if (typeof gtag !== 'undefined') {
        gtag('event', 'workout_suggested', { 'event_category': 'Gym Tracker', 'event_label': `${goal} (${level}, ${bodyPart}, BMI: ${bmi})` });
    }
});

// === ORIGINAL FORM SUBMIT (UNTOUCHED) ===
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const exercise = document.getElementById('exercise').value;
    const sets = document.getElementById('sets').value;
    const reps = document.getElementById('reps').value;
    const weight = document.getElementById('weight').value;
    const distance = document.getElementById('distance').value;
    const time = document.getElementById('time').value;
    const timeUnit = document.getElementById('time-unit').value;

    let workoutText = exercise;
    const details = [];
    if (sets) details.push(`${sets} set${sets == 1 ? '' : 's'}`);
    if (reps) details.push(`${reps} rep${reps == 1 ? '' : 's'}`);
    if (weight) details.push(`${weight}kg`);
    if (distance) details.push(`${distance}km`);
    if (time) details.push(`${time} ${timeUnit}`);
    if (details.length > 0) workoutText += `: ${details.join(', ')}`;

    if (editingIndex >= 0) {
        const wasCompleted = workouts[editingIndex].completed;
        if (wasCompleted) {
            completedWorkouts = completedWorkouts.filter(t => t !== workouts[editingIndex].timestamp);
        }
        workouts[editingIndex] = {
            text: workoutText,
            completed: wasCompleted,
            timestamp: workouts[editingIndex].timestamp
        };
        if (wasCompleted && !completedWorkouts.includes(workouts[editingIndex].timestamp)) {
            completedWorkouts.push(workouts[editingIndex].timestamp);
            updateStreak();
        }
        editingIndex = -1;
        if (typeof gtag !== 'undefined') {
            gtag('event', 'workout_edited', { 'event_category': 'Gym Tracker', 'event_label': workoutText });
        }
    } else {
        const timestamp = new Date().toISOString();
        workouts.push({
            text: workoutText,
            completed: false,
            timestamp: timestamp
        });
        if (typeof gtag !== 'undefined') {
            gtag('event', 'workout_logged', { 'event_category': 'Gym Tracker', 'event_label': exercise, 'value': 1 });
        }
    }

    saveWorkouts();
    renderWorkouts();
    document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
    form.reset();
});

// === REST OF YOUR ORIGINAL CODE (UNCHANGED) ===
clearButton.addEventListener('click', () => {
    workouts.forEach(workout => {
        if (workout.completed && !completedWorkouts.includes(workout.timestamp)) {
            completedWorkouts.push(workout.timestamp);
        }
    });
    workouts = [];
    saveWorkouts();
    renderWorkouts();
    if (typeof gtag !== 'undefined') {
        gtag('event', 'workouts_cleared', { 'event_category': 'Gym Tracker', 'event_label': 'Clear Button' });
    }
});

chartTypeSelect.addEventListener('change', (e) => {
    chartType = e.target.value;
    saveWorkouts();
    updateChart();
});

timeViewSelect.addEventListener('change', (e) => {
    timeView = e.target.value;
    saveWorkouts();
    updateChart();
});

filterTypeSelect.addEventListener('change', (e) => {
    filterType = e.target.value;
    saveWorkouts();
    updateChart();
});

goalProgressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    workoutGoal.value = parseInt(document.getElementById('workout-goal').value);
    workoutGoal.period = document.getElementById('goal-period').value;
    saveWorkouts();
    updateGoalProgress();
    updateChart();
    if (typeof gtag !== 'undefined') {
        gtag('event', 'workout_goal_set', { 'event_category': 'Gym Tracker', 'event_label': `${workoutGoal.value} workouts (${workoutGoal.period})` });
    }
});

resetProgressButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all progress data?')) {
        workouts = [];
        completedWorkouts = [];
        workoutsLog = [];
        lastResetDay = null;
        lastResetWeek = null;
        lastWorkoutDate = null;
        currentStreak = 0;
        workoutGoal = { value: null, period: 'weekly' };
        saveWorkouts();
        renderWorkouts();
        updateChart();
        updateGoalProgress();
        streakText.textContent = 'Streak: 0 days';
        if (typeof gtag !== 'undefined') {
            gtag('event', 'progress_reset', { 'event_category': 'Gym Tracker', 'event_label': 'Reset Progress' });
        }
    }
});

exportProgressButton.addEventListener('click', () => {
    const { labels, data } = getChartData();
    const csvContent = `data:text/csv;charset=utf-8,${timeView.charAt(0).toUpperCase() + timeView.slice(1)},Workouts\n` +
        labels.map((label, i) => `${label},${data[i]}`).join('\n');
    const csvLink = document.createElement('a');
    csvLink.setAttribute('href', encodeURI(csvContent));
    csvLink.setAttribute('download', `workout_progress_${timeView}.csv`);
    csvLink.click();

    if (chartInstance) {
        const imageLink = document.createElement('a');
        imageLink.setAttribute('href', chartInstance.toBase64Image());
        imageLink.setAttribute('download', `workout_progress_${timeView}.png`);
        imageLink.click();
    }

    if (typeof gtag !== 'undefined') {
        gtag('event', 'progress_exported', { 'event_category': 'Gym Tracker', 'event_label': `Exported ${timeView} view` });
    }
});

// === NEW: Auth Event Listeners ===
loginForm?.addEventListener('submit', login);
registerForm?.addEventListener('submit', register);
logoutBtn?.addEventListener('click', logout);
// === END NEW ===

// Initialize UI
chartTypeSelect.value = chartType;
timeViewSelect.value = timeView;
filterTypeSelect.value = filterType;
if (workoutGoal.value) {
    document.getElementById('workout-goal').value = workoutGoal.value;
    document.getElementById('goal-period').value = workoutGoal.period;
}
streakText.textContent = `Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`;

// Random quote
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// Reset form
document.getElementById('goal').value = '';
document.getElementById('fitness-level').value = '';
document.getElementById('body-part').value = '';
document.getElementById('height').value = '';
document.getElementById('height-unit').value = 'cm';
document.getElementById('weight').value = '';
document.getElementById('weight-unit').value = 'kg';
bmiOutput.value = '';
bmiCategory.textContent = '';

// === NEW: On Load — Check Login + Load DB ===
if (token) {
  showApp();
  loadGoalFromDB().then(() => {
    loadWorkoutsFromDB().then(() => {
      renderWorkouts();
      checkForInsights();
    });
  });
} else {
  showAuth();
}
// === END NEW ===

// Initial render
renderWorkouts();