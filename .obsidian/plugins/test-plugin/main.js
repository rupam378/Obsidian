const { Plugin } = require('obsidian');

class TestPlugin extends Plugin {
    onload() {
        console.log('Test plugin loaded!');
        this.addRibbonIcon('info', 'Test Plugin', () => {
            console.log('Test plugin ribbon clicked');
        });
    }
}

module.exports = TestPlugin;