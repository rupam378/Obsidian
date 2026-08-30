@echo off
echo Building Obsidian Knowledge Assistant Plugin...
cd plugin
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm run build
echo Plugin built successfully!
echo Copy the plugin folder to your Obsidian plugins directory:
echo Windows: %%APPDATA%%\obsidian\plugins\
echo Mac: ~/Library/Application Support/obsidian/plugins/
echo Linux: ~/.config/obsidian/plugins/
pause