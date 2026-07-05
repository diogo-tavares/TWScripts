(function(window) {
    var strVersion = 'v1.2 (Gestor de Armazéns Definitivo)';

    window.fnExecuteWarehouseScript = function() {
        UI.InfoMessage('A investigar armazéns... aguarde.', 2000);

        // Fazemos um pedido invisível à página de produção
        $.ajax({
            url: '/game.php?screen=overview_villages&mode=prod&page=-1',
            type: 'GET',
            success: function(data) {
                // Lê o HTML da página oculta
                var $html = $($.parseHTML(data));
                var villages = [];

                // O novo motor "caçador": ignora a tabela e vai direto a todas as linhas (tr)
                $html.find('tr').each(function() {
                    var $row = $(this);
                    
                    // Procura os elementos dos recursos na linha
                    var $wood = $row.find('.wood');
                    var $stone = $row.find('.stone');
                    var $iron = $row.find('.iron');
                    
                    // Se a linha não tiver os 3 recursos, salta fora (não é uma linha de aldeia)
                    if ($wood.length === 0 || $stone.length === 0 || $iron.length === 0) return;

                    // Procura o nome e ID da aldeia
                    var $link = $row.find('td:first a').first();
                    if ($row.find('span.quickedit-vn a').length) {
                        $link = $row.find('span.quickedit-vn a').first(); // Se tiver edição rápida
                    }
                    if (!$link.length) return;

                    var vName = $link.text().trim();
                    var vUrl = $link.attr('href');
                    if (!vUrl) return;
                    
                    var vMatch = vUrl.match(/village=(\d+)/);
                    if (!vMatch) return;
                    var vId = vMatch[1];

                    // Extrai os valores numéricos limpos
                    var wood = parseInt($wood.text().replace(/\D/g, ''), 10) || 0;
                    var stone = parseInt($stone.text().replace(/\D/g, ''), 10) || 0;
                    var iron = parseInt($iron.text().replace(/\D/g, ''), 10) || 0;

                    // O armazém está sempre na célula (td) seguinte aos recursos
                    var $resTd = $wood.closest('td');
                    var $storageTd = $resTd.next('td');
                    var storage = parseInt($storageTd.text().replace(/\D/g, ''), 10) || 0;

                    if (storage > 0) {
                        // Calcula as percentagens arredondadas
                        var pWood = Math.round((wood / storage) * 100);
                        var pStone = Math.round((stone / storage) * 100);
                        var pIron = Math.round((iron / storage) * 100);
                        
                        // Qual é a percentagem mais alta?
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

                if (villages.length === 0) {
                    UI.ErrorMessage('Não foram encontradas aldeias. Certifica-te que tens aldeias na Visão Geral de Produção.', 5000);
                    return;
                }

                // Ordenar: as aldeias mais cheias primeiro
                villages.sort(function(a, b) {
                    return b.maxP - a.maxP;
                });

                // Construir a UI
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

            // Destacar os números críticos a bold e cor
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

        html += '</table>';
        html += '</div>';
        html += '</td></tr></table>';
        html += '<small><strong>Gestor de Armazéns</strong> - ' + strVersion + '</small>';
        html += '</div>';

        Dialog.show('warehouse_helper', html);
    }

    // Arranque automático
    fnExecuteWarehouseScript();

})(window);
