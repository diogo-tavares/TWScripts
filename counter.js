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
        var outputSummary = { 'Full Nuke': { group: 'Offensive', criteria: [{ unit: 'offense', minpop: 20000 }], descID: 3 }, 'Full Defense': { group: 'Defensive', criteria: [{ unit: 'defense', minpop: 20000 }], descID: 8 } };
        // ... Insere aqui o teu bloco original outputSummary completo ...
        
        // Aqui entra a lógica de construção do docSource original que tinhas
        // Copia a partir de "var ii, jj, village..." do teu código original até ao "Dialog.show"
        // (Certifica-te que não falta nenhum parêntese ou chaveta no final da função)
        
        alert("Contador processado com sucesso!"); // Teste de execução
    }

    if (game_data.features.Premium.active) {
        fnExecuteScript();
    } else {
        UI.ErrorMessage('Premium Account required!', 6000);
    }
})(window);
