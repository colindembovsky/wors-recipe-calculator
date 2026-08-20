// Recipe data and pure scaling logic.
// No DOM access here. Everything is derived from a single entered beef
// mass so it can be unit tested without a browser.

/**
 * @typedef {Object} Ingredient
 * @property {string} key
 * @property {string} label
 * @property {'meat'|'spice'|'liquid'} category
 * @property {number} baseline - baseline quantity in grams (meat/spice) or millilitres (liquid)
 */

/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} name
 * @property {number} beefBaseline - baseline entered beef mass, in grams
 * @property {Ingredient[]} ingredients
 * @property {string} casing
 * @property {string[]} method
 * @property {string[]} safety
 */

/** @type {Recipe} */
export const DROEWORS = {
  id: 'droewors',
  name: 'Droëwors',
  tagline: 'Air-dried spiced beef sausage',
  beefBaseline: 800,
  ingredients: [
    { key: 'beef', label: 'Lean beef', category: 'meat', baseline: 800 },
    { key: 'fat', label: 'Beef fat', category: 'meat', baseline: 200 },
    { key: 'salt', label: 'Salt', category: 'spice', baseline: 20 },
    { key: 'coriander', label: 'Whole coriander seed, toasted & cracked', category: 'spice', baseline: 12 },
    { key: 'pepper', label: 'Black pepper, cracked', category: 'spice', baseline: 2.5 },
    { key: 'cloves', label: 'Cloves, ground', category: 'spice', baseline: 0.5 },
    { key: 'nutmeg', label: 'Nutmeg, ground', category: 'spice', baseline: 0.5 },
    { key: 'vinegar', label: 'Brown / malt vinegar', category: 'liquid', baseline: 30 },
    { key: 'worcestershire', label: 'Worcestershire sauce', category: 'liquid', baseline: 15 },
  ],
  casing: '20–24 mm natural sheep casings, as needed',
  method: [
    'Keep the beef and fat as cold as possible (partially frozen is ideal) and grind on a coarse plate.',
    'Toast the coriander seed lightly, then crack it coarsely. Do not grind it to a powder.',
    'Mix the ground meat with salt, coriander, pepper, cloves and nutmeg, then add the vinegar and Worcestershire sauce.',
    'Mix by hand until the mixture becomes tacky and evenly combined, working quickly to keep everything cold.',
    'Stuff firmly into sheep casings, twisting into long lengths, and hang in a well-ventilated, cool, dry, low-humidity space out of direct sun.',
    'Dry for several days to a week or more, depending on conditions, until the sausage has lost at least half its original weight. Check that the centre is uniformly dry, not only the outside.',
    'Once fully dried, store refrigerated in a sealed container or freeze for longer keeping.',
  ],
  safety: [
    'This recipe air-dries raw ground beef, so sanitation, cold handling and a controlled, well-ventilated drying environment matter far more than they would for a cooked sausage.',
    'Dry to at least 50% weight loss from the fresh, stuffed weight, and cut open a thick strand to confirm the centre is uniformly dry. A moist core is a food-safety risk.',
    'Droëwors is not shelf-stable at room temperature. Keep it refrigerated once dried, or freeze it for longer storage; do not leave it unrefrigerated for extended periods.',
  ],
};

/** @type {Recipe} */
export const BOEREWORS = {
  id: 'boerewors',
  name: 'Boerewors',
  tagline: 'Fresh coiled beef & pork sausage',
  beefBaseline: 600,
  ingredients: [
    { key: 'beef', label: 'Lean beef chuck or brisket', category: 'meat', baseline: 600 },
    { key: 'pork', label: 'Fresh, skinless, uncured pork belly (~50% lean/fat)', category: 'meat', baseline: 400 },
    { key: 'salt', label: 'Salt', category: 'spice', baseline: 14 },
    { key: 'coriander', label: 'Whole coriander seed, toasted & cracked', category: 'spice', baseline: 9 },
    { key: 'pepper', label: 'Black pepper, cracked', category: 'spice', baseline: 3 },
    { key: 'cloves', label: 'Cloves, ground', category: 'spice', baseline: 0.5 },
    { key: 'nutmeg', label: 'Nutmeg, ground', category: 'spice', baseline: 0.7 },
    { key: 'vinegar', label: 'Brown / malt vinegar', category: 'liquid', baseline: 40 },
    { key: 'worcestershire', label: 'Worcestershire sauce', category: 'liquid', baseline: 15 },
  ],
  casing: '28–32 mm natural hog casings, as needed',
  method: [
    'Keep the beef and pork belly well chilled and grind separately on a coarse plate, then combine.',
    'Toast the coriander seed lightly, then crack it coarsely. Visible flecks of coriander are part of what makes boerewors look and taste like boerewors.',
    'Mix the ground meats with salt, coriander, pepper, cloves and nutmeg, then add the vinegar and Worcestershire sauce.',
    'Mix by hand just until tacky and evenly combined. Overmixing makes the sausage dense instead of open-textured.',
    'Stuff loosely into hog casings and coil, twisting only occasionally to keep the traditional continuous coil rather than short links.',
    'Rest the coiled sausage, uncovered, in the refrigerator for a few hours (or overnight) to let the casing dry slightly and the flavours settle before cooking.',
    'Grill, pan-fry or braai over moderate heat, turning gently, until cooked through.',
  ],
  safety: [
    'Boerewors is a fresh sausage. It is not cured or dried, so cook it fully to an internal temperature of at least 71°C / 160°F before eating.',
    'Do not prick the casing while cooking; piercing it lets rendered fat and juices escape and dries out the sausage.',
    'Refrigerate fresh, uncooked boerewors for 1–2 days at most, or freeze it for longer storage; thaw in the refrigerator before cooking.',
  ],
};

export const RECIPES = [DROEWORS, BOEREWORS];

export const MIN_BEEF_GRAMS = 50;
export const MAX_BEEF_GRAMS = 20000;

/**
 * Compute the scale factor for a recipe given an entered beef mass.
 * @param {Recipe} recipe
 * @param {number} enteredBeefGrams
 * @returns {number}
 */
export function computeScaleFactor(recipe, enteredBeefGrams) {
  return enteredBeefGrams / recipe.beefBaseline;
}

/**
 * Scale every ingredient in a recipe by the ratio of entered beef mass to
 * the recipe's baseline beef mass.
 * @param {Recipe} recipe
 * @param {number} enteredBeefGrams
 * @returns {{ factor: number, totalGrams: number, ingredients: Array<Ingredient & { amount: number }> }}
 */
export function scaleRecipe(recipe, enteredBeefGrams) {
  const factor = computeScaleFactor(recipe, enteredBeefGrams);
  const ingredients = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    amount: ingredient.baseline * factor,
  }));
  const totalGrams = ingredients
    .filter((ingredient) => ingredient.category !== 'liquid')
    .reduce((sum, ingredient) => sum + ingredient.amount, 0);
  return { factor, totalGrams, ingredients };
}

/**
 * Validate a candidate beef mass (in grams). Returns null when valid, or a
 * user-facing error message when invalid.
 * @param {number} grams
 * @returns {string|null}
 */
export function validateBeefGrams(grams) {
  if (typeof grams !== 'number' || Number.isNaN(grams) || !Number.isFinite(grams)) {
    return 'Enter a valid number.';
  }
  if (grams <= 0) {
    return 'Enter a quantity greater than zero.';
  }
  if (grams < MIN_BEEF_GRAMS) {
    return `Enter at least ${MIN_BEEF_GRAMS} g (about ${(MIN_BEEF_GRAMS / 28.349523125).toFixed(1)} oz).`;
  }
  if (grams > MAX_BEEF_GRAMS) {
    return `Enter at most ${MAX_BEEF_GRAMS.toLocaleString('en-US')} g (about ${(MAX_BEEF_GRAMS / 1000).toFixed(0)} kg).`;
  }
  return null;
}
