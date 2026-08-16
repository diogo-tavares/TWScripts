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
        activeVillages: [],
        currentGroupName: "Todos",
        currentResults: [],

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
            self.activeVillages = [];

            $('#units_table tbody tr').each(function() {
                var $row = $(this);
                var $spans = $row.find('td').first().find('span[data-id]');
                
                if ($spans.length >= 1) {
                    var vId = $spans.eq(0).attr('data-id');
                    var name = $row.find('td').first().text();
                    var coordsMatch = name.match(/\d{3}\|\d{3}/);
                    
                    if (coordsMatch && vId) {
                        self.activeVillages.push({
                            id: vId,
                            name: name.trim(),
                            coords: coordsMatch[0]
                        });
                    }
                }
            });
        },

        buildUI: function() {
            var self = this;
            var now = new Date();
            var minDateStr = self.pad(now.getDate()) + "." + self.pad(now.getMonth()+1) + "." + now.getFullYear();
            var minTimeStr = self.pad(now.getHours()) + ":" + self.pad(now.getMinutes()) + ":" + self.pad(now.getSeconds());

            var arrDateStr = self.pad(now.getDate()) + "." + self.pad(now.getMonth()+1) + "." + now.getFullYear();
            var arrTimeStr = "08:00:00";

            var html = `
            <div id="tw_fake_planner" style="width:100%; box-sizing:border-box; padding:5px;">
                <div style="background:#804000; color:#fff; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🎭 Planeador de Fakes | Grupo: <u style="color:#ffdc73;">${self.currentGroupName}</u></span>
                    <small>(${self.activeVillages.length} aldeias | até ${self.activeVillages.length * 5} fakes)</small>
                </div>
                <table class="vis" style="width:100%; margin-bottom:10px;">
                    <tr>
                        <th style="width:30%;">Alvos (X|Y):</th>
                        <td>
                            <textarea id="planner_targets" placeholder="111|111 222|222 333|333 ..." style="width:100%; height:60px; box-sizing:border-box; font-family:monospace;"></textarea>
                            <small style="color:#666;">Cola as coordenadas dos alvos separadas por espaços ou linhas.</small>
                        </td>
                    </tr>
                    <tr>
                        <th>Data Mínima Envio:</th>
                        <td><input type="text" id="planner_min_date" value="${minDateStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Hora Mínima Envio:</th>
                        <td><input type="text" id="planner_min_time" value="${minTimeStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Data Chegada:</th>
                        <td><input type="text" id="planner_date" value="${arrDateStr}" style="width:100%; box-sizing:border-box;" /></td>
                    </tr>
                    <tr>
                        <th>Hora Chegada:</th>
                        <td><input type="text" id="planner_time" value="${arrTimeStr}" style="width:100%; box-sizing:border-box;" /></td>
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

            if (!self.activeVillages.length) {
                UI.ErrorMessage('Nenhuma aldeia encontrada neste grupo!');
                return;
            }

            // Parsing Data/Hora Mínima de Envio
            var minDParts = $('#planner_min_date').val().split('.');
            var minTParts = $('#planner_min_time').val().split(':');
            if (minDParts.length < 3 || minTParts.length < 3) {
                UI.ErrorMessage('Formato de Data/Hora Mínima de Envio inválido!');
                return;
            }
            var minLaunchTime = new Date(minDParts[2], minDParts[1] - 1, minDParts[0], minTParts[0], minTParts[1], minTParts[2]);

            // Parsing Data/Hora de Chegada
            var dParts = $('#planner_date').val().split('.');
            var tParts = $('#planner_time').val().split(':');
            if (dParts.length < 3 || tParts.length < 3) {
                UI.ErrorMessage('Formato de Data ou Hora de Chegada inválido!');
                return;
            }
            var arrivalTime = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
            var arrivalISOStr = dParts[2] + "-" + self.pad(dParts[1]) + "-" + self.pad(dParts[0]) + " " + 
                                self.pad(tParts[0]) + ":" + self.pad(tParts[1]) + ":" + self.pad(tParts[2]);

            // Gera todos os pares possíveis e descarta os que saem antes da data/hora mínima
            var allPossiblePairs = [];
            $.each(self.activeVillages, function(vIdx, v) {
                $.each(uniqueTargets, function(tIdx, target) {
                    var lTime = self.getLaunchTime(v.coords, target, arrivalTime);
                    if (lTime >= minLaunchTime) {
                        allPossiblePairs.push({
                            origin: v,
                            target: target,
                            launchTime: lTime
                        });
                    }
                });
            });

            allPossiblePairs.sort(function(a, b) { return a.launchTime - b.launchTime; });

            // Alocação sequencial por ordem de saída (máx 5 por origem, 1 por alvo)
            var originCounts = {};
            var assignedTargets = {};
            var assignedPlans = [];

            $.each(self.activeVillages, function(i, v) { originCounts[v.id] = 0; });

            for (var i = 0; i < allPossiblePairs.length; i++) {
                var pair = allPossiblePairs[i];
                var vId = pair.origin.id;
                var target = pair.target;

                if (!assignedTargets[target] && originCounts[vId] < 5) {
                    assignedPlans.push(pair);
                    assignedTargets[target] = true;
                    originCounts[vId]++;
                }
            }

            assignedPlans.sort(function(a, b) { return a.launchTime - b.launchTime; });
            self.currentResults = assignedPlans;

            var bbExport = `Plano de Fakes (chegada a ${arrivalISOStr})\n\n`;

            var outHtml = `
            <div style="background:#e0d0b0; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:8px; border:1px solid #804000;">
                📊 Fakes atribuídos: ${assignedPlans.length} / ${uniqueTargets.length} alvos
            </div>
            <table class="vis" style="width:100%; font-size:12px;">
                <thead>
                    <tr>
                        <th style="width:30px; text-align:center;">Feito</th>
                        <th>Origem</th>
                        <th>Alvo</th>
                        <th>Hora de Saída</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(assignedPlans, function(i, r) {
                var dateFormatted = r.launchTime.getFullYear() + "-" + 
                                    self.pad(r.launchTime.getMonth()+1) + "-" + 
                                    self.pad(r.launchTime.getDate());
                                    
                var timeFormatted = self.pad(r.launchTime.getHours()) + ":" + 
                                    self.pad(r.launchTime.getMinutes()) + ":" + 
                                    self.pad(r.launchTime.getSeconds());

                var displayLaunchStr = self.pad(r.launchTime.getDate()) + "." + 
                                       self.pad(r.launchTime.getMonth()+1) + " " + 
                                       timeFormatted;

                var tCoords = r.target.split('|');
                var placeUrl = `/game.php?village=${r.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                if (game_data.player.sitter != "0") {
                    placeUrl = `/game.php?t=${game_data.player.id}&village=${r.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                }

                outHtml += `<tr>
                    <td style="text-align:center;">
                        <input type="checkbox" class="fake_sent_check" data-target="${r.target}" />
                    </td>
                    <td><b>${r.origin.name}</b></td>
                    <td><b>${r.target}</b></td>
                    <td><b>${displayLaunchStr}</b></td>
                    <td><a href="${placeUrl}" target="_blank" class="btn" style="padding:2px 6px;">Atacar</a></td>
                </tr>`;

                bbExport += `Lançar ${self.unitName} [b]fake[/b] da [village]${r.origin.coords}[/village] contra a aldeia [village]${r.target}[/village] a [i]${dateFormatted}[/i] [b]${timeFormatted}[/b]\n`;
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

            // Ação do Botão "Lista de aldeias restantes"
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

        getLaunchTime: function(originCoordsStr, targetCoordsStr, arrivalTime) {
            var oCoords = originCoordsStr.split('|');
            var tCoords = targetCoordsStr.split('|');
            
            var dx = Math.abs(parseInt(tCoords[0]) - parseInt(oCoords[0]));
            var dy = Math.abs(parseInt(tCoords[1]) - parseInt(oCoords[1]));
            var dist = Math.sqrt(dx * dx + dy * dy);

            var travelTimeSeconds = Math.round(dist * this.ramSpeedInSeconds);
            return new Date(arrivalTime.getTime() - (travelTimeSeconds * 1000));
        },

        pad: function(n) { return n < 10 ? '0' + parseInt(n, 10) : n; }
    };

    fakePlanner.init();
})();
