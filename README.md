# Hagematech Calculator

A responsive scientific calculator Web Component with physical calculator style, custom gradients, custom hex colors, memory functions, keyboard support, and a bilingual Guide Book.

```html
<hagematech-calc></hagematech-calc>
```

---

## Preview

<p align="center">
  <img src="docs/images/hagematech-calc-aurora.png" alt="Hagematech Calculator Aurora" width="300" />
</p>

```html
<hagematech-calc></hagematech-calc>
```

<p align="center">
  <img src="docs/images/hagematech-calc-ocean.png" alt="Hagematech Calculator Ocean" width="300" />
</p>

```html
<hagematech-calc gradient="ocean"></hagematech-calc>
```

<p align="center">
  <img src="docs/images/hagematech-calc-custom-color.png" alt="Hagematech Calculator Custom Color" width="300" />
</p>

```html
<hagematech-calc color="#0ea5e9"></hagematech-calc>
```

<p align="center">
  <img src="docs/images/hagematech-calc-guide-book.png" alt="Hagematech Calculator Guide Book" width="300" />
</p>

---

## Features

- Scientific calculator Web Component
- Simple custom HTML tag
- Works with npm, CDN, React, Vue, Laravel, Next.js, Vite, Astro, and plain HTML
- Shadow DOM isolated style
- Physical calculator-style UI
- Responsive layout
- Custom gradient themes
- Custom hex color support
- Light and dark mode
- DEG/RAD mode
- Memory functions: `MC`, `MR`, `M+`, `M-`, `MS`
- Keyboard support
- Built-in bilingual Guide Book: English and Indonesian
- Powered by math.js

---

## Installation

You can use Hagematech Calculator with **npm** or directly from a **CDN**.

---

## Install with npm

```bash
npm install hagematech-calc
```

Import once in your JavaScript entry file:

```js
import 'hagematech-calc';
```

Use the component:

```html
<hagematech-calc></hagematech-calc>
```

---

## Use with CDN

Using jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/hagematech-calc@1.0.0"></script>

<hagematech-calc></hagematech-calc>
```

Using unpkg:

```html
<script src="https://unpkg.com/hagematech-calc@1.0.0"></script>

<hagematech-calc></hagematech-calc>
```

---

## Full HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hagematech Calculator Demo</title>
    <script src="https://cdn.jsdelivr.net/npm/hagematech-calc@1.0.0"></script>
</head>
<body>

    <h1>Hagematech Calculator Demo</h1>

    <hagematech-calc gradient="aurora"></hagematech-calc>

</body>
</html>
```

---

## Basic Usage

```html
<hagematech-calc></hagematech-calc>
```

---

## Gradient Themes

Available gradients:

- `aurora`
- `sunset`
- `ocean`
- `forest`
- `grape`
- `gold`

```html
<hagematech-calc gradient="aurora"></hagematech-calc>
<hagematech-calc gradient="sunset"></hagematech-calc>
<hagematech-calc gradient="ocean"></hagematech-calc>
<hagematech-calc gradient="forest"></hagematech-calc>
<hagematech-calc gradient="grape"></hagematech-calc>
<hagematech-calc gradient="gold"></hagematech-calc>
```

---

## Custom Color

Use any hexadecimal color.

```html
<hagematech-calc color="#0ea5e9"></hagematech-calc>
<hagematech-calc color="#dc2626"></hagematech-calc>
<hagematech-calc color="#16a34a"></hagematech-calc>
```

When the `color` attribute is provided, the calculator automatically generates matching gradients from that color.

---

## Light and Dark Mode

```html
<hagematech-calc theme="dark"></hagematech-calc>
<hagematech-calc theme="light"></hagematech-calc>
```

The calculator also includes a `LIGHT` button to switch between light and dark mode.

---

## Angle Mode

```html
<hagematech-calc angle-mode="DEG"></hagematech-calc>
<hagematech-calc angle-mode="RAD"></hagematech-calc>
```

The calculator also includes a `DEG/RAD` button.

---

## Precision

```html
<hagematech-calc precision="16"></hagematech-calc>
<hagematech-calc precision="32"></hagematech-calc>
```

---

## Multiple Calculators

Each calculator instance works independently.

```html
<hagematech-calc gradient="aurora"></hagematech-calc>
<hagematech-calc gradient="sunset"></hagematech-calc>
<hagematech-calc color="#0ea5e9"></hagematech-calc>
<hagematech-calc color="#dc2626"></hagematech-calc>
```

---

## Framework Usage

### React, Vue, Laravel, Vite, Astro

Install:

```bash
npm install hagematech-calc
```

Import:

```js
import 'hagematech-calc';
```

Use:

```html
<hagematech-calc gradient="ocean"></hagematech-calc>
```

---

## Next.js Usage

Because this package registers a browser custom element, import it on the client side.

```jsx
'use client';

import { useEffect } from 'react';

export default function Calculator() {
    useEffect(() => {
        import('hagematech-calc');
    }, []);

    return <hagematech-calc gradient="aurora"></hagematech-calc>;
}
```

---

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `gradient` | `aurora` | Built-in gradient theme |
| `color` | empty | Custom hex color |
| `theme` | `dark` | `dark` or `light` |
| `angle-mode` | `DEG` | `DEG` or `RAD` |
| `precision` | `16` | Result precision |
| `max-length` | `300` | Maximum expression length |

---

## Supported Buttons

### Basic

| Button | Function |
|---|---|
| `+` | Addition |
| `−` | Subtraction |
| `×` | Multiplication |
| `÷` | Division |
| `%` | Percent |
| `=` | Calculate |
| `AC` | Clear all |
| `CE` | Clear entry |
| `⌫` | Backspace |
| `±` | Toggle sign |

### Scientific

| Button | Function |
|---|---|
| `sin` | Sine |
| `cos` | Cosine |
| `tan` | Tangent |
| `asin` | Arc sine |
| `acos` | Arc cosine |
| `atan` | Arc tangent |
| `log` | Log base 10 |
| `ln` | Natural log |
| `√` | Square root |
| `∛` | Cube root |
| `x²` | Square |
| `xʸ` | Power |
| `1/x` | Inverse |
| `x!` | Factorial |
| `mod` | Modulo |
| `π` | Pi |
| `e` | Euler number |

### Memory

| Button | Function |
|---|---|
| `MS` | Save memory |
| `MR` | Recall memory |
| `M+` | Add to memory |
| `M-` | Subtract from memory |
| `MC` | Clear memory |

---

## Keyboard Support

| Key | Action |
|---|---|
| `0-9` | Input number |
| `+` `-` `*` `/` | Operators |
| `.` | Decimal |
| `%` | Percent |
| `Enter` | Calculate |
| `Backspace` | Delete |
| `Escape` | Clear or close Guide Book |

---

## Guide Book

Click the underlined **Guide Book** link at the bottom of the calculator.

The guide includes:

- English guide
- Indonesian guide
- Basic calculation instructions
- Scientific function instructions
- Memory and style instructions

---

## Calculate Event

The component dispatches a `calculate` event after a successful calculation.

```html
<hagematech-calc id="calc"></hagematech-calc>

<script>
document.getElementById('calc').addEventListener('calculate', function (event) {
    console.log(event.detail.expression);
    console.log(event.detail.result);
});
</script>
```

Example event detail:

```js
{
    expression: "2+2",
    result: "4"
}
```

---

## Browser Support

Works in modern browsers that support Web Components and Shadow DOM:

- Chrome
- Edge
- Firefox
- Safari

---

## Package Recommendation

```json
{
  "name": "hagematech-calc",
  "version": "1.0.0",
  "description": "A modern scientific calculator Web Component with gradients, memory functions, keyboard support, and bilingual guide book.",
  "main": "hagematech-calc.js",
  "unpkg": "hagematech-calc.js",
  "jsdelivr": "hagematech-calc.js",
  "files": [
    "hagematech-calc.js",
    "README.md",
    "LICENSE",
    "docs"
  ],
  "keywords": [
    "calculator",
    "scientific-calculator",
    "web-component",
    "custom-element",
    "math",
    "mathjs",
    "shadow-dom",
    "hagematech"
  ],
  "author": "Hagematech",
  "license": "MIT"
}
```

---

## License

This project is open source and free to use.

You are free to use Hagematech Calculator for personal, educational, open source, and commercial projects.

Attribution is appreciated but not required.

---

## Contact

For questions, feedback, or collaboration, contact:

- Email: your-email@example.com
- Website: https://yourdomain.com
- GitHub: https://github.com/your-username

---

## Version

Current version:

```txt
1.0.0
```

---

## Quick Copy Paste

### npm

```bash
npm install hagematech-calc
```

```js
import 'hagematech-calc';
```

```html
<hagematech-calc></hagematech-calc>
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/hagematech-calc@1.0.0"></script>

<hagematech-calc></hagematech-calc>
```

### Gradient

```html
<hagematech-calc gradient="ocean"></hagematech-calc>
```

### Custom Color

```html
<hagematech-calc color="#0ea5e9"></hagematech-calc>
```