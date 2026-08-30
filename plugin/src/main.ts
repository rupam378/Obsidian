import { App, Plugin, PluginSettingTab, Setting, Notice, TFile } from 'obsidian';
import { KnowledgeAssistantPanel } from './panel';

interface KnowledgeAssistantSettings {
    backendUrl: string;
    vaultPath: string;
    autoIndex: boolean;
}

const DEFAULT_SETTINGS: KnowledgeAssistantSettings = {
    backendUrl: 'http://127.0.0.1:5000',
    vaultPath: 'C:\\Users\\HP\\Documents\\Obsidian Vault',
    autoIndex: true
}

export default class KnowledgeAssistantPlugin extends Plugin {
    settings: KnowledgeAssistantSettings;

    async onload() {
        await this.loadSettings();

        // Add ribbon icon
        this.addRibbonIcon('brain', 'Knowledge Assistant', () => {
            this.activatePanel();
        });

        // Add command
        this.addCommand({
            id: 'open-knowledge-assistant',
            name: 'Open Knowledge Assistant',
            callback: () => {
                this.activatePanel();
            }
        });

        // Add command to search selected text
        this.addCommand({
            id: 'search-selection',
            name: 'Search selection in vault',
            callback: () => {
                this.searchSelection();
            }
        });

        // Add command to generate content from selection
        this.addCommand({
            id: 'generate-from-selection',
            name: 'Generate content from selection',
            callback: () => {
                this.generateFromSelection();
            }
        });

        // Add settings tab
        this.addSettingTab(new KnowledgeAssistantSettingTab(this.app, this));

        // Register the view type
        this.registerView(
            'knowledge-assistant-view',
            (leaf) => new KnowledgeAssistantPanel(leaf, this)
        );

        // Auto-index on startup if enabled
        if (this.settings.autoIndex) {
            this.indexVault();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    activatePanel() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType('knowledge-assistant-view')[0];

        if (!leaf) {
            const newLeaf = workspace.getRightLeaf(false);
            if (newLeaf) {
                newLeaf.setViewState({ type: 'knowledge-assistant-view', active: true });
                workspace.revealLeaf(newLeaf);
            }
        } else {
            workspace.revealLeaf(leaf);
        }
    }

    async searchSelection() {
        const activeView = this.app.workspace.activeLeaf?.view;
        if (!activeView) return;

        const selection = (activeView as any).editor?.getSelection();
        if (selection) {
            this.activatePanel();
            setTimeout(() => {
                const leaf = this.app.workspace.getLeavesOfType('knowledge-assistant-view')[0];
                if (leaf && leaf.view instanceof KnowledgeAssistantPanel) {
                    (leaf.view as KnowledgeAssistantPanel).performSearch(selection);
                }
            }, 100);
        } else {
            new Notice('No text selected');
        }
    }

    async generateFromSelection() {
        const activeView = this.app.workspace.activeLeaf?.view;
        if (!activeView) return;

        const selection = (activeView as any).editor?.getSelection();
        if (selection) {
            this.activatePanel();
            setTimeout(() => {
                const leaf = this.app.workspace.getLeavesOfType('knowledge-assistant-view')[0];
                if (leaf && leaf.view instanceof KnowledgeAssistantPanel) {
                    (leaf.view as KnowledgeAssistantPanel).performGeneration(selection);
                }
            }, 100);
        } else {
            new Notice('No text selected');
        }
    }

    async indexVault() {
        try {
            const response = await fetch(`${this.settings.backendUrl}/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                new Notice('Vault indexed successfully');
            } else {
                new Notice('Failed to index vault');
            }
        } catch (error) {
            new Notice('Error connecting to backend. Make sure the Python server is running.');
        }
    }

    async searchVault(query: string, nResults: number = 5) {
        try {
            const response = await fetch(`${this.settings.backendUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    n_results: nResults
                })
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Search failed');
            }
        } catch (error) {
            new Notice('Error performing search');
            return null;
        }
    }

    async generateContent(query: string, nResults: number = 3) {
        try {
            const response = await fetch(`${this.settings.backendUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    n_results: nResults
                })
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Generation failed');
            }
        } catch (error) {
            new Notice('Error generating content');
            return null;
        }
    }

    async getStats() {
        try {
            const response = await fetch(`${this.settings.backendUrl}/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting stats');
        }
        return null;
    }
}

class KnowledgeAssistantSettingTab extends PluginSettingTab {
    plugin: KnowledgeAssistantPlugin;

    constructor(app: App, plugin: KnowledgeAssistantPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Knowledge Assistant Settings' });

        new Setting(containerEl)
            .setName('Backend URL')
            .setDesc('URL of the Python backend server')
            .addText(text => text
                .setPlaceholder('http://127.0.0.1:5000')
                .setValue(this.plugin.settings.backendUrl)
                .onChange(async (value) => {
                    this.plugin.settings.backendUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Vault Path')
            .setDesc('Path to your Obsidian vault (for the backend)')
            .addText(text => text
                .setPlaceholder('/path/to/vault')
                .setValue(this.plugin.settings.vaultPath)
                .onChange(async (value) => {
                    this.plugin.settings.vaultPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-index on startup')
            .setDesc('Automatically index vault when plugin loads')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoIndex)
                .onChange(async (value) => {
                    this.plugin.settings.autoIndex = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Index Vault Now')
            .setDesc('Manually trigger vault indexing')
            .addButton(button => button
                .setButtonText('Index')
                .onClick(async () => {
                    await this.plugin.indexVault();
                }));

        new Setting(containerEl)
            .setName('Connection Status')
            .setDesc('Check if backend is running')
            .addButton(button => button
                .setButtonText('Check Connection')
                .onClick(async () => {
                    const stats = await this.plugin.getStats();
                    if (stats) {
                        let status = `Connected! ${stats.total_documents} documents indexed`;
                        if (stats.llm && stats.llm.available) {
                            status += stats.llm.loaded ? ' | LLM: Ready' : ' | LLM: Configured but not loaded';
                        } else {
                            status += ' | LLM: Not configured (using template generation)';
                        }
                        new Notice(status);
                    } else {
                        new Notice('Cannot connect to backend');
                    }
                }));
    }
}