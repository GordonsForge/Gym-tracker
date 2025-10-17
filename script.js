// Select the form and workout list container from the HTML
const form = document.getElementById('workout-form');
const workoutList = document.getElementById('workout-list');

// Array of motivational quotes for the quote section
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
    "Every morning you rise is another chance to rewrite who you are."
];

// Add submit event listener to the form
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)

    // Get values from form inputs
    const exercise = document.getElementById('exercise').value;
    const sets = document.getElementById('sets').value;
    const reps = document.getElementById('reps').value;
    const weight = document.getElementById('weight').value;

    // Create a new div for the workout entry
    const workoutItem = document.createElement('div');
    workoutItem.classList.add('workout-item'); // Add CSS class for styling
    workoutItem.textContent = `${exercise}: ${sets} sets, ${reps} reps, ${weight}kg`; // Format the entry

    // Append the entry to the workout list
    workoutList.appendChild(workoutItem);

    // Reset the form after submission
    form.reset();
});

// Set a random quote on page load
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];