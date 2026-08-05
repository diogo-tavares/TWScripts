javascript:
(function(){
    if ($('#tw_fake_planner').length) {
        $('#tw_fake_planner').remove();
        return;
    }

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
            var dateStr = self.pad(now.getDate()) + "." + self.pad(now.getMonth()+1) + "." + now.getFullYear();
            var timeStr = self.pad(now.getHours()) + ":" + self.pad(now.getMinutes()) + ":" + self.pad(now.getSeconds());

            var html = `
            <div id="tw_fake_planner" style="width:100%; box-sizing:border-box; padding:5px;">
                <div style="background:#804000; color:#fff; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🎭 Planeador de Fakes | Grupo: <u style="color:#ffdc73;">${self.currentGroupName}</u></span>
                    <small>(${self.activeVillages.length} aldeias disponíveis)</small>
                </div>
                <table class="vis" style="width:100%; margin-bottom:10px;">
                    <tr>
                        <th style="width:25%;">Alvos (X|Y):</th>
                        <td>
                            <textarea id="planner_targets" placeholder="111|111 222|222 333|333 ..." style="width:100%; height:60px; box-sizing:border-box; font-family:monospace;"></textarea>
                            <small style="color:#666;">Podes colar as coordenadas separadas por espaços ou quebras de linha.</small>
                        </td>
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
                UI.ErrorMessage('Insere pelo menos uma coordenada de alvo válida (ex: 111|111)');
                return;
            }

            if (!self.activeVillages.length) {
                UI.ErrorMessage('Nenhuma aldeia encontrada neste grupo!');
                return;
            }

            var dParts = $('#planner_date').val().split('.');
            var tParts = $('#planner_time').val().split(':');
            if (dParts.length < 3 || tParts.length < 3) {
                UI.ErrorMessage('Formato de Data (DD.MM.YYYY) ou Hora (HH:MM:SS) inválido!');
                return;
            }

            var arrivalTime = new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
            var arrivalISOStr = dParts[2] + "-" + self.pad(dParts[1]) + "-" + self.pad(dParts[0]) + " " + 
                                self.pad(tParts[0]) + ":" + self.pad(tParts[1]) + ":" + self.pad(tParts[2]);

            var availableOrigins = self.activeVillages.slice();
            var targetsToAssign = targetMatches.slice();

            var assignedPlans = [];
            var unassignedTargets = [];

            for (var i = 0; i < targetsToAssign.length; i++) {
                var target = targetsToAssign[i];
                if (availableOrigins.length > 0) {
                    var origin = availableOrigins.shift();
                    assignedPlans.push({
                        origin: origin,
                        target: target
                    });
                } else {
                    unassignedTargets.push(target);
                }
            }

            var hasBadTimes = true;
            var maxLoopSafety = 500; 
            var loops = 0;

            while (hasBadTimes && availableOrigins.length > 0 && loops < maxLoopSafety) {
                loops++;
                hasBadTimes = false;

                for (var j = 0; j < assignedPlans.length; j++) {
                    var plan = assignedPlans[j];
                    
                    var launchTime = self.getLaunchTime(plan.origin.coords, plan.target, arrivalTime);
                    var hour = launchTime.getHours();

                    if (hour >= 1 && hour < 9) {
                        hasBadTimes = true;

                        if (availableOrigins.length > 0) {
                            var newOrigin = availableOrigins.shift();
                            availableOrigins.push(plan.origin);
                            plan.origin = newOrigin;
                        } else {
                            break;
                        }
                    }
                }
            }

            var results = [];
            var badTimeCount = 0;
            var bbExport = `Plano de Fakes (chegada a ${arrivalISOStr})\n\n`;

            $.each(assignedPlans, function(idx, item) {
                var launchTime = self.getLaunchTime(item.origin.coords, item.target, arrivalTime);
                var hour = launchTime.getHours();
                var isNight = (hour >= 1 && hour < 9);
                
                if (isNight) badTimeCount++;

                var dateFormatted = launchTime.getFullYear() + "-" + 
                                    self.pad(launchTime.getMonth()+1) + "-" + 
                                    self.pad(launchTime.getDate());
                                    
                var timeFormatted = self.pad(launchTime.getHours()) + ":" + 
                                    self.pad(launchTime.getMinutes()) + ":" + 
                                    self.pad(launchTime.getSeconds());

                var displayLaunchStr = self.pad(launchTime.getDate()) + "." + 
                                       self.pad(launchTime.getMonth()+1) + " " + 
                                       timeFormatted;

                var tCoords = item.target.split('|');
                var placeUrl = `/game.php?village=${item.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                if (game_data.player.sitter != "0") {
                    placeUrl = `/game.php?t=${game_data.player.id}&village=${item.origin.id}&screen=place&x=${tCoords[0]}&y=${tCoords[1]}`;
                }

                results.push({
                    name: item.origin.name,
                    coords: item.origin.coords,
                    target: item.target,
                    unit: self.unitName,
                    launchTime: launchTime,
                    launchStr: displayLaunchStr,
                    dateFormatted: dateFormatted,
                    timeFormatted: timeFormatted,
                    placeUrl: placeUrl,
                    isNight: isNight
                });
            });

            results.sort(function(a, b) { return a.launchTime - b.launchTime; });

            var statusMsg = "";
            if (badTimeCount > 0) {
                statusMsg = `<div style="background:#ffcccc; color:#990000; padding:6px; border-radius:3px; margin-bottom:8px; font-weight:bold;">
                    ⚠️ Atenção: ${badTimeCount} fake(s) têm de sair na madrugada (01:00h - 09:00h) por falta de aldeias suplentes para troca.
                </div>`;
            } else {
                statusMsg = `<div style="background:#d4edda; color:#155724; padding:6px; border-radius:3px; margin-bottom:8px; font-weight:bold;">
                    ✅ Todos os horários de saída estão fora da madrugada (01:00h - 09:00h)!
                </div>`;
            }

            var outHtml = statusMsg + `
            <h4 style="margin-top:10px; color:#804000;">📅 Ordem de Envio dos Fakes (${results.length})</h4>
            <table class="vis" style="width:100%; font-size:12px;">
                <thead>
                    <tr>
                        <th>Origem</th>
                        <th>Alvo</th>
                        <th>Hora de Saída</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>`;

            $.each(results, function(i, r) {
                var rowStyle = r.isNight ? 'style="background-color:#ffe6e6;"' : '';
                outHtml += `<tr ${rowStyle}>
                    <td><b>${r.name}</b></td>
                    <td>[village]${r.target}[/village]</td>
                    <td><b>${r.launchStr}</b> ${r.isNight ? '🌙' : ''}</td>
                    <td><a href="${r.placeUrl}" target="_blank" class="btn" style="padding:2px 6px;">Atacar</a></td>
                </tr>`;

                bbExport += `Lançar ${r.unit} [b]fake[/b] da [village]${r.coords}[/village] contra a aldeia [village]${r.target}[/village] a [i]${r.dateFormatted}[/i] [b]${r.timeFormatted}[/b]\n`;
            });

            outHtml += `</tbody></table>`;
            
            outHtml += `<div style="margin-top:15px;">
                <b>Exportar Plano em BBCode:</b>
                <textarea style="width:100%; height:120px; box-sizing:border-box; font-size:11px;" onclick="this.select()">${bbExport}</textarea>
            </div>`;

            $('#planner_results').html(outHtml);
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
