javascript:
(function(){
    if ($('#tw_fake_planner').length) {
        $('#tw_fake_planner').remove();
        return;
    }

    // 1.º Clique: Redirecionamento para Visão Geral (Tropas)
    if (window.location.href.indexOf('screen=overview_villages') === -1 || window.location.href.indexOf('mode=units') === -1) {
        UI.InfoMessage('A redirecionar para a Visão Geral (Tropas)...', 1500);
        var targetUrl = '/game.php?village=' + game_data.village.id + '&screen=overview_villages&mode=units';
        if (game_data.player.sitter != "0") {
            targetUrl = '/game.php?t=' + game_data.player.id + '&village=' + game_data.village.id + '&screen=overview_villages&mode=units';
        }
        window.location.href = targetUrl;
        return;
    }

    var fakePlanner = {
        ramSpeedInSeconds: 1764.724,
        unitName: "Ariete",
        villages: [],
        currentGroupName: "Todos",

        init: function() {
            var self = this;
            UI.InfoMessage('A iniciar Planeador de Fakes...', 1000);
            self.detectCurrentGroup();
            self.readCurrentPageVillages();
            self.buildUI();
        },

        detectCurrentGroup: function() {
            var self = this;
            var $activeGroup = $('.group-menu-item.btn-b, .vis_item strong, #group_list strong, .option-selected');
            if ($activeGroup.length) {
                var name = $activeGroup.first().text().replace('[', '').replace(']', '').trim();
                if (name) self.currentGroupName = name;
            } else {
                var $selectedOpt = $('select[name="group_id"] option:selected');
                if ($selectedOpt.length) {
                    self.currentGroupName = $selectedOpt.text().trim();
                }
            }
        },

        readCurrentPageVillages: function() {
            var self = this;
            self.villages = [];

            $('#units_table tbody tr').each(function() {
                var $row = $(this);
                var $spans = $row.find('td').first().find('span[data-id]');
                
                if ($spans.length >= 1) {
                    var vId = $spans.eq(0).attr('data-id');
                    var name = $row.find('td').first().text();
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
        },

        getServerDateTime: function() {
            var serverDateStr = $('#serverDate').text().trim();
            var serverTimeStr = $('#serverTime').text().trim();
            
            if (serverDateStr && serverTimeStr) {
                var dParts = serverDateStr.split('/');
                var tParts = serverTimeStr.split(':');
                return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
            }
            return new Date();
        },

        buildUI: function() {
            var self = this;
            var now = self.getServerDateTime();
            var arrDateStr = self.pad(now.getDate()) + "." + self.pad(now.getMonth()+1) + "." + now.getFullYear();

            var html = `
            <div id="tw_fake_planner" style="width:100%; box-sizing:border-box; padding:5px;">
                <div style="background:#804000; color:#fff; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🎭 Planeador de Fakes | Grupo: <u style="color:#ffdc73;">${self.currentGroupName}</u></span>
                    <small>(${self.villages.length} aldeias | até ${self.villages.length * 5} fakes)</small>
                </div>
                <table class="vis" style="width:100%; margin-bottom:10px;">
                    <tr>
                        <th style="width:30%;">Dia de Chegada:</th>
                        <td><input type="text" id="planner_arr_date" value="${arrDateStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Hora Mínima Chegada:</th>
                        <td><input type="text" id="planner_min_time" value="08:00:00" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Hora Máxima Chegada:</th>
                        <td><input type="text" id="planner_max_time" value="23:00:00" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Alvos (X|Y):</th>
                        <td>
                            <textarea id="planner_targets" placeholder="111|111 222|222 333|333 ..." style="width:100%; height:60px; box-sizing:border-box; font-family:monospace;"></textarea>
                            <small style="color:#666;">Cola as coordenadas dos alvos separadas por espaços ou linhas.</small>
                        </td>
                    </tr>
                </table>
                <div style="text-align:center; margin-bottom:10px;">
                    <button class="btn btn-confirm-yes" id="btn_calculate_fakes" style="width:100%; padding:8px; font-weight:bold; font-size:14px;">Gerar Plano de Fakes</button>
                </div>
                <div id="planner_results" style="overflow-x:auto;"></div>
            </div>`;

            Dialog.show("tw_fake_planner_dialog", html);
            
            var calcWidth = Math.min(900, $(window).width() - 20);
            $('#tw_fake_planner_dialog').css({
                'width': calcWidth + 'px',
                'max-width': '95vw'
            });

            $('#btn_calculate_fakes').click(function(){ self.calculateFakes(); });
        },

        calculateFakes: function() {
            var self = this;
            var rawTargets = $('#planner_targets').val();
            var targetMatches = rawTargets.match(/\d{3}\|\d{3}/g);

            if (!targetMatches || targetMatches.length === 0) {
                UI.ErrorMessage('Insere pelo menos uma coordenada de alvo válida.');
                return;
            }

            var uniqueTargets = [];
            $.each(targetMatches, function(i, el){
                if($.inArray(el, uniqueTargets) === -1) uniqueTargets.push(el);
            });

            if (!self.villages.length) {
                UI.ErrorMessage('Nenhuma aldeia encontrada neste grupo!');
                return;
            }

            var dParts = $('#planner_arr_date').val().split('.');
            var minTParts = $('#planner_min_time').val().split(':');
            var maxTParts = $('#planner_max_time').val().split(':');

            if (dParts.length < 3 || minTParts.length < 3 || maxTParts.length < 3) {
                UI.ErrorMessage('Formato de Data (DD.MM.YYYY) ou Horas (HH:MM:SS) inválido!');
                return;
            }

            var minArrival = new Date(dParts[2], dParts[1] - 1, dParts[0], minTParts[0], minTParts[1], minTParts[2]);
            var maxArrival = new Date(dParts[2], dParts[1] - 1, dParts[0], maxTParts[0], maxTParts[1], maxTParts[2]);

            if (minArrival > maxArrival) {
                UI.ErrorMessage('A Hora Mínima não pode ser superior à Hora Máxima!');
                return;
            }

            var serverNow = self.getServerDateTime();

            // Filtra pares onde o lançamento feito AGORA chega estritamente entre a hora mínima e máxima
            var validPairs = [];
            $.each(self.villages, function(vIdx, v) {
                $.each(uniqueTargets, function(tIdx, target) {
                    var travelSecs = self.getTravelTimeSeconds(v.coords, target);
                    var minLaunch = new Date(minArrival.getTime() - (travelSecs * 1000));
                    var maxLaunch = new Date(maxArrival.getTime() - (travelSecs * 1000));

                    // serverNow >= minLaunch garante que não chega ANTES da hora mínima
                    // serverNow <= maxLaunch garante que não chega DEPOIS da hora máxima
                    if (serverNow >= minLaunch && serverNow <= maxLaunch) {
                        validPairs.push({
                            origin: v,
                            target: target,
                            minLaunch: minLaunch,
                            maxLaunch: maxLaunch
                        });
                    }
                });
            });

            validPairs.sort(function(a, b) { return a.maxLaunch - b.maxLaunch; });

            var originCounts = {};
            var assignedTargets = {};
            var assignedPlans = [];

            $.each(self.villages, function(i, v) { originCounts[v.id] = 0; });

            for (var i = 0; i < validPairs.length; i++) {
                var pair = validPairs[i];
                var vId = pair.origin.id;
                var target = pair.target;

                if (!assignedTargets[target] && originCounts[vId] < 5) {
                    assignedPlans.push(pair);
                    assignedTargets[target] = true;
                    originCounts[vId]++;
                }
            }

            var bbExport = `Plano de Fakes (chegada entre ${$('#planner_min_time').val()} e ${$('#planner_max_time').val()} a ${$('#planner_arr_date').val()})\n\n`;

            var outHtml = `
            <div style="background:#e0d0b0; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:8px; border:1px solid #804000;">
                📊 Fakes válidos para envio agora: ${assignedPlans.length} / ${uniqueTargets.length} alvos
            </div>
            <table class="vis" style="width:100%; font-size:12px;">
                <thead>
                    <tr>
                        <th style="width:35px; text-align:center;">Feito</th>
                        <th style="width:50px; text-align:center;">Ação</th>
                        <th>Origem</th>
                        <th>Alvo</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(assignedPlans, function(i, r) {
                var tCoords = r.target.split('|');
                var placeUrl = `/game.php?village=${r.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                if (game_data.player.sitter != "0") {
                    placeUrl = `/game.php?t=${game_data.player.id}&village=${r.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                }

                outHtml += `<tr>
                    <td style="text-align:center;">
                        <input type="checkbox" class="fake_sent_check" data-target="${r.target}" />
                    </td>
                    <td style="text-align:center;">
                        <a href="${placeUrl}" target="_blank" class="btn" style="padding:2px 6px;">Atacar</a>
                    </td>
                    <td><b>${r.origin.name}</b></td>
                    <td><b>${r.target}</b></td>
                </tr>`;

                bbExport += `Lançar ${self.unitName} [b]fake[/b] da [village]${r.origin.coords}[/village] contra a aldeia [village]${r.target}[/village]\n`;
            });

            outHtml += `</tbody></table>`;

            outHtml += `
            <div style="margin-top:15px; text-align:center;">
                <button class="btn btn-default" id="btn_remaining_villages" style="width:100%; padding:6px; font-weight:bold;">Lista de aldeias restantes</button>
            </div>
            <div id="remaining_container" style="display:none; margin-top:8px;">
                <b>Coordenadas dos Alvos Pendentes:</b>
                <textarea id="remaining_targets_box" style="width:100%; height:70px; box-sizing:border-box; font-family:monospace; font-size:11px;" onclick="this.select()"></textarea>
            </div>`;

            outHtml += `<div style="margin-top:15px;">
                <b>Exportar Plano em BBCode:</b>
                <textarea style="width:100%; height:120px; box-sizing:border-box; font-size:11px;" onclick="this.select()">${bbExport}</textarea>
            </div>`;

            $('#planner_results').html(outHtml);

            $('#btn_remaining_villages').click(function(){
                var sentTargets = [];
                $('.fake_sent_check:checked').each(function(){
                    sentTargets.push($(this).attr('data-target'));
                });

                var remaining = [];
                $.each(uniqueTargets, function(idx, t){
                    if ($.inArray(t, sentTargets) === -1) {
                        remaining.push(t);
                    }
                });

                $('#remaining_targets_box').val(remaining.join(' '));
                $('#remaining_container').show();
                UI.InfoMessage('Lista atualizada: ' + remaining.length + ' alvos restantes.', 1500);
            });
        },

        getTravelTimeSeconds: function(originCoordsStr, targetCoordsStr) {
            var oCoords = originCoordsStr.split('|');
            var tCoords = targetCoordsStr.split('|');
            
            var dx = Math.abs(parseInt(tCoords[0]) - parseInt(oCoords[0]));
            var dy = Math.abs(parseInt(tCoords[1]) - parseInt(oCoords[1]));
            var dist = Math.sqrt(dx * dx + dy * dy);

            return Math.round(dist * this.ramSpeedInSeconds);
        },

        pad: function(n) { return n < 10 ? '0' + parseInt(n, 10) : n; }
    };

    fakePlanner.init();
})();
