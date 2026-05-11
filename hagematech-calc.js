// hagematech-calc.js
// Hagematech Scientific Calculator Web Component
// CDN-ready, Shadow DOM, no eval(), powered by math.js

class HagematechCalc extends HTMLElement {
    static tagName = 'hagematech-calc';
    static mathJsUrl = 'https://cdn.jsdelivr.net/npm/mathjs@15.2.0/lib/browser/math.js';
    static mathLoader = null;

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.angleMode = (this.getAttribute('angle-mode') || 'DEG').toUpperCase() === 'RAD'
            ? 'RAD'
            : 'DEG';

        this.precision = Number(this.getAttribute('precision') || 64);
        this.theme = (this.getAttribute('theme') || 'light').toLowerCase();
        this.maxExpressionLength = Number(this.getAttribute('max-length') || 500);
        this.maxHistory = Number(this.getAttribute('history-size') || 20);

        this.math = null;
        this.scope = new Map();

        this.memory = null;
        this.lastResult = 0;
        this.history = [];
        this.previewTimer = null;

        this.handleClick = this.handleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    async connectedCallback() {
        this.renderLoading();

        try {
            await this.loadMathJs();
            this.initMath();
            this.render();
            this.cacheElements();
            this.bindEvents();
            this.updateIndicators();
            this.updateHistory();
            this.preview();
        } catch (error) {
            this.renderError(error);
        }
    }

    disconnectedCallback() {
        this.unbindEvents();
    }

    async loadMathJs() {
        if (window.math) {
            return window.math;
        }

        if (!HagematechCalc.mathLoader) {
            HagematechCalc.mathLoader = new Promise((resolve, reject) => {
                const existingScript = document.querySelector('script[data-hagematech-mathjs="true"]');

                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve(window.math), { once: true });
                    existingScript.addEventListener('error', () => reject(new Error('Gagal memuat math.js.')), { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = HagematechCalc.mathJsUrl;
                script.async = true;
                script.defer = true;
                script.dataset.hagematechMathjs = 'true';

                script.onload = () => {
                    if (window.math) {
                        resolve(window.math);
                    } else {
                        reject(new Error('math.js tidak ditemukan setelah script dimuat.'));
                    }
                };

                script.onerror = () => reject(new Error('Gagal memuat math.js dari CDN.'));

                document.head.appendChild(script);
            });
        }

        return HagematechCalc.mathLoader;
    }

    initMath() {
        const rootMath = window.math;

        this.math = rootMath.create
            ? rootMath.create(rootMath.all)
            : rootMath;

        try {
            this.math.config({
                number: 'BigNumber',
                precision: this.precision
            });
        } catch (error) {
            console.warn('Math config warning:', error);
        }

        this.installCustomScope();
    }

    installCustomScope() {
        const m = this.math;

        const toStringValue = (value) => {
            if (value === null || value === undefined) return '0';
            if (typeof value === 'string') return value;
            if (typeof value?.toString === 'function') return value.toString();
            return String(value);
        };

        const toAngleInput = (value) => {
            if (this.angleMode === 'RAD') {
                return value;
            }

            return m.unit(`${toStringValue(value)} deg`);
        };

        const fromAngleOutput = (value) => {
            if (this.angleMode === 'RAD') {
                return value;
            }

            return m.multiply(m.divide(value, m.pi), 180);
        };

        this.scope.set('sin', (x) => m.sin(toAngleInput(x)));
        this.scope.set('cos', (x) => m.cos(toAngleInput(x)));
        this.scope.set('tan', (x) => m.tan(toAngleInput(x)));

        this.scope.set('asin', (x) => fromAngleOutput(m.asin(x)));
        this.scope.set('acos', (x) => fromAngleOutput(m.acos(x)));
        this.scope.set('atan', (x) => fromAngleOutput(m.atan(x)));
        this.scope.set('atan2', (y, x) => fromAngleOutput(m.atan2(y, x)));

        this.scope.set('ln', (x) => m.log(x));
        this.scope.set('log', (x) => m.log10(x));
        this.scope.set('log10', (x) => m.log10(x));
        this.scope.set('log2', (x) => m.log2(x));

        this.scope.set('sqrt', (x) => m.sqrt(x));
        this.scope.set('cbrt', (x) => m.nthRoot(x, 3));
        this.scope.set('root', (x, n) => m.nthRoot(x, n));

        this.scope.set('square', (x) => m.pow(x, 2));
        this.scope.set('cube', (x) => m.pow(x, 3));
        this.scope.set('inv', (x) => m.divide(1, x));

        this.scope.set('nCr', (n, r) => m.combinations(n, r));
        this.scope.set('nPr', (n, r) => m.permutations(n, r));

        this.scope.set('rand', () => m.random());
        this.scope.set('Ans', this.lastResult);
        this.scope.set('ans', this.lastResult);
        this.scope.set('Mem', this.memory || 0);
        this.scope.set('mem', this.memory || 0);
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .loading {
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 16px;
                    background: #ffffff;
                    color: #111827;
                    font-size: 14px;
                }
            </style>

            <div class="loading">
                Loading calculator...
            </div>
        `;
    }

    renderError(error) {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .error {
                    border: 1px solid #fecaca;
                    border-radius: 16px;
                    padding: 16px;
                    background: #fff1f2;
                    color: #991b1b;
                    font-size: 14px;
                    line-height: 1.5;
                }

                code {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }
            </style>

            <div class="error">
                Calculator gagal dimuat.<br>
                <code>${this.escapeHtml(error?.message || String(error))}</code>
            </div>
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

                    --calc-bg: #ffffff;
                    --calc-panel: #f8fafc;
                    --calc-border: #e2e8f0;
                    --calc-text: #0f172a;
                    --calc-muted: #64748b;
                    --calc-button: #ffffff;
                    --calc-button-hover: #f1f5f9;
                    --calc-primary: #2563eb;
                    --calc-primary-text: #ffffff;
                    --calc-danger-bg: #fff1f2;
                    --calc-danger-text: #be123c;
                    --calc-warning-bg: #fffbeb;
                    --calc-info-bg: #eff6ff;
                    --calc-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
                }

                :host([theme="dark"]) {
                    --calc-bg: #020617;
                    --calc-panel: #0f172a;
                    --calc-border: #1e293b;
                    --calc-text: #e5e7eb;
                    --calc-muted: #94a3b8;
                    --calc-button: #111827;
                    --calc-button-hover: #1f2937;
                    --calc-primary: #3b82f6;
                    --calc-primary-text: #ffffff;
                    --calc-danger-bg: #450a0a;
                    --calc-danger-text: #fecaca;
                    --calc-warning-bg: #422006;
                    --calc-info-bg: #172554;
                    --calc-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
                }

                *, *::before, *::after {
                    box-sizing: border-box;
                }

                .calculator {
                    width: 100%;
                    max-width: 1120px;
                    background: var(--calc-bg);
                    color: var(--calc-text);
                    border: 1px solid var(--calc-border);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: var(--calc-shadow);
                }

                .header {
                    padding: 16px;
                    background: var(--calc-panel);
                    border-bottom: 1px solid var(--calc-border);
                }

                .brand-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .brand {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .brand-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .brand-subtitle {
                    font-size: 12px;
                    color: var(--calc-muted);
                }

                .meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 10px;
                    border: 1px solid var(--calc-border);
                    border-radius: 999px;
                    background: var(--calc-bg);
                    color: var(--calc-muted);
                    font-size: 12px;
                    white-space: nowrap;
                }

                .pill strong {
                    color: var(--calc-text);
                }

                .screen-wrap {
                    display: grid;
                    gap: 10px;
                }

                .expression {
                    width: 100%;
                    min-height: 58px;
                    resize: vertical;
                    border: 1px solid var(--calc-border);
                    border-radius: 16px;
                    padding: 12px 14px;
                    background: var(--calc-bg);
                    color: var(--calc-text);
                    outline: none;
                    font: 600 18px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }

                .expression:focus {
                    border-color: var(--calc-primary);
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
                }

                .result {
                    min-height: 52px;
                    padding: 12px 14px;
                    border: 1px dashed var(--calc-border);
                    border-radius: 16px;
                    background: var(--calc-bg);
                    color: var(--calc-text);
                    font: 800 19px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    word-break: break-word;
                }

                .result.error {
                    color: var(--calc-danger-text);
                    background: var(--calc-danger-bg);
                    border-color: var(--calc-danger-text);
                }

                .content {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 300px;
                }

                .keypad {
                    padding: 16px;
                    display: grid;
                    grid-template-columns: repeat(8, minmax(0, 1fr));
                    gap: 10px;
                    background: var(--calc-bg);
                }

                button {
                    font-family: inherit;
                }

                .key {
                    min-height: 46px;
                    border: 1px solid var(--calc-border);
                    border-radius: 14px;
                    background: var(--calc-button);
                    color: var(--calc-text);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 800;
                    transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease;
                }

                .key:hover {
                    background: var(--calc-button-hover);
                    border-color: var(--calc-primary);
                }

                .key:active {
                    transform: translateY(1px) scale(0.99);
                }

                .key.operator {
                    background: var(--calc-info-bg);
                    color: var(--calc-primary);
                }

                .key.danger {
                    background: var(--calc-danger-bg);
                    color: var(--calc-danger-text);
                }

                .key.memory {
                    background: var(--calc-warning-bg);
                }

                .key.equal {
                    background: var(--calc-primary);
                    color: var(--calc-primary-text);
                    border-color: var(--calc-primary);
                }

                .key.wide {
                    grid-column: span 2;
                }

                .key.extra-wide {
                    grid-column: span 3;
                }

                .side {
                    padding: 16px;
                    background: var(--calc-panel);
                    border-left: 1px solid var(--calc-border);
                    display: grid;
                    gap: 14px;
                    align-content: start;
                }

                .side-title {
                    margin: 0;
                    color: var(--calc-muted);
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                .history-list {
                    display: grid;
                    gap: 10px;
                    max-height: 520px;
                    overflow: auto;
                }

                .history-empty {
                    color: var(--calc-muted);
                    font-size: 13px;
                    line-height: 1.5;
                }

                .history-item {
                    text-align: left;
                    border: 1px solid var(--calc-border);
                    border-radius: 14px;
                    background: var(--calc-bg);
                    color: var(--calc-text);
                    padding: 10px;
                    cursor: pointer;
                }

                .history-item:hover {
                    border-color: var(--calc-primary);
                }

                .history-expression {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--calc-muted);
                    font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    word-break: break-word;
                }

                .history-result {
                    display: block;
                    color: var(--calc-text);
                    font: 800 14px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    word-break: break-word;
                }

                .help {
                    padding: 12px;
                    border: 1px solid var(--calc-border);
                    border-radius: 14px;
                    background: var(--calc-bg);
                    color: var(--calc-muted);
                    font-size: 12px;
                    line-height: 1.5;
                }

                .help code {
                    color: var(--calc-text);
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }

                @media (max-width: 980px) {
                    .content {
                        grid-template-columns: 1fr;
                    }

                    .side {
                        border-left: 0;
                        border-top: 1px solid var(--calc-border);
                    }
                }

                @media (max-width: 760px) {
                    .brand-row {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .keypad {
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }

                    .key.wide,
                    .key.extra-wide {
                        grid-column: span 2;
                    }
                }
            </style>

            <div class="calculator" part="container">
                <div class="header" part="header">
                    <div class="brand-row">
                        <div class="brand">
                            <h2 class="brand-title">Hagematech Calculator</h2>
                            <span class="brand-subtitle">Scientific Calculator Web Component</span>
                        </div>

                        <div class="meta">
                            <span class="pill">Angle: <strong id="angleModeText"></strong></span>
                            <span class="pill">Precision: <strong id="precisionText"></strong></span>
                            <span class="pill">Memory: <strong id="memoryText"></strong></span>
                        </div>
                    </div>

                    <div class="screen-wrap">
                        <textarea
                            id="expression"
                            class="expression"
                            spellcheck="false"
                            autocapitalize="off"
                            autocomplete="off"
                            autocorrect="off"
                            aria-label="Calculator expression"
                            placeholder="Type expression, example: sin(30) + sqrt(81)"
                        ></textarea>

                        <div id="result" class="result" aria-live="polite"></div>
                    </div>
                </div>

                <div class="content">
                    <div class="keypad" part="keypad">
                        ${this.renderButtons()}
                    </div>

                    <aside class="side" part="history">
                        <h3 class="side-title">History</h3>
                        <div id="historyList" class="history-list"></div>

                        <div class="help">
                            <strong>Shortcut:</strong><br>
                            <code>Enter</code> = calculate<br>
                            <code>Esc</code> = clear<br>
                            <code>Backspace</code> = delete<br><br>

                            <strong>Contoh:</strong><br>
                            <code>100 + 3%</code><br>
                            <code>sin(30)</code><br>
                            <code>nCr(10, 2)</code><br>
                            <code>2 inch to cm</code>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    }

    renderButtons() {
        const buttons = [
            ['MC', 'memory-clear', '', 'memory'],
            ['MR', 'memory-recall', '', 'memory'],
            ['MS', 'memory-save', '', 'memory'],
            ['M+', 'memory-plus', '', 'memory'],
            ['M-', 'memory-minus', '', 'memory'],
            ['DEG/RAD', 'toggle-angle', '', 'operator wide'],
            ['Theme', 'toggle-theme', '', 'operator'],

            ['AC', 'clear-all', '', 'danger'],
            ['CE', 'clear-entry', '', 'danger'],
            ['⌫', 'backspace', '', 'danger'],
            ['(', 'insert', '(', 'operator'],
            [')', 'insert', ')', 'operator'],
            ['%', 'insert', '%', 'operator'],
            ['mod', 'insert', ' mod ', 'operator'],
            ['Ans', 'insert', 'ans', 'operator'],

            ['sin', 'insert', 'sin(', 'operator'],
            ['cos', 'insert', 'cos(', 'operator'],
            ['tan', 'insert', 'tan(', 'operator'],
            ['asin', 'insert', 'asin(', 'operator'],
            ['acos', 'insert', 'acos(', 'operator'],
            ['atan', 'insert', 'atan(', 'operator'],
            ['π', 'insert', 'pi', 'operator'],
            ['e', 'insert', 'e', 'operator'],

            ['ln', 'insert', 'ln(', 'operator'],
            ['log', 'insert', 'log(', 'operator'],
            ['log₂', 'insert', 'log2(', 'operator'],
            ['exp', 'insert', 'exp(', 'operator'],
            ['√x', 'wrap', 'sqrt(|)', 'operator'],
            ['∛x', 'wrap', 'cbrt(|)', 'operator'],
            ['x²', 'wrap', '(|)^2', 'operator'],
            ['x³', 'wrap', '(|)^3', 'operator'],

            ['xʸ', 'insert', '^', 'operator'],
            ['1/x', 'wrap', '1/(|)', 'operator'],
            ['x!', 'wrap', '(|)!', 'operator'],
            ['abs', 'insert', 'abs(', 'operator'],
            ['round', 'insert', 'round(', 'operator'],
            ['floor', 'insert', 'floor(', 'operator'],
            ['ceil', 'insert', 'ceil(', 'operator'],
            ['rand', 'insert', 'rand()', 'operator'],

            ['nCr', 'insert', 'nCr(', 'operator'],
            ['nPr', 'insert', 'nPr(', 'operator'],
            ['gcd', 'insert', 'gcd(', 'operator'],
            ['lcm', 'insert', 'lcm(', 'operator'],
            ['to', 'insert', ' to ', 'operator'],
            ['i', 'insert', 'i', 'operator'],
            ['[', 'insert', '[', 'operator'],
            [']', 'insert', ']', 'operator'],

            ['7', 'insert', '7', ''],
            ['8', 'insert', '8', ''],
            ['9', 'insert', '9', ''],
            ['÷', 'insert', '/', 'operator'],
            ['AND', 'insert', ' and ', 'operator'],
            ['OR', 'insert', ' or ', 'operator'],
            ['XOR', 'insert', ' xor ', 'operator'],
            ['NOT', 'insert', 'not ', 'operator'],

            ['4', 'insert', '4', ''],
            ['5', 'insert', '5', ''],
            ['6', 'insert', '6', ''],
            ['×', 'insert', '*', 'operator'],
            ['<<', 'insert', ' << ', 'operator'],
            ['>>', 'insert', ' >> ', 'operator'],
            ['≤', 'insert', ' <= ', 'operator'],
            ['≥', 'insert', ' >= ', 'operator'],

            ['1', 'insert', '1', ''],
            ['2', 'insert', '2', ''],
            ['3', 'insert', '3', ''],
            ['−', 'insert', '-', 'operator'],
            ['<', 'insert', ' < ', 'operator'],
            ['>', 'insert', ' > ', 'operator'],
            ['==', 'insert', ' == ', 'operator'],
            ['!=', 'insert', ' != ', 'operator'],

            ['0', 'insert', '0', 'wide'],
            ['.', 'insert', '.', ''],
            ['±', 'toggle-sign', '', 'operator'],
            ['+', 'insert', '+', 'operator'],
            [',', 'insert', ', ', 'operator'],
            ['=', 'calculate', '', 'equal extra-wide']
        ];

        return buttons.map(([label, action, value, className]) => {
            return `
                <button
                    type="button"
                    class="key ${className}"
                    data-action="${this.escapeHtml(action)}"
                    data-value="${this.escapeHtml(value)}"
                >
                    ${this.escapeHtml(label)}
                </button>
            `;
        }).join('');
    }

    cacheElements() {
        this.expressionEl = this.shadowRoot.getElementById('expression');
        this.resultEl = this.shadowRoot.getElementById('result');
        this.historyListEl = this.shadowRoot.getElementById('historyList');
        this.angleModeTextEl = this.shadowRoot.getElementById('angleModeText');
        this.precisionTextEl = this.shadowRoot.getElementById('precisionText');
        this.memoryTextEl = this.shadowRoot.getElementById('memoryText');
    }

    bindEvents() {
        this.shadowRoot.addEventListener('click', this.handleClick);
        this.expressionEl.addEventListener('keydown', this.handleKeydown);
        this.expressionEl.addEventListener('input', this.handleInput);
    }

    unbindEvents() {
        if (!this.shadowRoot) return;

        this.shadowRoot.removeEventListener('click', this.handleClick);

        if (this.expressionEl) {
            this.expressionEl.removeEventListener('keydown', this.handleKeydown);
            this.expressionEl.removeEventListener('input', this.handleInput);
        }
    }

    handleClick(event) {
        const historyButton = event.target.closest('.history-item');

        if (historyButton) {
            this.setExpression(historyButton.dataset.expression || '');
            this.preview();
            this.focusInput();
            return;
        }

        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const value = button.dataset.value || '';

        switch (action) {
            case 'insert':
                this.insertText(value);
                break;

            case 'wrap':
                this.wrapText(value);
                break;

            case 'clear-all':
                this.clearAll();
                break;

            case 'clear-entry':
                this.clearEntry();
                break;

            case 'backspace':
                this.backspace();
                break;

            case 'calculate':
                this.calculate();
                break;

            case 'toggle-sign':
                this.toggleSign();
                break;

            case 'toggle-angle':
                this.toggleAngleMode();
                break;

            case 'toggle-theme':
                this.toggleTheme();
                break;

            case 'memory-clear':
                this.memoryClear();
                break;

            case 'memory-recall':
                this.memoryRecall();
                break;

            case 'memory-save':
                this.memorySave();
                break;

            case 'memory-plus':
                this.memoryPlus();
                break;

            case 'memory-minus':
                this.memoryMinus();
                break;

            default:
                break;
        }

        this.focusInput();
    }

    handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.calculate();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.clearAll();
            return;
        }
    }

    handleInput() {
        this.schedulePreview();
    }

    insertText(text) {
        const input = this.expressionEl;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        input.setRangeText(text, start, end, 'end');
        this.schedulePreview();
    }

    wrapText(pattern) {
        const input = this.expressionEl;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const selected = input.value.slice(start, end);

        const replacementValue = selected || '';
        const finalText = pattern.replace('|', replacementValue);

        input.setRangeText(finalText, start, end, 'end');

        const cursorIndex = finalText.indexOf('|');

        if (cursorIndex >= 0) {
            const cursor = start + cursorIndex;
            input.setSelectionRange(cursor, cursor);
        } else if (!selected) {
            const emptySlot = pattern.indexOf('|');
            if (emptySlot >= 0) {
                const cursor = start + emptySlot;
                input.setSelectionRange(cursor, cursor);
            }
        }

        this.schedulePreview();
    }

    backspace() {
        const input = this.expressionEl;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (start !== end) {
            input.setRangeText('', start, end, 'end');
            this.schedulePreview();
            return;
        }

        if (start <= 0) return;

        input.setRangeText('', start - 1, start, 'end');
        this.schedulePreview();
    }

    clearAll() {
        this.setExpression('');
        this.setResult('');
    }

    clearEntry() {
        this.setExpression('');
        this.schedulePreview();
    }

    toggleSign() {
        const input = this.expressionEl;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (start !== end) {
            const selected = input.value.slice(start, end);
            input.setRangeText(`-(${selected})`, start, end, 'end');
            this.schedulePreview();
            return;
        }

        const expression = this.getExpression().trim();

        if (!expression) {
            this.insertText('-');
            return;
        }

        this.setExpression(`-(${expression})`);
        this.schedulePreview();
    }

    toggleAngleMode() {
        this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.installCustomScope();
        this.updateIndicators();
        this.schedulePreview();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.setAttribute('theme', this.theme);
    }

    schedulePreview() {
        if (this.previewTimer) {
            clearTimeout(this.previewTimer);
        }

        this.previewTimer = setTimeout(() => {
            this.preview();
        }, 120);
    }

    preview() {
        const expression = this.getExpression().trim();

        if (!expression) {
            this.setResult('');
            return;
        }

        try {
            const result = this.evaluate(expression);
            this.setResult(this.formatResult(result), false);
        } catch {
            this.setResult('...', false);
        }
    }

    calculate() {
        const expression = this.getExpression().trim();

        if (!expression) return;

        try {
            const result = this.evaluate(expression);
            const formatted = this.formatResult(result);

            this.lastResult = result;
            this.scope.set('ans', result);
            this.scope.set('Ans', result);

            this.setResult(formatted, false);
            this.setExpression(formatted);
            this.addHistory(expression, formatted);

            this.dispatchEvent(new CustomEvent('calculate', {
                detail: {
                    expression,
                    result,
                    formatted
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            this.setResult(error?.message || 'Error', true);
        }
    }

    evaluate(expression) {
        if (expression.length > this.maxExpressionLength) {
            throw new Error(`Expression terlalu panjang. Maksimal ${this.maxExpressionLength} karakter.`);
        }

        this.scope.set('ans', this.lastResult || 0);
        this.scope.set('Ans', this.lastResult || 0);
        this.scope.set('mem', this.memory || 0);
        this.scope.set('Mem', this.memory || 0);

        const normalizedExpression = this.normalizeExpression(expression);
        const result = this.math.evaluate(normalizedExpression, this.scope);

        return this.normalizeResult(result);
    }

    normalizeExpression(expression) {
        return expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'pi')
            .replace(/√/g, 'sqrt')
            .replace(/∞/g, 'Infinity');
    }

    normalizeResult(result) {
        if (Array.isArray(result)) {
            return result.length ? result[result.length - 1] : result;
        }

        if (result && typeof result === 'object' && Array.isArray(result.entries)) {
            return result.entries.length ? result.entries[result.entries.length - 1] : result;
        }

        return result;
    }

    formatResult(value) {
        try {
            return this.math.format(value, {
                precision: this.precision,
                notation: 'auto',
                lowerExp: -12,
                upperExp: 20
            });
        } catch {
            return value?.toString ? value.toString() : String(value);
        }
    }

    currentValue() {
        const expression = this.getExpression().trim();

        if (expression) {
            return this.evaluate(expression);
        }

        return this.lastResult || 0;
    }

    memoryClear() {
        this.memory = null;
        this.updateIndicators();
    }

    memoryRecall() {
        if (this.memory === null) return;

        this.insertText(this.formatResult(this.memory));
    }

    memorySave() {
        try {
            this.memory = this.currentValue();
            this.updateIndicators();
        } catch (error) {
            this.setResult(error?.message || 'Memory Error', true);
        }
    }

    memoryPlus() {
        try {
            const value = this.currentValue();

            if (this.memory === null) {
                this.memory = value;
            } else {
                this.memory = this.math.add(this.memory, value);
            }

            this.updateIndicators();
        } catch (error) {
            this.setResult(error?.message || 'Memory Error', true);
        }
    }

    memoryMinus() {
        try {
            const value = this.currentValue();

            if (this.memory === null) {
                this.memory = this.math.unaryMinus(value);
            } else {
                this.memory = this.math.subtract(this.memory, value);
            }

            this.updateIndicators();
        } catch (error) {
            this.setResult(error?.message || 'Memory Error', true);
        }
    }

    addHistory(expression, result) {
        this.history.unshift({
            expression,
            result
        });

        this.history = this.history.slice(0, this.maxHistory);
        this.updateHistory();
    }

    updateHistory() {
        if (!this.historyListEl) return;

        if (!this.history.length) {
            this.historyListEl.innerHTML = `
                <div class="history-empty">
                    Belum ada history. Tekan <strong>=</strong> atau <strong>Enter</strong> untuk menyimpan hasil.
                </div>
            `;
            return;
        }

        this.historyListEl.innerHTML = this.history.map((item) => `
            <button
                type="button"
                class="history-item"
                data-expression="${this.escapeHtml(item.expression)}"
            >
                <span class="history-expression">${this.escapeHtml(item.expression)}</span>
                <span class="history-result">= ${this.escapeHtml(item.result)}</span>
            </button>
        `).join('');
    }

    updateIndicators() {
        if (this.angleModeTextEl) {
            this.angleModeTextEl.textContent = this.angleMode;
        }

        if (this.precisionTextEl) {
            this.precisionTextEl.textContent = String(this.precision);
        }

        if (this.memoryTextEl) {
            this.memoryTextEl.textContent = this.memory === null ? 'Empty' : 'Set';
        }
    }

    getExpression() {
        return this.expressionEl?.value || '';
    }

    setExpression(value) {
        if (!this.expressionEl) return;
        this.expressionEl.value = value;
    }

    setResult(value, isError = false) {
        if (!this.resultEl) return;

        this.resultEl.textContent = value || '';
        this.resultEl.classList.toggle('error', Boolean(isError));
    }

    focusInput() {
        if (this.expressionEl) {
            this.expressionEl.focus();
        }
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

if (!customElements.get(HagematechCalc.tagName)) {
    customElements.define(HagematechCalc.tagName, HagematechCalc);
}