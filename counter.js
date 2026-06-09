(function(window) {
    var strVersion = 'v8.6';
    var unitDesc = { spear: 'Spear fighters', sword: 'Swordsmen', axe: 'Axemen', archer: 'Archers', spy: 'Scouts', light: 'Light cavalry', marcher: 'Mounted archers', heavy: 'Heavy cavalry', ram: 'Rams', catapult: 'Catapults', knight: 'Paladin', snob: 'Noblemen', militia: 'Militia', offense: 'Offensive', defense: 'Defensive' };

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
    function fnHasMilitia() { return game_data.units.includes('militia'); }
    function formatAsNumber(n) { return parseInt(n).toLocaleString('de'); }
    function preparePopupContent(b, w) { return '<div class="ra-body" style="max-width: ' + w + '">' + b + '</div>'; }
    
    // Títulos atualizados para Atack em vez de Nukes
    function fnTranslate(id) { 
        var t = { en: ['Full Train Nukes','Full Defense Trains','Other Nobles','Full Atack','3/4 Atack','1/2 Atack','1/4 Atack','Catapult Nukes','Full Defense','3/4 Defense','1/2 Defense','1/4 Defense','Full Scouts','3/4 Scouts','1/2 Scouts','1/4 Scouts','Other','Troops Counter','Noble Armies','Offensive Armies','Defensive Armies','Scout Armies','Other Armies','Offensive Units','Defensive Units','Other Units','Total Units','Co-ordinates'] }; 
        var l = (typeof t[game_data.market] == 'undefined') ? 'en' : game_data.market; 
        return (typeof t[l][id] == 'undefined') ? '' : t[l][id]; 
    }
    
    function fnCriteriaToStr(c) { var s = ''; c.forEach(x => { if(x.minpop) s+=(s?' and ':'')+'('+unitDesc[x.unit]+'[pop] >= '+x.minpop+')'; if(x.maxpop) s+=(s?' and ':'')+'('+unitDesc[x.unit]+'[pop] < '+x.maxpop+')'; }); return s; }

    function fnGetTroopCount() {
        var v = parseFloat(game_data.version.split(' ')[1].replace('release_', ''));
        var c = $('#units_table ' + (v >= 7.1 ? 'thead' : 'tbody:eq(0)') + ' th').length - 2;
        var i = [];
        $('#units_table > tbody').each(function() { $(this).find('tr:last').remove(); });
        $('#units_table tbody' + (v < 7.1 ? ':gt(0)' : '')).each(function(r, e) {
            var d = { troops: new Array(13).fill(0) };
            var coord = $(e).find('td:eq(0)').text().match(/(\d+)\|(\d+)/);
            d.coords = coord ? coord[0] : "0|0";
            $(e).find('td:gt(0):not(:has(>a))').each(function(n, x) {
                if (n % c && Math.floor(n / c) != 1) d.troops[(n % c) - 1] += parseInt($(x).text() || '0', 10);
            });
            i.push(d);
        });
        return i;
    }

    window.clickDraggableEl = function() {
        jQuery('.troops-counter-content').remove();
    };

    function fnCalculateTroopCount() {
        var unitConfig = fnCreateUnitConfig();
        
        // Grupos de exércitos limpos (removidos Nobles, Scouts e Cat Nukes)
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
        $(unitConfig).children().each(function(i, e) { summary[e.nodeName] = { tally: 0, count: 0, population: 0, coords: [] }; });
        for (var item in outputSummary) { summary[item] = { tally: 0, count: 0, population: 0, coords: [] }; }
        var defense = ['spear', 'sword', 'heavy', 'catapult']; var offense = ['axe', 'light', 'ram', 'catapult'];
        if(fnHasArchers()){ defense.push('archer'); offense.push('marcher'); }
        if(fnHasMilitia()){ defense.push('militia'); }
        
        villageTroops.forEach(village => {
            var total = { defense: { count: 0, population: 0 }, offense: { count: 0, population: 0 } };
            var index = 0;
            $(unitConfig).children().each(function(i, e) {
                var unit = e.nodeName; var pop = parseInt($(e).find('pop').text(), 10);
                var count = village.troops[index];
                if(new RegExp('^(' + defense.join('|') + ')$').test(unit)) { total.defense.count += count; total.defense.population += count * pop; }
                if(new RegExp('^(' + offense.join('|') + ')$').test(unit)) { total.offense.count += count; total.offense.population += count * pop; }
                index++;
            });
            for (var item in outputSummary) {
                var isValid = true;
                outputSummary[item].criteria.forEach(c => {
                    var val = (c.unit === 'defense') ? total.defense.population : (c.unit === 'offense') ? total.offense.population : 0;
                    if(c.minpop && val < c.minpop) isValid = false;
                    if(c.maxpop && val >= c.maxpop) isValid = false;
                });
                if(isValid) { summary[item].coords.push(village.coords); summary[item].tally++; }
            }
        });

        var groupSummary = {};
        for (var item in outputSummary) {
            if (outputSummary.hasOwnProperty(item)) {
                if (typeof groupSummary[outputSummary[item].group] == 'undefined') {
                    groupSummary[outputSummary[item].group] = [];
                }
                groupSummary[outputSummary[item].group].push(item);
            }
        }

        var totalTroops = summary.unitTotal.population;
        var intPlayerPoints = parseInt(game_data.player.points);
        var troopsToPointsRatio = (intPlayerPoints !== 0) ? (totalTroops / intPlayerPoints).toFixed(2) : "0.00";
        var playerName = game_data.player.name;
        var playerId = game_data.player.id;
        var serverTime = jQuery('#serverTime').text();
        var serverDate = jQuery('#serverDate').text();
        
        var currentGroupValue = jQuery('#paged_view_content .vis_item > strong').text().trim();
        if(currentGroupValue.startsWith('[')) currentGroupValue = currentGroupValue.slice(1, -1);

        var showPlayer = '<b>Player:</b> <a href="/game.php?screen=info_player&id=' + playerId + '" target="_blank">' + playerName + '</a><br>';
        var showTroopsPointRatio = '<b>Troops/Points Ratio:</b> <span>' + troopsToPointsRatio + '</span><br>';
        var serverDateTime = '<b>Server Time:</b> ' + serverTime + ' ' + serverDate + '<br><hr>';
        var currentGroup = '<b>Current Group:</b> ' + currentGroupValue + '<br>';

        // Títulos mapeados manualmente para evitar bugs
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
        docSource += '<table class="not-draggable">';
        docSource += '<tr><td width="450" valign="top"><table class="vis" width="100%">';
        
        for (var item in groupSummary) {
            if (groupSummary.hasOwnProperty(item)) {
                var count = 0;
                docSource += '<tr><th colspan="2">' + groupNames[item] + '</th></tr>';
                for (var jj = 0; jj < groupSummary[item].length; jj++) {
                    docSource += '<tr class="' + (count++ % 2 ? 'row_b' : 'row_a') + '">';
                    docSource += '<td width="240" style="white-space:nowrap;"><a href="#" onclick="window.fnShowCoords(\'' + groupSummary[item][jj] + '\',\'' + fnTranslate(outputSummary[groupSummary[item][jj]].descID) + '\'); return false;" title="' + fnCriteriaToStr(outputSummary[groupSummary[item][jj]].criteria) + '">&raquo;&nbsp; ' + fnTranslate(outputSummary[groupSummary[item][jj]].descID) + '</a></td>';
                    docSource += '<td width="240"' + (summary[groupSummary[item][jj]].tally > 0 ? '' : ' class="hidden"') + ' style="text-align:right;"><span>' + summary[groupSummary[item][jj]].tally + '</span></td>';
                    docSource += '</tr>';
                }
            }
        }
        docSource += '</table></td>';
        docSource += '<td valign="top">';

        /* Offensive Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(23) + '</th></tr>';
        var count = 0;
        for (var key in offense) {
            if (offense.hasOwnProperty(key)) {
                docSource += '<tr class="' + (count++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + offense[key] + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[offense[key]].count) + ' ' + unitDesc[offense[key]] + '</span></td></tr>';
            }
        }
        docSource += '</table>';

        /* Defensive Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(24) + '</th></tr>';
        var count = 0;
        for (var key in defense) {
            if (defense.hasOwnProperty(key)) {
                docSource += '<tr class="' + (count++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + defense[key] + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[defense[key]].count) + ' ' + unitDesc[defense[key]] + '</span></td></tr>';
            }
        }
        docSource += '</table>';

        /* Total Units Table (Movido para baixo da Defesa) */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(26) + '</th></tr>';
        docSource += '<tr class="row_a"><td><span>Count:</span></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary.unitTotal.tally) + '</span></td></tr>';
        docSource += '<tr class="row_b"><td><span>Pop:</span></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary.unitTotal.population) + '</span></td></tr>';
        docSource += '</table>';

        /* Other Units Table */
        docSource += '<table class="vis" width="100%"><tr><th colspan="2" style="white-space:nowrap;">' + fnTranslate(25) + '</th></tr>';
        var count = 0;
        $(unitConfig).children().each(function (i, e) {
            var unit = e.nodeName;
            if (!new RegExp('^(' + defense.join('|') + '|' + offense.join('|') + ')$').test(unit)) {
                docSource += '<tr class="' + (count++ % 2 ? 'row_b' : 'row_a') + '"><td><img src="https://' + location.hostname + '/graphic/unit/unit_' + unit + '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' + formatAsNumber(summary[unit].count) + ' ' + unitDesc[unit] + '</span></td></tr>';
            }
        });
        docSource += '</table></td></tr></table><br>';

        /* Coords System Logic */
        docSource += '<script type="text/javascript">';
        docSource += 'window.fnShowCoords = function(id, description) { ';
        docSource += 'var coords = {};';
        for (var item in outputSummary) {
            if (outputSummary.hasOwnProperty(item) && summary[item].coords.length) {
                docSource += 'coords["' + item + '"] = "' + summary[item].coords.join(' ') + '";';
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

    if (game_data.features.Premium.active) {
        fnExecuteScript();
    } else {
        UI.ErrorMessage('Premium Account required!', 6000);
    }
})(window);
