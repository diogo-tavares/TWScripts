(function(window) {
    var strVersion = 'v8.6 (Custom Final)';
    var unitDesc = { spear: 'Spear fighters', sword: 'Swordsmen', axe: 'Axemen', archer: 'Archers', spy: 'Scouts', light: 'Light cavalry', marcher: 'Mounted archers', heavy: 'Heavy cavalry', ram: 'Rams', catapult: 'Catapults', knight: 'Paladin', snob: 'Noblemen', offense: 'Offensive', defense: 'Defensive' };

    window.fnExecuteScript = function() {
        if (checkScreen('overview_villages', 'units')) {
            fnCalculateTroopCount();
        } else {
            window.location.href = '/game.php?screen=overview_villages&mode=units';
        }
    };

    function checkScreen(s, m) { var u = new URL(window.location.href); return (u.searchParams.get('screen') === s && u.searchParams.get('mode') === m); }
    function fnAjaxRequest(u, m, p, t) { var r = null; $.ajax({ async: false, url: u, data: p, dataType: t, type: String(m || 'GET').toUpperCase(), success: function(d) { r = d; } }); return r; }
    function fnCreateUnitConfig() { return $(fnAjaxRequest('/interface.php', 'GET', { func: 'get_unit_info' }, 'xml')).find('config'); }
    function fnHasArchers() { return game_data.units.includes('archer'); }
    function formatAsNumber(n) { return parseInt(n).toLocaleString('de'); }
    function preparePopupContent(b, w) { return '<div class="ra-body" style="max-width: ' + w + '">' + b + '</div>'; }
    
    function fnTranslate(id) { 
        var t = { en: ['Full Train Nukes','Full Defense Trains','Other Nobles','Full Atack','3/4 Atack','1/2 Atack','1/4 Atack','Catapult Nukes','Full Defense','3/4 Defense','1/2 Defense','1/4 Defense','Full Scouts','3/4 Scouts','1/2 Scouts','1/4 Scouts','Other','Troops Counter','Noble Armies','Offensive Armies','Defensive Armies','Scout Armies','Other Armies','Offensive Units','Defensive Units','Other Units','Total Units','Co-ordinates'] }; 
        var l = (typeof t[game_data.market] == 'undefined') ? 'en' : game_data.market; 
        return (typeof t[l][id] == 'undefined') ? '' : t[l][id]; 
    }
    
    function fnCriteriaToStr(c) { var s = ''; c.forEach(x => { if(x.minpop) s+=(s?' and ':'')+'('+unitDesc[x.unit]+'[pop] >= '+x.minpop+')'; if(x.maxpop) s+=(s?' and ':'')+'('+unitDesc[x.unit]+'[pop] < '+x.maxpop+')'; }); return s; }

    function fnGetTroopCount() {
        var gameVersion = parseFloat(game_data.version.split(' ')[1].replace('release_', ''));
        var colCount = $('#units_table ' + (gameVersion >= 7.1 ? 'thead' : 'tbody:eq(0)') + ' th').length - 2;
        var villageTroopInfo = [];

        var $tableClone = $('#units_table').clone();

        $tableClone.find('> tbody').each(function (row) {
            $(this).find('tr:last').remove();
        });

        $tableClone.find('tbody' + (gameVersion < 7.1 ? ':gt(0)' : '')).each(function (row, eleRow) {
            var villageData = { troops: new Array(20).fill(0) };
            var $firstCell = $(eleRow).find('td:eq(0)');

            var coords = $firstCell.text().match(/\d+\|\d+/g);
            coords = coords ? coords[coords.length - 1].match(/(\d+)\|(\d+)/) : null;
            
            if (coords) {
                villageData.x = parseInt(coords[1], 10);
                villageData.y = parseInt(coords[2], 10);
                villageData.coords = coords[0];
                
                // Extrair ID da Aldeia e construir link direto para a Praça de Reuniões
                var $link = $firstCell.find('a:first');
                var rawUrl = $link.attr('href') || '#';
                var vMatch = rawUrl.match(/village=(\d+)/);
                var vId = vMatch ? vMatch[1] : '';
                
                villageData.url = vId ? ('/game.php?village=' + vId + '&screen=place') : rawUrl;
                villageData.name = $link.text().trim() || villageData.coords;

                $(eleRow).find('td:gt(0):not(:has(>a))').each(function (cell, eleCell) {
                    if (cell % colCount) {
                        if (Math.floor(cell / colCount) != 1) {
                            villageData.troops[(cell % colCount) - 1] += parseInt($(eleCell).text() || '0', 10);
                        }
                    }
                });
                villageTroopInfo.push(villageData);
            }
        });

        return villageTroopInfo;
    }

    function fnCalculateTroopCount() {
        var unitConfig = fnCreateUnitConfig();
        
        var outputSummary = { 
            'Full Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 20000 }], descID: 3 }, 
            'Semi Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 15000, maxpop: 20000 }], descID: 4 }, 
            'Half Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 10000, maxpop: 15000 }], descID: 5 }, 
            'Quarter Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 5000, maxpop: 10000 }], descID: 6 }, 
            'Full Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 20000 }], descID: 8 }, 
            'Semi Defense': { group: 'Defensive', criteria: [{ unit: 'defense
