# NUOVA — Men's Luxury Wear

A standalone, responsive fashion storefront built with **HTML, CSS, and vanilla JavaScript**.

## No integrations

This project intentionally has no framework, build tool, backend, database, external API, payment provider, Shopify connection, third-party JavaScript library, or remote font dependency.

All source files and visual assets are local to this repository.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. For the best local development experience, use a simple static-file preview extension in your editor. No package installation is required.

## Features

- Responsive desktop, tablet, and mobile layouts.
- NUOVA logo and cocoa / bronze / white identity.
- Hero, category, featured collection, product, brand story, newsletter, and footer sections.
- Product category filters and search.
- Product quick-view dialog with size selection.
- Shopping bag with quantity controls, remove action, subtotal, and local browser storage.
- Scroll-reveal motion with `prefers-reduced-motion` support.
- No external services or dependencies.

## Important demo limitations

- Products, categories, and prices are sample data in `script.js`.
- The newsletter form validates locally but does not send or store emails.
- Checkout is a demonstration message only. No orders, shipping, taxes, payment processing, or customer accounts are connected.
- The shopping bag is saved only in the visitor's browser using `localStorage`.
- Product and hero visuals are original local SVG illustrations. Replace them with licensed brand photography when real product photography is ready.

## Customize products

Edit the `products` array at the top of `script.js`. Each product has:

- `id`
- `name`
- `category` (`clothing`, `shoes`, or `accessories`)
- `type`
- `price` (USD)
- `image` (local asset path)
- `badge`
- `colors`
- `description`

Add new images to `assets/` and update the corresponding `image` path.

## Publish with GitHub

Create a GitHub repository and upload all files while preserving the folder structure. The repository itself stores the website source. If you later choose to publish it as a public static site, GitHub Pages can serve this plain HTML/CSS/JS project directly; no external hosting service is required.

## Main files

- `index.html` — page structure and accessible interface.
- `styles.css` — complete design system, responsive layouts, and animations.
- `script.js` — filters, search, quick view, cart, and demo forms.
- `assets/` — logo and original local SVG artwork.
