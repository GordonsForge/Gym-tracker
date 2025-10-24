/**
 * @jest-environment jsdom
 */
jest.setTimeout(10000); // Prevent timeouts

describe('Forge Flow Tests', () => {
  let localStorageMock;

  beforeEach(async () => {
    // Mock document and DOM elements
    document.body.innerHTML = `
      <form id="goal-form">
        <select id="goal" required>
          <option value="" disabled selected>Select a goal</option>
          <option value="Build Muscle">Build Muscle</option>
          <option value="Build Endurance">Build Endurance</option>
          <option value="Build Strength">Build Strength</option>
        </select>
        <select id="fitness-level" required>
          <option value="" disabled selected>Select a level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <fieldset>
          <legend>Focus Areas (optional):</legend>
          <label><input type="checkbox" name="body-part" value="abs"> Abs</label>
          <label><input type="checkbox" name="body-part" value="chest"> Chest</label>
          <label><input type="checkbox" name="body-part" value="back"> Back</label>
          <label><input type="checkbox" name="body-part" value="legs"> Legs</label>
          <label><input type="checkbox" name="body-part" value="arms"> Arms</label>
          <label><input type="checkbox" name="body-part" value="shoulders"> Shoulders</label>
          <label><input type="checkbox" name="body-part" value="glutes"> Glutes</label>
        </fieldset>
        <button type="submit">Save Goal</button>
      </form>
      <button id="suggest-workout">Suggest Workout</button>
      <div id="suggestion-output"></div>
      <form id="workout-form"></form>
      <div id="workout-list"></div>
      <button id="clear-workouts"></button>
      <p id="progress-text"></p>
      <p id="quote"></p>
    `;

    // Mock localStorage
    localStorageMock = {
      store: {},
      getItem: jest.fn((key) => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => (localStorageMock.store[key] = value)),
      clear: jest.fn(() => (localStorageMock.store = {})),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock gtag
    window.gtag = jest.fn();

    // Mock Math.random
    jest.spyOn(Math, 'random').mockReturnValue(0);

    // Mock alert to prevent errors
    window.alert = jest.fn();

    // Load script.js
    require('../script.js');

    // Wait for DOM and script
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
    jest.clearAllMocks();
  });

  test('Goal form exists and has required elements', () => {
    expect(document.getElementById('goal-form')).toBeTruthy();
    expect(document.getElementById('goal')).toBeTruthy();
    expect(document.getElementById('fitness-level')).toBeTruthy();
    expect(document.querySelectorAll('input[name="body-part"]')).toHaveLength(7);
    expect(document.querySelector('#goal-form button[type="submit"]')).toBeTruthy();
  });

  test('Goal form submission saves to localStorage', () => {
    const goalSelect = document.getElementById('goal');
    const levelSelect = document.getElementById('fitness-level');
    const absCheckbox = document.querySelector('input[value="abs"]');
    const form = document.getElementById('goal-form');

    goalSelect.value = 'Build Muscle';
    levelSelect.value = 'beginner';
    absCheckbox.checked = true;

    form.dispatchEvent(new Event('submit'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'userGoal',
      JSON.stringify({ goal: 'Build Muscle', level: 'beginner', bodyParts: ['abs'] })
    );
    expect(window.gtag).toHaveBeenCalledWith('event', 'goal_saved', {
      event_category: 'Gym Tracker',
      event_label: 'Build Muscle (beginner, abs)',
    });
  });

  test('Suggest Workout button exists and is clickable', () => {
    const button = document.getElementById('suggest-workout');
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
  });

  test('Mock AI suggests workouts for Beginner + Build Muscle + abs', () => {
    localStorageMock.store['userGoal'] = JSON.stringify({
      goal: 'Build Muscle',
      level: 'beginner',
      bodyParts: ['abs'],
    });

    const button = document.getElementById('suggest-workout');
    const output = document.getElementById('suggestion-output');

    button.click();

    expect(output.textContent).toBe('3x10 crunches, 3x12 leg raises, 2x30s plank');
    expect(window.gtag).toHaveBeenCalledWith('event', 'workout_suggested', {
      event_category: 'Gym Tracker',
      event_label: '3x10 crunches, 3x12 leg raises, 2x30s plank',
    });
  });

  test('Mock AI suggests workouts for Intermediate + Build Endurance + legs', () => {
    localStorageMock.store['userGoal'] = JSON.stringify({
      goal: 'Build Endurance',
      level: 'intermediate',
      bodyParts: ['legs'],
    });

    const button = document.getElementById('suggest-workout');
    const output = document.getElementById('suggestion-output');

    button.click();

    expect(output.textContent).toBe('5km run, 3x20 lunges, 3x15 jump squats');
    expect(window.gtag).toHaveBeenCalledWith('event', 'workout_suggested', {
      event_category: 'Gym Tracker',
      event_label: '5km run, 3x20 lunges, 3x15 jump squats',
    });
  });

  test('Mock AI suggests workouts for Advanced + Build Strength + chest', () => {
    localStorageMock.store['userGoal'] = JSON.stringify({
      goal: 'Build Strength',
      level: 'advanced',
      bodyParts: ['chest'],
    });

    const button = document.getElementById('suggest-workout');
    const output = document.getElementById('suggestion-output');

    button.click();

    expect(output.textContent).toBe('5x5 bench press (heavy), 4x10 incline dumbbell press, 3x12 cable flys');
    expect(window.gtag).toHaveBeenCalledWith('event', 'workout_suggested', {
      event_category: 'Gym Tracker',
      event_label: '5x5 bench press (heavy), 4x10 incline dumbbell press, 3x12 cable flys',
    });
  });

  test('Mock AI handles no body parts selected', () => {
    localStorageMock.store['userGoal'] = JSON.stringify({
      goal: 'Build Muscle',
      level: 'beginner',
      bodyParts: [],
    });

    const button = document.getElementById('suggest-workout');
    const output = document.getElementById('suggestion-output');

    button.click();

    expect(output.textContent).toBe('Log workouts for tailored suggestions!');
    expect(window.gtag).toHaveBeenCalledWith('event', 'workout_suggested', {
      event_category: 'Gym Tracker',
      event_label: 'Log workouts for tailored suggestions!',
    });
  });

  test('Mock AI handles no goal set', () => {
    localStorageMock.store['userGoal'] = JSON.stringify({});

    const button = document.getElementById('suggest-workout');
    const output = document.getElementById('suggestion-output');

    button.click();

    expect(output.textContent).toBe('No goal set. Smash through!');
    expect(window.gtag).toHaveBeenCalledWith('event', 'workout_suggested', {
      event_category: 'Gym Tracker',
      event_label: 'No goal set. Smash through!',
    });
  });
});