// DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const pasteToggle = document.getElementById('pasteToggle');
const pastePanel = document.getElementById('pastePanel');
const pasteTextarea = document.getElementById('pasteTextarea');
const pasteRenderBtn = document.getElementById('pasteRenderBtn');
const pasteCancelBtn = document.getElementById('pasteCancelBtn');
const pasteToggleLabel = document.getElementById('pasteToggleLabel');
const themeToggle = document.getElementById('themeToggle');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const printBtn = document.getElementById('printBtn');

// Store the processed HTML and original markdown for export and source-view.
let processedHTML = '';
let originalMarkdown = '';
let originalFileName = '';
let viewMode = 'rendered'; // 'rendered' | 'source'

// Browsers use document.title as the suggested filename when saving to PDF
// from the print dialog. Capture the default so clear can restore it.
const DEFAULT_TITLE = document.title;

// Randomize visible text on page load
function initializeRidiculousness() {
    document.getElementById('mainTitle').textContent = '📝 ' + getRandomReference('titles');
    document.getElementById('mainSubtitle').textContent = getRandomReference('subtitles');

    document.getElementById('dropZoneHeading').textContent = getRandomReference('dropZoneHeadings');
    document.getElementById('dropZoneSubtext').innerHTML =
        getRandomReference('dropZoneSubtext') + '<br><small>Supports all standard markdown syntax (and bad jokes)</small>';

    document.getElementById('emptyStateMessage').textContent = getRandomReference('emptyStates');

    document.getElementById('copyBtn').innerHTML = '📋 ' + getRandomReference('buttonLabels', 'copy');
    document.getElementById('saveBtn').innerHTML = '💾 ' + getRandomReference('buttonLabels', 'save');
    document.getElementById('clearBtn').innerHTML = '🗑️ ' + getRandomReference('buttonLabels', 'clear');
}

// Configure marked.js (v15) for better HTML output
marked.setOptions({
    breaks: true,   // Convert \n to <br>
    gfm: true       // Enable GitHub Flavored Markdown
});

// Convert markdown to safe HTML. DOMPurify strips <script>, on*= handlers,
// javascript: URLs, etc., so we can render markdown from untrusted sources.
function markdownToSafeHTML(markdown) {
    const rawHtml = marked.parse(markdown);
    return DOMPurify.sanitize(rawHtml);
}

// Drag and drop event handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Click to browse
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Shared render pipeline. Used by both file drop and paste-text inputs.
function renderMarkdown(markdownText, displayName) {
    try {
        const htmlContent = markdownToSafeHTML(markdownText);

        processedHTML = htmlContent;
        originalMarkdown = markdownText;
        originalFileName = displayName.replace(/\.[^/.]+$/, "");
        viewMode = 'rendered';
        updateViewToggleLabel();
        document.title = originalFileName || DEFAULT_TITLE;

        displayRenderedContent(htmlContent, displayName);

        dropZone.classList.add('compact');
        hidePastePanel();
        copyBtn.style.display = 'block';
        saveBtn.style.display = 'block';
        clearBtn.style.display = 'block';
        viewToggleBtn.style.display = 'block';
        printBtn.style.display = 'block';
    } catch (error) {
        showStatus(getRandomReference('errorMessages') + ': ' + error.message, 'error');
        console.error('Render error:', error);
    }
}

// File input handler
function handleFile(file) {
    const validExtensions = ['.md', '.markdown', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        showStatus(getRandomReference('errorMessages'), 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => renderMarkdown(e.target.result, file.name);
    reader.onerror = () => showStatus(getRandomReference('errorMessages'), 'error');
    reader.readAsText(file);
}

function displayRenderedContent(htmlContent, fileName) {
    // Build the banner with DOM APIs so the filename can't be HTML-injected.
    output.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'status-message status-success';
    banner.textContent = `✅ ${getRandomReference('successMessages')} — "${fileName}"`;
    output.appendChild(banner);

    const rendered = document.createElement('div');
    rendered.className = 'rendered-content';
    // htmlContent is already DOMPurify-sanitized.
    rendered.innerHTML = htmlContent;
    output.appendChild(rendered);

    applySyntaxHighlighting(rendered);
    warnIfRelativeImages(rendered);
    buildTableOfContents(rendered);
}

// Highlight every <pre><code> block inside a container using highlight.js.
// Marked tags code blocks with language-X classes; highlight.js uses those for
// language selection and falls back to auto-detect when absent.
function applySyntaxHighlighting(container) {
    if (typeof hljs === 'undefined') return;
    container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// For paste-text input we don't have a source filename. Try to extract one from
// the document's first ATX H1, otherwise stamp the time. Capped at 60 chars to
// keep download dialogs sane.
function deriveNameFromMarkdown(markdownText) {
    const h1Match = markdownText.match(/^#\s+(.+?)\s*#*\s*$/m);
    if (h1Match) {
        const slug = slugify(h1Match[1]).slice(0, 60).replace(/-+$/, '');
        if (slug) return `${slug}.md`;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `pasted-${stamp}.md`;
}

// Build a "On this page" table of contents from h1/h2/h3 headings inside the
// rendered container. Skipped for documents with fewer than 3 headings — TOC
// adds clutter when there isn't enough to navigate.
function buildTableOfContents(container) {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3'));
    if (headings.length < 3) return;

    const usedIds = new Set();
    const entries = headings.map((heading) => {
        let id = slugify(heading.textContent || 'section');
        if (!id) id = 'section';
        let candidate = id;
        let n = 2;
        while (usedIds.has(candidate)) {
            candidate = `${id}-${n}`;
            n += 1;
        }
        usedIds.add(candidate);
        heading.id = candidate;
        return {
            id: candidate,
            text: heading.textContent || '',
            level: parseInt(heading.tagName.slice(1), 10),
        };
    });

    const minLevel = Math.min(...entries.map((e) => e.level));

    const toc = document.createElement('details');
    toc.className = 'toc';
    toc.open = true;

    const summary = document.createElement('summary');
    summary.textContent = 'On this page';
    toc.appendChild(summary);

    const list = document.createElement('ul');
    list.className = 'toc-list';
    entries.forEach((entry) => {
        const li = document.createElement('li');
        li.className = `toc-item toc-level-${entry.level - minLevel}`;
        const link = document.createElement('a');
        link.href = `#${entry.id}`;
        link.textContent = entry.text;
        li.appendChild(link);
        list.appendChild(li);
    });
    toc.appendChild(list);

    output.insertBefore(toc, container);
}

// Detect <img> tags with relative src and insert a friendly notice. Browsers
// block loading local files referenced by file:// pages, so a markdown file
// using `![](./diagram.png)` would show broken images with no explanation.
function warnIfRelativeImages(container) {
    const imgs = container.querySelectorAll('img');
    if (!imgs.length) return;

    let relativeCount = 0;
    imgs.forEach((img) => {
        // Use getAttribute, not .src — .src resolves to an absolute URL.
        const raw = (img.getAttribute('src') || '').trim();
        if (!raw) return;
        const isExternal = /^(https?:|data:|blob:|\/\/)/i.test(raw);
        if (!isExternal) relativeCount += 1;
    });

    if (!relativeCount) return;

    const notice = document.createElement('div');
    notice.className = 'status-message status-info';
    const label = relativeCount === 1 ? 'image' : 'images';
    notice.innerHTML =
        `<strong>Heads up:</strong> this document references ${relativeCount} local ${label} ` +
        `(e.g. <code>./picture.png</code>). Browsers block local images for security, ` +
        `so they'll appear broken unless the file is hosted on a web server.`;
    // Insert above the rendered content (after the success banner if present).
    output.insertBefore(notice, container);
}

function showStatus(message, type) {
    const existingStatus = output.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;

    output.insertBefore(statusDiv, output.firstChild);

    if (type === 'error') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

// Paste-text input handlers
function showPastePanel() {
    pastePanel.hidden = false;
    pasteToggleLabel.textContent = 'Hide paste area';
    pasteTextarea.focus();
}

function hidePastePanel() {
    pastePanel.hidden = true;
    pasteToggleLabel.textContent = 'Or paste markdown text';
}

pasteToggle.addEventListener('click', () => {
    if (pastePanel.hidden) {
        showPastePanel();
    } else {
        hidePastePanel();
    }
});

pasteCancelBtn.addEventListener('click', () => {
    pasteTextarea.value = '';
    hidePastePanel();
});

pasteRenderBtn.addEventListener('click', () => {
    const text = pasteTextarea.value.trim();
    if (!text) {
        pasteTextarea.focus();
        return;
    }
    renderMarkdown(text, deriveNameFromMarkdown(text));
});

// Ctrl/Cmd+Enter inside the textarea triggers render
pasteTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        pasteRenderBtn.click();
    }
});

// Copy to clipboard — rich format. Pasting into Gmail/Word/Slack yields the
// formatted document; pasting into a code editor yields the markdown source.
copyBtn.addEventListener('click', async () => {
    if (!processedHTML) return;

    const htmlDoc = createCompleteHTMLDocument(processedHTML);
    const plainText = originalMarkdown || htmlDoc;

    try {
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.write === 'function' &&
            typeof ClipboardItem !== 'undefined'
        ) {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([htmlDoc], { type: 'text/html' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain' })
                })
            ]);
            showStatus('Copied — paste into email/Word for formatted, or a text editor for the source.', 'success');
        } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(htmlDoc);
            showStatus('Copied as HTML text.', 'success');
        } else {
            throw new Error('Clipboard API not available in this browser. Use Save instead.');
        }

        const originalLabel = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = originalLabel; }, 2000);
    } catch (error) {
        const msg = (error && error.message) ? error.message : String(error);
        showStatus(`Copy failed: ${msg}`, 'error');
        console.error('Clipboard error:', error);
    }
});

// Save as HTML file
saveBtn.addEventListener('click', () => {
    try {
        const completeHTML = createCompleteHTMLDocument(processedHTML);
        const blob = new Blob([completeHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `${originalFileName || 'converted-markdown'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('HTML file downloaded!', 'success');
    } catch (error) {
        showStatus(getRandomReference('errorMessages'), 'error');
        console.error('Save error:', error);
    }
});

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Create a complete, standalone HTML document for export
function createCompleteHTMLDocument(content) {
    const title = escapeHtml(originalFileName || 'Converted Markdown');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
            background: #fff;
        }

        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }

        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }

        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            color: #e74c3c;
            font-family: 'Monaco', 'Consolas', monospace;
        }

        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
        }

        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }

        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #7f8c8d;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
        }

        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}

// Clear/reset
clearBtn.addEventListener('click', () => {
    dropZone.classList.remove('compact');
    copyBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    clearBtn.style.display = 'none';

    processedHTML = '';
    originalMarkdown = '';
    originalFileName = '';
    viewMode = 'rendered';
    fileInput.value = '';
    pasteTextarea.value = '';
    hidePastePanel();
    viewToggleBtn.style.display = 'none';
    printBtn.style.display = 'none';
    document.title = DEFAULT_TITLE;

    output.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #a0aec0;">
            <div style="font-size: 3em; margin-bottom: 20px;">✨</div>
            <p>${getRandomReference('emptyStates')}</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Ready to make your markdown human-readable!</p>
        </div>
    `;

    const originalText = clearBtn.textContent;
    clearBtn.textContent = '✅ Cleared!';
    setTimeout(() => {
        clearBtn.textContent = originalText;
    }, 1000);
});

// ----- View toggle (rendered <-> source) -----
function updateViewToggleLabel() {
    viewToggleBtn.textContent = viewMode === 'rendered'
        ? '📝 View source'
        : '👁️ View rendered';
}

viewToggleBtn.addEventListener('click', () => {
    if (!processedHTML && !originalMarkdown) return;
    viewMode = viewMode === 'rendered' ? 'source' : 'rendered';
    updateViewToggleLabel();

    if (viewMode === 'source') {
        output.innerHTML = '';
        const pre = document.createElement('pre');
        pre.className = 'source-view';
        pre.textContent = originalMarkdown;
        output.appendChild(pre);
    } else {
        // Re-render from stored markdown so any post-processing re-runs.
        displayRenderedContent(processedHTML, originalFileName || 'document');
    }
});

// ----- Print / Save as PDF -----
printBtn.addEventListener('click', () => {
    // Bounce back to rendered view first so source pre-blocks don't get printed.
    if (viewMode !== 'rendered') {
        viewMode = 'rendered';
        updateViewToggleLabel();
        displayRenderedContent(processedHTML, originalFileName || 'document');
    }

    // Force light theme for print/PDF output so the result is ink-friendly
    // regardless of the user's current viewing theme. Restore after.
    const previousTheme = document.documentElement.getAttribute('data-theme');
    if (previousTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        const restore = () => {
            document.documentElement.setAttribute('data-theme', 'dark');
            window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
    }

    window.print();
});

// ----- Theme handling -----
const THEME_STORAGE_KEY = 'markdown-reticulator.theme';

function getInitialTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch (_) {
        // localStorage can throw in some sandboxed contexts; fall through.
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (_) {
        // Persistence is best-effort.
    }
});

// Apply theme immediately so first paint is correct.
applyTheme(getInitialTheme());

// Boot
initializeRidiculousness();
console.log('🚀 The Markdown Whisperer has awakened!');
console.log('📚 Supported features: GFM, tables, code blocks, and questionable humor');
console.log('🎭 References randomized. Your spouse will either laugh or file for divorce.');
