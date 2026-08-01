# Continuum

Continuum is an Obsidian desktop plugin that gathers live notes into one persistent, ordered reading flow.

## Use

- Run **Continuum: Add current note** to collect the active Markdown note.
- Run **Continuum: Focus Continuum** to open or return to the Continuum.
- Select an entry's source path to reopen it in Live Preview.

Continuum opens in the right sidebar initially and remembers whether you last placed it in the left sidebar, right sidebar, or main area. Closing it is intentional; it stays closed after restart until a command reveals it.

## Development

```sh
npm install
npm test
npm run build
npm run lint
```

Install `main.js`, `manifest.json`, and `styles.css` in `<Vault>/.obsidian/plugins/continuum/` to test in Obsidian.
