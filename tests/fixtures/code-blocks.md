# Syntax Highlighting Test

Each code block below should render with syntax colors applied by highlight.js. Inline `code spans` should also be styled, but with the simpler red-monospace look (no highlighting).

## JavaScript

```javascript
function greet(name) {
    const message = `Hello, ${name}!`;
    console.log(message);
    return message;
}

greet('world');
```

## Python

```python
def fibonacci(n):
    """Yield Fibonacci numbers up to n."""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

print(list(fibonacci(100)))
```

## Bash

```bash
#!/bin/bash
# Build and deploy
set -euo pipefail

VERSION=$(git rev-parse --short HEAD)
echo "Building version $VERSION"

npm run build
aws s3 sync ./dist s3://my-bucket/
```

## JSON

```json
{
  "name": "markdown-reticulator",
  "version": "1.0.0",
  "dependencies": {
    "marked": "^15.0.12",
    "dompurify": "^3.4.3"
  }
}
```

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Example</title>
</head>
<body>
    <h1>Hello</h1>
</body>
</html>
```

## CSS

```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea, #764ba2);
}
```

## Unlabeled code block (auto-detect)

```
SELECT users.name, COUNT(orders.id) AS order_count
FROM users
LEFT JOIN orders ON orders.user_id = users.id
GROUP BY users.id
HAVING order_count > 5;
```

The block above has no language label. highlight.js should auto-detect (probably as SQL) and still apply colors.

## Inline code

Inline code like `const x = 42` or `pip install requests` should appear in monospace with the red-tinted styling — not the syntax-highlighted block styling.
