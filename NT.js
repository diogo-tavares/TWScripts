javascript:(function() {
    const cssSophie = `
    <style>
        #sophieNTModal {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 920px;
            max-height: 88vh;
            background-color: #F4E4BC;
            border: 3px solid #803000;
            z-index: 999999;
            box-shadow: 0 0 25px rgba(0,0,0,0.85);
            font-family: Verdana, Arial, sans-serif;
            font-size: 11px;
            color: #000;
            overflow-y: auto;
            border-radius: 4px;
        }
        .sophHeader {
            background-color: #c6a768;
            font-weight: bold;
            color: #803000;
            padding: 10px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #803000;
        }
        .sophRowA { background-color: #F4E4BC; }
        .sophRowB { background-color: #fff5da; }
        .sophTable { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .sophTable th { background-color: #c6a768; color: #803000; padding: 6px; border: 1px solid #803000; }
        .sophTable td { padding: 5px; text-align: center; border: 1px solid #d2b48c; }
        .btnSophie {
            background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%);
            color: white !important;
            border: 1px solid #3b240f;
            padding: 5px 12px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 3px;
        }
        .btnSophie:hover { background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%); }
        .btnSophie:disabled { background: #888; cursor: not-allowed; }
        .resWood { color: #804000; font-weight: bold; }
        .resStone { color: #a84000; font-weight: bold; }
        .resIron { color: #505050; font-weight: bold; }
        .debugBox {
            margin-top: 10px;
            padding: 8px;
            background: #111;
            color: #0f0;
            font-family: monospace;
            font-size: 10px;
            max-height: 220px;
            overflow-y: auto;
            text-align: left;
            border-radius: 3px;
        }
    </style>`;

    $("#sophieNTModal").remove();

    const CUSTO_NOBRE = { w: 40000, c: 50000, i: 50000 };

    let modalHtml = `
    ${cssSophie}
    <div id="sophieNTModal">
        <div class="sophHeader">
            <span>⚔️ NT Resource Balancer (v12 - Native Combined Parser)</span>
            <span onclick="$('#sophieNTModal').remove();" style="cursor:pointer;font-size:16px;">✖</span>
        </div>
        <div id="ntBody" style="padding: 12px;">
            <div id="ntConfigStep">
                <p><b>1. Introduz as coordenadas onde queres fazer NT:</b></p>
                <textarea id="targetCoordsInput" rows="3" style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px;">354|615 356|615 361|623 363|623 351|619 361|622 352|631</textarea>
                
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <label><b>Nobres pretendidos por aldeia: </b></label>
                        <input type="number" id="noblesCountInput" value="4" min="1" max="10" style="width: 45px; text-align: center;">
                    </div>
                    <button class="btnSophie" id="btnRunOptimizer">Carregar e Otimizar</button>
                </div>
            </div>

            <div id="ntLoadingStep" style="display:none; text-align:center; padding: 25px;">
                <p style="font-size:13px;"><b>A mapear aldeias, recursos e tropas...</b></p>
                <div id="ntLoadingStatus" style="font-size:12px; color:#803000; margin-top:5px;"></div>
            </div>

            <div id="ntResultStep" style="display:none;">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span id="ntSummaryText" style="font-weight:bold; font-size:12px;"></span>
                    <div>
                        <button class="btnSophie" id="btnToggleDebug" style="background:#555;margin-right:5px;">Ver Debug</button>
                        <button class="btnSophie" id="btnBackConfig">Voltar</button>
                    </div>
                </div>
                <div id="debugLog" class="debugBox" style="display:none;"></div>
                <table class="sophTable">
                    <thead>
                        <tr>
                            <th>Origem</th>
                            <th>Destino</th>
                            <th>Dist.</th>
                            <th>Madeira</th>
                            <th>Argila</th>
                            <th>Ferro</th>
                            <th>Mercs</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody id="ntTableBody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    $("body").append(modalHtml);

    let debugLines = [];
    function logDebug(msg) {
        let ts = new Date().toLocaleTimeString();
        debugLines.push(`[${ts}] ${msg}`);
        $("#debugLog").html(debugLines.join("<br>"));
    }

    $("#btnToggleDebug").click(() => $("#debugLog").slideToggle());

    $("#btnBackConfig").click(() => {
        $("#ntResultStep").hide();
        $("#ntLoadingStep").hide();
        $("#ntConfigStep").show();
    });

    $("#btnRunOptimizer").click(async function() {
        debugLines = [];
        let rawInput = $("#targetCoordsInput").val();
        let targetMatches = rawInput.match(/\d{3}\|\d{3}/g);

        if (!targetMatches || targetMatches.length === 0) {
            UI.ErrorMessage("Nenhuma coordenada válida inserida!");
            return;
        }

        let uniqueTargets = [...new Set(targetMatches)];
        let targetNobles = parseInt($("#noblesCountInput").val()) || 4;

        $("#ntConfigStep").hide();
        $("#ntLoadingStep").show();

        let accountVillages = {};

        // 1. Leitura Completa via Vista Combinada
        $("#ntLoadingStatus").text("A carregar visão combinada global...");
        try {
            let combHtml = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=combined&group=0`);
            let docComb = $(combHtml);
            let tbl = docComb.find("#combined_table");

            // Mapeamento dinâmico de colunas
            let snobColIndex = -1;
            let headerRow = tbl.find("tr:first");
            headerRow.find("th, td").each(function(idx) {
                let cellHtml = $(this).html();
                if (cellHtml.includes("unit_snob") || cellHtml.includes("snob.png") || cellHtml.includes("unit=snob")) {
                    snobColIndex = idx;
                }
            });
            logDebug(`Coluna Snob identificada no índice: ${snobColIndex}`);

            tbl.find("tr").each(function() {
                let r = $(this);
                let link = r.find(".quickedit-vn");
                if (!link.length) return;

                let coordM = link.text().match(/(\d{3}\|\d{3})/);
                let vid = link.attr("data-id") || (r.find("a[href*='village=']").attr("href") || "").match(/village=(\d+)/);
                if (typeof vid === 'object' && vid) vid = vid[1];

                if (coordM && vid) {
                    let coord = coordM[1];
                    let [x, y] = coord.split("|").map(Number);

                    // Extração flexível de recursos
                    let rowText = r.text();
                    let w = 0, c = 0, i = 0;

                    // Método 1: seletores nativos
                    let wElem = r.find(".wood, [class*='wood']").not("th");
                    let cElem = r.find(".stone, [class*='stone']").not("th");
                    let iElem = r.find(".iron, [class*='iron']").not("th");

                    if (wElem.length) w = parseInt(wElem.text().replace(/\D/g, '')) || 0;
                    if (cElem.length) c = parseInt(cElem.text().replace(/\D/g, '')) || 0;
                    if (iElem.length) i = parseInt(iElem.text().replace(/\D/g, '')) || 0;

                    // Método 2: Fallback por regex se o seletor falhar
                    if (w === 0 && c === 0 && i === 0) {
                        let resMatches = rowText.match(/(\d{1,3}(?:\.\d{3})*|\d+)\s+(\d{1,3}(?:\.\d{3})*|\d+)\s+(\d{1,3}(?:\.\d{3})*|\d+)/);
                        if (resMatches) {
                            w = parseInt(resMatches[1].replace(/\./g, '')) || 0;
                            c = parseInt(resMatches[2].replace(/\./g, '')) || 0;
                            i = parseInt(resMatches[3].replace(/\./g, '')) || 0;
                        }
                    }

                    // Mercadores (ex: 110/110)
                    let merc = 0;
                    r.find("td").each(function() {
                        let m = $(this).text().trim().match(/^(\d+)\/(\d+)$/);
                        if (m) { merc = parseInt(m[1]) || 0; return false; }
                    });

                    // Nobres
                    let snobs = 0;
                    if (snobColIndex !== -1) {
                        snobs = parseInt(r.find("td").eq(snobColIndex).text().trim()) || 0;
                    }

                    accountVillages[coord] = {
                        id: vid,
                        coord: coord,
                        x: x,
                        y: y,
                        w: w,
                        c: c,
                        i: i,
                        merc: merc,
                        snobs: snobs
                    };
                }
            });
            logDebug(`Aldeias mapeadas na visão combinada: ${Object.keys(accountVillages).length}`);
        } catch(e) {
            logDebug(`Erro ao ler visão combinada: ${e}`);
        }

        // 2. Fallback Específico de Recursos via mode=prod (para garantir armazéns caso a combinada oculte recursos)
        let sampleCoord = Object.keys(accountVillages)[0];
        if (sampleCoord && accountVillages[sampleCoord].w === 0 && accountVillages[sampleCoord].c === 0) {
            $("#ntLoadingStatus").text("A ajustar leitura de recursos via vista de produção...");
            try {
                let prodHtml = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=prod&group=0`);
                let docProd = $(prodHtml);
                docProd.find("#production_table tr").each(function() {
                    let r = $(this);
                    let link = r.find(".quickedit-vn");
                    if (!link.length) return;
                    let coordM = link.text().match(/(\d{3}\|\d{3})/);
                    if (coordM && accountVillages[coordM[1]]) {
                        let entry = accountVillages[coordM[1]];
                        let rawWood = r.find("span.wood, .wood").text().replace(/\D/g, '');
                        let rawStone = r.find("span.stone, .stone").text().replace(/\D/g, '');
                        let rawIron = r.find("span.iron, .iron").text().replace(/\D/g, '');
                        if (rawWood) entry.w = parseInt(rawWood) || 0;
                        if (rawStone) entry.c = parseInt(rawStone) || 0;
                        if (rawIron) entry.i = parseInt(rawIron) || 0;
                    }
                });
                logDebug("Recursos corrigidos via tabela de produção.");
            } catch(e) {
                logDebug(`Aviso ao ler produção: ${e}`);
            }
        }

        // 3. Transportes a caminho via mode=trader
        $("#ntLoadingStatus").text("A somar recursos em trânsito...");
        let incomingRes = {};
        try {
            let traderHtml = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=trader`);
            let docTrader = $(traderHtml);

            docTrader.find("#trades_table tr, table.vis tr").each(function() {
                let r = $(this);
                let text = r.text();
                let destMatch = text.match(/(\d{3}\|\d{3})/g);
                if (destMatch && destMatch.length >= 2) {
                    let destCoord = destMatch[1];
                    if (!incomingRes[destCoord]) incomingRes[destCoord] = { w: 0, c: 0, i: 0 };

                    let w = parseInt(r.find(".wood").text().replace(/\D/g, '')) || 0;
                    let c = parseInt(r.find(".stone").text().replace(/\D/g, '')) || 0;
                    let i = parseInt(r.find(".iron").text().replace(/\D/g, '')) || 0;

                    incomingRes[destCoord].w += w;
                    incomingRes[destCoord].c += c;
                    incomingRes[destCoord].i += i;
                }
            });
            logDebug("Transportes a caminho mapeados.");
        } catch(e) {
            logDebug("Aviso: Falha ao ler transportes.");
        }

        // 4. Dadoras elegíveis
        let groupVillages = [];
        Object.keys(accountVillages).forEach(coord => {
            if (!uniqueTargets.includes(coord)) {
                groupVillages.push(accountVillages[coord]);
            }
        });
        logDebug(`Dadoras ativas elegíveis: ${groupVillages.length}`);

        // 5. Cálculo dos défices
        let targets = [];
        uniqueTargets.forEach(coord => {
            let [x, y] = coord.split("|").map(Number);
            let localV = accountVillages[coord] || { id: null, w: 0, c: 0, i: 0, snobs: 0 };
            let inc = incomingRes[coord] || { w: 0, c: 0, i: 0 };
            let currentNobles = localV.snobs;

            let neededNobles = Math.max(0, targetNobles - currentNobles);

            let totalReqW = neededNobles * CUSTO_NOBRE.w;
            let totalReqC = neededNobles * CUSTO_NOBRE.c;
            let totalReqI = neededNobles * CUSTO_NOBRE.i;

            let defW = Math.max(0, totalReqW - (localV.w + inc.w));
            let defC = Math.max(0, totalReqC - (localV.c + inc.c));
            let defI = Math.max(0, totalReqI - (localV.i + inc.i));

            logDebug(`Alvo ${coord} (ID: ${localV.id}) | Nobres: [${currentNobles}/${targetNobles}] | Armazém: ${localV.w}W ${localV.c}C ${localV.i}I | Défice: ${defW}W ${defC}C ${defI}I`);

            if ((defW + defC + defI) > 0) {
                targets.push({
                    id: localV.id,
                    coord: coord,
                    x: x,
                    y: y,
                    req: { w: defW, c: defC, i: defI }
                });
            }
        });

        // 6. Distribuição dos envios
        let transfers = [];
        targets.forEach(t => {
            groupVillages.sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));

            for (let src of groupVillages) {
                if (t.req.w === 0 && t.req.c === 0 && t.req.i === 0) break;
                if (src.coord === t.coord || src.merc <= 0) continue;

                let cap = src.merc * 1000;
                let sendW = Math.min(src.w, t.req.w, cap);
                cap -= sendW;
                let sendC = Math.min(src.c, t.req.c, cap);
                cap -= sendC;
                let sendI = Math.min(src.i, t.req.i, cap);

                let totalSend = sendW + sendC + sendI;
                if (totalSend === 0) continue;

                let mercUsed = Math.ceil(totalSend / 1000);

                transfers.push({
                    srcId: src.id,
                    srcCoord: src.coord,
                    targetId: t.id,
                    targetCoord: t.coord,
                    targetX: t.x,
                    targetY: t.y,
                    dist: Math.hypot(src.x - t.x, src.y - t.y).toFixed(1),
                    w: sendW,
                    c: sendC,
                    i: sendI,
                    merc: mercUsed
                });

                src.w -= sendW;
                src.c -= sendC;
                src.i -= sendI;
                src.merc -= mercUsed;

                t.req.w -= sendW;
                t.req.c -= sendC;
                t.req.i -= sendI;
            }
        });

        let tbody = $("#ntTableBody");
        tbody.empty();

        function updateCounter() {
            let restantes = $("#ntTableBody tr.task-row").length;
            if (restantes === 0) {
                $("#ntSummaryText").html("<span style='color:green;'>✔️ Todas as ordens foram concluídas!</span>");
                tbody.html("<tr><td colspan='8' style='padding: 15px; font-weight: bold; color: green;'>Plano de envios concluído com sucesso.</td></tr>");
            } else {
                $("#ntSummaryText").text(`Tarefas pendentes: ${restantes}`);
            }
        }

        if (transfers.length === 0) {
            tbody.append(`<tr><td colspan='8' style='padding: 12px; color: #a00; font-weight: bold;'>Nenhum envio necessário com base nos recursos e transportes atuais.</td></tr>`);
            $("#ntSummaryText").text("Nenhum envio gerado.");
            $("#debugLog").show();
        } else {
            transfers.forEach((tr, index) => {
                let rowClass = index % 2 === 0 ? "sophRowA" : "sophRowB";
                let rowId = `task_row_${index}`;

                tbody.append(`
                    <tr id="${rowId}" class="task-row ${rowClass}">
                        <td>${tr.srcCoord}</td>
                        <td><b>${tr.targetCoord}</b></td>
                        <td>${tr.dist}</td>
                        <td class="resWood">${tr.w.toLocaleString()}</td>
                        <td class="resStone">${tr.c.toLocaleString()}</td>
                        <td class="resIron">${tr.i.toLocaleString()}</td>
                        <td>${tr.merc}</td>
                        <td><button class="btnSophie send-direct-btn" data-row="${rowId}" data-src="${tr.srcId}" data-tid="${tr.targetId}" data-tx="${tr.targetX}" data-ty="${tr.targetY}" data-w="${tr.w}" data-c="${tr.c}" data-i="${tr.i}">Enviar</button></td>
                    </tr>
                `);
            });

            updateCounter();

            $(".send-direct-btn").off("click").on("click", function() {
                let btn = $(this);
                let rowId = btn.data("row");
                let rowElement = $(`#${rowId}`);

                btn.prop("disabled", true).text("A enviar...");

                let postData = {
                    target_id: btn.data("tid"),
                    x: btn.data("tx"),
                    y: btn.data("ty"),
                    wood: btn.data("w"),
                    stone: btn.data("c"),
                    iron: btn.data("i"),
                    h: game_data.csrf
                };

                $.ajax({
                    url: `/game.php?village=${btn.data("src")}&screen=market&mode=send&action=send`,
                    type: 'POST',
                    data: postData,
                    success: function(resp) {
                        let isError = typeof resp === 'string' && (resp.includes("error_box") || resp.includes("Não há mercadores"));
                        if (isError) {
                            let errMatch = resp.match(/<div class="error_box">(.*?)<\/div>/s);
                            let msg = errMatch ? $(errMatch[0]).text().trim() : "Recusado pelo jogo.";
                            logDebug(`FALHA no envio: ${msg}`);
                            UI.ErrorMessage(msg);
                            btn.prop("disabled", false).text("Enviar");
                        } else {
                            UI.SuccessMessage("Recursos enviados com sucesso!");
                            rowElement.fadeOut(200, function() {
                                $(this).remove();
                                updateCounter();
                            });
                        }
                    },
                    error: function(xhr, status, err) {
                        logDebug(`HTTP ERROR (${xhr.status}): ${err}`);
                        UI.ErrorMessage(`Erro HTTP ${xhr.status}: Tenta novamente.`);
                        btn.prop("disabled", false).text("Enviar");
                    }
                });
            });
        }

        $("#ntLoadingStep").hide();
        $("#ntResultStep").show();
    });
})();
