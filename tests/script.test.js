const puppeteer = require('puppeteer');

jest.setTimeout(30000); // Increase Jest timeout for Puppeteer

describe('Forge Flow Tests', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
    await page.goto(`file://${process.cwd()}/index.html`);
    await page.waitForTimeout(5000); // Increased delay
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem = jest.fn((key, value) => {
        window.localStorage[key] = value;
      });
      window.localStorage.getItem = jest.fn((key) => window.localStorage[key] || null);
      window.gtag = jest.fn();
      window.alert = jest.fn();
    });
    await page.evaluate(() => {
      Math.random = () => 0;
    });
    await page.reload();
    await page.waitForTimeout(3000); // Increased delay
  });

  test('Goal form exists and has required elements', async () => {
    const goalForm = await page.$('#goal-form');
    const goalSelect = await page.$('#goal');
    const levelSelect = await page.$('#fitness-level');
    const bodyPartCheckboxes = await page.$$('input[name="body-part"]');
    const submitButton = await page.$('#goal-form button[type="submit"]');

    expect(goalForm).toBeTruthy();
    expect(goalSelect).toBeTruthy();
    expect(levelSelect).toBeTruthy();
    expect(bodyPartCheckboxes.length).toBe(7);
    expect(submitButton).toBeTruthy();
  });

  test('Goal form submission saves to localStorage', async () => {
    await page.select('#goal', 'Build Muscle');
    await page.select('#fitness-level', 'beginner');
    await page.click('input[value="abs"]');
    await page.click('#goal-form button[type="submit"]');
    await page.waitForTimeout(1000);

    const userGoal = await page.evaluate(() => window.localStorage.getItem('userGoal'));
    expect(JSON.parse(userGoal)).toEqual({
      goal: 'Build Muscle',
      level: 'beginner',
      bodyParts: ['abs'],
    });
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'goal_saved',
      { event_category: 'Gym Tracker', event_label: 'Build Muscle (beginner, abs)' },
    ]);
  });

  test('Suggest Workout button exists and is clickable', async () => {
    const button = await page.$('#suggest-workout');
    expect(button).toBeTruthy();
    const tagName = await page.evaluate((el) => el.tagName, button);
    expect(tagName).toBe('BUTTON');
  });

  test('Mock AI suggests workouts for Beginner + Build Muscle + abs', async () => {
    await page.evaluate(() =>
      window.localStorage.setItem(
        'userGoal',
        JSON.stringify({ goal: 'Build Muscle', level: 'beginner', bodyParts: ['abs'] })
      )
    );
    await page.click('#suggest-workout');
    await page.waitForTimeout(1000);

    const output = await page.$eval('#suggestion-output', (el) => el.textContent);
    expect(output).toBe('3x10 crunches, 3x12 leg raises, 2x30s plank');
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'workout_suggested',
      {
        event_category: 'Gym Tracker',
        event_label: '3x10 crunches, 3x12 leg raises, 2x30s plank',
      },
    ]);
  });

  test('Mock AI suggests workouts for Intermediate + Build Endurance + legs', async () => {
    await page.evaluate(() =>
      window.localStorage.setItem(
        'userGoal',
        JSON.stringify({ goal: 'Build Endurance', level: 'intermediate', bodyParts: ['legs'] })
      )
    );
    await page.click('#suggest-workout');
    await page.waitForTimeout(1000);

    const output = await page.$eval('#suggestion-output', (el) => el.textContent);
    expect(output).toBe('5km run, 3x20 lunges, 3x15 jump squats');
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'workout_suggested',
      {
        event_category: 'Gym Tracker',
        event_label: '5km run, 3x20 lunges, 3x15 jump squats',
      },
    ]);
  });

  test('Mock AI suggests workouts for Advanced + Build Strength + chest', async () => {
    await page.evaluate(() =>
      window.localStorage.setItem(
        'userGoal',
        JSON.stringify({ goal: 'Build Strength', level: 'advanced', bodyParts: ['chest'] })
      )
    );
    await page.click('#suggest-workout');
    await page.waitForTimeout(1000);

    const output = await page.$eval('#suggestion-output', (el) => el.textContent);
    expect(output).toBe('5x5 bench press (heavy), 4x10 incline dumbbell press, 3x12 cable flys');
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'workout_suggested',
      {
        event_category: 'Gym Tracker',
        event_label: '5x5 bench press (heavy), 4x10 incline dumbbell press, 3x12 cable flys',
      },
    ]);
  });

  test('Mock AI handles no body parts selected', async () => {
    await page.evaluate(() =>
      window.localStorage.setItem(
        'userGoal',
        JSON.stringify({ goal: 'Build Muscle', level: 'beginner', bodyParts: [] })
      )
    );
    await page.click('#suggest-workout');
    await page.waitForTimeout(1000);

    const output = await page.$eval('#suggestion-output', (el) => el.textContent);
    expect(output).toBe('Log workouts for tailored suggestions!');
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'workout_suggested',
      {
        event_category: 'Gym Tracker',
        event_label: 'Log workouts for tailored suggestions!',
      },
    ]);
  });

  test('Mock AI handles no goal set', async () => {
    await page.evaluate(() =>
      window.localStorage.setItem('userGoal', JSON.stringify({}))
    );
    await page.click('#suggest-workout');
    await page.waitForTimeout(1000);

    const output = await page.$eval('#suggestion-output', (el) => el.textContent);
    expect(output).toBe('No goal set. Smash through!');
    expect(page.evaluate(() => window.gtag.mock.calls[0])).toEqual([
      'event',
      'workout_suggested',
      {
        event_category: 'Gym Tracker',
        event_label: 'No goal set. Smash through!',
      },
    ]);
  });
});