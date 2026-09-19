const plugins = [
    {
        name: "MaxLevel.js",
        description: "Обходить базове обмеження рівнів 99 і додає масштабування характеристик акторів.",
        code: `(() => {
    const parameters = PluginManager.parameters("MaxLevelBypass");
    const globalMaxLevel = Number(parameters['globalMaxLevel'] || 999);

    const _Game_Actor_maxLevel = Game_Actor.prototype.maxLevel;
    Game_Actor.prototype.maxLevel = function() {
        if (this.actor().meta && this.actor().meta.MaxLevel) {
            return Number(this.actor().meta.MaxLevel);
        }
        return (_Game_Actor_maxLevel.call(this) >= 99) ? globalMaxLevel : _Game_Actor_maxLevel.call(this);
    };

    const _Game_Actor_paramBase = Game_Actor.prototype.paramBase;
    Game_Actor.prototype.paramBase = function(paramId) {
        const level = this._level;
        
        if (level > 99) {
            const val99 = this.currentClass().params[paramId][99];
            const val98 = this.currentClass().params[paramId][98];
            const growth = val99 - val98; 
            
            return val99 + (growth * (level - 99));
        }
        
        return _Game_Actor_paramBase.call(this, paramId);
    };
})();`
    },
    {
        name: "SimpleItemNotifier.js",
        description: "Автоматично виводить текстове повідомлення про отримані або втрачені предмети.",
        code: `/*:
 * @target MZ
 * @plugindesc Автоматично показує повідомлення при отриманні або втраті предметів.
 * @author Developer
 * * @help SimpleItemNotifier.js
 * * Цей плагін не потребує налаштувань. Всі виклики $gameParty.gainItem()
 * будуть супроводжуватися текстовим повідомленням.
 */

(() => {
    const _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        _Game_Party_gainItem.call(this, item, amount, includeEquip);

        if (item && amount !== 0) {
            const action = amount > 0 ? "Отримано" : "Втрачено";
            const absAmount = Math.abs(amount);
            $gameMessage.add(\`\${action}: \${item.name} x\${absAmount}\`);
        }
    };
})();`
    },
    {
        name: "DisableDashSwitch.js",
        description: "Блокує можливість прискорення/бігу гравця за допомогою ігрового перемикача (Switch).",
        code: `(() => {
    const pluginName = "DisableDashSwitch";
    const parameters = PluginManager.parameters(pluginName);
    const disableSwitchId = Number(parameters['disableSwitchId'] || 1);

    const _Game_Player_isDashDiabled = Game_Player.prototype.isDashDisabled;
    Game_Player.prototype.isDashDisabled = function() {
        if ($gameSwitches.value(disableSwitchId)) {
            return true;
        }
        return _Game_Player_isDashDiabled.call(this);
    };
})();`
    },
    {
        name: "FullPartyRecovery.js",
        description: "Викликова команда для повного відновлення всієї групи зі звуковим ефектом і текстовим сповіщенням.",
        code: `$gameParty.members().forEach(actor => actor.recoverAll());

AudioManager.playSe({ name: "Recovery", volume: 90, pitch: 100, pan: 0 });

$gameMessage.add("Вся група повністю відновлена!");`
    }
];

function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/javascript;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('plugin-grid');

    plugins.forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div>
                <h3>${plugin.name}</h3>
                <p>${plugin.description}</p>
                <div class="code-box">${escapeHtml(plugin.code)}</div>
            </div>
            <button class="btn">Завантажити .js</button>
        `;

        card.querySelector('.btn').addEventListener('click', () => {
            downloadFile(plugin.name, plugin.code);
        });

        grid.appendChild(card);
    });
});

function escapeHtml(string) {
    return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}