import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gramsToOunces,
  ouncesToGrams,
  gramsToPounds,
  poundsToGrams,
  mlToTbsp,
  tbspToMl,
  celsiusToFahrenheit,
  roundTo,
  formatNumber,
  formatMass,
  formatSpiceGrams,
  formatLiquidTbsp,
  formatTemperature,
  inputToGrams,
  gramsToInput,
} from '../js/units.js';

test('gramsToOunces / ouncesToGrams round-trip', () => {
  const grams = 800;
  const ounces = gramsToOunces(grams);
  assert.ok(Math.abs(ounces - 28.2192) < 0.001);
  assert.ok(Math.abs(ouncesToGrams(ounces) - grams) < 1e-9);
});

test('gramsToPounds / poundsToGrams round-trip', () => {
  const grams = 1000;
  const pounds = gramsToPounds(grams);
  assert.ok(Math.abs(poundsToGrams(pounds) - grams) < 1e-9);
});

test('mlToTbsp / tbspToMl use the US tablespoon (14.7868 ml)', () => {
  assert.ok(Math.abs(mlToTbsp(14.7868) - 1) < 1e-9);
  assert.ok(Math.abs(tbspToMl(1) - 14.7868) < 1e-9);
  assert.ok(Math.abs(mlToTbsp(30) - 2.0288) < 0.001);
});

test('celsiusToFahrenheit converts the boerewors safe cook temperature', () => {
  assert.equal(Math.round(celsiusToFahrenheit(71)), 160);
});

test('roundTo rounds to the requested decimal places', () => {
  assert.equal(roundTo(1.005, 2), 1.01);
  assert.equal(roundTo(2.5, 0), 3);
  assert.equal(roundTo(0.1234, 3), 0.123);
});

test('formatNumber trims to the requested precision', () => {
  assert.equal(formatNumber(2, 2), '2');
  assert.equal(formatNumber(2.5, 2), '2.5');
  assert.equal(formatNumber(2.567, 2), '2.57');
});

test('formatMass metric switches from g to kg at 1000 g', () => {
  assert.equal(formatMass(800, 'metric').text, '800 g');
  assert.equal(formatMass(999, 'metric').text, '999 g');
  assert.equal(formatMass(1000, 'metric').text, '1 kg');
  assert.equal(formatMass(1500, 'metric').text, '1.5 kg');
});

test('formatMass imperial switches from oz to lb at 16 oz', () => {
  // 800 g is roughly 28.22 oz, above the 16 oz threshold, so it reports lb.
  const result = formatMass(800, 'imperial');
  assert.equal(result.unit, 'lb');
  assert.ok(Math.abs(parseFloat(result.value) - 1.76) < 0.01);

  const small = formatMass(200, 'imperial');
  assert.equal(small.unit, 'oz');
  assert.ok(Math.abs(parseFloat(small.value) - 7.1) < 0.05);
});

test('formatSpiceGrams always reports grams regardless of unit system', () => {
  assert.equal(formatSpiceGrams(20).text, '20 g');
  assert.equal(formatSpiceGrams(0.5).text, '0.5 g');
  assert.equal(formatSpiceGrams(2.5).text, '2.5 g');
});

test('formatLiquidTbsp always reports US tablespoons', () => {
  const result = formatLiquidTbsp(30);
  assert.equal(result.unit, 'tbsp');
  assert.ok(Math.abs(parseFloat(result.value) - 2.03) < 0.01);
});

test('formatTemperature switches unit label with system', () => {
  assert.equal(formatTemperature(71, 'metric'), '71°C');
  assert.equal(formatTemperature(71, 'imperial'), '160°F');
});

test('inputToGrams / gramsToInput preserve the entered beef amount without drift', () => {
  // Entering 800 g in metric mode should read back as 800 g.
  assert.equal(gramsToInput(inputToGrams(800, 'metric'), 'metric'), 800);

  // Entering 600 g and switching to imperial and back to metric must not drift.
  const canonicalGrams = inputToGrams(600, 'metric');
  const imperialDisplay = gramsToInput(canonicalGrams, 'imperial');
  const backToGrams = inputToGrams(imperialDisplay, 'imperial');
  // The canonical value used for calculations never actually changes on a
  // pure unit toggle in the app (only the display recomputes from the same
  // canonical grams), but this checks the conversion functions themselves
  // are accurate enough that re-deriving grams from a rounded oz display
  // stays within a gram of the original.
  assert.ok(Math.abs(backToGrams - canonicalGrams) < 1);
});
