// DOM wiring for the recipe calculators.
// All maths lives in js/recipes.js and js/units.js; this file only reads
// input, calls those pure functions, and writes the results back to the page.

import { RECIPES, scaleRecipe, validateBeefGrams } from './recipes.js';
import {
  formatMass,
  formatSpiceGrams,
  formatLiquidTbsp,
  formatTemperature,
  formatBeefAmount,
  inputToGrams,
  gramsToInput,
} from './units.js';

const STORAGE_KEY = 'wors-calc-unit-system';

/** @type {'metric'|'imperial'} */
let unitSystem = readStoredUnitSystem();

/**
 * Per-recipe canonical state: the entered beef mass in grams. Grams is the
 * single source of truth, so toggling the unit system only changes how that
 * canonical value is displayed, never the value itself.
 * @type {Map<string, number>}
 */
const beefGrams = new Map(RECIPES.map((recipe) => [recipe.id, recipe.beefBaseline]));

function readStoredUnitSystem() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

function writeStoredUnitSystem(system) {
  try {
    window.localStorage.setItem(STORAGE_KEY, system);
  } catch {
    // Storage may be unavailable (private browsing, disabled cookies); the
    // calculator still works, it just won't remember the preference.
  }
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const system = params.get('unit');
  if (system === 'metric' || system === 'imperial') {
    unitSystem = system;
  }
  for (const recipe of RECIPES) {
    const raw = params.get(recipe.id);
    if (raw === null) continue;
    const amount = Number(raw);
    const grams = inputToGrams(amount, unitSystem);
    if (validateBeefGrams(grams) === null) {
      beefGrams.set(recipe.id, grams);
    }
  }
}

function writeUrlState() {
  const params = new URLSearchParams();
  params.set('unit', unitSystem);
  for (const recipe of RECIPES) {
    const display = gramsToInput(beefGrams.get(recipe.id), unitSystem);
    params.set(recipe.id, String(display));
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}

function buildIngredientRow(ingredient) {
  const row = document.createElement('tr');

  const labelCell = document.createElement('th');
  labelCell.scope = 'row';
  labelCell.textContent = ingredient.label;
  row.appendChild(labelCell);

  const amountCell = document.createElement('td');
  amountCell.className = `amount amount--${ingredient.category}`;
  let formatted;
  if (ingredient.category === 'liquid') {
    formatted = formatLiquidTbsp(ingredient.amount, unitSystem);
  } else if (ingredient.category === 'spice') {
    formatted = formatSpiceGrams(ingredient.amount);
  } else {
    formatted = formatMass(ingredient.amount, unitSystem);
  }
  amountCell.textContent = formatted.text;
  row.appendChild(amountCell);

  return row;
}

function renderRecipe(recipe) {
  const card = document.querySelector(`[data-recipe="${recipe.id}"]`);
  if (!card) return;

  const input = card.querySelector('.beef-input');
  const errorEl = card.querySelector('.field-error');
  const grams = beefGrams.get(recipe.id);
  const displayValue = gramsToInput(grams, unitSystem);

  if (document.activeElement !== input) {
    input.value = String(displayValue);
  }
  input.setAttribute('aria-invalid', 'false');
  errorEl.textContent = '';

  const unitLabel = card.querySelector('.beef-unit-label');
  unitLabel.textContent = unitSystem === 'imperial' ? 'lb' : 'kg';

  const { totalGrams, ingredients } = scaleRecipe(recipe, grams);

  const meatBody = card.querySelector('.ingredients-meat tbody');
  const spiceBody = card.querySelector('.ingredients-spice tbody');
  const liquidBody = card.querySelector('.ingredients-liquid tbody');
  meatBody.replaceChildren();
  spiceBody.replaceChildren();
  liquidBody.replaceChildren();

  for (const ingredient of ingredients) {
    const row = buildIngredientRow(ingredient);
    if (ingredient.category === 'meat') meatBody.appendChild(row);
    else if (ingredient.category === 'spice') spiceBody.appendChild(row);
    else liquidBody.appendChild(row);
  }

  const totalEl = card.querySelector('.batch-total');
  totalEl.textContent = formatMass(totalGrams, unitSystem).text;

  const casingEl = card.querySelector('.casing-note');
  if (casingEl) casingEl.textContent = recipe.casing;

  const resetButton = card.querySelector('.reset-button');
  if (resetButton) {
    const baseline = formatBeefAmount(recipe.beefBaseline, unitSystem);
    resetButton.textContent = `Reset to ${baseline.text} baseline`;
  }

  card.querySelectorAll('[data-temp-c]').forEach((el) => {
    const celsius = Number(el.dataset.tempC);
    el.textContent = formatTemperature(celsius, unitSystem);
  });

  writeUrlState();
}

function renderAll() {
  document.documentElement.dataset.unitSystem = unitSystem;
  for (const recipe of RECIPES) {
    renderRecipe(recipe);
  }
}

function handleBeefInput(recipe, inputEl, errorEl) {
  const raw = inputEl.value.trim();
  const amount = Number(raw);
  const grams = inputToGrams(amount, unitSystem);
  const error = raw === '' ? 'Enter a quantity.' : validateBeefGrams(grams);

  if (error) {
    inputEl.setAttribute('aria-invalid', 'true');
    errorEl.textContent = error;
    return;
  }

  inputEl.setAttribute('aria-invalid', 'false');
  errorEl.textContent = '';
  beefGrams.set(recipe.id, grams);
  renderRecipe(recipe);
}

function handleReset(recipe) {
  beefGrams.set(recipe.id, recipe.beefBaseline);
  renderRecipe(recipe);
}

function initRecipeCard(recipe) {
  const card = document.querySelector(`[data-recipe="${recipe.id}"]`);
  if (!card) return;

  const input = card.querySelector('.beef-input');
  const errorEl = card.querySelector('.field-error');

  input.addEventListener('input', () => handleBeefInput(recipe, input, errorEl));

  const resetButton = card.querySelector('.reset-button');
  resetButton.addEventListener('click', () => handleReset(recipe));
}

function initUnitToggle() {
  const toggle = document.querySelector('#unit-toggle');
  if (!toggle) return;
  toggle.value = unitSystem;
  toggle.addEventListener('change', () => {
    unitSystem = toggle.value === 'imperial' ? 'imperial' : 'metric';
    writeStoredUnitSystem(unitSystem);
    renderAll();
  });
}

function initYear() {
  const yearEl = document.querySelector('#current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function addMediaQueryListener(query, handler) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
  } else if (typeof query.addListener === 'function') {
    // Safari < 14 fallback.
    query.addListener(handler);
  }
}

/**
 * Pins the hero photograph and tilts it away in 3D as the reader scrolls
 * past it, so the image reads as a backdrop the recipes emerge from rather
 * than a fixed banner. Only runs on wide screens with motion allowed; the
 * photo is a plain static image everywhere else (see .hero base styles).
 */
function initHeroPeel() {
  const hero = document.querySelector('#hero');
  const photo = document.querySelector('#heroPhoto');
  if (!hero || !photo) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowViewportQuery = window.matchMedia('(max-width: 860px)');

  let peelActive = false;
  let frameRequested = false;

  function resetPhoto() {
    photo.style.transform = '';
    photo.style.opacity = '';
  }

  function updatePeel() {
    frameRequested = false;
    if (!peelActive) return;

    const rect = hero.getBoundingClientRect();
    const scrollRange = rect.height - window.innerHeight;
    if (scrollRange <= 0) {
      resetPhoto();
      return;
    }

    const progress = Math.min(Math.max(-rect.top / scrollRange, 0), 1);
    // Smoothstep easing so the peel starts and ends gently.
    const eased = progress * progress * (3 - 2 * progress);

    photo.style.transform = [
      'rotate(-1deg)',
      `rotateX(${(eased * -68).toFixed(2)}deg)`,
      `translateY(${(eased * -16).toFixed(2)}%)`,
      `translateZ(${(eased * -260).toFixed(1)}px)`,
      `scale(${(1 - eased * 0.16).toFixed(3)})`,
    ].join(' ');
    photo.style.opacity = (1 - eased * 0.92).toFixed(3);
  }

  function requestUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updatePeel);
  }

  function applyMode() {
    const shouldPeel = !reducedMotionQuery.matches && !narrowViewportQuery.matches;
    if (shouldPeel === peelActive) return;
    peelActive = shouldPeel;
    hero.classList.toggle('hero--peel', peelActive);
    if (peelActive) {
      requestUpdate();
    } else {
      resetPhoto();
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    applyMode();
    requestUpdate();
  });
  addMediaQueryListener(reducedMotionQuery, applyMode);
  addMediaQueryListener(narrowViewportQuery, applyMode);

  applyMode();
}

/**
 * Fades the overlapping recipe ledger from translucent to solid parchment as
 * it clears the hero. The custom property changes paint only, so the overlap
 * stays fixed and never causes a layout jump.
 */
function initRecipeReveal() {
  const hero = document.querySelector('#hero');
  const main = document.querySelector('#main');
  if (!hero || !main) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameRequested = false;

  function updateReveal() {
    frameRequested = false;

    if (reducedMotionQuery.matches) {
      main.style.setProperty('--recipe-reveal', '1');
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    const heroTop = window.scrollY + heroRect.top;
    const stickyRunway = Math.max(heroRect.height - window.innerHeight, 0);
    const revealEnd = hero.classList.contains('hero--peel')
      ? heroTop + stickyRunway
      : heroTop + heroRect.height;
    const revealDistance = Math.min(Math.max(window.innerHeight * 0.35, 180), 420);
    const revealStart = Math.max(0, revealEnd - revealDistance);
    const progress = Math.min(
      Math.max((window.scrollY - revealStart) / Math.max(revealEnd - revealStart, 1), 0),
      1,
    );
    const eased = progress * progress * (3 - 2 * progress);

    main.style.setProperty('--recipe-reveal', eased.toFixed(3));
  }

  function requestRevealUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateReveal);
  }

  window.addEventListener('scroll', requestRevealUpdate, { passive: true });
  window.addEventListener('resize', requestRevealUpdate);
  addMediaQueryListener(reducedMotionQuery, requestRevealUpdate);
  requestRevealUpdate();
}

function init() {
  readUrlState();
  for (const recipe of RECIPES) {
    initRecipeCard(recipe);
  }
  initUnitToggle();
  initYear();
  initHeroPeel();
  initRecipeReveal();
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
