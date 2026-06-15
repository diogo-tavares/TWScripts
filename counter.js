(function(window) {
    var strVersion = 'v8.6 (Custom)';
    var unitDesc = { spear: 'Spear fighters', sword: 'Swordsmen', axe: 'Axemen', archer: 'Archers', spy: 'Scouts', light: 'Light cavalry', marcher: 'Mounted archers', heavy: 'Heavy cavalry', ram: 'Rams', catapult: 'Catapults', knight: 'Paladin', snob: 'Noblemen', offense: 'Offensive', defense: 'Defensive' };

    window.fnExecuteScript = function() {
        if (checkScreen('overview_villages', 'units')) {
            fnCalculateTroopCount();
        } else {
            UI.ErrorMessage('Script must be run from <a href="/game.php?screen=overview_villages&mode=units" class="btn">Troops Overview</a>', 5000);
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

    // --- MOTOR DE CONTAGEM ORIGINAL RESTAURADO ---
    function fnGetTroopCount() {
        var gameVersion = parseFloat(game_data.version.split(' ')[1].replace('release_', ''));
        var colCount = $('#units_table ' + (gameVersion >= 7.1 ? 'thead' : 'tbody:eq(0)') + ' th').length - 2;
        var villageTroopInfo = [];

        $('#units_table > tbody').each(function (row) {
            $(this).find('tr:last').remove();
        });

        $('#units_table tbody' + (gameVersion < 7.1 ? ':gt(0)' : '')).each(function (row, eleRow) {
            var villageData = { troops: new Array(20).fill(0) }; // Expandi o array para segurança

            var coords = $(eleRow).find('td:eq(0)').text().match(/\d+\|\d+/g);
            coords = coords ? coords[coords.length - 1].match(/(\d+)\|(\d+)/) : null;
            if (coords) {
                villageData.x = parseInt(coords[1], 10);
                villageData.y = parseInt(coords[2], 10);
                villageData.coords = coords[0];

                $(eleRow).find('td:gt(0):not(:has(>a))').each(function (cell, eleCell) {
                    if (cell % colCount) {
                        if (Math.floor(cell / colCount) != 1) { // Ignora as tropas na aldeia para não duplicar
                            villageData.troops[(cell % colCount) - 1] += parseInt($(eleCell).text() || '0', 10);
                        }
                    }
                });
                villageTroopInfo.push(villageData);
            }
        });

        return villageTroopInfo;
    }
    // ---------------------------------------------

    function fnCalculateTroopCount() {
        var unitConfig = fnCreateUnitConfig();
        
        var outputSummary = { 
            'Full Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 20000 }], descID: 3 }, 
            'Semi Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 15000, maxpop: 20000 }], descID: 4 }, 
            'Half Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 10000, maxpop: 15000 }], descID: 5 }, 
            'Quarter Atack': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 5000, maxpop: 10000 }], descID: 6 }, 
            'Full Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 20000 }], descID: 8 }, 
            'Semi Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 15000, maxpop: 20000 }], descID: 9 }, 
            'Half Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 10000, maxpop: 15000 }], descID: 10 }, 
            'Quarter Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 5000, maxpop: 10000 }], descID: 11 }, 
            'Other': { group: 'Other', criteria: [{ unit: 'spy', maxpop: 5000 }, { unit: 'defense', maxpop: 5000 }, { unit: 'offense', maxpop: 5000 }], descID: 16 } 
        };
        
        var villageTroops = fnGetTroopCount();
        var summary = { unitTotal: { tally: 0, population: 0 }, defense: { tally: 0, count: 0, population: 0, coords: [] }, offense: { tally: 0, count: 0, population: 0, coords: [] } };
        
        // Inicializa objectos ignorando a milícia
        $(unitConfig).children().each(function(i, e) { 
            if (e.nodeName !== 'militia') {
                summary[e.nodeName] = { tally: 0, count: 0, population: 0, coords: [] }; 
            }
        });
        
        for (var item in outputSummary) { summary[item] = { tally: 0, count: 0, population: 0, coords: [] }; }
        
        // Defesa sem catapultas
        var defense = ['spear', 'sword', 'heavy']; 
        var offense = ['axe', 'light', 'ram', 'catapult'];
        if(fnHasArchers()){ defense.push('archer'); offense.push('marcher'); }
        
        // --- LOOP ORIGINAL DE CÁLCULO DE SOMAS ---
        for (var ii = 0; ii < villageTroops.length; ii++) {
            var village = villageTroops[ii];
            var total = {
                defense: { tally: 0, count: 0, population: 0, coords: [] },
                offense: { tally: 0, count: 0, population: 0, coords: [] },
            };

            $(unitConfig).children().each(function (i, e) {
                total[e.nodeName] = { tally: 0, count: 0, population: 0, coords: [] };
            });

            var index = 0;
            $(unitConfig).children().each(function (i, e) {
                var unit = e.nodeName;
                var pop = parseInt($(e).find('pop').text(), 10);
                var count = isNaN(village.troops[index]) ? 0 : village.troops[index];

                total[unit].count += count;
                total[unit].population += count * pop;

                /* Defense */
                if (new RegExp('^(' + defense.join('|') + ')$').test(unit)) {
                    total.defense.count += total[unit].count;
                    total.defense.population += total[unit].population;
                }

                /* Offense */
                if (new RegExp('^(' + offense.join('|') + ')$').test(unit)) {
                    total.offense.count += total[unit].count;
                    total.offense.population += total[unit].population;
                }

                /* Units (Ignorando Milícia globalmente) */
                if (unit !== 'militia') {
                    summary[unit].count += total[unit].count;
                    summary[unit].population += total[unit].population;

                    /* All Units */
                    summary.unitTotal.tally += total[unit].count;
                    summary.unitTotal.population += total[unit].population;
                }
                index++;
            });

            summary.defense.count += total.defense.count;
            summary.defense.population += total.defense.population;
            summary.offense.count += total.offense.count;
            summary.offense.population += total.offense.population;

            for (var itemKey in outputSummary) {
                if (outputSummary.hasOwnProperty(itemKey)) {
                    var isValid = true;
                    for (var jj = 0; jj < outputSummary[itemKey].criteria.length; jj++) {
                        var criteria = outputSummary[itemKey].criteria[jj];
                        var tPop = total[criteria.unit].population;

                        if (!(typeof criteria.minpop == 'undefined' || !criteria.minpop || tPop >= criteria.minpop)) {
                            isValid = false;
                        }
                        if (!(typeof criteria.maxpop == 'undefined' || !criteria.maxpop || tPop < criteria.maxpop)) {
                            isValid = false;
                        }
                    }

                    if (isValid) {
                        summary[itemKey].coords.push(village.coords);
                        summary[itemKey].tally++;
                    }
                }
            }
        }
        // -----------------------------------------

        var groupSummary = {};
        for (var gItem in outputSummary) {
            if (outputSummary.hasOwnProperty(gItem)) {
                if (typeof groupSummary[outputSummary[gItem].group] == 'undefined') {
                    groupSummary[outputSummary[gItem].group] = [];
                }
                groupSummary[outputSummary[gItem].group].push(gItem);
            }
        }

        var totalTroops = summary.unitTotal.population;
        var intPlayerPoints = parseInt(String(game_data.player.points).replace(/[\.,]/g, ''), 10) || 0;
        var troopsToPointsRatio = (intPlayerPoints !== 0) ? (totalTroops / intPlayerPoints).toFixed(2) : "0.00";
        var playerName = game_data.player.name;
        var playerId = game_data.player.id;
        var serverTime = jQuery('#serverTime').text();
        var serverDate = jQuery('#serverDate').text();
        
        // Remove os >< e os parentesis rectos do nome do grupo
        var currentGroupValue = jQuery('#paged_view_content .vis_item > strong').text().replace(/[><\[\]]/g, '').trim();

        var showPlayer = '<b>Player:</b> <a href="/game.php?screen=info_player&id=' + playerId + '" target="_blank">' + playerName + '</a><br>';
        var showTroopsPointRatio = '<b>Troops/Points Ratio:</b> <span>' + troopsToPointsRatio + '</span><br>';
        var serverDateTime = '<b>Server Time:</b> ' + serverTime + ' ' + serverDate + '<br><hr>';
        var currentGroup = '<b>Current Group:</b> ' + currentGroupValue + '<br>';

        var groupNames = {
            'Offensive': fnTranslate(19),
            'Defensive': fnTranslate(20),
            'Other': fnTranslate(22)
        };

        var docSource = '';
        docSource += '<table class="main" width="100%" align="center"><tr><td>';
        docSource += '<h2>' + fnTranslate(17) + '</h2>';
        docSource += showPlayer;
        docSource += showTroopsPointRatio;
        docSource += currentGroup;
        docSource += serverDateTime;
        docSource += '<table class="not-draggable" width="100%">';
        
        // COLUNA ESQUERDA
        docSource += '<tr><td width="50%" valign="top"><table class="vis" width="100%">';
        for (var listGroup in groupSummary) {
            if (groupSummary.hasOwnProperty(listGroup)) {
                var rowCount = 0;
                docSource += '<tr><th colspan="2">' + groupNames[listGroup] + '</th></tr>';
                for (var jj = 0; jj < groupSummary[listGroup].length; jj++) {
                    var lineItem = groupSummary[listGroup][jj];
                    docSource += '<tr class="' + (rowCount++ % 2 ? 'row_b' : 'row_a') + '">';
                    docSource += '<td width="240" style="white-space:nowrap;"><a href="#" onclick="window.fnShowCoords(\'' + lineItem + '\',\'' + fnTranslate(outputSummary[lineItem].descID) + '\'); return false;" title="' + fnCriteriaToStr(outputSummary[lineItem].criteria) + '">&raquo;&nbsp; ' + fnTranslate(outputSummary[lineItem].descID) + '</a></td>';
                    docSource += '<td width="100"' + (summary[lineItem].tally > 0 ? '' : ' class="hidden"') + ' style="text-align:right;"><span>' + summary[lineItem].tally + '</span></td>';
                    docSource += '</tr>';
                }
            }
        }
        docSource += '</table><br>';
        
        /* Total Units Table (Fundo da Coluna Esquerda) */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(26) + '</th></tr>';
        docSource += '<tr class="row_a"><td><span>Count:</span></td><td style="white-space:nowrap; text-align:right;"><span> ' + formatAsNumber(summary.unitTotal.tally) + '</span></td></tr>';
        docSource += '<tr class="row_b"><td><span>Pop:</span></td><td style="white-space:nowrap; text-align:right;"><span> ' + formatAsNumber(summary.unitTotal.population) + '</span></td></tr>';
        docSource += '</table></td>';

        // COLUNA DIREITA
        docSource += '<td width="50%" valign="top">';
        /* Offensive Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(23) + '</th></tr>';
        var offCount = 0;
        for (var keyOff in offense) {
            if (offense.hasOwnProperty(keyOff)) {
                docSource += '<tr class="' + (offCount++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + offense[keyOff] + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[offense[keyOff]].count) + ' ' + unitDesc[offense[keyOff]] + '</span></td></tr>';
            }
        }
        docSource += '</table>';

        /* Defensive Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(24) + '</th></tr>';
        var defCount = 0;
        for (var keyDef in defense) {
            if (defense.hasOwnProperty(keyDef)) {
                docSource += '<tr class="' + (defCount++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + defense[keyDef] + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[defense[keyDef]].count) + ' ' + unitDesc[defense[keyDef]] + '</span></td></tr>';
            }
        }
        docSource += '</table>';

        /* Other Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(25) + '</th></tr>';
        var othCount = 0;
        $(unitConfig).children().each(function (i, e) {
            var unit = e.nodeName;
            if (unit !== 'militia' && !new RegExp('^(' + defense.join('|') + '|' + offense.join('|') + ')$').test(unit)) {
                docSource += '<tr class="' + (othCount++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + unit + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[unit].count) + ' ' + unitDesc[unit] + '</span></td></tr>';
            }
        });
        docSource += '</table></td></tr></table><br>';

        /* Coords System Logic */
        docSource += '<script type="text/javascript">';
        docSource += 'window.fnShowCoords = function(id, description) { ';
        docSource += 'var coords = {};';
        for (var sItem in outputSummary) {
            if (outputSummary.hasOwnProperty(sItem) && summary[sItem].coords.length) {
                docSource += 'coords["' + sItem + '"] = "' + summary[sItem].coords.join(' ') + '";';
            }
        }
        docSource += 'document.getElementById("coords_group").innerHTML = description;';
        docSource += 'var eleCoords = document.getElementById("coords_container");';
        docSource += 'eleCoords.value = coords[id] ? coords[id] : "";';
        docSource += 'eleCoords.focus(); eleCoords.select(); };';
        docSource += '</script>';

        /* Coords Display */
        docSource += '<table id="coordinate_table" class="vis" style="width:100%;">';
        docSource += '<tr><th>' + fnTranslate(27) + ': <span id="coords_group" style="font-weight:100;"></span></th></tr>';
        docSource += '<tr><td style="box-sizing:border-box;width:100%;"><textarea id="coords_container" style="resize:none;width:100%;box-sizing:border-box;height:60px;"></textarea></td></tr>';
        docSource += '</table>';

        Dialog.show('content', preparePopupContent(docSource, '720px'));
    }

    window.clickDraggableEl = function() {
        jQuery('.troops-counter-content').remove();
    };

    if (game_data.features.Premium.active) {
        fnExecuteScript();
    } else {
        UI.ErrorMessage('Premium Account required!', 6000);
    }
})(window);
