import { ItemView, WorkspaceLeaf } from 'obsidian';
import KnowledgeAssistantPlugin from './main';

export const KNOWLEDGE_ASSISTANT_VIEW_TYPE = 'knowledge-assistant-view';

export class KnowledgeAssistantPanel extends ItemView {
    plugin: KnowledgeAssistantPlugin;

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
        container.createEl('h2', { text: 'Knowledge Assistant' });

        // Search section
        const searchDiv = container.createDiv();
        searchDiv.createEl('h3', { text: 'Semantic Search' });
        
        const searchInput = searchDiv.createEl('input', {
            type: 'text',
            placeholder: 'Search your vault...',
            cls: 'knowledge-assistant-input'
        });
        searchInput.style.width = '100%';
        searchInput.style.padding = '8px';
        searchInput.style.marginBottom = '10px';

        const searchButton = searchDiv.createEl('button', {
            text: 'Search',
            cls: 'knowledge-assistant-button'
        });
        searchButton.style.padding = '8px 16px';
        searchButton.style.marginRight = '10px';

        const resultsDiv = searchDiv.createDiv({ cls: 'knowledge-assistant-results' });
        resultsDiv.style.marginTop = '15px';
        resultsDiv.style.maxHeight = '300px';
        resultsDiv.style.overflowY = 'auto';

        // Generation section
        const generateDiv = container.createDiv();
        generateDiv.createEl('h3', { text: 'Content Generation' });
        
        const generateInput = generateDiv.createEl('input', {
            type: 'text',
            placeholder: 'Ask about your notes...',
            cls: 'knowledge-assistant-input'
        });
        generateInput.style.width = '100%';
        generateInput.style.padding = '8px';
        generateInput.style.marginBottom = '10px';

        const generateButton = generateDiv.createEl('button', {
            text: 'Generate',
            cls: 'knowledge-assistant-button'
        });
        generateButton.style.padding = '8px 16px';

        const generateDivResult = generateDiv.createDiv({ cls: 'knowledge-assistant-generated' });
        generateDivResult.style.marginTop = '15px';
        generateDivResult.style.maxHeight = '300px';
        generateDivResult.style.overflowY = 'auto';

        // Stats section
        const statsDiv = container.createDiv();
        statsDiv.createEl('h3', { text: 'Vault Statistics' });
        const statsContent = statsDiv.createDiv();
        statsContent.createEl('p', { text: 'Loading stats...' });

        // Event listeners
        searchButton.addEventListener('click', () => {
            this.performSearch(searchInput.value, resultsDiv);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value, resultsDiv);
            }
        });

        generateButton.addEventListener('click', () => {
            this.performGeneration(generateInput.value, generateDivResult);
        });

        generateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performGeneration(generateInput.value, generateDivResult);
            }
        });

        // Load stats
        this.loadStats(statsContent);
    }

    async performSearch(query: string, resultsDiv?: HTMLElement) {
        if (!query.trim()) return;

        const container = resultsDiv || this.containerEl.querySelector('.knowledge-assistant-results');
        if (!container) return;

        container.empty();
        container.createEl('p', { text: 'Searching...' });

        const results = await this.plugin.searchVault(query);
        
        container.empty();

        if (!results) {
            container.createEl('p', { text: 'Error performing search. Check backend connection.' });
            return;
        }

        if (results.results.length === 0) {
            container.createEl('p', { text: 'No results found.' });
            return;
        }

        container.createEl('h4', { text: `Found ${results.results.length} results:` });

        results.results.forEach((result: any, index: number) => {
            const resultItem = container.createDiv({ cls: 'knowledge-assistant-result-item' });
            resultItem.style.padding = '10px';
            resultItem.style.marginBottom = '10px';
            resultItem.style.border = '1px solid #ddd';
            resultItem.style.borderRadius = '4px';

            const header = resultItem.createDiv();
            header.createEl('strong', { text: `${index + 1}. ${result.metadata.file || 'Unknown'}` });
            header.createEl('span', { 
                text: ` (Similarity: ${(1 - result.distance).toFixed(2)})`,
                cls: 'knowledge-assistant-similarity'
            });

            const content = resultItem.createDiv({ cls: 'knowledge-assistant-result-content' });
            content.style.marginTop = '5px';
            content.style.fontSize = '0.9em';
            
            // Truncate content if too long
            const preview = result.document.length > 200 
                ? result.document.substring(0, 200) + '...' 
                : result.document;
            content.createEl('p', { text: preview });

            // Add click to open file
            const openButton = resultItem.createEl('button', {
                text: 'Open Note',
                cls: 'knowledge-assistant-open-button'
            });
            openButton.style.marginTop = '5px';
            openButton.style.padding = '4px 8px';
            openButton.style.fontSize = '0.8em';

            openButton.addEventListener('click', () => {
                this.openFile(result.metadata.path);
            });
        });
    }

    async performGeneration(query: string, resultsDiv?: HTMLElement) {
        if (!query.trim()) return;

        const container = resultsDiv || this.containerEl.querySelector('.knowledge-assistant-generated');
        if (!container) return;

        container.empty();
        container.createEl('p', { text: 'Generating content...' });

        const result = await this.plugin.generateContent(query);
        
        container.empty();

        if (!result) {
            container.createEl('p', { text: 'Error generating content. Check backend connection.' });
            return;
        }

        container.createEl('h4', { text: 'Generated Response:' });

        const contentDiv = container.createDiv({ cls: 'knowledge-assistant-generated-content' });
        contentDiv.style.padding = '10px';
        contentDiv.style.backgroundColor = '#f5f5f5';
        contentDiv.style.borderRadius = '4px';
        contentDiv.style.whiteSpace = 'pre-wrap';
        contentDiv.createEl('p', { text: result.content });

        // Show context used
        if (result.context && result.context.length > 0) {
            container.createEl('h4', { text: 'Context Used:' });
            const contextDiv = container.createDiv({ cls: 'knowledge-assistant-context' });
            contextDiv.style.marginTop = '10px';

            result.context.forEach((ctx: any, index: number) => {
                const ctxItem = contextDiv.createDiv();
                ctxItem.style.padding = '8px';
                ctxItem.style.marginBottom = '5px';
                ctxItem.style.borderLeft = '3px solid #007bff';
                ctxItem.style.paddingLeft = '10px';
                
                ctxItem.createEl('strong', { text: `${index + 1}. ${ctx.metadata.file}` });
                const preview = ctx.document.length > 100 
                    ? ctx.document.substring(0, 100) + '...' 
                    : ctx.document;
                ctxItem.createEl('p', { text: preview, cls: 'knowledge-assistant-context-preview' });
            });
        }
    }

    async loadStats(container: HTMLElement) {
        const stats = await this.plugin.getStats();
        
        container.empty();

        if (!stats) {
            container.createEl('p', { text: 'Unable to connect to backend.' });
            return;
        }

        container.createEl('p', { text: `Total Documents: ${stats.total_documents}` });
        container.createEl('p', { text: `Vault Path: ${stats.vault_path}` });
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