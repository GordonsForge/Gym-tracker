// Get DOM elements for interaction
const form = document.getElementById('workout-form'); // Form for logging workouts
const workoutList = document.getElementById('workout-list'); // Container for workout items
const clearButton = document.getElementById('clear-workouts'); // Button to clear workout list
const progressText = document.getElementById('progress-text'); // Progress display text
const goalForm = document.getElementById('goal-form'); // Goal form for fitness goal, level, body parts (Day 3)
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

// Handle goal form submission (Day 3)
goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = document.getElementById('goal').value;
    const level = document.getElementById('fitness-level').value;
    const bodyParts = Array.from(document.querySelectorAll('input[name="body-part"]:checked')).map(input => input.value);
    // Save goal, fitness level, and body parts to localStorage for AI suggestions
    localStorage.setItem('userGoal', JSON.stringify({ goal, level, bodyParts }));
    alert('Goal saved! Plus Ultra!');
    // Track goal submission in GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'goal_saved', {
            'event_category': 'Gym Tracker',
            'event_label': `${goal} (${level}, ${bodyParts.join(', ') || 'none'})`
        });
    }
});

// Handle Suggest Workout button (Day 3)
suggestButton.addEventListener('click', () => {
    const { goal, level, bodyParts } = JSON.parse(localStorage.getItem('userGoal') || '{}');
    let suggestion = 'No goal set. Smash through!';
    // Enhanced mock AI logic: Suggest 3 varied workouts based on goal, level, and body parts (Day 3)
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
        // Generate suggestion based on inputs
        if (bodyParts && bodyParts.length > 0) {
            // Select one body part randomly for variety (or first selected)
            const selectedPart = bodyParts[Math.floor(Math.random() * bodyParts.length)];
            suggestion = workouts[goal][level][selectedPart].join(', ');
        } else {
            // Fallback: General workout for goal and level
            suggestion = workouts[goal][level].general?.join(', ') || 'Log workouts for tailored suggestions!';
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