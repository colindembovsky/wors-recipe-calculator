import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DROEWORS,
  BOEREWORS,
  RECIPES,
  computeScaleFactor,
  scaleRecipe,
  validateBeefGrams,
  MIN_BEEF_GRAMS,
  MAX_BEEF_GRAMS,
} from '../js/recipes.js';

test('RECIPES exposes both droëwors and boerewors', () => {
  assert.equal(RECIPES.length, 2);
  assert.equal(RECIPES[0].id, 'droewors');
  assert.equal(RECIPES[1].id, 'boerewors');
});

test('computeScaleFactor is 1 at each recipe baseline', () => {
  assert.equal(computeScaleFactor(DROEWORS, DROEWORS.beefBaseline), 1);
  assert.equal(computeScaleFactor(BOEREWORS, BOEREWORS.beefBaseline), 1);
});

test('scaling droëwors to its baseline (800 g) reproduces the exact baseline quantities', () => {
  const { factor, ingredients } = scaleRecipe(DROEWORS, 800);
  assert.equal(factor, 1);

  const byKey = Object.fromEntries(ingredients.map((i) => [i.key, i.amount]));
  assert.equal(byKey.beef, 800);
  assert.equal(byKey.fat, 200);
  assert.equal(byKey.salt, 20);
  assert.equal(byKey.coriander, 12);
  assert.equal(byKey.pepper, 2.5);
  assert.equal(byKey.cloves, 0.5);
  assert.equal(byKey.nutmeg, 0.5);
  assert.equal(byKey.vinegar, 30);
  assert.equal(byKey.worcestershire, 15);
});

test('scaling boerewors to its baseline (600 g) reproduces the exact baseline quantities', () => {
  const { factor, ingredients } = scaleRecipe(BOEREWORS, 600);
  assert.equal(factor, 1);

  const byKey = Object.fromEntries(ingredients.map((i) => [i.key, i.amount]));
  assert.equal(byKey.beef, 600);
  assert.equal(byKey.pork, 400);
  assert.equal(byKey.salt, 14);
  assert.equal(byKey.coriander, 9);
  assert.equal(byKey.pepper, 3);
  assert.equal(byKey.cloves, 0.5);
  assert.equal(byKey.nutmeg, 0.7);
  assert.equal(byKey.vinegar, 40);
  assert.equal(byKey.worcestershire, 15);
});

test('doubling the entered beef mass doubles every ingredient', () => {
  const { ingredients } = scaleRecipe(DROEWORS, 1600);
  const byKey = Object.fromEntries(ingredients.map((i) => [i.key, i.amount]));
  assert.equal(byKey.beef, 1600);
  assert.equal(byKey.fat, 400);
  assert.equal(byKey.salt, 40);
  assert.equal(byKey.vinegar, 60);
});

test('halving the entered beef mass halves every ingredient', () => {
  const { ingredients } = scaleRecipe(BOEREWORS, 300);
  const byKey = Object.fromEntries(ingredients.map((i) => [i.key, i.amount]));
  assert.equal(byKey.beef, 300);
  assert.equal(byKey.pork, 200);
  assert.equal(byKey.salt, 7);
});

test('scaleRecipe totalGrams sums meat and spice mass but excludes liquids', () => {
  const { totalGrams } = scaleRecipe(DROEWORS, 800);
  // 800 beef + 200 fat + 20 salt + 12 coriander + 2.5 pepper + 0.5 cloves + 0.5 nutmeg
  assert.equal(totalGrams, 1035.5);
});

test('validateBeefGrams rejects non-finite, negative and zero values', () => {
  assert.ok(validateBeefGrams(NaN));
  assert.ok(validateBeefGrams(Infinity));
  assert.ok(validateBeefGrams(-Infinity));
  assert.ok(validateBeefGrams(0));
  assert.ok(validateBeefGrams(-50));
  assert.ok(validateBeefGrams('800'));
});

test('validateBeefGrams enforces min/max bounds', () => {
  assert.ok(validateBeefGrams(MIN_BEEF_GRAMS - 1));
  assert.equal(validateBeefGrams(MIN_BEEF_GRAMS), null);
  assert.equal(validateBeefGrams(MAX_BEEF_GRAMS), null);
  assert.ok(validateBeefGrams(MAX_BEEF_GRAMS + 1));
});

test('validateBeefGrams accepts decimal quantities within range', () => {
  assert.equal(validateBeefGrams(812.5), null);
});
