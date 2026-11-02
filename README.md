# Fleky's Snow Day

A first game for Jojo. Fleky is a fluffy white kitten with purple-gray spots, pink ears, and a gold tag that says **FLEKY**. She plays in a snowy meadow.

The live game is at **https://siqiliu18.github.io/Fleky-the-Cat/**

## How to play

Turn the iPad sideways. Tap a big button:

- **Chase Yarn** — Fleky runs to the rainbow ball. Each one she catches adds 1 to the counter, and a new ball appears.
- **Jump** — Fleky leaps through the rainbow hoop.
- **Roll Over** — Fleky tumbles in the snow, then pops up on her back.

The little button at the top left turns the sound off. There is no way to lose.

## Run it on this computer

The game is plain HTML, CSS, and JavaScript. A small local server is enough (opening the file directly will not load the scripts):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 . Keys for a desktop check: `C` chase, `J` jump, `R` roll over.

## Pages

Pushing to `main` runs `.github/workflows/pages.yml`, which publishes the site with GitHub Actions. In the repo settings, Pages source should be **GitHub Actions**.

The concept sketch is saved at `assets/fleky-concept.jpg` for reference. In the game her name is spelled Fleky.
