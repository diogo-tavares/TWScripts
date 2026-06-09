(function() {
    if (typeof jQuery == 'undefined') return;

    var strVersion = 'v8.6';
    var unitDesc = {spear:'Spear fighters',sword:'Swordsmen',axe:'Axemen',archer:'Archers',spy:'Scouts',light:'Light cavalry',marcher:'Mounted archers',heavy:'Heavy cavalry',ram:'Rams',catapult:'Catapults',knight:'Paladin',snob:'Noblemen',militia:'Militia',offense:'Offensive',defense:'Defensive'};
    
    if (typeof unitConfig == 'undefined') unitConfig = fnCreateUnitConfig();
    var DRAGGABLE = false;

    function fnExecuteScript() {
        if (checkScreen('overview_villages', 'units')) {
            fnCalculateTroopCount();
        } else {
            UI.ErrorMessage('Script must be run from <a href="/game.php?screen=overview_villages&mode=units" class="btn">Troops Overview</a>', 5000);
        }
    }

    function fnTranslate(id) {
        var translation = { en: ['Full Train Nukes','Full Defense Trains','Other Nobles','Full Nukes','3/4 Nukes','1/2 Nukes','1/4 Nukes','Catapult Nukes','Full Defense','3/4 Defense','1/2 Defense','1/4 Defense','Full Scouts','3/4 Scouts','1/2 Scouts','1/4 Scouts','Other','Troops Counter','Noble Armies','Offensive Armies','Defensive Armies','Scout Armies','Other Armies','Offensive Units','Defensive Units','Other Units','Total Units','Co-ordinates'] };
        var lang = (typeof translation[game_data.market] == 'undefined') ? 'en' : game_data.market;
        return (typeof translation[lang][id] == 'undefined') ? '' : translation[lang][id];
    }

    function fnAjaxRequest(url, sendMethod, params, type) {
        var payload = null;
        $.ajax({ async: false, url: url, data: params, dataType: type, type: String(sendMethod || 'GET').toUpperCase(), success: function(data) { payload = data; } });
        return payload;
    }

    function fnCreateConfig(name) { return $(fnAjaxRequest('/interface.php', 'GET', { func: name }, 'xml')).find('config'); }
    function fnCreateUnitConfig() { return fnCreateConfig('get_unit_info'); }
    function fnHasArchers() { return game_data.units.includes('archer'); }
    function fnHasMilitia() { return game_data.units.includes('militia'); }

    function fnGetTroopCount() {
        var gameVersion = parseFloat(game_data.version.split(' ')[1].replace('release_', ''));
        var colCount = $('#units_table ' + (gameVersion >= 7.1 ? 'thead' : 'tbody:eq(0)') + ' th').length - 2;
        var villageTroopInfo = [];
        $('#units_table > tbody').each(function() { $(this).find('tr:last').remove(); });
        $('#units_table tbody' + (gameVersion < 7.1 ? ':gt(0)' : '')).each(function(row, eleRow) {
            var villageData = { troops: [0,0,0,0,0,0,0,0,0,0,0,0,0] };
            var coords = $(eleRow).find('td:eq(0)').text().match(/\d+\|\d+/g);
            coords = coords ? coords[coords.length - 1].match(/(\d+)\|(\d+)/) : null;
            villageData.coords = coords[0];
            $(eleRow).find('td:gt(0):not(:has(>a))').each(function(cell, eleCell) {
                if (cell % colCount && Math.floor(cell / colCount) != 1) {
                    villageData.troops[(cell % colCount) - 1] += parseInt($(eleCell).text() || '0', 10);
                }
            });
            villageTroopInfo.push(villageData);
        });
        return villageTroopInfo;
    }

    function fnCriteriaToStr(criteria) {
        var valueStr = '';
        criteria.forEach(c => {
            if (c.minpop) valueStr += (valueStr ? ' and ' : '') + '(' + unitDesc[c.unit] + '[pop] >= ' + c.minpop + ')';
            if (c.maxpop) valueStr += (valueStr ? ' and ' : '') + '(' + unitDesc[c.unit] + '[pop] < ' + c.maxpop + ')';
        });
        return valueStr;
    }

    function fnCalculateTroopCount() {
        var outputSummary = {
            'Full Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 20000 }], descID: 3 },
            'Semi Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 15000, maxpop: 20000 }], descID: 4 },
            'Half Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 10000, maxpop: 15000 }], descID: 5 },
            'Full Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 20000 }], descID: 8 },
            'Semi Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 15000, maxpop: 20000 }], descID: 9 },
            'Other': { group: 'Other', criteria: [{ unit: 'spy', maxpop: 5000 }, { unit: 'defense', maxpop: 5000 }, { unit: 'offense', maxpop: 5000 }], descID: 16 }
        };

        var summary = { unitTotal: { tally: 0, population: 0 }, defense: { tally: 0, count: 0, population: 0, coords: [] }, offense: { tally: 0, count: 0, population: 0, coords: [] } };
        // ... (resto da lógica de cálculo igual ao original)
        // [O teu código de cálculo permanece aqui]
        
        Dialog.show('content', preparePopupContent(docSource, '440px'));
    }

    function checkScreen(userScreen, userMode) {
        var url = new URL(window.location.href);
        return (url.searchParams.get('screen') === userScreen && url.searchParams.get('mode') === userMode);
    }

    function preparePopupContent(b, w) { return `<div class="ra-body" style="max-width: ${w}">${b}</div>`; }

    if (!game_data.features.Premium.active) {
        UI.ErrorMessage('Premium Account required!', 6000);
    } else {
        fnExecuteScript();
    }
})();
