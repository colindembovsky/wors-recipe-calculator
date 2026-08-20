// Unit conversion and formatting helpers.
// Pure functions only. No DOM access, so they can be unit tested
// Node's built-in test runner without a browser.

export const G_PER_OZ = 28.349523125;
export const G_PER_LB = G_PER_OZ * 16;
export const ML_PER_TBSP = 14.7868; // 1 US tablespoon
export const ML_PER_US_FL_OZ = ML_PER_TBSP * 2;

/**
 * Convert grams to ounces.
 * @param {number} grams
 * @returns {number}
 */
export function gramsToOunces(grams) {
  return grams / G_PER_OZ;
}

/**
 * Convert ounces to grams.
 * @param {number} ounces
 * @returns {number}
 */
export function ouncesToGrams(ounces) {
  return ounces * G_PER_OZ;
}

/**
 * Convert grams to pounds.
 * @param {number} grams
 * @returns {number}
 */
export function gramsToPounds(grams) {
  return grams / G_PER_LB;
}

/**
 * Convert pounds to grams.
 * @param {number} pounds
 * @returns {number}
 */
export function poundsToGrams(pounds) {
  return pounds * G_PER_LB;
}

/**
 * Convert millilitres to US tablespoons.
 * @param {number} ml
 * @returns {number}
 */
export function mlToTbsp(ml) {
  return ml / ML_PER_TBSP;
}

/**
 * Convert US tablespoons to millilitres.
 * @param {number} tbsp
 * @returns {number}
 */
export function tbspToMl(tbsp) {
  return tbsp * ML_PER_TBSP;
}

/**
 * Convert millilitres to US fluid ounces.
 * @param {number} ml
 * @returns {number}
 */
export function mlToUsFluidOunces(ml) {
  return ml / ML_PER_US_FL_OZ;
}

/**
 * Convert Celsius to Fahrenheit.
 * @param {number} celsius
 * @returns {number}
 */
export function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * Round a number to a fixed number of decimal places, returned as a number
 * (not a string) so callers can decide formatting.
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
export function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format a number for display, trimming unnecessary trailing zeros while
 * guaranteeing at least `minDecimals` and at most `maxDecimals` digits.
 * @param {number} value
 * @param {number} maxDecimals
 * @param {number} [minDecimals]
 * @returns {string}
 */
export function formatNumber(value, maxDecimals, minDecimals = 0) {
  const rounded = roundTo(value, maxDecimals);
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Format a meat/fat mass (beef, pork, fat) for display, choosing a sensible
 * unit for the given unit system. Metric uses g below 1000 g and kg at or
 * above. Imperial uses oz below 16 oz and lb at or above.
 * @param {number} grams
 * @param {'metric'|'imperial'} system
 * @returns {{ value: string, unit: string, text: string }}
 */
export function formatMass(grams, system) {
  if (system === 'imperial') {
    const ounces = gramsToOunces(grams);
    if (ounces >= 16) {
      const pounds = ounces / 16;
      const value = formatNumber(pounds, 2);
      return { value, unit: 'lb', text: `${value} lb` };
    }
    const value = formatNumber(ounces, 1);
    return { value, unit: 'oz', text: `${value} oz` };
  }
  if (grams >= 1000) {
    const kg = grams / 1000;
    const value = formatNumber(kg, 2);
    return { value, unit: 'kg', text: `${value} kg` };
  }
  const value = formatNumber(grams, grams < 10 ? 1 : 0);
  return { value, unit: 'g', text: `${value} g` };
}

/**
 * Spices always display in grams, in both metric and imperial modes.
 * @param {number} grams
 * @returns {{ value: string, unit: string, text: string }}
 */
export function formatSpiceGrams(grams) {
  const decimals = grams < 5 ? 2 : grams < 20 ? 1 : 0;
  const value = formatNumber(grams, decimals);
  return { value, unit: 'g', text: `${value} g` };
}

/**
 * Liquids always display in US tablespoons, followed by millilitres in metric
 * mode or US fluid ounces in imperial mode.
 * @param {number} ml
 * @param {'metric'|'imperial'} system
 * @returns {{
 *   value: string,
 *   unit: string,
 *   secondaryValue: string,
 *   secondaryUnit: string,
 *   text: string
 * }}
 */
export function formatLiquidTbsp(ml, system) {
  const tbsp = mlToTbsp(ml);
  const decimals = tbsp < 10 ? 2 : 1;
  const value = formatNumber(tbsp, decimals);
  const secondaryValue = system === 'imperial'
    ? formatNumber(mlToUsFluidOunces(ml), 2)
    : formatNumber(ml, ml < 10 ? 1 : 0);
  const secondaryUnit = system === 'imperial' ? 'US fl oz' : 'ml';

  return {
    value,
    unit: 'tbsp',
    secondaryValue,
    secondaryUnit,
    text: `${value} tbsp / ${secondaryValue} ${secondaryUnit}`,
  };
}

/**
 * Format a temperature for display in the given unit system.
 * @param {number} celsius
 * @param {'metric'|'imperial'} system
 * @returns {string}
 */
export function formatTemperature(celsius, system) {
  if (system === 'imperial') {
    return `${formatNumber(celsiusToFahrenheit(celsius), 0)}°F`;
  }
  return `${formatNumber(celsius, 0)}°C`;
}

/**
 * Convert a beef-quantity input value (in the unit currently shown to the
 * user — kg for metric, lb for imperial) into canonical grams. This is the
 * single place raw user input is turned into the internal source of truth,
 * so toggling display units never re-derives the canonical amount from a
 * previously rounded display value.
 * @param {number} amount
 * @param {'metric'|'imperial'} system
 * @returns {number} grams
 */
export function inputToGrams(amount, system) {
  return system === 'imperial' ? poundsToGrams(amount) : amount * 1000;
}

/**
 * Convert canonical grams into the display value shown in the beef-quantity
 * input for the given unit system (kg for metric, lb for imperial). Rounded
 * to three decimal places, roughly gram-level precision in either unit, so
 * repeated unit switching doesn't visibly drift the entered amount.
 * @param {number} grams
 * @param {'metric'|'imperial'} system
 * @returns {number}
 */
export function gramsToInput(grams, system) {
  return system === 'imperial' ? roundTo(gramsToPounds(grams), 3) : roundTo(grams / 1000, 3);
}

/**
 * Format canonical grams as the kg/lb amount shown in beef-quantity labels
 * (the reset button, for example) that read a value rather than accept one.
 * Unlike formatMass, this never switches down to g/oz, since the beef input
 * itself is always entered in kg or lb.
 * @param {number} grams
 * @param {'metric'|'imperial'} system
 * @returns {{ value: string, unit: string, text: string }}
 */
export function formatBeefAmount(grams, system) {
  if (system === 'imperial') {
    const value = formatNumber(gramsToPounds(grams), 2);
    return { value, unit: 'lb', text: `${value} lb` };
  }
  const value = formatNumber(grams / 1000, 2);
  return { value, unit: 'kg', text: `${value} kg` };
}
