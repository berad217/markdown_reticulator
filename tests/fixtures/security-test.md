# Security Test — XSS Payloads

This document contains intentional cross-site-scripting payloads. **Every payload below should be neutralized by DOMPurify.** If any of them executes (alert dialog, console error from a blocked script, network request to evil.example.com, etc.), the sanitization is broken and this is a critical bug.

## Plain script tag

<script>alert('XSS-FAIL-script-tag')</script>

Above this line: an inline `<script>` tag. It must not execute.

## Image with onerror handler

<img src="x" onerror="alert('XSS-FAIL-onerror')">

Above this line: a broken image whose `onerror` handler tries to fire. The handler must be stripped.

## SVG with onload

<svg onload="alert('XSS-FAIL-svg-onload')"><circle cx="10" cy="10" r="5"/></svg>

Above: an SVG with an `onload` handler.

## javascript: URL in markdown link

[Click me, I am dangerous](javascript:alert('XSS-FAIL-js-href'))

Above: the rendered link must not have a `javascript:` href. The link should either be inert, point nowhere, or be removed.

## javascript: URL in raw HTML anchor

<a href="javascript:alert('XSS-FAIL-raw-anchor')">Raw anchor</a>

## iframe

<iframe src="https://evil.example.com" width="100" height="100"></iframe>

The iframe must not appear in the rendered output. (Browsers may also block loading it, but the tag itself should be stripped.)

## Inline event handlers on a paragraph

<p onclick="alert('XSS-FAIL-onclick')">Click me</p>

The paragraph should render but the `onclick` attribute must be gone.

## Data URI script

<a href="data:text/html,<script>alert('XSS-FAIL-data-uri')</script>">Data URI link</a>

## Object / embed tags

<object data="https://evil.example.com/payload"></object>
<embed src="https://evil.example.com/payload">

## Style with expression (old IE attack, harmless today but should still be cleaned)

<div style="background:url('javascript:alert(1)')">Styled div</div>

## End of test

If the document rendered without **any** alert dialogs, the sanitizer is doing its job.

To double-check, open the browser DevTools console while rendering this file. You should see:

- No "XSS-FAIL-*" alerts
- No CSP violation errors related to the payloads above
- No network requests to `evil.example.com`
