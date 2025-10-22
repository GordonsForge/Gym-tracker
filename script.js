// Get DOM elements for interaction
const form = document.getElementById('workout-form'); // Form for logging workouts
const workoutList = document.getElementById('workout-list'); // Container for workout items
const clearButton = document.getElementById('clear-workouts'); // Button to clear workout list
const progressText = document.getElementById('progress-text'); // Progress display text
const goalForm = document.getElementById('goal-form'); // Goal form for fitness goal and level (Day 2)
const suggestButton = document.getElementById('suggest-workout'); // Suggest Workout button (Day 2)
const suggestionOutput = document.getElementById('suggestion-output'); // Output for AI suggestions (Day 2)

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

// Load workouts and completed workout timestamps from localStorage
let workouts = JSON.parse(localStorage.getItem('workouts') || '[]'); // Current workout list
let completedWorkouts = JSON.parse(localStorage.getItem('completedWorkouts') || '[]'); // Cleared completed timestamps
let lastResetDay = localStorage.getItem('lastResetDay') || null; // Last day reset
let lastResetWeek = localStorage.getItem('lastResetWeek') || null; // Last week reset
let editingIndex = -1; // Track index of workout being edited

// Clean completedWorkouts and reset counters if needed
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

// Clean invalid or future timestamps and reset for new day/week/month
completedWorkouts = completedWorkouts.filter(t => {
    try {
        const date = new Date(t);
        return date <= now && date >= monthStart; // Keep only current month’s valid timestamps
    } catch (e) {
        return false; // Remove invalid timestamps
    }
});

// Reset Today if new day
if (!lastResetDay || new Date(lastResetDay) < today) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < today); // Remove today’s timestamps
    lastResetDay = now.toISOString();
}

// Reset Week if new week (Sunday start)
if (!lastResetWeek || new Date(lastResetWeek) < weekStart) {
    completedWorkouts = completedWorkouts.filter(t => new Date(t) < weekStart); // Remove week’s timestamps
    lastResetWeek = now.toISOString();
}

// Save cleaned data
localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
localStorage.setItem('lastResetDay', lastResetDay);
localStorage.setItem('lastResetWeek', lastResetWeek);

// Save workouts and metadata to localStorage
function saveWorkouts() {
    localStorage.setItem('workouts', JSON.stringify(workouts));
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
    localStorage.setItem('lastResetDay', lastResetDay);
    localStorage.setItem('lastResetWeek', lastResetWeek);
}

// Update progress counts for completed workouts only
function updateProgress() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count completed workouts in current list and cleared completed workouts
    const todayCount = workouts.filter(w => w.completed && new Date(w.timestamp) >= today).length +
                      completedWorkouts.filter(t => new Date(t) >= today).length;
    const weekCount = workouts.filter(w => w.completed && new Date(w.timestamp) >= weekStart).length +
                      completedWorkouts.filter(t => new Date(t) >= weekStart).length;
    const monthCount = workouts.filter(w => w.completed && new Date(w.timestamp) >= monthStart).length +
                       completedWorkouts.filter(t => new Date(t) >= monthStart).length;

    // Update progress display
    progressText.textContent = `Today: ${todayCount} | Week: ${weekCount} | Month: ${monthCount}`;

    // Track progress view in GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'progress_viewed', {
            'event_category': 'Gym Tracker',
            'event_label': 'Progress Update',
            'value': todayCount
        });
    }
}

// Render workouts to the DOM
function renderWorkouts() {
    workoutList.innerHTML = ''; // Clear current list
    workouts.forEach((workout, index) => {
        const workoutItem = document.createElement('div');
        workoutItem.classList.add('workout-item');
        if (workout.completed) workoutItem.classList.add('completed');

        // Checkbox for marking workout complete
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = workout.completed;
        checkbox.addEventListener('change', () => {
            workouts[index].completed = checkbox.checked;
            workoutItem.classList.toggle('completed', checkbox.checked);
            saveWorkouts();
            updateProgress();
            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_completed', {
                    'event_category': 'Gym Tracker',
                    'event_label': workout.text,
                    'value': checkbox.checked ? 1 : 0
                });
            }
        });

        // Display workout text
        const textSpan = document.createElement('span');
        textSpan.textContent = workout.text;

        // Edit button to pre-fill form
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.addEventListener('click', () => {
            const parts = workout.text.split(': ');
            const exercise = parts[0];
            const details = parts[1] ? parts[1].split(', ') : [];
            let sets = '', reps = '', weight = '', distance = '';
            details.forEach(detail => {
                if (detail.includes('set')) sets = detail.split(' ')[0];
                if (detail.includes('rep')) reps = detail.split(' ')[0];
                if (detail.includes('kg')) weight = detail.split(' ')[0];
                if (detail.includes('km')) distance = detail.split(' ')[0];
            });

            document.getElementById('exercise').value = exercise;
            document.getElementById('sets').value = sets;
            document.getElementById('reps').value = reps;
            document.getElementById('weight').value = weight;
            document.getElementById('distance').value = distance;
            editingIndex = index;

            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_edit_started', {
                    'event_category': 'Gym Tracker',
                    'event_label': workout.text
                });
            }
        });

        // Delete button to remove workout
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
            if (typeof gtag !== 'undefined') {
                gtag('event', 'workout_deleted', {
                    'event_category': 'Gym Tracker',
                    'event_label': workout.text
                });
            }
        });

        workoutItem.appendChild(checkbox);
        workoutItem.appendChild(textSpan);
        workoutItem.appendChild(editButton);
        workoutItem.appendChild(deleteButton);
        workoutList.appendChild(workoutItem);
    });
    updateProgress();
}

// Handle goal form submission (Day 2)
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = document.getElementById('goal').value;
    const level = document.getElementById('fitness-level').value;
    // Save goal and fitness level to localStorage for AI suggestions
    localStorage.setItem('userGoal', JSON.stringify({ goal, level }));
    alert('Goal saved! Plus Ultra!');
    // Track goal submission in GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'goal_saved', {
            'event_category': 'Gym Tracker',
            'event_label': `${goal} (${level})`
        });
    }
});

// Handle Suggest Workout button (Day 2)
suggestButton.addEventListener('click', () => {
    const { goal, level } = JSON.parse(localStorage.getItem('userGoal') || '{}');
    let suggestion = 'No goal set. Smash through!';
    // Mock AI logic: Suggest workouts based on goal and fitness level
    if (goal && level) {
        if (level === 'beginner' && goal.toLowerCase().includes('muscle')) {
            suggestion = '3x10 push-ups, 3x10 squats - Start strong!';
        } else if (level === 'intermediate' && goal.toLowerCase().includes('muscle')) {
            suggestion = '4x8 bench press, 3x12 bicep curls - Power up!';
        } else if (level === 'advanced' && goal.toLowerCase().includes('muscle')) {
            suggestion = '5x5 deadlifts, 4x10 pull-ups - Go Plus Ultra!';
        } else {
            suggestion = 'Log workouts for tailored suggestions!';
        }
    }
    // Display suggestion in output div
    suggestionOutput.textContent = suggestion;
    // Track suggestion request in GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'workout_suggested', {
            'event_category': 'Gym Tracker',
            'event_label': suggestion
        });
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

    let workoutText = exercise;
    const details = [];
    if (sets) details.push(`${sets} set${sets == 1 ? '' : 's'}`);
    if (reps) details.push(`${reps} rep${reps == 1 ? '' : 's'}`);
    if (weight) details.push(`${weight}kg`);
    if (distance) details.push(`${distance}km`);
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
        if (wasCompleted) {
            completedWorkouts.push(workouts[editingIndex].timestamp);
        }
        if (typeof gtag !== 'undefined') {
            gtag('event', 'workout_edited', {
                'event_category': 'Gym Tracker',
                'event_label': workoutText
            });
        }
        editingIndex = -1;
    } else {
        workouts.push({
            text: workoutText,
            completed: false,
            timestamp: new Date().toISOString()
        });
        if (typeof gtag !== 'undefined') {
            gtag('event', 'workout_logged', {
                'event_category': 'Gym Tracker',
                'event_label': exercise,
                'value': 1,
                'distance': distance || 'none'
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
    // Move completed workouts' timestamps to completedWorkouts
    workouts.forEach(workout => {
        if (workout.completed) {
            completedWorkouts.push(workout.timestamp);
        }
    });
    workouts = []; // Clear current workout list
    saveWorkouts(); // Save both arrays
    renderWorkouts(); // Re-render list (progress persists)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'workouts_cleared', {
            'event_category': 'Gym Tracker',
            'event_label': 'Clear Button'
        });
    }
});

// Set random quote on page load
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// Initial render
renderWorkouts();