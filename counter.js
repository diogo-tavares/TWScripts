(function(window) {
    var strVersion = 'v8.6';
    var latestUpdated = '2023-12-25';
    var unitDesc = { spear: 'Spear fighters', sword: 'Swordsmen', axe: 'Axemen', archer: 'Archers', spy: 'Scouts', light: 'Light cavalry', marcher: 'Mounted archers', heavy: 'Heavy cavalry', ram: 'Rams', catapult: 'Catapults', knight: 'Paladin', snob: 'Noblemen', militia: 'Militia', offense: 'Offensive', defense: 'Defensive' };
    var DRAGGABLE = false;

    window.fnExecuteScript = function() {
        initDebug();
        if (checkScreen('overview_villages', 'units')) {
            fnCalculateTroopCount();
        } else {
            UI.ErrorMessage('Script must be run from <a href="/game.php?screen=overview_villages&mode=units" class="btn">Troops Overview</a>', 5000);
        }
    };

    function initDebug() { console.debug('[Troops Counter] It works!'); }
    function checkScreen(s, m) { var u = new URL(window.location.href); return (u.searchParams.get('screen') === s && u.searchParams.get('mode') === m); }
    function fnAjaxRequest(u, m, p, t) { var r = null; $.ajax({ async: false, url: u, data: p, dataType: t, type: String(m || 'GET').toUpperCase(), success: function(d) { r = d; } }); return r; }
    function fnCreateUnitConfig() { return $(fnAjaxRequest('/interface.php', 'GET', { func: 'get_unit_info' }, 'xml')).find('config'); }
    function fnHasArchers() { return game_data.units.includes('archer'); }
    function fnHasMilitia() { return game_data.units.includes('militia'); }
    function formatAsNumber(n) { return parseInt(n).toLocaleString('de'); }
    function preparePopupContent(b, w) { return `<div class="ra-body" style="max-width: ${w}">${b}</div>`; }
    function fnTranslate(id) { var t = { en: ['Full Train Nukes','Full Defense Trains','Other Nobles','Full Nukes','3/4 Nukes','1/2 Nukes','1/4 Nukes','Catapult Nukes','Full Defense','3/4 Defense','1/2 Defense','1/4 Defense','Full Scouts','3/4 Scouts','1/2 Scouts','1/4 Scouts','Other','Troops Counter','Noble Armies','Offensive Armies','Defensive Armies','Scout Armies','Other Armies','Offensive Units','Defensive Units','Other Units','Total Units','Co-ordinates'] }; var l = (typeof t[game_data.market] == 'undefined') ? 'en' : game_data.market; return (typeof t[l][id] == 'undefined') ? '' : t[l][id]; }
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

    function fnCalculateTroopCount() {
        var unitConfig = fnCreateUnitConfig();
        var outputSummary = { 'Full Train Nuke': { group: 'Nobles', criteria: [{ unit: 'snob', minpop: 400 }, { unit: 'offense', minpop: 19600 }], descID: 0 }, 'Full Defense Train': { group: 'Nobles', criteria: [{ unit: 'snob', minpop: 400 }, { unit: 'defense', minpop: 19600 }], descID: 1 }, 'Other Nobles': { group: 'Nobles', criteria: [{ unit: 'snob', minpop: 100 }, { unit: 'defense', maxpop: 19600 }, { unit: 'offense', maxpop: 19600 }], descID: 2 }, 'Full Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 20000 }], descID: 3 }, 'Semi Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 15000, maxpop: 20000 }], descID: 4 }, 'Half Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 10000, maxpop: 15000 }], descID: 5 }, 'Quarter Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 5000, maxpop: 10000 }], descID: 6 }, 'Cat Nuke': { group: 'Offensive', criteria: [{ unit: 'catapult', minpop: 800 }, { unit: 'offense', minpop: 20000 }], descID: 7 }, 'Full Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 20000 }], descID: 8 }, 'Semi Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 15000, maxpop: 20000 }], descID: 9 }, 'Half Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 10000, maxpop: 15000 }], descID: 10 }, 'Quarter Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 5000, maxpop: 10000 }], descID: 11 }, 'Full Scout': { group: 'Scouts', criteria: [{ unit: 'spy', minpop: 20000 }], descID: 12 }, 'Semi Scout': { group: 'Scouts', criteria: [{ unit: 'spy', minpop: 15000, maxpop: 20000 }], descID: 13 }, 'Half Scout': { group: 'Scouts', criteria: [{ unit: 'spy', minpop: 10000, maxpop: 15000 }], descID: 14 }, 'Quarter Scout': { group: 'Scouts', criteria: [{ unit: 'spy', minpop: 5000, maxpop: 10000 }], descID: 15 }, Other: { group: 'Other', criteria: [{ unit: 'spy', maxpop: 5000 }, { unit: 'defense', maxpop: 5000 }, { unit: 'offense', maxpop: 5000 }], descID: 16 } };
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
        
        var docSource = '';
    docSource +=
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n';
    docSource += '<html><head>';
    docSource += '<script type="text/javascript">';
    docSource += 'function fnShowCoords(id,description){';
    docSource += 'var coords={};';
    for (item in outputSummary) {
        if (outputSummary.hasOwnProperty(item)) {
            if (summary[item].coords.length) {
                docSource +=
                    'coords["' +
                    item +
                    '"] = "' +
                    summary[item].coords.join(' ') +
                    '";\n';
            }
        }
    }
    docSource +=
        'document.getElementById("coords_group").innerHTML = description;';
    docSource += 'var eleCoords = document.getElementById("coords_container");';
    docSource += 'eleCoords.value = coords[id]?coords[id]:"";';
    docSource += 'eleCoords.focus();';
    docSource += 'eleCoords.select();';
    docSource += '}';
    docSource += '</script>';
    docSource += '</head>';
    docSource += '<body>';
    docSource += '<table class="main" width="100%" align="center"><tr><td>';
    docSource +=
        '<h2>' +
        fnTranslate(curGroup++) +
        '<sup><span style="font-size:small;">' +
        '</span></sup></h2>';
    docSource += `${showPlayer}`;
    docSource += `${showTroopsPointRatio}`;
    docSource += `${currentGroup}`;
    docSource += `${serverDateTime}`;
    docSource += '<table class="not-draggable">';
    docSource +=
        '<tr><td width="450" valign="top"><table class="vis" width="100%">';
    for (item in groupSummary) {
        if (groupSummary.hasOwnProperty(item)) {
            count = 0;
            docSource +=
                '<tr><th colspan="2">' + fnTranslate(curGroup++) + '</th></tr>';
            for (jj = 0; jj < groupSummary[item].length; jj++) {
                docSource +=
                    '<tr class="' + (count++ % 2 ? 'row_b' : 'row_a') + '">';
                docSource +=
                    '<td width="240" style="white-space:nowrap;"><a href="#" onclick="fnShowCoords(\'' +
                    groupSummary[item][jj] +
                    "','" +
                    fnTranslate(outputSummary[groupSummary[item][jj]].descID) +
                    '\');" title="' +
                    fnCriteriaToStr(
                        outputSummary[groupSummary[item][jj]].criteria
                    ) +
                    '">&raquo;&nbsp; ' +
                    fnTranslate(outputSummary[groupSummary[item][jj]].descID) +
                    '</a></td>\n';
                docSource +=
                    '<td width="240"' +
                    (summary[groupSummary[item][jj]].tally > 0
                        ? ''
                        : ' class="hidden"') +
                    ' style="text-align:right;"><span>' +
                    summary[groupSummary[item][jj]].tally +
                    '</span></td>';
                docSource += '</tr>';
            }
        }
    }
    docSource += '</table>';
    docSource += '<td valign="top">';

    /* Offensive Units */

    docSource += '<table class="vis" width="100%">';
    docSource +=
        '<tr><th colspan="2" style="white-space:nowrap;">' +
        fnTranslate(curGroup++) +
        '</th></tr>';
    count = 0;
    for (key in offense) {
        if (offense.hasOwnProperty(key)) {
            docSource +=
                '<tr class="' +
                (count++ % 2 ? 'row_b' : 'row_a') +
                '"><td><img src="https://' +
                location.hostname +
                '/graphic/unit/unit_' +
                offense[key] +
                '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' +
                formatAsNumber(summary[offense[key]].count) +
                ' ' +
                unitDesc[offense[key]] +
                '</span></td></tr>';
        }
    }
    docSource += '</table>';

    /* Defensive Units */
    docSource += '<table class="vis" width="100%">';
    docSource +=
        '<tr><th colspan="2" style="white-space:nowrap;">' +
        fnTranslate(curGroup++) +
        '</th></tr>';
    count = 0;
    for (key in defense) {
        if (defense.hasOwnProperty(key)) {
            docSource +=
                '<tr class="' +
                (count++ % 2 ? 'row_b' : 'row_a') +
                '"><td><img src="https://' +
                location.hostname +
                '/graphic/unit/unit_' +
                defense[key] +
                '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' +
                formatAsNumber(summary[defense[key]].count) +
                ' ' +
                unitDesc[defense[key]] +
                '</span></td></tr>';
        }
    }
    docSource += '</table>';

    /* Other Units */
    docSource += '<table class="vis" width="100%">';
    docSource +=
        '<tr><th colspan="2" style="white-space:nowrap;">' +
        fnTranslate(curGroup++) +
        '</th></tr>';
    count = 0;
    $(unitConfig)
        .children()
        .each(function (i, e) {
            var unit = e.nodeName;
            if (
                !new RegExp(
                    '^(' + defense.join('|') + '|' + offense.join('|') + ')$'
                ).test(unit)
            ) {
                docSource +=
                    '<tr class="' +
                    (count++ % 2 ? 'row_b' : 'row_a') +
                    '"><td><img src="https://' +
                    location.hostname +
                    '/graphic/unit/unit_' +
                    unit +
                    '.png?1" alt=""/></td><td style="white-space:nowrap;"><span> ' +
                    formatAsNumber(summary[unit].count) +
                    ' ' +
                    unitDesc[unit] +
                    '</span></td></tr>';
            }
        });
    docSource += '</table>';

    /* Total Units */
    docSource += '<table class="vis" width="100%">';
    docSource +=
        '<tr><th colspan="2" style="white-space:nowrap;">' +
        fnTranslate(curGroup++) +
        '</th></tr>';
    docSource +=
        '<tr class="' +
        'row_a' +
        '"><td><span>Count:</span></td><td style="white-space:nowrap;"><span> ' +
        formatAsNumber(summary.unitTotal.tally) +
        '</span></td></tr>';
    docSource +=
        '<tr class="' +
        'row_b' +
        '"><td><span>Pop:</span></td><td style="white-space:nowrap;"><span> ' +
        formatAsNumber(summary.unitTotal.population) +
        '</span></td></tr>';
    docSource += '</table></td></td></tr></table><br>';
    docSource +=
        '<table id="coordinate_table" class="vis" style="width:100%;">';
    docSource +=
        '<tr><th>' +
        fnTranslate(curGroup++) +
        ': <span id="coords_group" style="font-weight:100;"></span>';
    docSource +=
        '<tr><td style="box-sizing:border-box;width:100%;"><textarea id="coords_container" style="resize:none;width:100%;box-sizing:border-box;height:60px;"></textarea></td></tr>';
    docSource += '</table>';
    docSource += `<small><strong>Troops Counter ${strVersion}</strong> - <a href="https://twscripts.dev/" rel="noopener noreferrer" target="_blank">RedAlert</a> - <a href="https://forum.tribalwars.net/index.php?threads/troops-counter-by-dalesmckay-fixed.285246/" rel="noopener noreferrer" target="_blank">Help</a>`;
    docSource += '</body>';
    docSource += '</html>';

    if (DRAGGABLE) {
        docSource += `
			<a class="popup_box_close custom-close-button" onClick="clickDraggableEl();" href="#">&nbsp;</a>
			<style>
				.troops-counter-content {
					position: fixed;
					background-color: #f4e4bc !important;
					border: 1px solid #603000;
					padding: 10px;
					top: 10vh;
					right: 15vw;
					z-index: 1000;
					width: 440px;
					height: auto;
				}
				.custom-close-button {
					right: 0;
					top: 0;
				}
			</style>
		`;
        if (jQuery('.troops-counter-content').length > 0) {
            UI.ErrorMessage('Troops Counter is already loaded!');
        } else {
            var troopsCounterContent = document.createElement('div');
            troopsCounterContent.classList.add('troops-counter-content');
            troopsCounterContent.innerHTML = docSource;
            jQuery('body').append(troopsCounterContent);
            jQuery('.troops-counter-content').draggable({
                cancel: '.not-draggable',
            });
        }
    } else {
        const popupContent = preparePopupContent(docSource, '440px');
        Dialog.show('content', popupContent);
    }
}

    if (game_data.features.Premium.active) {
        fnExecuteScript();
    } else {
        UI.ErrorMessage('Premium Account required!', 6000);
    }
})(window);
