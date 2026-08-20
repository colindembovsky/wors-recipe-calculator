# Wors Recipe Calculator

A static calculator for scaling two South African sausage recipes, droëwors and
boerewors, from any amount of beef. Enter the total lean-and-fat beef weight for
droëwors or the lean beef weight for boerewors, and every other ingredient scales
with it in metric or imperial units.

There is no build step. It's plain HTML, CSS and vanilla JavaScript, meant to run
as-is from GitHub Pages or any static file host.

## Running it locally

Clone the repo and serve the folder with any static file server, for example:

```sh
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed local URL in a browser. Opening `index.html` directly from
disk also works in most browsers, though a local server avoids `file://` quirks
with the URL query-string state.

## How the calculators work

- `js/recipes.js` holds the baseline recipe data for both sausages (ingredients,
  method, casing and safety notes) and the pure scaling math, keyed off the
  amount of beef entered.
- `js/units.js` holds pure unit-conversion and formatting helpers (grams, ounces,
  pounds, millilitres, US tablespoons, °C/°F), independent of the DOM.
- `js/app.js` wires the recipe and unit logic to the page: rendering ingredient
  tables, keeping the unit toggle, beef inputs and URL query string in sync, and
  validating what's typed in.

Keeping the calculation logic in plain modules with no DOM access means it can be
unit tested with Node's built-in test runner, with no browser or test framework
required.

## Testing

```sh
npm test
```

This runs `node --test` against `test/units.test.js` and `test/recipes.test.js`,
covering unit conversion, round-tripping between metric and imperial without
drift, and recipe scaling at the stated baselines and other beef weights.

## Deploying to GitHub Pages

`.github/workflows/pages.yml` runs the test suite on every push to `main`, then
publishes the repository root straight to GitHub Pages with no build step, using
`actions/upload-pages-artifact` and `actions/deploy-pages`.

To enable it on a repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`. The site publishes at `https://<owner>.github.io/<repo>/`.

## Project layout

```
index.html          Page structure and content
css/styles.css       Styling
js/recipes.js        Recipe data and scaling math (tested)
js/units.js          Unit conversion and formatting (tested)
js/app.js            DOM wiring
test/                Node test runner suites
assets/               Site imagery
.github/workflows/    GitHub Pages Actions workflow
```
