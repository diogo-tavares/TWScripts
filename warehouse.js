(function(window) {
    var strVersion = 'v1.0 (Gestor de Armazéns)';

    window.fnExecuteWarehouseScript = function() {
        UI.InfoMessage('A investigar armazéns... aguarde.', 2000);

        // Fazemos um pedido invisível à página de produção (page=-1 garante que lê todas as páginas se houver muitas aldeias)
        $.ajax({
            url: '/game.php?screen=overview_villages&mode=prod&page=-1',
            type: 'GET',
            success: function(data) {
                var $html = $(data);
                var $prodTable = $html.find('#production_table');
                
                if (!$prodTable.length) {
                    UI.ErrorMessage('Erro: Não foi possível encontrar a tabela de produção.', 4000);
                    return;
                }

                var villages = [];

                // Percorre todas as aldeias na tabela
                $prodTable.find('tr.nowrap').each(function() {
                    var $row = $(this);
                    
                    // Encontra o link da aldeia
                    var $link = $row.find('td:eq(0) span.quickedit-vn a:first');
                    if (!$link.length) $link = $row.find('td:eq(0) a:first');
                    if (!$link.length) return;

                    var vName = $link.text().trim();
                    var vUrl = $link.attr('href');
                    var vMatch = vUrl.match(/village=(\d+)/);
                    if (!vMatch) return;
                    var vId = vMatch[1];

                    // Encontra a célula dos recursos
                    var $resCell = $row.find('.res.wood').closest('td');
                    if (!$resCell.length) return;

                    // Extrai os recursos (limpando pontos que o jogo usa nos milhares)
                    var wood = parseInt($resCell.find('.res.wood').text().replace(/\D/g, ''), 10) || 0;
                    var stone = parseInt($resCell.find('.res.stone').text().replace(/\D/g, ''), 10) || 0;
                    var iron = parseInt($resCell.find('.res.iron').text().replace(/\D/g, ''), 10) || 0;

                    // O armazém é a célula imediatamente a seguir aos recursos
                    var $storageCell = $resCell.next('td');
                    var storage = parseInt($storageCell.text().replace(/\D/g, ''), 10) || 0;

                    if (storage > 0) {
                        // Calcula as percentagens arredondadas
                        var pWood = Math.round((wood / storage) * 100);
                        var pStone = Math.round((stone / storage) * 100);
                        var pIron = Math.round((iron / storage) * 100);
                        
                        // Descobre qual é o recurso mais cheio para definir a cor da aldeia
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

                // Ordenar as aldeias: as mais cheias ficam no topo
                villages.sort(function(a, b) {
                    return b.maxP - a.maxP;
                });

                // Construir a Janela (UI)
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
        html += '<p style="font-size:11px; margin-top:-5px;">Clica na aldeia para ir diretamente para o seu Mercado. Ocupação arredondada às unidades.</p>';
        
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
                var linkColor = '#005500'; // Cor padrão dos links do jogo

                // Regras de cores pedidas
                if (v.maxP >= 80) {
                    bgStyle = 'background-color: #ffcccc !important;'; // Fundo vermelho claro
                    linkColor = '#cc0000'; // Link vermelho forte
                } else if (v.maxP >= 60) {
                    bgStyle = 'background-color: #ffffcc !important;'; // Fundo amarelo claro
                    linkColor = '#a87b00'; // Link amarelo forte/dourado
                }

                var marketUrl = '/game.php?village=' + v.id + '&screen=market';

                // Destacar também as percentagens críticas individualmente para facilitar a leitura visual
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
        html += '<small><strong>Gestor de Armazéns</strong> - By Gemini</small>';
        html += '</div>';

        Dialog.show('warehouse_helper', html);
    }

    // Executar script
    fnExecuteWarehouseScript();

})(window);
