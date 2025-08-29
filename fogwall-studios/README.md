# Fogwall Studios — static site

A minimal dungeon-gothic ASCII site with an intro "fog wall" you click to enter. Built with plain HTML/CSS/JS for easy hosting on GitHub Pages.

## Local preview

Open `index.html` directly, or serve the folder. On Windows PowerShell:

```powershell
# Option 1: Python (if installed)
python -m http.server 8080 ; Start-Process http://localhost:8080/fogwall-studios/

# Option 2: Node (if you have serve)
# npx serve . -l 8080 ; Start-Process http://localhost:8080/fogwall-studios/
```

## Deploy on GitHub Pages

Since this repo is a user/organization pages repo (`<user>.github.io`), files under this folder will be served at:

```
https://<user>.github.io/fogwall-studios/
```

Just commit and push. If creating a separate project pages site, place contents at the repo root or enable Pages from the `docs/` folder and move files accordingly.

## Customize

- Tweak colors in `styles.css` under `:root`.
- Edit ASCII art in header (`index.html`) and the project tiles.
- Replace placeholder links in the Contact column.
- Adjust fog wall density in `script.js` by editing `chars` and thresholds.
