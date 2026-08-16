javascript:
(function(){
    if ($('#tw_export_attacks_dialog').length) {
        $('#tw_export_attacks_dialog').remove();
        return;
    }

    // 1.º Clique: Se não estiver na página de Comandos de Ataque, redireciona
    var isCommandsScreen = window.location.href.indexOf('screen=overview_villages') !== -1 && 
                           window.location.href.indexOf('mode=commands') !== -1 && 
                           window.location.href.indexOf('type=attack') !== -1;

    if (!isCommandsScreen) {
        UI.InfoMessage('A redirecionar para Visualização Geral -> Comandos -> Ataques...', 1500);
        var targetUrl = '/game.php?village=' + game_data.village.id + '&screen=overview_villages&mode=commands&type=attack';
        if (game_data.player.sitter != "0") {
            targetUrl = '/game.php?t=' + game_data.player.id + '&village=' + game_data.village.id + '&screen=overview_villages&mode=commands&type=attack';
        }
        window.location.href = targetUrl;
        return;
    }

    var attackExporter = {
        attacks: [],

        init: function() {
            var self = this;
            UI.InfoMessage('A extrair comandos de ataque...', 1000);
            self.readCommands();
            self.buildUI();
        },

        readCommands: function() {
            var self = this;
            self.attacks = [];

            $('#commands_table tbody tr.nowrap').each(function() {
                var $row = $(this);
                var $cells = $row.find('td');

                if ($cells.length >= 3) {
                    var commandText = $cells.eq(0).text().trim();
                    var originText = $cells.eq(1).text().trim();
                    var arrivalText = $cells.eq(2).text().trim();

                    // Extrair coordenadas da origem e do alvo
                    var targetMatch = commandText.match(/\d{3}\|\d{3}/);
                    var originMatch = originText.match(/\d{3}\|\d{3}/);

                    var targetCoords = targetMatch ? targetMatch[0] : "Desconhecido";
                    var originCoords = originMatch ? originMatch[0] : "Desconhecido";

                    // Limpar texto de chegada (remover milissegundos se existirem)
                    var arrivalClean = arrivalText.replace(/\s+/g, ' ');

                    self.attacks.push({
                        commandName: commandText,
                        originCoords: originCoords,
                        targetCoords: targetCoords,
                        arrival: arrivalClean
                    });
                }
            });
        },

        buildUI: function() {
            var self = this;

            if (!self.attacks.length) {
                UI.ErrorMessage('Nenhum comando de ataque encontrado nesta página!');
                return;
            }

            var bbCodeExport = `[b]Lista de Ataques a Decorrer (${self.attacks.length})[/b]\n\n`;
            var tableRows = '';

            $.each(self.attacks, function(i, att) {
                bbCodeExport += `Ataque da [village]${att.originCoords}[/village] contra [village]${att.targetCoords}[/village] - Chegada: [b]${att.arrival}[/b]\n`;

                tableRows += `<tr>
                    <td>${i + 1}</td>
                    <td>[village]${att.originCoords}[/village]</td>
                    <td>[village]${att.targetCoords}[/village]</td>
                    <td><b>${att.arrival}</b></td>
                </tr>`;
            });

            var html = `
            <div id="tw_export_attacks_dialog" style="width:100%; box-sizing:border-box; padding:5px;">
                <div style="background:#804000; color:#fff; padding:6px 10px; font-weight:bold; border-radius:3px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>⚔️ Comandos de Ataque Ativos</span>
                    <small>(${self.attacks.length} ataques lidos)</small>
                </div>
                
                <div style="max-height:220px; overflow-y:auto; margin-bottom:12px; border:1px solid #d4c5a3;">
                    <table class="vis" style="width:100%; font-size:12px;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Origem</th>
                                <th>Alvo</th>
                                <th>Chegada</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                <div>
                    <b>Exportar em BBCode:</b>
                    <textarea style="width:100%; height:140px; box-sizing:border-box; font-size:11px; font-family:monospace;" onclick="this.select()">${bbCodeExport}</textarea>
                </div>
            </div>`;

            Dialog.show("tw_export_attacks_popup", html);

            var calcWidth = Math.min(800, $(window).width() - 20);
            $('#tw_export_attacks_popup').css({
                'width': calcWidth + 'px',
                'max-width': '95vw'
            });
        }
    };

    attackExporter.init();
})();
