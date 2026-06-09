// DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const pasteTextarea = document.getElementById('pasteTextarea');
const pasteRenderBtn = document.getElementById('pasteRenderBtn');
const themeToggle = document.getElementById('themeToggle');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const printBtn = document.getElementById('printBtn');
const saveMdBtn = document.getElementById('saveMdBtn');
const mainContent = document.getElementById('mainContent');
const filePanel = document.getElementById('filePanel');
const filePanelTitle = document.getElementById('filePanelTitle');
const fileList = document.getElementById('fileList');
const selectAllBtn = document.getElementById('selectAllBtn');
const combineBtn = document.getElementById('combineBtn');

// Store the processed HTML and original markdown for export and source-view.
// These represent "what is currently rendered" — a single selected document or
// the combined view — so the export buttons, TOC, and source toggle don't need
// to know which it is.
let processedHTML = '';
let originalMarkdown = '';
let originalFileName = '';
let viewMode = 'rendered'; // 'rendered' | 'source'

// The loaded-file collection. Each entry: { id, name, markdown, checked }.
// `documents` is the source of truth; rendering reads from it. `activeDocId`
// is the single doc on screen, or null when the combined view is showing.
let documents = [];
let activeDocId = null;     // id of the single document on screen, or null
let combinedView = false;   // true when the combined document is on screen
let docIdCounter = 0;

// Browsers use document.title as the suggested filename when saving to PDF
// from the print dialog. Capture the default so clear can restore it.
const DEFAULT_TITLE = document.title;

// Randomize visible text on page load
function initializeRidiculousness() {
    document.getElementById('mainTitle').textContent = '📝 ' + getRandomReference('titles');
    document.getElementById('mainSubtitle').textContent = getRandomReference('subtitles');

    document.getElementById('dropZoneHeading').textContent = getRandomReference('dropZoneHeadings');
    document.getElementById('dropZoneSubtext').innerHTML =
        getRandomReference('dropZoneSubtext') + '<br><small>Drop one file, several, or a whole folder</small>';

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
    ingestDataTransfer(e.dataTransfer);
});

// Click to browse
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
    // Reset so picking the same file(s) again still fires a change event.
    fileInput.value = '';
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
        copyBtn.style.display = 'block';
        saveBtn.style.display = 'block';
        clearBtn.style.display = 'block';
        viewToggleBtn.style.display = 'block';
        printBtn.style.display = 'block';
        saveMdBtn.style.display = 'block';
    } catch (error) {
        showStatus(getRandomReference('errorMessages') + ': ' + error.message, 'error');
        console.error('Render error:', error);
    }
}

// ----- File ingestion (multi-file + folder) -----

const VALID_EXTENSIONS = ['.md', '.markdown', '.txt'];

function isValidMarkdownFile(name) {
    const ext = '.' + name.split('.').pop().toLowerCase();
    return VALID_EXTENSIONS.includes(ext);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(reader.error || new Error('read failed'));
        reader.readAsText(file);
    });
}

// Handle a drop. When the browser exposes the entries API we can read dropped
// folders; otherwise fall back to the flat FileList. Folder reads are flat —
// top-level files plus one level into each dropped directory, no recursion.
function ingestDataTransfer(dataTransfer) {
    const items = dataTransfer.items;
    const supportsEntries =
        items && items.length && typeof items[0].webkitGetAsEntry === 'function';

    if (!supportsEntries) {
        addFiles(Array.from(dataTransfer.files || []));
        return;
    }

    // webkitGetAsEntry must be called synchronously — the items list is cleared
    // once this handler returns, but the entry objects stay valid afterward.
    const entries = [];
    for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
    }
    if (!entries.length) {
        addFiles(Array.from(dataTransfer.files || []));
        return;
    }

    collectFilesFromEntries(entries)
        .then((files) => addFiles(files))
        .catch((err) => {
            console.error('Folder read error:', err);
            showStatus(getRandomReference('errorMessages'), 'error');
        });
}

function collectFilesFromEntries(entries) {
    const tasks = entries.map((entry) => {
        if (entry.isFile) {
            return entryToFile(entry).then((f) => (f ? [f] : []));
        }
        if (entry.isDirectory) {
            return readAllDirEntries(entry.createReader()).then((children) => {
                const fileEntries = children.filter((c) => c.isFile);
                return Promise.all(fileEntries.map(entryToFile))
                    .then((files) => files.filter(Boolean));
            });
        }
        return Promise.resolve([]);
    });
    return Promise.all(tasks).then((groups) => groups.flat());
}

// A directory reader returns entries in batches; keep reading until it's empty.
function readAllDirEntries(reader) {
    return new Promise((resolve, reject) => {
        const all = [];
        const readBatch = () => {
            reader.readEntries((batch) => {
                if (!batch.length) {
                    resolve(all);
                    return;
                }
                all.push(...batch);
                readBatch();
            }, reject);
        };
        readBatch();
    });
}

function entryToFile(fileEntry) {
    return new Promise((resolve) => {
        fileEntry.file((file) => resolve(file), () => resolve(null));
    });
}

// Read, validate, and add a batch of files to the document collection.
async function addFiles(fileArray) {
    const valid = fileArray.filter((f) => isValidMarkdownFile(f.name));
    const skipped = fileArray.length - valid.length;

    if (!valid.length) {
        if (fileArray.length) showStatus(getRandomReference('errorMessages'), 'error');
        return;
    }

    const newDocs = [];
    for (const file of valid) {
        try {
            const text = await readFileAsText(file);
            newDocs.push(makeDoc(file.name, text));
        } catch (err) {
            console.error('Read error for', file.name, err);
        }
    }
    if (!newDocs.length) {
        showStatus(getRandomReference('errorMessages'), 'error');
        return;
    }

    // Alphabetical (numeric-aware) so a folder of 01-, 02-, ... lands in order.
    newDocs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    documents.push(...newDocs);

    // Show the first newly-added file if nothing is on screen yet.
    if (activeDocId === null && !combinedView) {
        selectDocument(newDocs[0].id);
    } else {
        renderFilePanel();
    }

    if (skipped > 0) {
        const n = newDocs.length;
        showStatus(
            `Added ${n} file${n === 1 ? '' : 's'}; skipped ${skipped} non-markdown file${skipped === 1 ? '' : 's'}.`,
            'info'
        );
    }
}

function makeDoc(name, markdown) {
    docIdCounter += 1;
    return { id: docIdCounter, name, markdown, checked: true };
}

// Add a single document (used by the paste-text input) and view it.
function addDocument(name, markdown) {
    const doc = makeDoc(name, markdown);
    documents.push(doc);
    selectDocument(doc.id);
    return doc;
}

// ----- Document selection, ordering, removal -----

function selectDocument(id) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    activeDocId = id;
    combinedView = false;
    renderMarkdown(doc.markdown, doc.name);
    renderFilePanel();
}

function moveDocument(id, direction) {
    const i = documents.findIndex((d) => d.id === id);
    if (i === -1) return;
    const j = i + direction;
    if (j < 0 || j >= documents.length) return;
    [documents[i], documents[j]] = [documents[j], documents[i]];
    renderFilePanel();
    // Reflect the new order in the combined view if it's showing.
    if (combinedView) renderCombined();
}

function removeDocument(id) {
    const i = documents.findIndex((d) => d.id === id);
    if (i === -1) return;
    documents.splice(i, 1);

    if (!documents.length) {
        resetToEmpty();
        return;
    }

    const neighbor = documents[Math.min(i, documents.length - 1)];

    if (combinedView) {
        const checkedCount = documents.filter((d) => d.checked).length;
        if (checkedCount >= 2) {
            renderFilePanel();
            renderCombined();
        } else {
            // Not enough left to combine — drop back to a single document.
            selectDocument(neighbor.id);
        }
        return;
    }

    if (activeDocId === id) {
        selectDocument(neighbor.id);
    } else {
        renderFilePanel();
    }
}

// ----- Combine -----

// Join the checked documents into one markdown source. Each file gets an H1 of
// its name and a --- rule between files, so the combined TOC sections by file.
function buildCombinedMarkdown(docs) {
    return docs
        .map((doc) => {
            const title = doc.name.replace(/\.[^/.]+$/, '');
            return `# ${title}\n\n${doc.markdown.trim()}`;
        })
        .join('\n\n---\n\n') + '\n';
}

function renderCombined() {
    const checked = documents.filter((d) => d.checked);
    if (checked.length < 2) return;
    combinedView = true;
    activeDocId = null;
    renderMarkdown(buildCombinedMarkdown(checked), 'combined.md');
    renderFilePanel();
}

// ----- Sidebar file panel -----

function updateLayout() {
    mainContent.classList.toggle('has-docs', documents.length > 0);
}

function updateCombineButton() {
    const checkedCount = documents.filter((d) => d.checked).length;
    combineBtn.disabled = checkedCount < 2;
    combineBtn.classList.toggle('active', combinedView);
    combineBtn.textContent =
        checkedCount >= 2 ? `🧩 Combine ${checkedCount} files` : '🧩 Combine selected';
}

function renderFilePanel() {
    updateLayout();

    if (!documents.length) {
        filePanel.hidden = true;
        fileList.innerHTML = '';
        return;
    }

    filePanel.hidden = false;
    filePanelTitle.textContent =
        documents.length === 1 ? '1 file' : `${documents.length} files`;
    selectAllBtn.textContent = documents.every((d) => d.checked) ? 'Select none' : 'Select all';

    fileList.innerHTML = '';
    documents.forEach((doc, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        if (!combinedView && doc.id === activeDocId) li.classList.add('active');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-check';
        checkbox.checked = doc.checked;
        checkbox.title = 'Include when combining';
        checkbox.addEventListener('change', () => {
            doc.checked = checkbox.checked;
            selectAllBtn.textContent =
                documents.every((d) => d.checked) ? 'Select none' : 'Select all';
            updateCombineButton();
        });
        li.appendChild(checkbox);

        const nameBtn = document.createElement('button');
        nameBtn.type = 'button';
        nameBtn.className = 'file-name';
        nameBtn.textContent = doc.name;
        nameBtn.title = doc.name;
        nameBtn.addEventListener('click', () => selectDocument(doc.id));
        li.appendChild(nameBtn);

        const controls = document.createElement('div');
        controls.className = 'file-controls';

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'file-ctrl';
        upBtn.textContent = '↑';
        upBtn.title = 'Move up';
        upBtn.disabled = index === 0;
        upBtn.addEventListener('click', () => moveDocument(doc.id, -1));
        controls.appendChild(upBtn);

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'file-ctrl';
        downBtn.textContent = '↓';
        downBtn.title = 'Move down';
        downBtn.disabled = index === documents.length - 1;
        downBtn.addEventListener('click', () => moveDocument(doc.id, 1));
        controls.appendChild(downBtn);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-ctrl file-remove';
        removeBtn.textContent = '✕';
        removeBtn.title = 'Remove from list';
        removeBtn.addEventListener('click', () => removeDocument(doc.id));
        controls.appendChild(removeBtn);

        li.appendChild(controls);
        fileList.appendChild(li);
    });

    updateCombineButton();
}

selectAllBtn.addEventListener('click', () => {
    const allChecked = documents.length > 0 && documents.every((d) => d.checked);
    documents.forEach((d) => { d.checked = !allChecked; });
    renderFilePanel();
});

combineBtn.addEventListener('click', renderCombined);

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

    applyMermaidDiagrams(rendered);
    applySyntaxHighlighting(rendered);
    warnIfRelativeImages(rendered);
    buildTableOfContents(rendered);
}

// Convert ```mermaid code blocks into rendered diagrams. Runs before
// applySyntaxHighlighting so highlight.js doesn't try to colorize the source.
// Each diagram's original source is stashed on data-mermaid-source so we can
// re-render with new colors when the user toggles the theme.
function applyMermaidDiagrams(container) {
    if (typeof mermaid === 'undefined') return;
    const blocks = container.querySelectorAll('pre code.language-mermaid');
    if (!blocks.length) return;

    blocks.forEach((block) => {
        const source = block.textContent;
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid';
        wrapper.dataset.mermaidSource = source;
        wrapper.textContent = source;
        const pre = block.parentElement;
        if (pre && pre.parentElement) {
            pre.parentElement.replaceChild(wrapper, pre);
        }
    });

    initializeMermaid();
    mermaid
        .run({ nodes: container.querySelectorAll('.mermaid') })
        .catch((err) => { console.error('Mermaid render error:', err); });
}

function initializeMermaid() {
    if (typeof mermaid === 'undefined') return;
    const theme = document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'default';
    mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'strict',
        fontFamily: 'inherit'
    });
}

// Re-render existing diagrams when the theme changes so their colors match
// the page. Mermaid marks rendered nodes with data-processed; we clear that
// and reset the inner text to the saved source before re-running.
function rerenderMermaidForTheme() {
    if (typeof mermaid === 'undefined') return;
    const diagrams = document.querySelectorAll('.mermaid[data-mermaid-source]');
    if (!diagrams.length) return;

    diagrams.forEach((div) => {
        div.removeAttribute('data-processed');
        div.innerHTML = '';
        div.textContent = div.dataset.mermaidSource;
    });

    initializeMermaid();
    mermaid
        .run({ nodes: diagrams })
        .catch((err) => { console.error('Mermaid re-render error:', err); });
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

// Paste-text input handlers. The paste area is always visible (thin), so there
// is no panel to show or hide — Render turns the text into a document.
pasteRenderBtn.addEventListener('click', () => {
    const text = pasteTextarea.value.trim();
    if (!text) {
        pasteTextarea.focus();
        return;
    }
    // Pasted text becomes a document in the list like any dropped file.
    addDocument(deriveNameFromMarkdown(text), text);
    pasteTextarea.value = '';
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

// Save the original markdown source as a .md file. Useful when the source came
// from paste-input and the user wants the .md on disk for later — e.g. they
// copied markdown out of a tool that doesn't let them export a .md directly.
saveMdBtn.addEventListener('click', () => {
    try {
        const blob = new Blob([originalMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFileName || 'markdown'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('Markdown file downloaded!', 'success');
    } catch (error) {
        showStatus(`Save .md failed: ${error.message}`, 'error');
        console.error('Save .md error:', error);
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

// Reset everything back to the empty state: drop the whole collection, hide the
// action buttons and file panel, and restore the welcome message.
function resetToEmpty() {
    documents = [];
    activeDocId = null;
    combinedView = false;

    processedHTML = '';
    originalMarkdown = '';
    originalFileName = '';
    viewMode = 'rendered';
    fileInput.value = '';
    pasteTextarea.value = '';

    dropZone.classList.remove('compact');
    copyBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    viewToggleBtn.style.display = 'none';
    printBtn.style.display = 'none';
    saveMdBtn.style.display = 'none';
    document.title = DEFAULT_TITLE;

    renderFilePanel(); // hides the panel and removes the two-column layout

    output.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #a0aec0;">
            <div style="font-size: 3em; margin-bottom: 20px;">✨</div>
            <p>${getRandomReference('emptyStates')}</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Ready to make your markdown human-readable!</p>
        </div>
    `;
}

// Clear/reset
clearBtn.addEventListener('click', () => {
    resetToEmpty();

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
    rerenderMermaidForTheme();
});

// Apply theme immediately so first paint is correct.
applyTheme(getInitialTheme());

// Boot
initializeRidiculousness();
console.log('🚀 The Markdown Whisperer has awakened!');
console.log('📚 Supported features: GFM, tables, code blocks, and questionable humor');
console.log('🎭 References randomized. Your spouse will either laugh or file for divorce.');
