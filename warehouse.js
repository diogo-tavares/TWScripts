(function(window) {

    window.fnExecuteWarehouseScript = function() {
        UI.InfoMessage('A investigar armazéns... aguarde.', 2000);

        $.ajax({
            url: '/game.php?screen=overview_villages&mode=prod&page=-1',
            type: 'GET',
            success: function(data) {
                var $html = $($.parseHTML(data));
                var $prodTable = $html.find('#production_table');
                var villages = [];
                var processedIds = []; 

                if (!$prodTable.length) {
                    UI.ErrorMessage('Tabela de produção não encontrada.', 4000);
                    return;
                }

                // Função cirúrgica para extrair APENAS os números do elemento exato
                function getCleanNumber($el) {
                    if (!$el || !$el.length) return 0;
                    var $clone = $el.clone();
                    $clone.find('.hidden').remove(); 
                    return parseInt($clone.text().replace(/\D/g, ''), 10) || 0;
                }

                $prodTable.find('tr').each(function() {
                    var $row = $(this);

                    // Ignorar cabeçalhos e afins
                    if (!$row.hasClass('row_a') && !$row.hasClass('row_b')) return;

                    var $link = $row.find('span.quickedit-vn a').first();
                    if (!$link.length) {
                        $link = $row.find('td:eq(0) a').first();
                    }

                    if (!$link.length) return;
                    
                    var vName = $link.text().trim();
                    if (vName === '') return; 

                    var vUrl = $link.attr('href');
                    if (!vUrl) return;
                    
                    var vMatch = vUrl.match(/village=(\d+)/);
                    if (!vMatch) return;
                    var vId = vMatch[1];

                    // Bloqueio de duplicados
                    if (processedIds.includes(vId)) return;

                    // AGORA SIM: Extrair diretamente do SPAN do ícone (e não da célula inteira)
                    var $spanWood = $row.find('.wood').first();
                    var $spanStone = $row.find('.stone').first();
                    var $spanIron = $row.find('.iron').first();

                    if (!$spanWood.length || !$spanStone.length || !$spanIron.length) return;

                    var wood = getCleanNumber($spanWood);
                    var stone = getCleanNumber($spanStone);
                    var iron = getCleanNumber($spanIron);
                    
                    // O armazém está na célula (td) a seguir à célula que contém os recursos
                    var $tdStorage = $spanIron.closest('td').next('td');
                    var storage = getCleanNumber($tdStorage);

                    if (storage > 0) {
                        processedIds.push(vId); 
                        
                        var pWood = Math.round((wood / storage) * 100);
                        var pStone = Math.round((stone / storage) * 100);
                        var pIron = Math.round((iron / storage) * 100);
                        
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
                    UI.ErrorMessage('Não foram encontradas aldeias válidas.', 5000);
                    return;
                }

                // Ordenar: as aldeias mais cheias ficam no topo
                villages.sort(function(a, b) {
                    return b.maxP - a.maxP;
                });

                buildUI(villages);
            },
            error: function() {
                UI.ErrorMessage('Erro ao ligar ao servidor.', 4000);
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

            var marketUrl = '/game.php?village=' + v.id + '&screen=market';

            // Destacar os números
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
        html += '<small><strong>Gestor de Armazéns</strong></small>';
        html += '</div>';

        Dialog.show('warehouse_helper', html);
    }

    fnExecuteWarehouseScript();

})(window);
