javascript:
(function(){
    if ($('#tw_group_planner').length) {
        $('#tw_group_planner').remove();
        return;
    }

    var groupPlanner = {
        // Velocidades base em minutos por campo
        speeds: {
            spear: 18, sword: 22, axe: 18, archer: 18, spy: 9,
            light: 10, marcher: 10, heavy: 11, ram: 29, catapult: 29,
            knight: 10, snob: 34
        },
        unitNames: {
            spear: "Lanceiro", sword: "Espadachim", axe: "Viking",
            archer: "Arqueiro", spy: "Batedor", light: "Cavalaria Leve",
            marcher: "Arqueiro a Cavalo", heavy: "Cavalaria Pesada", ram: "Ariete",
            catapult: "Catapulta", knight: "Paladino", snob: "Nobre"
        },
        activeUnits: ['spear','sword','axe','spy','light','heavy','ram','catapult','snob','knight'],
        villages: [],

        init: function() {
            var self = this;
            UI.InfoMessage('A iniciar planeador...', 1000);
            self.buildUI();
            self.loadGroups();
        },

        buildUI: function() {
            var self = this;
            var targetCoords = game_data.village.x + '|' + game_data.village.y;
            
            if (game_data.screen === "info_village") {
                var txt = $('#content_value').text();
                var m = txt.match(/\d{3}\|\d{3}/);
                if (m) targetCoords = m[0];
            }

            var now = new Date();
            var dateStr = self.pad(now.getDate()) + "." + self.pad(now.getMonth()+1) + "." + now.getFullYear();
            var timeStr = self.pad(now.getHours()) + ":" + self.pad(now.getMinutes()) + ":" + self.pad(now.getSeconds());

            var html = `
            <div id="tw_group_planner" class="vis vis_item" style="position:fixed; top:60px; right:20px; z-index:99999; width:750px; max-height:85vh; overflow-y:auto; background:#f4e4c1; border:2px solid #804000; padding:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border-radius:5px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #804000; padding-bottom:5px;">
                    <h3 style="margin:0; color:#804000;">🏹 Planeador de Ataques por Grupo</h3>
                    <button class="btn btn-close" id="close_planner" style="float:right;">X</button>
                </div>
                <table class="vis" style="width:100%; margin-bottom:10px;">
                    <tr>
                        <th>Grupo:</th>
                        <td><select id="planner_group_select"><option value="">A carregar...</option></select></td>
                        <th>Alvo (X|Y):</th>
                        <td><input type="text" id="planner_target" value="${targetCoords}" size="8" /></td>
                    </tr>
                    <tr>
                        <th>Chegada (Data):</th>
                        <td><input type="text" id="planner_date" value="${dateStr}" size="10" /></td>
                        <th>Chegada (Hora):</th>
                        <td><input type="text" id="planner_time" value="${timeStr}" size="8" /></td>
                    </tr>
                </table>
                <div style="text-align:center; margin-bottom:10px;">
                    <button class="btn btn-confirm-yes" id="btn_calculate_plan">Calcular Horários</button>
                </div>
                <div id="planner_results"></div>
            </div>`;

            $('body').append(html);

            $('#close_planner').click(function(){ $('#tw_group_planner').remove(); });
            
            $('#planner_group_select').change(function(){
                var url = $(this).val();
                if(url) self.loadVillagesFromGroup(url);
            });

            $('#btn_calculate_plan').click(function(){ self.calculate(); });
        },

        loadGroups: function() {
            var self = this;
            var overviewUrl = '/game.php?village=' + game_data.village.id + '&type=own_home&mode=units&group=0&page=-1&screen=overview_villages';
            if (game_data.player.sitter != "0") {
                overviewUrl = '/game.php?t=' + game_data.player.id + '&village=' + game_data.village.id + '&type=own_home&mode=units&group=0&page=-1&screen=overview_villages';
            }

            $.get(overviewUrl, function(data) {
                var $html = $(data);
                var $groups = $html.find('.vis_item').first().find('a');
                var options = '<option value="">-- Seleciona um Grupo --</option>';
                
                $groups.each(function() {
                    var name = $(this).text().replace('[', '').replace(']', '').trim();
                    var href = $(this).attr('href') + '&page=-1';
                    options += `<option value="${href}">${name}</option>`;
                });

                $('#planner_group_select').html(options);
            });
        },

        loadVillagesFromGroup: function(groupUrl) {
            var self = this;
            UI.InfoMessage('A obter aldeias do grupo...', 1000);
            
            $.get(groupUrl, function(data) {
                var $html = $(data);
                var $rows = $html.find('#units_table tbody tr');
                self.villages = [];

                $rows.each(function(i) {
                    if (i === 0) return; 
                    var $spans = $(this).find('td').first().find('span');
                    if ($spans.length >= 3) {
                        var vId = $spans.eq(0).attr('data-id');
                        var name = $spans.eq(2).text();
                        var coordsMatch = name.match(/\d{3}\|\d{3}/);
                        
                        if (coordsMatch && vId) {
                            self.villages.push({
                                id: vId,
                                name: name.trim(),
                                coords: coordsMatch[0]
                            });
                        }
                    }
                });

                self.renderVillageList();
            });
        },

        renderVillageList: function() {
            var self = this;
            if(!self.villages.length) {
                $('#planner_results').html('<p style="color:red; text-align:center;">Nenhuma aldeia encontrada neste grupo!</p>');
                return;
            }

            var unitOptions = '';
            $.each(self.activeUnits, function(i, u) {
                unitOptions += `<option value="${u}">${self.unitNames[u]}</option>`;
            });

            var html = `<table class="vis" style="width:100%;">
                <thead>
                    <tr>
                        <th>Aldeia Origem</th>
                        <th>Coordenadas</th>
                        <th>
                            Mudar TODAS para: 
                            <select id="planner_global_unit">
                                <option value="">-- Escolher para todas --</option>
                                ${unitOptions}
                            </select>
                        </th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(self.villages, function(i, v) {
                html += `<tr>
                    <td>${v.name}</td>
                    <td>${v.coords}</td>
                    <td>
                        <select class="planner_village_unit" data-index="${i}">
                            <option value="ram" selected>Ariete / Catapulta</option>
                            ${unitOptions}
                        </select>
                    </td>
                </tr>`;
            });

            html += `</tbody></table>`;
            $('#planner_results').html(html);

            $('#planner_global_unit').change(function(){
                var selectedUnit = $(this).val();
                if(selectedUnit) {
                    $('.planner_village_unit').val(selectedUnit);
                }
            });
        },

        calculate: function() {
            var self = this;
            var target = $('#planner_target').val().match(/\d{3}\|\d{3}/);
            if(!target) { UI.ErrorMessage('Insere coordenadas de alvo válidas (ex: 555|555)'); return; }
            var tCoords = target[0].split('|');

            var dParts = $('#planner_date').val().split('.');
            var tParts = $('#planner_time').val().split(':');
            if(dParts.length < 3 || tParts.length < 3) { UI.ErrorMessage('Formato de Data (DD.MM.YYYY) ou Hora (HH:MM:SS) inválido!'); return; }

            var arrivalTime = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
            
            var results = [];
            var bbTable = `[table][**]Origem[||]Velocidade[||]Saída (Lançar)[||]Ação[/**]\n`;

            $('.planner_village_unit').each(function(i) {
                var v = self.villages[i];
                var unit = $(this).val();
                
                var vCoords = v.coords.split('|');
                var dx = Math.abs(parseInt(tCoords[0]) - parseInt(vCoords[0]));
                var dy = Math.abs(parseInt(tCoords[1]) - parseInt(vCoords[1]));
                var dist = Math.sqrt(dx * dx + dy * dy);

                // Arredondamento exato do motor do jogo (em segundos)
                var travelTimeSeconds = Math.round(dist * self.speeds[unit] * 60);

                var launchTime = new Date(arrivalTime.getTime() - (travelTimeSeconds * 1000));

                var launchStr = self.pad(launchTime.getDate()) + "." + 
                                self.pad(launchTime.getMonth()+1) + " " + 
                                self.pad(launchTime.getHours()) + ":" + 
                                self.pad(launchTime.getMinutes()) + ":" + 
                                self.pad(launchTime.getSeconds());

                var placeUrl = `/game.php?village=${v.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                if (game_data.player.sitter != "0") {
                    placeUrl = `/game.php?t=${game_data.player.id}&village=${v.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                }

                results.push({
                    name: v.name,
                    coords: v.coords,
                    unit: self.unitNames[unit],
                    launchTime: launchTime,
                    launchStr: launchStr,
                    placeUrl: placeUrl
                });
            });

            results.sort(function(a, b) { return a.launchTime - b.launchTime; });

            var outHtml = `<h4 style="margin-top:15px; color:#804000;">📅 Horários de Envio (Ordenados)</h4>
            <table class="vis" style="width:100%;">
                <thead>
                    <tr>
                        <th>Origem</th>
                        <th>Tropa Base</th>
                        <th>Hora de Saída</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(results, function(i, r) {
                outHtml += `<tr>
                    <td>${r.name}</td>
                    <td>${r.unit}</td>
                    <td><b>${r.launchStr}</b></td>
                    <td><a href="${r.placeUrl}" target="_blank" class="btn">Abrir Praça</a></td>
                </tr>`;

                bbTable += `[*]${r.name} (${r.coords})[|]${r.unit}[|]${r.launchStr}[|][url=https://${document.location.host}${r.placeUrl}]Atacar[/url]\n`;
            });

            bbTable += `[/table]`;
            outHtml += `</tbody></table>`;
            
            outHtml += `<div style="margin-top:10px;">
                <h4>Exportar Tabela BB Code (Para o Fórum / Bloco de Notas):</h4>
                <textarea style="width:98%; height:80px;" onclick="this.select()">${bbTable}</textarea>
            </div>`;

            $('#planner_results').html(outHtml);
        },

        pad: function(n) { return n < 10 ? '0' + n : n; }
    };

    groupPlanner.init();
})();
