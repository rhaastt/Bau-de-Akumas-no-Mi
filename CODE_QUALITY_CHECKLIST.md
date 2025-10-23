# 📋 Code Quality Checklist for Beginners

This checklist helps maintain clean, readable, and maintainable code for HTML, CSS, and JavaScript projects. Use this as a reference when writing or reviewing code.

## 🏗️ **HTML Structure & Semantics**

### ✅ **Document Structure**
- [ ] Use proper DOCTYPE declaration (`<!DOCTYPE html>`)
- [ ] Include `<html>` tag with `lang` attribute (e.g., `lang="pt-br"` or `lang="en"`)
- [ ] Include `<meta charset="UTF-8">` in the head
- [ ] Include viewport meta tag for responsive design
- [ ] Use meaningful `<title>` that describes the page content
- [ ] Structure content with semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`)

### ✅ **Accessibility & Best Practices**
- [ ] All images have descriptive `alt` attributes
- [ ] Use proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- [ ] Include `aria-label` or `aria-labelledby` for complex UI elements
- [ ] Use `role` attributes when semantic HTML isn't sufficient
- [ ] Ensure keyboard navigation works properly
- [ ] Use `aria-live` regions for dynamic content updates

### ✅ **Code Organization**
- [ ] Indent code consistently (2 or 4 spaces, not tabs)
- [ ] Use meaningful class and ID names (descriptive, not generic)
- [ ] Avoid inline styles (use CSS classes instead)
- [ ] Close all tags properly
- [ ] No empty elements without proper structure

### ✅ **Performance**
- [ ] Use `loading="lazy"` for images below the fold
- [ ] Use `decoding="async"` for images
- [ ] Use `fetchpriority="high"` only for critical images
- [ ] Optimize image formats (WebP when possible)

---

## 🎨 **CSS Styling & Organization**

### ✅ **File Structure**
- [ ] Use a CSS reset or normalize file
- [ ] Organize CSS into logical sections with comments
- [ ] Use consistent naming conventions (BEM, camelCase, or kebab-case)
- [ ] Group related styles together
- [ ] Use CSS custom properties (variables) for repeated values

### ✅ **Responsive Design**
- [ ] Use relative units (rem, em, %, vw, vh) instead of fixed pixels
- [ ] Use `clamp()` for fluid typography and spacing
- [ ] Test on different screen sizes
- [ ] Use mobile-first approach
- [ ] Include proper media queries

### ✅ **Code Quality**
- [ ] No duplicate CSS rules
- [ ] Use shorthand properties when appropriate
- [ ] Avoid `!important` unless absolutely necessary
- [ ] Use consistent spacing and indentation
- [ ] Group selectors logically
- [ ] Use meaningful class names that describe purpose, not appearance

### ✅ **Performance & Best Practices**
- [ ] Minimize CSS specificity conflicts
- [ ] Use efficient selectors (avoid deep nesting)
- [ ] Remove unused CSS
- [ ] Use CSS Grid and Flexbox appropriately
- [ ] Include `prefers-reduced-motion` media queries for animations

---

## ⚡ **JavaScript Logic & Structure**

### ✅ **Code Organization**
- [ ] Use meaningful variable and function names
- [ ] Declare variables with `const` or `let` (avoid `var`)
- [ ] Use `const` for values that won't change
- [ ] Group related functions together
- [ ] Use consistent indentation (2 or 4 spaces)
- [ ] Add comments for complex logic

### ✅ **Function Design**
- [ ] Functions should do one thing well (single responsibility)
- [ ] Use descriptive function names that explain what they do
- [ ] Keep functions small and focused
- [ ] Use parameters instead of global variables
- [ ] Return meaningful values from functions

### ✅ **Error Handling**
- [ ] Check if DOM elements exist before using them
- [ ] Use try-catch blocks for operations that might fail
- [ ] Provide meaningful error messages
- [ ] Handle edge cases gracefully
- [ ] Validate user input

### ✅ **Event Handling**
- [ ] Use `addEventListener` instead of inline event handlers
- [ ] Remove event listeners when no longer needed
- [ ] Use event delegation for dynamic content
- [ ] Handle keyboard events for accessibility
- [ ] Prevent default behavior when appropriate

### ✅ **DOM Manipulation**
- [ ] Cache DOM elements in variables when used multiple times
- [ ] Use `textContent` instead of `innerHTML` for text
- [ ] Escape user input when using `innerHTML`
- [ ] Use `classList` methods instead of `className`
- [ ] Batch DOM updates to improve performance

### ✅ **Modern JavaScript Features**
- [ ] Use template literals for string concatenation
- [ ] Use arrow functions when appropriate
- [ ] Use destructuring for objects and arrays
- [ ] Use spread operator for copying arrays/objects
- [ ] Use `const` and `let` instead of `var`

---

## 🔧 **General Code Quality**

### ✅ **Readability**
- [ ] Use consistent naming conventions throughout the project
- [ ] Write self-documenting code with clear variable names
- [ ] Add comments for complex business logic
- [ ] Use whitespace to separate logical sections
- [ ] Avoid deeply nested code (max 3-4 levels)

### ✅ **Maintainability**
- [ ] Keep functions and files focused on single responsibilities
- [ ] Avoid code duplication (DRY principle)
- [ ] Use configuration objects for complex setups
- [ ] Make code modular and reusable
- [ ] Keep dependencies minimal

### ✅ **Performance**
- [ ] Minimize DOM queries
- [ ] Use `requestAnimationFrame` for animations
- [ ] Debounce or throttle frequent events
- [ ] Lazy load non-critical resources
- [ ] Optimize images and assets

### ✅ **Security**
- [ ] Sanitize user input
- [ ] Use HTTPS for external resources
- [ ] Avoid `eval()` and similar dangerous functions
- [ ] Validate data on both client and server side
- [ ] Use Content Security Policy when possible

---

## 🐛 **Common Issues to Avoid**

### ❌ **HTML Issues**
- Missing alt attributes on images
- Using `<div>` for everything instead of semantic elements
- Inline styles mixed with CSS
- Missing closing tags
- Improper nesting of elements

### ❌ **CSS Issues**
- Overly specific selectors
- Using `!important` unnecessarily
- Not using CSS Grid or Flexbox when appropriate
- Hard-coded pixel values instead of relative units
- Duplicate or conflicting styles

### ❌ **JavaScript Issues**
- Using `var` instead of `const`/`let`
- Not checking if elements exist before using them
- Global variables instead of proper scoping
- Not handling errors
- Mixing concerns in functions

---

## 📝 **Code Review Checklist**

Before submitting code, ask yourself:

1. **Is the code easy to read and understand?**
2. **Are variable and function names descriptive?**
3. **Is the code organized logically?**
4. **Are there any obvious bugs or potential issues?**
5. **Is the code accessible to users with disabilities?**
6. **Does the code follow the project's conventions?**
7. **Are there any performance concerns?**
8. **Is error handling appropriate?**
9. **Are there any security vulnerabilities?**
10. **Is the code maintainable for future developers?**

---

## 🚀 **Quick Reference**

### **Good Examples:**
```html
<!-- Good: Semantic HTML with proper attributes -->
<button id="open-chest" class="btn btn-primary" aria-label="Open treasure chest">
  Open Chest
</button>

<!-- Good: Proper image with alt text -->
<img src="treasure.webp" alt="Golden treasure chest" loading="lazy" decoding="async">
```

```css
/* Good: Using CSS custom properties and relative units */
:root {
  --primary-color: #007bff;
  --spacing-unit: 1rem;
}

.btn {
  padding: var(--spacing-unit);
  background-color: var(--primary-color);
  border-radius: 0.5rem;
}
```

```javascript
// Good: Clear function with error handling
function openChest() {
  const chestButton = document.getElementById('open-chest');
  if (!chestButton) {
    console.error('Chest button not found');
    return;
  }
  
  chestButton.addEventListener('click', handleChestClick);
}
```

### **Bad Examples:**
```html
<!-- Bad: Generic div, no alt text, inline styles -->
<div onclick="openChest()" style="background: blue;">Open</div>
<img src="treasure.webp">
```

```css
/* Bad: Hard-coded values, poor naming */
.blue-button {
  padding: 16px;
  background: #0000ff;
  border-radius: 8px;
}
```

```javascript
// Bad: Global variable, no error checking
var button = document.getElementById('btn');
button.onclick = function() { /* ... */ };
```

---

*Remember: Clean code is not just about making it work, but making it easy to understand, maintain, and extend. When in doubt, prioritize readability over cleverness!*