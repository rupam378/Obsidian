import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import KnowledgeAssistantPlugin from './main';

export const KNOWLEDGE_ASSISTANT_VIEW_TYPE = 'knowledge-assistant-view';

export class KnowledgeAssistantPanel extends ItemView {
    plugin: KnowledgeAssistantPlugin;
    private currentTab: string = 'search';
    private searchHistory: string[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: KnowledgeAssistantPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return KNOWLEDGE_ASSISTANT_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Knowledge Assistant';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('ka-container');

        // Header with title
        const header = container.createDiv({ cls: 'ka-header' });
        header.createEl('h1', { text: '⭐ Knowledge Assistant', cls: 'ka-title' });
        
        // Status indicator
        const statusDiv = header.createDiv({ cls: 'ka-status' });
        this.updateStatusIndicator(statusDiv);

        // Tab navigation
        const tabNav = container.createDiv({ cls: 'ka-tabs' });
        const tabs = [
            { id: 'search', label: '🔍 Search', icon: 'search' },
            { id: 'generate', label: '✨ Generate', icon: 'wand' },
            { id: 'stats', label: '📊 Stats', icon: 'bar-chart' },
            { id: 'settings', label: '⚙️ Settings', icon: 'settings' }
        ];

        // Content area (create before tabs to reference it)
        const content = container.createDiv({ cls: 'ka-content' });

        tabs.forEach((tab, index) => {
            const tabBtn = tabNav.createEl('button', { 
                text: tab.label, 
                cls: `ka-tab-btn ${tab.id === this.currentTab ? 'active' : ''}`,
                attr: { 'data-tab-id': tab.id }
            });
            tabBtn.addEventListener('click', () => this.switchTab(tab.id, content));
        });

        // Tab panels
        const searchPanel = content.createDiv({ cls: 'ka-panel ka-search-panel' });
        const generatePanel = content.createDiv({ cls: 'ka-panel ka-generate-panel' });
        const statsPanel = content.createDiv({ cls: 'ka-panel ka-stats-panel' });
        const settingsPanel = content.createDiv({ cls: 'ka-panel ka-settings-panel' });

        this.createSearchPanel(searchPanel);
        this.createGeneratePanel(generatePanel);
        this.createStatsPanel(statsPanel);
        this.createSettingsPanel(settingsPanel);

        // Show initial tab
        this.showTab('search', content);
    }

    switchTab(tabId: string, content: HTMLElement) {
        this.currentTab = tabId;
        
        // Update tab buttons
        const tabNav = content.parentElement?.querySelector('.ka-tabs');
        if (tabNav) {
            tabNav.querySelectorAll('.ka-tab-btn').forEach((btn) => {
                btn.classList.remove('active');
            });
            const activeBtn = tabNav.querySelector(`.ka-tab-btn[data-tab-id="${tabId}"]`) as HTMLElement;
            if (activeBtn) activeBtn.classList.add('active');
        }

        // Show tab content
        this.showTab(tabId, content);
    }

    showTab(tabId: string, content: HTMLElement) {
        content.querySelectorAll('.ka-panel').forEach((panel) => {
            panel.classList.remove('ka-panel-active');
        });
        const panel = content.querySelector(`.ka-${tabId}-panel`) as HTMLElement;
        if (panel) panel.classList.add('ka-panel-active');
    }

    createSearchPanel(panel: HTMLElement) {
        // Search input with advanced options
        const inputGroup = panel.createDiv({ cls: 'ka-input-group' });
        
        const searchInput = inputGroup.createEl('input', {
            type: 'text',
            placeholder: 'Search your notes...',
            cls: 'ka-input ka-search-input'
        });

        const searchButton = inputGroup.createEl('button', {
            text: '🔍 Search',
            cls: 'ka-btn ka-btn-primary ka-search-btn'
        });

        // Filter options
        const filterGroup = panel.createDiv({ cls: 'ka-filter-group' });
        filterGroup.createEl('label', { text: 'Number of results: ', cls: 'ka-label' });
        const resultCountSelect = filterGroup.createEl('select', { cls: 'ka-select' });
        [3, 5, 10, 20].forEach(num => {
            const opt = resultCountSelect.createEl('option', { text: String(num) });
            opt.value = String(num);
            if (num === 5) opt.selected = true;
        });

        // Results container
        const resultsDiv = panel.createDiv({ cls: 'ka-results-container' });

        // Event listeners
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                if (!this.searchHistory.includes(query)) {
                    this.searchHistory.unshift(query);
                    if (this.searchHistory.length > 10) this.searchHistory.pop();
                }
                const limit = parseInt(resultCountSelect.value);
                this.performSearch(query, resultsDiv, limit);
            }
        };

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        // Search history
        if (this.searchHistory.length > 0) {
            const historyDiv = panel.createDiv({ cls: 'ka-history' });
            historyDiv.createEl('small', { text: 'Recent searches:', cls: 'ka-history-label' });
            this.searchHistory.slice(0, 3).forEach(term => {
                const historyBtn = historyDiv.createEl('button', { 
                    text: term, 
                    cls: 'ka-btn ka-btn-secondary ka-history-btn'
                });
                historyBtn.addEventListener('click', () => {
                    searchInput.value = term;
                    performSearch();
                });
            });
        }
    }

    createGeneratePanel(panel: HTMLElement) {
        const inputGroup = panel.createDiv({ cls: 'ka-input-group' });

        const generateInput = inputGroup.createEl('input', {
            type: 'text',
            placeholder: 'Ask about your notes...',
            cls: 'ka-input ka-generate-input'
        });

        const generateButton = inputGroup.createEl('button', {
            text: '✨ Generate',
            cls: 'ka-btn ka-btn-primary ka-generate-btn'
        });

        // LLM info
        const infoDiv = panel.createDiv({ cls: 'ka-info-box' });
        infoDiv.createEl('small', { 
            text: 'Uses RAG (Retrieval-Augmented Generation) to create intelligent responses based on your notes.',
            cls: 'ka-info-text'
        });

        // Results container
        const resultsDiv = panel.createDiv({ cls: 'ka-generated-container' });

        const performGeneration = () => {
            const query = generateInput.value.trim();
            if (query) {
                this.performGeneration(query, resultsDiv);
            }
        };

        generateButton.addEventListener('click', performGeneration);
        generateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performGeneration();
        });
    }

    createStatsPanel(panel: HTMLElement) {
        panel.createEl('h3', { text: 'Vault Statistics', cls: 'ka-panel-title' });
        
        const statsContent = panel.createDiv({ cls: 'ka-stats-grid' });
        statsContent.createEl('p', { text: 'Loading statistics...', cls: 'ka-loading' });

        this.loadStats(statsContent);
    }

    createSettingsPanel(panel: HTMLElement) {
        panel.createEl('h3', { text: 'Settings', cls: 'ka-panel-title' });
        
        const settingsContent = panel.createDiv({ cls: 'ka-settings-content' });

        // Backend URL
        const urlGroup = settingsContent.createDiv({ cls: 'ka-setting-group' });
        urlGroup.createEl('label', { text: 'Server URL:', cls: 'ka-label' });
        const urlInput = urlGroup.createEl('input', {
            type: 'text',
            value: this.plugin.settings.backendUrl,
            cls: 'ka-input'
        });

        // Test connection button
        const testBtn = settingsContent.createEl('button', {
            text: 'Test Connection',
            cls: 'ka-btn ka-btn-secondary'
        });
        testBtn.addEventListener('click', () => {
            this.testConnection();
        });

        // Auto-index toggle
        const indexGroup = settingsContent.createDiv({ cls: 'ka-setting-group' });
        indexGroup.createEl('label', { text: 'Index notes automatically:', cls: 'ka-label' });
        const indexCheckbox = indexGroup.createEl('input', {
            type: 'checkbox',
            cls: 'ka-checkbox'
        });
        indexCheckbox.checked = this.plugin.settings.autoIndex;

        // Save settings button
        const saveBtn = settingsContent.createEl('button', {
            text: 'Save Settings',
            cls: 'ka-btn ka-btn-primary'
        });
        saveBtn.addEventListener('click', () => {
            this.plugin.settings.backendUrl = urlInput.value;
            this.plugin.settings.autoIndex = indexCheckbox.checked;
            this.plugin.saveSettings();
            new Notice('Settings saved!');
        });
    }

    async performSearch(query: string, resultsDiv?: HTMLElement, limit: number = 5) {
        if (!resultsDiv) return;
        
        resultsDiv.empty();
        
        // Show loading indicator
        const loadingDiv = resultsDiv.createDiv({ cls: 'ka-loading-spinner' });
        loadingDiv.createEl('div', { cls: 'ka-spinner' });
        loadingDiv.createEl('p', { text: 'Searching...', cls: 'ka-loading-text' });

        const results = await this.plugin.searchVault(query, limit);
        
        resultsDiv.empty();

        if (!results) {
            const errorDiv = resultsDiv.createDiv({ cls: 'ka-error-box' });
            errorDiv.createEl('p', { text: '❌ Search failed. Please check the backend connection.' });
            return;
        }

        if (results.results.length === 0) {
            const emptyDiv = resultsDiv.createDiv({ cls: 'ka-empty-box' });
            emptyDiv.createEl('p', { text: '📭 No results found. Try a different search term.' });
            return;
        }

        // Results header
        const header = resultsDiv.createDiv({ cls: 'ka-results-header' });
        header.createEl('h4', { text: `✅ Found ${results.results.length} result${results.results.length !== 1 ? 's' : ''}:` });

        // Result items
        results.results.forEach((result: any, index: number) => {
            const resultCard = resultsDiv.createDiv({ cls: 'ka-result-card' });

            // Card header
            const cardHeader = resultCard.createDiv({ cls: 'ka-result-header' });
            cardHeader.createEl('strong', { text: `${index + 1}. ${result.metadata.file || 'Unknown'}` });
            
            const similarity = ((1 - result.distance) * 100).toFixed(0);
            const badgeClass = parseInt(similarity) >= 80 ? 'high' : parseInt(similarity) >= 50 ? 'medium' : 'low';
            const badge = cardHeader.createEl('span', { 
                text: `${similarity}% relevant`,
                cls: `ka-badge ka-badge-${badgeClass}`
            });

            // Card content
            const content = resultCard.createDiv({ cls: 'ka-result-content' });
            const preview = result.document.length > 300 
                ? result.document.substring(0, 300) + '...' 
                : result.document;
            content.createEl('p', { text: preview });

            // Card footer with actions
            const footer = resultCard.createDiv({ cls: 'ka-result-footer' });

            const openBtn = footer.createEl('button', {
                text: '📖 Open',
                cls: 'ka-btn ka-btn-small'
            });
            openBtn.addEventListener('click', () => this.openFile(result.metadata.path));

            const copyBtn = footer.createEl('button', {
                text: '📋 Copy',
                cls: 'ka-btn ka-btn-small'
            });
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(result.document);
                new Notice('Content copied!');
            });

            const copyPathBtn = footer.createEl('button', {
                text: '📌 Path',
                cls: 'ka-btn ka-btn-small'
            });
            copyPathBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(result.metadata.path);
                new Notice('Path copied!');
            });
        });
    }

    async performGeneration(query: string, resultsDiv?: HTMLElement) {
        if (!resultsDiv) return;
        
        resultsDiv.empty();
        
        // Show loading indicator
        const loadingDiv = resultsDiv.createDiv({ cls: 'ka-loading-spinner' });
        loadingDiv.createEl('div', { cls: 'ka-spinner' });
        loadingDiv.createEl('p', { text: 'Generating content...', cls: 'ka-loading-text' });

        const result = await this.plugin.generateContent(query);
        
        resultsDiv.empty();

        if (!result) {
            const errorDiv = resultsDiv.createDiv({ cls: 'ka-error-box' });
            errorDiv.createEl('p', { text: '❌ Content generation failed. Please check the backend connection.' });
            return;
        }

        // Generated content card
        const contentCard = resultsDiv.createDiv({ cls: 'ka-generated-card' });
        contentCard.createEl('h4', { text: '✨ Generated Response', cls: 'ka-card-title' });

        const contentDiv = contentCard.createDiv({ cls: 'ka-generated-content' });
        contentDiv.createEl('p', { text: result.content });

        // Copy button
        const copyBtn = contentCard.createEl('button', {
            text: '📋 Copy Response',
            cls: 'ka-btn ka-btn-secondary'
        });
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.content);
            new Notice('Response copied!');
        });

        // Context used
        if (result.context && result.context.length > 0) {
            const contextCard = resultsDiv.createDiv({ cls: 'ka-context-card' });
            contextCard.createEl('h4', { text: `📚 Context Used (${result.context.length} documents)`, cls: 'ka-card-title' });

            result.context.forEach((ctx: any, index: number) => {
                const ctxItem = contextCard.createDiv({ cls: 'ka-context-item' });
                
                ctxItem.createEl('strong', { text: `${index + 1}. ${ctx.metadata.file}`, cls: 'ka-context-title' });
                
                const preview = ctx.document && ctx.document.length > 150
                    ? ctx.document.substring(0, 150) + '...' 
                    : (ctx.document || '[Empty]');
                ctxItem.createEl('p', { text: preview, cls: 'ka-context-preview' });

                const openBtn = ctxItem.createEl('button', {
                    text: '📖 Open',
                    cls: 'ka-btn ka-btn-tiny'
                });
                openBtn.addEventListener('click', () => this.openFile(ctx.metadata.path));
            });
        }
    }

    async loadStats(container: HTMLElement) {
        const stats = await this.plugin.getStats();
        
        container.empty();

        if (!stats) {
            container.createEl('p', { text: '❌ Cannot connect to the backend server.', cls: 'ka-error' });
            return;
        }

        // Stats cards
        const statsGrid = container.createDiv({ cls: 'ka-stats-grid' });

        const docCard = statsGrid.createDiv({ cls: 'ka-stat-card' });
        docCard.createEl('div', { text: '📄', cls: 'ka-stat-icon' });
        docCard.createEl('div', { text: String(stats.total_documents), cls: 'ka-stat-value' });
        docCard.createEl('div', { text: 'Documents', cls: 'ka-stat-label' });

        const llmCard = statsGrid.createDiv({ cls: 'ka-stat-card' });
        const llmStatus = stats.llm?.available ? (stats.llm?.loaded ? '✅' : '⏳') : '⚠️';
        llmCard.createEl('div', { text: llmStatus, cls: 'ka-stat-icon' });
        llmCard.createEl('div', { text: stats.llm?.available ? 'AI on' : (stats.llm?.enabled ? 'Disabled' : 'Fallback'), cls: 'ka-stat-value' });
        llmCard.createEl('div', { text: 'AI Model Status', cls: 'ka-stat-label' });

        if (stats.vault_path) {
            const pathCard = statsGrid.createDiv({ cls: 'ka-stat-card ka-stat-path' });
            pathCard.createEl('strong', { text: 'Vault Path:' });
            pathCard.createEl('code', { text: stats.vault_path, cls: 'ka-path-text' });
        }
    }

    async testConnection() {
        try {
            const stats = await this.plugin.getStats();
            if (stats) {
                new Notice('✅ Connection successful!');
            } else {
                new Notice('❌ Connection failed');
            }
        } catch (e) {
            new Notice('❌ Error connecting to backend');
        }
    }

    async updateStatusIndicator(container: HTMLElement) {
        try {
            const stats = await this.plugin.getStats();
            if (stats) {
                const statusEl = container.createDiv({ cls: 'ka-status-indicator ka-status-online' });
                statusEl.createEl('span', { text: '● Online', cls: 'ka-status-text' });
            }
        } catch (e) {
            const statusEl = container.createDiv({ cls: 'ka-status-indicator ka-status-offline' });
            statusEl.createEl('span', { text: '● Offline', cls: 'ka-status-text' });
        }
    }

    async openFile(path: string) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
            await this.app.workspace.openLinkText(path, '', true);
        }
    }

    async onClose() {
        // Cleanup when panel is closed
    }
}