(function(window) {
    var strVersion = 'v1.1 (Gestor de Armazéns)';

    window.fnExecuteWarehouseScript = function() {
        UI.InfoMessage('A investigar armazéns... aguarde.', 2000);

        // Fazemos um pedido invisível à página de produção
        $.ajax({
            url: '/game.php?screen=overview_villages&mode=prod&page=-1',
            type: 'GET',
            success: function(data) {
                // Parse seguro do HTML recebido
                var $html = $($.parseHTML(data));
                var $prodTable = $html.find('#production_table');
                
                if (!$prodTable.length) {
                    UI.ErrorMessage('Erro: Não foi possível encontrar a tabela de produção.', 4000);
                    return;
                }

                // Procurar em que coluna está a madeira (normalmente é a coluna 2 ou 3)
                var woodIdx = -1;
                $prodTable.find('tr:first th').each(function(i) {
                    if ($(this).find('.wood').length > 0 || $(this).find('img[src*="wood"]').length > 0) {
                        woodIdx = i;
                    }
                });

                // Prevenção caso o layout do jogo mude
                if (woodIdx === -1) woodIdx = 2;

                var villages = [];

                // Percorrer as linhas das aldeias (ignorando cabeçalhos)
                $prodTable.find('tr.row_a, tr.row_b').each(function() {
                    var $row = $(this);
                    var $cells = $row.children('td');
                    
                    // Se a linha não tiver células suficientes, ignorar
                    if ($cells.length < woodIdx + 4) return;

                    // Encontra o link da aldeia
                    var $link = $cells.eq(0).find('span.quickedit-vn a:first');
                    if (!$link.length) $link = $cells.eq(0).find('a:first');
                    if (!$link.length) return;

                    var vName = $link.text().trim();
                    var vUrl = $link.attr('href');
                    var vMatch = vUrl.match(/village=(\d+)/);
                    if (!vMatch) return;
                    var vId = vMatch[1];

                    // Ler os recursos usando a ordem certa das colunas (Madeira, Argila, Ferro, Armazém)
                    var wood = parseInt($cells.eq(woodIdx).text().replace(/\D/g, ''), 10) || 0;
                    var stone = parseInt($cells.eq(woodIdx + 1).text().replace(/\D/g, ''), 10) || 0;
                    var iron = parseInt($cells.eq(woodIdx + 2).text().replace(/\D/g, ''), 10) || 0;
                    var storage = parseInt($cells.eq(woodIdx + 3).text().replace(/\D/g, ''), 10) || 0;

                    if (storage > 0) {
                        // Calcula as percentagens arredondadas
                        var pWood = Math.round((wood / storage) * 100);
                        var pStone = Math.round((stone / storage) * 100);
                        var pIron = Math.round((iron / storage) * 100);
                        
                        // Qual é a percentagem mais alta para definir a urgência?
                        var maxP = Math.max(pWood, pStone, pIron);

                        villages.push({
                            id: vId,
                            name: vName,
                            wood: pWood,
                            stone: pStone,
                            iron: pIron,
                            maxP: maxP
                        });
                    }
                });

                // Ordenar: as aldeias mais cheias primeiro
                villages.sort(function(a, b) {
                    return b.maxP - a.maxP;
                });

                // Construir e mostrar a Janela (UI)
                buildUI(villages);
            },
            error: function() {
                UI.ErrorMessage('Erro ao ligar ao servidor para ler os armazéns.', 4000);
            }
        });
    };

    function buildUI(villages) {
        var html = '';
        html += '<div class="ra-body" style="max-width: 600px;">';
        html += '<table class="main" width="100%" align="center"><tr><td>';
        html += '<h2>Estado dos Armazéns</h2>';
        html += '<p style="font-size:11px; margin-top:-5px;">Clica na aldeia para ir diretamente para o seu Mercado.</p>';
        
        html += '<div style="max-height: 400px; overflow-y: auto; border: 1px solid #7d510f;">';
        html += '<table class="vis" width="100%">';
        html += '<tr>';
        html += '<th>Aldeia</th>';
        html += '<th style="text-align:center;"><span class="icon header wood"></span></th>';
        html += '<th style="text-align:center;"><span class="icon header stone"></span></th>';
        html += '<th style="text-align:center;"><span class="icon header iron"></span></th>';
        html += '</tr>';

        if (villages.length === 0) {
            html += '<tr><td colspan="4" style="text-align:center;">Nenhuma aldeia encontrada.</td></tr>';
        } else {
            for (var i = 0; i < villages.length; i++) {
                var v = villages[i];
                var rowClass = (i % 2 === 0) ? 'row_a' : 'row_b';
                var bgStyle = '';
                var linkColor = '#005500';

                // Cores das linhas
                if (v.maxP >= 80) {
                    bgStyle = 'background-color: #ffcccc !important;'; 
                    linkColor = '#cc0000'; 
                } else if (v.maxP >= 60) {
                    bgStyle = 'background-color: #ffffcc !important;'; 
                    linkColor = '#a87b00'; 
                }

                // O link que leva para o mercado no mesmo separador
                var marketUrl = '/game.php?village=' + v.id + '&screen=market';

                // Destacar os números mais altos a bold e cor
                var styleW = (v.wood >= 80) ? 'color:#cc0000; font-weight:bold;' : ((v.wood >= 60) ? 'color:#a87b00; font-weight:bold;' : '');
                var styleS = (v.stone >= 80) ? 'color:#cc0000; font-weight:bold;' : ((v.stone >= 60) ? 'color:#a87b00; font-weight:bold;' : '');
                var styleI = (v.iron >= 80) ? 'color:#cc0000; font-weight:bold;' : ((v.iron >= 60) ? 'color:#a87b00; font-weight:bold;' : '');

                html += '<tr class="' + rowClass + '" style="' + bgStyle + '">';
                html += '<td><a href="' + marketUrl + '" style="font-weight:bold; color:' + linkColor + ';">' + v.name + '</a></td>';
                html += '<td style="text-align:center; ' + styleW + '">' + v.wood + '%</td>';
                html += '<td style="text-align:center; ' + styleS + '">' + v.stone + '%</td>';
                html += '<td style="text-align:center; ' + styleI + '">' + v.iron + '%</td>';
                html += '</tr>';
            }
        }

        html += '</table>';
        html += '</div>';
        html += '</td></tr></table>';
        html += '<small><strong>Gestor de Armazéns</strong> - By rodaSbro</small>';
        html += '</div>';

        Dialog.show('warehouse_helper', html);
    }

    // Arranque automático
    fnExecuteWarehouseScript();

})(window);
