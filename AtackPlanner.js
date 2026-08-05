javascript:
(function(){
    if ($('#tw_group_planner').length) {
        $('#tw_group_planner').remove();
        return;
    }

    var groupPlanner = {
        speedsInSeconds: {
            spear: 1095.346,
            sword: 1338.756,
            axe: 1095.346,
            archer: 1095.346,
            spy: 547.673,
            light: 608.525,
            marcher: 608.525,
            heavy: 669.378,
            ram: 1764.724,
            catapult: 1764.724,
            knight: 608.525,
            snob: 2068.986
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
            <div id="tw_group_planner" style="width:100%; box-sizing:border-box; padding:5px;">
                <table class="vis" style="width:100%; margin-bottom:10px;">
                    <tr>
                        <th style="width:30%;">Grupo:</th>
                        <td><select id="planner_group_select" style="width:100%;"><option value="">A carregar grupos...</option></select></td>
                    </tr>
                    <tr>
                        <th>Alvo (X|Y):</th>
                        <td><input type="text" id="planner_target" value="${targetCoords}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Data Chegada:</th>
                        <td><input type="text" id="planner_date" value="${dateStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Hora Chegada:</th>
                        <td><input type="text" id="planner_time" value="${timeStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                </table>
                <div style="text-align:center; margin-bottom:10px;">
                    <button class="btn btn-confirm-yes" id="btn_calculate_plan" style="width:100%; padding:8px; font-weight:bold;">Calcular Horários</button>
                </div>
                <div id="planner_results" style="overflow-x:auto;"></div>
            </div>`;

            // Janela adaptável: 750px no PC ou a largura total disponível no telemóvel
            Dialog.show("tw_group_planner_dialog", html);
            var calcWidth = Math.min(750, $(window).width() - 20);
            $('#tw_group_planner_dialog').css({
                'width': calcWidth + 'px',
                'max-width': '98vw'
            });

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
                // Procura grupos tanto em tags 'a' (PC) como em 'option' (Versão Mobile/App)
                var $groupElements = $html.find('.group-menu-item, .vis_item a[href*="group="], select[name="group_id"] option, #group_list a');
                var options = '<option value="">-- Seleciona um Grupo --</option>';
                var addedGroups = {};

                $groupElements.each(function() {
                    var $this = $(this);
                    var name = $this.text().replace('[', '').replace(']', '').trim();
                    var href = $this.attr('href') || $this.val();

                    if(name && href && !addedGroups[name] && name.toLowerCase() !== 'todos' && name.toLowerCase() !== 'wszystkie') {
                        // Converte valor em URL se for um elemento <option>
                        if(href.indexOf('game.php') === -1 && !isNaN(href)) {
                            href = overviewUrl.replace('group=0', 'group=' + href);
                        } else if(href.indexOf('page=-1') === -1) {
                            href += '&page=-1';
                        }
                        
                        addedGroups[name] = true;
                        options += `<option value="${href}">${name}</option>`;
                    }
                });

                // Fallback caso o seletor principal falhe na App
                if(Object.keys(addedGroups).length === 0) {
                    $html.find('a[href*="group="]').each(function() {
                        var name = $(this).text().replace('[', '').replace(']', '').trim();
                        var href = $(this).attr('href') + '&page=-1';
                        if(name && !addedGroups[name]) {
                            addedGroups[name] = true;
                            options += `<option value="${href}">${name}</option>`;
                        }
                    });
                }

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

            var html = `
            <div style="margin-bottom:8px; background:#e0d0b0; padding:5px; border-radius:3px;">
                <label><b>Mudar TODAS para:</b></label>
                <select id="planner_global_unit" style="width:100%; margin-top:3px;">
                    <option value="">-- Escolher para todas --</option>
                    ${unitOptions}
                </select>
            </div>
            <table class="vis" style="width:100%; font-size:11px;">
                <thead>
                    <tr>
                        <th>Aldeia</th>
                        <th>Tropa Base</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(self.villages, function(i, v) {
                html += `<tr>
                    <td><b>${v.name}</b></td>
                    <td>
                        <select class="planner_village_unit" data-index="${i}" style="width:100%;">
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
            var targetMatch = $('#planner_target').val().match(/\d{3}\|\d{3}/);
            if(!targetMatch) { UI.ErrorMessage('Insere coordenadas válidas (ex: 555|555)'); return; }
            var targetCoordsStr = targetMatch[0];
            var tCoords = targetCoordsStr.split('|');

            var dParts = $('#planner_date').val().split('.');
            var tParts = $('#planner_time').val().split(':');
            if(dParts.length < 3 || tParts.length < 3) { UI.ErrorMessage('Formato de Data/Hora inválido!'); return; }

            var arrivalTime = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
            var arrivalISOStr = dParts[2] + "-" + self.pad(dParts[1]) + "-" + self.pad(dParts[0]) + " " + 
                                self.pad(tParts[0]) + ":" + self.pad(tParts[1]) + ":" + self.pad(tParts[2]);

            var results = [];
            var bbExport = `Plano de ataque contra a aldeia [village]${targetCoordsStr}[/village] (chegada a ${arrivalISOStr})\n\n`;

            $('.planner_village_unit').each(function(i) {
                var v = self.villages[i];
                var unit = $(this).val();
                
                var vCoords = v.coords.split('|');
                var dx = Math.abs(parseInt(tCoords[0]) - parseInt(vCoords[0]));
                var dy = Math.abs(parseInt(tCoords[1]) - parseInt(vCoords[1]));
                var dist = Math.sqrt(dx * dx + dy * dy);

                var travelTimeSeconds = Math.round(dist * self.speedsInSeconds[unit]);
                var launchTime = new Date(arrivalTime.getTime() - (travelTimeSeconds * 1000));

                var dateFormatted = launchTime.getFullYear() + "-" + 
                                    self.pad(launchTime.getMonth()+1) + "-" + 
                                    self.pad(launchTime.getDate());
                                    
                var timeFormatted = self.pad(launchTime.getHours()) + ":" + 
                                    self.pad(launchTime.getMinutes()) + ":" + 
                                    self.pad(launchTime.getSeconds());

                var displayLaunchStr = self.pad(launchTime.getDate()) + "." + 
                                       self.pad(launchTime.getMonth()+1) + " " + 
                                       timeFormatted;

                var placeUrl = `/game.php?village=${v.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                if (game_data.player.sitter != "0") {
                    placeUrl = `/game.php?t=${game_data.player.id}&village=${v.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                }

                results.push({
                    name: v.name,
                    coords: v.coords,
                    unit: self.unitNames[unit],
                    launchTime: launchTime,
                    launchStr: displayLaunchStr,
                    dateFormatted: dateFormatted,
                    timeFormatted: timeFormatted,
                    placeUrl: placeUrl
                });
            });

            results.sort(function(a, b) { return a.launchTime - b.launchTime; });

            var outHtml = `<h4 style="margin-top:15px; color:#804000;">📅 Horários de Saída</h4>
            <table class="vis" style="width:100%; font-size:11px;">
                <thead>
                    <tr>
                        <th>Origem</th>
                        <th>Saída</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(results, function(i, r) {
                outHtml += `<tr>
                    <td>${r.name}<br><small>(${r.unit})</small></td>
                    <td><b>${r.launchStr}</b></td>
                    <td><a href="${r.placeUrl}" target="_blank" class="btn" style="padding:2px 5px;">Praça</a></td>
                </tr>`;

                bbExport += `[url=https://${document.location.host}${r.placeUrl}]Atacar[/url] ${r.unit} da [village]${r.coords}[/village] a [i]${r.dateFormatted}[/i] [b]${r.timeFormatted}[/b]\n`;
            });

            outHtml += `</tbody></table>`;
            
            outHtml += `<div style="margin-top:10px;">
                <b>Exportar Plano:</b>
                <textarea style="width:100%; height:100px; box-sizing:border-box; font-size:10px;" onclick="this.select()">${bbExport}</textarea>
            </div>`;

            $('#planner_results').html(outHtml);
        },

        pad: function(n) { return n < 10 ? '0' + parseInt(n, 10) : n; }
    };

    groupPlanner.init();
})();
