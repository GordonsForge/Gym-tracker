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
    "Go beyond, Plus Ultra! 🌟"
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

// Clean completedWorkouts and reset counters if needed
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

// Clean invalid or future timestamps and ensure unique entries
completedWorkouts = [...new Set(completedWorkouts.filter(t => {
    try {
        const date = new Date(t);
        return date <= now && date >= monthStart;
    } catch (e) {
        return false;
    }
}))];

// Reset Today if new day
if (!lastResetDay || new Date(lastResetDay) < today) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < today);
    lastResetDay = now.toISOString();
}

// Reset Week if new week (Sunday start)
if (!lastResetWeek || new Date(lastResetWeek) < weekStart) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < weekStart);
    lastResetWeek = now.toISOString();
}

// Save all data to localStorage
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

    streakText.textContent = `🔥 Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`;
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

    // Combine and deduplicate workouts by timestamp
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
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        data = Array(7).fill(0); // Initialize array with zeros
        filteredWorkouts.forEach(w => {
            const workoutDate = new Date(w.timestamp);
            const dayIndex = (workoutDate.getDay() + 6) % 7; // Shift Sunday (0) to index 6, Monday (1) to 0, etc.
            if (workoutDate >= weekStart && workoutDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
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

    // Ensure non-empty data to prevent chart failure
    if (!labels.length || !data.length || data.every(val => val === 0)) {
        labels = ['No Data'];
        data = [0];
    }

    return { labels, data };
}

// Update Chart.js chart
function updateChart() {
    if (!ctx) {
        console.error('Chart canvas context not found');
        return;
    }

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
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                },
                scales: chartType === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Workouts' }
                    },
                    x: {
                        title: { display: true, text: timeView.charAt(0).toUpperCase() + timeView.slice(1) }
                    }
                } : {},
                plugins: {
                    legend: {
                        display: chartType === 'pie'
                    }
                }
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
        checkbox.addEventListener('change', () => {
            workouts[index].completed = checkbox.checked;
            workoutItem.classList.toggle('completed', checkbox.checked);
            if (checkbox.checked) {
                if (!completedWorkouts.includes(workout.timestamp)) {
                    completedWorkouts.push(workout.timestamp);
                    updateStreak();
                }
            } else {
                completedWorkouts = completedWorkouts.filter(t => t !== workout.timestamp);
            }
            saveWorkouts();
            updateChart();
            updateProgress();
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

// Handle goal form submission
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = document.getElementById('goal').value;
    const level = document.getElementById('fitness-level').value;
    const bodyParts = Array.from(document.querySelectorAll('input[name="body-part"]:checked')).map(input => input.value);
    localStorage.setItem('userGoal', JSON.stringify({ goal, level, bodyParts }));
    alert('Goal saved! Plus Ultra!');
    if (typeof gtag !== 'undefined') {
        gtag('event', 'goal_saved', { 'event_category': 'Gym Tracker', 'event_label': `${goal} (${level}, ${bodyParts.join(', ') || 'none'})` });
    }
});

// Handle Suggest Workout button
suggestButton.addEventListener('click', () => {
    const { goal, level, bodyParts } = JSON.parse(localStorage.getItem('userGoal') || '{}');
    let suggestion = 'No goal set. Smash through!';
    if (goal && level) {
        const workouts = {
            'Build Muscle': {
                beginner: {
                    abs: ['3x10 crunches', '3x12 leg raises', '2x30s plank'],
                    chest: ['3x10 push-ups', '3x12 incline push-ups', '2x15 chest dips'],
                    back: ['3x8 bent-over rows (light)', '3x10 reverse flys', '2x12 supermans'],
                    legs: ['3x10 bodyweight squats', '3x12 lunges', '2x15 calf raises'],
                    arms: ['3x10 bicep curls (light)', '3x12 tricep dips', '2x15 hammer curls'],
                    shoulders: ['3x10 shoulder press (light)', '3x12 lateral raises', '2x15 front raises'],
                    glutes: ['3x10 glute bridges', '3x12 donkey kicks', '2x15 fire hydrants']
                },
                intermediate: {
                    abs: ['4x12 hanging leg raises', '3x15 bicycle crunches', '3x45s plank'],
                    chest: ['4x8 bench press (moderate)', '3x12 dumbbell flys', '3x10 push-ups'],
                    back: ['4x8 pull-ups', '3x10 bent-over rows', '3x12 deadlifts (moderate)'],
                    legs: ['4x8 squats (moderate)', '3x12 lunges', '3x10 step-ups'],
                    arms: ['4x8 bicep curls', '3x12 tricep pushdowns', '3x10 skull crushers'],
                    shoulders: ['4x8 overhead press', '3x12 lateral raises', '3x10 rear delt flys'],
                    glutes: ['4x8 hip thrusts', '3x12 glute kickbacks', '3x15 sumo squats']
                },
                advanced: {
                    abs: ['5x15 weighted crunches', '4x20 cable woodchoppers', '3x60s plank'],
                    chest: ['5x5 bench press (heavy)', '4x10 incline dumbbell press', '3x12 cable flys'],
                    back: ['5x5 deadlifts (heavy)', '4x8 weighted pull-ups', '3x12 barbell rows'],
                    legs: ['5x5 barbell squats (heavy)', '4x10 lunges (weighted)', '3x12 leg press'],
                    arms: ['5x5 barbell curls', '4x10 weighted dips', '3x12 concentration curls'],
                    shoulders: ['5x5 military press', '4x10 Arnold press', '3x12 upright rows'],
                    glutes: ['5x5 hip thrusts (heavy)', '4x10 single-leg glute bridges', '3x12 barbell sumo squats']
                }
            },
            'Build Endurance': {
                beginner: {
                    abs: ['3x15 bicycle crunches', '3x20 mountain climbers', '2x30s hollow hold'],
                    chest: ['3x15 push-ups', '3x20 chest dips', '2x30s isometric chest press'],
                    back: ['3x15 supermans', '3x20 bodyweight rows', '2x30s plank rows'],
                    legs: ['2km jog', '3x15 bodyweight squats', '3x20 walking lunges'],
                    arms: ['3x15 arm circles', '3x20 tricep dips', '2x30s shadow boxing'],
                    shoulders: ['3x15 shoulder taps', '3x20 front raises (light)', '2x30s lateral hold'],
                    glutes: ['3x15 glute bridges', '3x20 donkey kicks', '2x30s squat hold']
                },
                intermediate: {
                    abs: ['4x20 mountain climbers', '3x30 Russian twists', '3x45s plank'],
                    chest: ['4x12 push-ups', '3x15 incline push-ups', '3x20 burpees'],
                    back: ['4x12 bodyweight rows', '3x15 supermans', '3x20 plank rows'],
                    legs: ['5km run', '3x20 lunges', '3x15 jump squats'],
                    arms: ['4x12 bicep curls (light)', '3x15 tricep pushdowns', '3x20 shadow boxing'],
                    shoulders: ['4x12 lateral raises', '3x15 shoulder press (light)', '3x20 Y-raises'],
                    glutes: ['4x12 glute kickbacks', '3x15 sumo squats', '3x20 fire hydrants']
                },
                advanced: {
                    abs: ['5x25 mountain climbers', '4x30 weighted Russian twists', '3x60s plank with leg lift'],
                    chest: ['5x15 clapping push-ups', '4x20 incline dumbbell press', '3x25 burpees'],
                    back: ['5x10 pull-ups', '4x15 deadlifts (moderate)', '3x20 bent-over rows'],
                    legs: ['10km run', '4x20 jump lunges', '3x15 pistol squats'],
                    arms: ['5x15 weighted dips', '4x20 hammer curls', '3x25 shadow boxing'],
                    shoulders: ['5x10 overhead press', '4x15 rear delt flys', '3x20 lateral raises'],
                    glutes: ['5x10 hip thrusts (moderate)', '4x15 single-leg glute bridges', '3x20 sumo squats']
                }
            },
            'Build Strength': {
                beginner: {
                    abs: ['3x10 crunches', '3x12 leg raises', '2x30s plank'],
                    chest: ['3x10 push-ups', '3x12 incline push-ups', '2x15 chest dips'],
                    back: ['3x8 bodyweight rows', '3x10 supermans', '2x12 reverse flys'],
                    legs: ['3x10 bodyweight squats', '3x12 lunges', '2x15 calf raises'],
                    arms: ['3x10 bicep curls (light)', '3x12 tricep dips', '2x15 hammer curls'],
                    shoulders: ['3x10 shoulder press (light)', '3x12 lateral raises', '2x15 front raises'],
                    glutes: ['3x10 glute bridges', '3x12 donkey kicks', '2x15 fire hydrants']
                },
                intermediate: {
                    abs: ['4x12 hanging leg raises', '3x15 bicycle crunches', '3x45s plank'],
                    chest: ['4x8 bench press (moderate)', '3x12 dumbbell flys', '3x10 push-ups'],
                    back: ['4x8 pull-ups', '3x10 bent-over rows', '3x12 deadlifts (moderate)'],
                    legs: ['4x8 squats (moderate)', '3x12 lunges', '3x10 step-ups'],
                    arms: ['4x8 bicep curls', '3x12 tricep pushdowns', '3x10 skull crushers'],
                    shoulders: ['4x8 overhead press', '3x12 lateral raises', '3x10 rear delt flys'],
                    glutes: ['4x8 hip thrusts', '3x12 glute kickbacks', '3x15 sumo squats']
                },
                advanced: {
                    abs: ['5x15 weighted crunches', '4x20 cable woodchoppers', '3x60s plank'],
                    chest: ['5x5 bench press (heavy)', '4x10 incline dumbbell press', '3x12 cable flys'],
                    back: ['5x5 deadlifts (heavy)', '4x8 weighted pull-ups', '3x12 barbell rows'],
                    legs: ['5x5 barbell squats (heavy)', '4x10 lunges (weighted)', '3x12 leg press'],
                    arms: ['5x5 barbell curls', '4x10 weighted dips', '3x12 concentration curls'],
                    shoulders: ['5x5 military press', '4x10 Arnold press', '3x12 upright rows'],
                    glutes: ['5x5 hip thrusts (heavy)', '4x10 single-leg glute bridges', '3x12 barbell sumo squats']
                }
            }
        };
        if (bodyParts && bodyParts.length > 0) {
            const selectedPart = bodyParts[Math.floor(Math.random() * bodyParts.length)];
            suggestion = workouts[goal][level][selectedPart].join(', ');
        } else {
            suggestion = workouts[goal][level].general?.join(', ') || 'Log workouts for tailored suggestions!';
        }
    }
    suggestionOutput.textContent = suggestion;
    if (typeof gtag !== 'undefined') {
        gtag('event', 'workout_suggested', { 'event_category': 'Gym Tracker', 'event_label': suggestion });
    }
});

// Handle workout form submission
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
            gtag('event', 'workout_logged', {
                'event_category': 'Gym Tracker',
                'event_label': exercise,
                'value': 1,
                'distance': distance || 'none',
                'time': time ? `${time} ${timeUnit}` : 'none'
            });
        }
    }

    saveWorkouts();
    renderWorkouts();
    document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
    form.reset();
});

// Handle Clear Workouts button
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

// Handle chart type and time view changes
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

// Handle goal progress form submission
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

// Handle reset progress
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
        streakText.textContent = '🔥 Streak: 0 days';
        if (typeof gtag !== 'undefined') {
            gtag('event', 'progress_reset', { 'event_category': 'Gym Tracker', 'event_label': 'Reset Progress' });
        }
    }
});

// Handle export progress
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
        gtag('event', 'progress_exported', { 'event_category': 'Gym Tracker', 'event_label': `Exported ${timeView} view as CSV and image` });
    }
});

// Initialize UI elements
chartTypeSelect.value = chartType;
timeViewSelect.value = timeView;
filterTypeSelect.value = filterType;
if (workoutGoal.value) {
    document.getElementById('workout-goal').value = workoutGoal.value;
    document.getElementById('goal-period').value = workoutGoal.period;
}
streakText.textContent = `🔥 Streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`;

// Set random quote on page load
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// Initial render
renderWorkouts();