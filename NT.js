javascript:(function() {
    const SCRIPT_VERSION = "v15.0 - Sophie Theme & Isolated Incomings";

    const cssSophieTheme = `
    <style>
        #sophieNTModal {
            position: fixed;
            top: 25px;
            left: 50%;
            transform: translateX(-50%);
            width: 900px;
            max-height: 88vh;
            background-color: #2b303a;
            border: 2px solid #1a1c23;
            z-index: 999999;
            box-shadow: 0 0 25px rgba(0,0,0,0.85);
            font-family: Verdana, Arial, sans-serif;
            font-size: 11px;
            color: #e0e0e0;
            overflow-y: auto;
            border-radius: 4px;
        }
        .sophieTopBar {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            background: #1e222b;
            border-bottom: 1px solid #3c4250;
            padding: 8px 12px;
            font-size: 11px;
            gap: 6px;
        }
        .sophieTopBar div {
            color: #fff;
            font-weight: bold;
        }
        .sophieTitleBar {
            background-color: #242831;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #3c4250;
        }
        .sophieTitleBar span.title {
            color: #fff;
            font-weight: bold;
            font-size: 13px;
        }
        .sophieTable {
            width: 100%;
            border-collapse: collapse;
        }
        .sophieTable th {
            background-color: #1e222b;
            color: #fff;
            padding: 7px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #3c4250;
            text-align: center;
        }
        .sophieTable td {
            padding: 6px;
            border: 1px solid #3c4250;
            text-align: center;
            font-size: 11px;
            color: #ffffff;
        }
        .rowDarkA { background-color: #2b303a; }
        .rowDarkB { background-color: #242831; }
        .rowDarkA:hover, .rowDarkB:hover { background-color: #383f4c; }
        .coordLink {
            color: #4da6ff !important;
            text-decoration: none;
            font-weight: bold;
        }
        .btnSophieDark {
            background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%);
            color: #ffffff !important;
            border: 1px solid #201205;
            padding: 3px 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
            border-radius: 2px;
        }
        .btnSophieDark:hover { background: linear-gradient(to bottom, #a68a70 0%,#8d6b47 22%,#7c532b 30%,#7c532b 100%); }
        .btnSophieDark:disabled { background: #555; cursor: not-allowed; border-color: #333; }
        .resIconText {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            color: #fff;
            font-weight: bold;
        }
        .debugConsole {
            background: #111;
            color: #0f0;
            font-family: monospace;
            font-size: 10px;
            padding: 8px;
            max-height: 220px;
            overflow-y: auto;
            text-align: left;
            border-top: 1px solid #3c4250;
        }
    </style>`;

    $("#sophieNTModal").remove();

    const CUSTO_NOBRE = { w: 40000, c: 50000, i: 50000 };

    let modalHtml = `
    ${cssSophieTheme}
    <div id="sophieNTModal">
        <div class="sophieTitleBar">
            <span class="title">⚔️ Warehouse Balancer - Fazer NTs (${SCRIPT_VERSION})</span>
            <span onclick="$('#sophieNTModal').remove();" style="cursor:pointer;font-size:16px;color:#fff;">✖</span>
        </div>
        
        <div id="ntBody" style="padding: 10px;">
            <div id="ntConfigStep">
                <p style="color:#ddd; margin: 4px 0 6px 0;"><b>Aldeias Alvo (onde queres NTs):</b></p>
                <textarea id="targetCoordsInput" rows="2" style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#1e222b; color:#fff; border:1px solid #3c4250;">354|615 356|615 361|623 363|623 351|619 361|622 352|631</textarea>
                
                <p style="color:#ddd; margin: 8px 0 6px 0;"><b>Aldeias Dadoras [Vazio = todas do grupo atual]:</b></p>
                <textarea id="donorCoordsInput" rows="3" placeholder="Ex: 340|600 341|600..." style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#1e222b; color:#fff; border:1px solid #3c4250;"></textarea>

                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <label style="color:#ddd;"><b>Nobres pretendidos: </b></label>
                        <input type="number" id="noblesCountInput" value="4" min="1" max="10" style="width: 45px; text-align: center; background:#1e222b; color:#fff; border:1px solid #3c4250;">
                    </div>
                    <button class="btnSophieDark" id="btnRunOptimizer">Carregar e Calcular Envios</button>
                </div>
            </div>

            <div id="ntLoadingStep" style="display:none; text-align:center; padding: 25px;">
                <p style="font-size:13px; color:#fff;"><b>A contactar os mercados e a auditar transportes a chegar...</b></p>
                <div id="ntLoadingStatus" style="font-size:12px; color:#4da6ff; margin-top:5px;"></div>
            </div>

            <div id="ntResultStep" style="display:none;">
                <div class="sophieTopBar" id="ntStatsBar">
                    <div id="statTotalWood">Total Wood: 0</div>
                    <div id="statTotalClay">Total Clay: 0</div>
                    <div id="statTotalIron">Total Iron: 0</div>
                </div>

                <div style="display:flex; justify-content: space-between; align-items:center; padding: 6px 0;">
                    <span id="ntSummaryText" style="font-weight:bold; font-size:11px; color:#fff;"></span>
                    <div>
                        <button class="btnSophieDark" id="btnToggleDebug" style="background:#444;margin-right:5px;">Debug</button>
                        <button class="btnSophieDark" id="btnBackConfig">Voltar</button>
                    </div>
                </div>

                <div id="debugLog" class="debugConsole" style="display:none;"></div>

                <table class="sophieTable">
                    <thead>
                        <tr>
                            <th>Source village</th>
                            <th>Target village</th>
                            <th>Distance</th>
                            <th>Wood</th>
                            <th>Clay</th>
                            <th>Iron</th>
                            <th>Action</th>
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
        logDebug(`>>> INICIADO: ${SCRIPT_VERSION} <<<`);

        let rawTargets = $("#targetCoordsInput").val().match(/\d{3}\|\d{3}/g);
        if (!rawTargets || rawTargets.length === 0) {
            UI.ErrorMessage("Nenhuma coordenada de alvo inserida!");
            return;
        }

        let uniqueTargets = [...new Set(rawTargets)];
        let rawDonors = ($("#donorCoordsInput").val() || "").match(/\d{3}\|\d{3}/g);
        let explicitDonors = rawDonors ? [...new Set(rawDonors)] : [];
        let targetNobles = parseInt($("#noblesCountInput").val()) || 4;

        $("#ntConfigStep").hide();
        $("#ntLoadingStep").show();

        let accountVillages = {};

        // 1. Mapear Produção e Nobres em Treino
        $("#ntLoadingStatus").text("A carregar armazéns e recrutamento...");
        try {
            let prodHtml = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=prod`);
            let docProd = $(prodHtml);

            docProd.find("#production_table tr").each(function() {
                let r = $(this);
                let link = r.find(".quickedit-vn");
                if (!link.length) return;

                let coordM = link.text().match(/(\d{3}\|\d{3})/);
                let vid = link.attr("data-id") || (r.find("a[href*='village=']").attr("href") || "").match(/village=(\d+)/);
                if (typeof vid === 'object' && vid) vid = vid[1];

                if (coordM && vid) {
                    let coord = coordM[1];
                    let villageName = link.text().trim();
                    let [x, y] = coord.split("|").map(Number);
                    let w = parseInt(r.find(".wood").text().replace(/\D/g, '')) || 0;
                    let c = parseInt(r.find(".stone").text().replace(/\D/g, '')) || 0;
                    let i = parseInt(r.find(".iron").text().replace(/\D/g, '')) || 0;

                    let merc = 0;
                    r.find("td").each(function() {
                        let m = $(this).text().trim().match(/^(\d+)\/(\d+)$/);
                        if (m) { merc = parseInt(m[1]) || 0; return false; }
                    });

                    let snobsInTraining = r.find("img[src*='unit_snob'], img[src*='snob']").length;

                    accountVillages[coord] = {
                        id: vid,
                        name: villageName,
                        coord: coord,
                        x: x,
                        y: y,
                        w: w,
                        c: c,
                        i: i,
                        merc: merc,
                        snobs: snobsInTraining
                    };

                    if (snobsInTraining > 0 && uniqueTargets.includes(coord)) {
                        logDebug(`Alvo ${coord}: +${snobsInTraining} nobre(s) em treino.`);
                    }
                }
            });
            logDebug(`Total de aldeias no ecrã: ${Object.keys(accountVillages).length}`);
        } catch(e) {
            logDebug(`Erro na leitura de produção: ${e}`);
        }

        // 2. Mapear Nobres Prontos
        $("#ntLoadingStatus").text("A contabilizar nobres prontos...");
        try {
            let unitsHtml = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=complete`);
            let docUnits = $(unitsHtml);

            let snobColIndex = -1;
            docUnits.find("#units_table thead th, #units_table tr:first th").each(function(idx) {
                if ($(this).find("img[src*='unit_snob']").length) {
                    snobColIndex = idx;
                    return false;
                }
            });

            if (snobColIndex !== -1) {
                docUnits.find("#units_table tbody tr, #units_table tr").each(function() {
                    let r = $(this);
                    let link = r.find(".quickedit-vn");
                    if (link.length) {
                        let coordM = link.text().match(/(\d{3}\|\d{3})/);
                        if (coordM && accountVillages[coordM[1]]) {
                            let readySnobs = parseInt(r.find("td").eq(snobColIndex).text().trim()) || 0;
                            accountVillages[coordM[1]].snobs += readySnobs;
                        }
                    }
                });
            }
        } catch(e) {
            logDebug(`Aviso ao ler tropas: ${e}`);
        }

        // 3. CONSULTA DIRETA AO MERCADO - ISOLAMENTO ESTRITO DE "A CHEGAR"
        $("#ntLoadingStatus").text("A extrair dados de transportes a chegar...");
        let incomingRes = {};

        for (let coord of uniqueTargets) {
            let targetV = accountVillages[coord];
            if (!targetV || !targetV.id) continue;

            incomingRes[coord] = { w: 0, c: 0, i: 0 };
            try {
                let mHtml = await $.get(`/game.php?village=${targetV.id}&screen=market`);
                let docM = $(mHtml);

                docM.find("table.vis tr").each(function() {
                    let text = $(this).text();
                    if (text.includes("A chegar:") || text.includes("Incoming:")) {
                        let rowHtml = $(this).html();

                        // Truncar o HTML para ignorar tudo a partir de "De saída" ou "Outgoing"
                        let incomingPart = rowHtml.split(/De saída|Outgoing/i)[0];
                        let incomingBlock = $("<div>" + incomingPart + "</div>");

                        incomingBlock.find("span.icon.header.wood, img[src*='wood'], .wood").each(function() {
                            let val = parseInt($(this).parent().text().replace(/\D/g, '')) || 0;
                            if (val < 1000000) incomingRes[coord].w += val;
                        });
                        incomingBlock.find("span.icon.header.stone, img[src*='stone'], .stone").each(function() {
                            let val = parseInt($(this).parent().text().replace(/\D/g, '')) || 0;
                            if (val < 1000000) incomingRes[coord].c += val;
                        });
                        incomingBlock.find("span.icon.header.iron, img[src*='iron'], .iron").each(function() {
                            let val = parseInt($(this).parent().text().replace(/\D/g, '')) || 0;
                            if (val < 1000000) incomingRes[coord].i += val;
                        });
                    }
                });

                logDebug(`Mercado ${coord} (Isolado): +${incomingRes[coord].w.toLocaleString()}W | +${incomingRes[coord].c.toLocaleString()}C | +${incomingRes[coord].i.toLocaleString()}I`);
            } catch(err) {
                logDebug(`Erro no mercado de ${coord}: ${err}`);
            }
        }

        // 4. Selecionar Dadoras
        let groupVillages = [];
        if (explicitDonors.length > 0) {
            explicitDonors.forEach(coord => {
                if (accountVillages[coord] && !uniqueTargets.includes(coord)) {
                    groupVillages.push(accountVillages[coord]);
                }
            });
        } else {
            Object.keys(accountVillages).forEach(coord => {
                if (!uniqueTargets.includes(coord)) {
                    groupVillages.push(accountVillages[coord]);
                }
            });
        }

        // 5. Cálculo dos Défices
        let targets = [];
        let grandTotalW = 0, grandTotalC = 0, grandTotalI = 0;

        uniqueTargets.forEach(coord => {
            let [x, y] = coord.split("|").map(Number);
            let localV = accountVillages[coord] || { id: null, name: coord, w: 0, c: 0, i: 0, snobs: 0 };
            let inc = incomingRes[coord] || { w: 0, c: 0, i: 0 };
            let totalNobles = localV.snobs;

            let neededNobles = Math.max(0, targetNobles - totalNobles);
            let totalReqW = neededNobles * CUSTO_NOBRE.w;
            let totalReqC = neededNobles * CUSTO_NOBRE.c;
            let totalReqI = neededNobles * CUSTO_NOBRE.i;

            let defW = Math.max(0, totalReqW - (localV.w + inc.w));
            let defC = Math.max(0, totalReqC - (localV.c + inc.c));
            let defI = Math.max(0, totalReqI - (localV.i + inc.i));

            grandTotalW += defW;
            grandTotalC += defC;
            grandTotalI += defI;

            logDebug(`--- ALVO: ${coord} ---`);
            logDebug(`  Nobres: [${totalNobles}/${targetNobles}]`);
            logDebug(`  Défice a pedir: ${defW.toLocaleString()}W | ${defC.toLocaleString()}C | ${defI.toLocaleString()}I`);

            if ((defW + defC + defI) > 0) {
                targets.push({
                    id: localV.id,
                    name: localV.name,
                    coord: coord,
                    x: x,
                    y: y,
                    req: { w: defW, c: defC, i: defI }
                });
            }
        });

        $("#statTotalWood").html(`Total wood: <span style="color:#fff;">${grandTotalW.toLocaleString()}</span>`);
        $("#statTotalClay").html(`Total clay: <span style="color:#fff;">${grandTotalC.toLocaleString()}</span>`);
        $("#statTotalIron").html(`Total iron: <span style="color:#fff;">${grandTotalI.toLocaleString()}</span>`);

        // 6. Distribuição dos Envios
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
                    srcName: src.name,
                    srcCoord: src.coord,
                    targetId: t.id,
                    targetName: t.name,
                    targetCoord: t.coord,
                    targetX: t.x,
                    targetY: t.y,
                    dist: Math.round(Math.hypot(src.x - t.x, src.y - t.y)),
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
                $("#ntSummaryText").html("<span style='color:#00ff88;'>✔️ Todas as ordens foram concluídas!</span>");
                tbody.html("<tr><td colspan='7' style='padding: 20px; font-weight: bold; color: #00ff88; text-align:center;'>Todos os transportes para nobres foram despachados.</td></tr>");
            } else {
                $("#ntSummaryText").text(`Remaining orders: ${restantes}`);
            }
        }

        const iconW = '<span class="icon header wood"> </span>';
        const iconC = '<span class="icon header stone"> </span>';
        const iconI = '<span class="icon header iron"> </span>';

        if (transfers.length === 0) {
            tbody.append(`<tr><td colspan='7' style='padding: 15px; color: #ff8888; font-weight: bold;'>Nenhum envio necessário. As aldeias já dispõem de nobres ou recursos em trânsito suficientes.</td></tr>`);
            $("#ntSummaryText").text("0 ordens pendentes.");
            $("#debugLog").show();
        } else {
            transfers.forEach((tr, index) => {
                let rowClass = index % 2 === 0 ? "rowDarkA" : "rowDarkB";
                let rowId = `task_row_${index}`;

                tbody.append(`
                    <tr id="${rowId}" class="task-row ${rowClass}">
                        <td><a href="/game.php?village=${tr.srcId}&screen=overview" target="_blank" class="coordLink">${tr.srcName}</a></td>
                        <td><a href="/game.php?village=${tr.targetId}&screen=overview" target="_blank" class="coordLink">${tr.targetName}</a></td>
                        <td><b>${tr.dist}</b></td>
                        <td><span class="resIconText">${tr.w.toLocaleString()} ${iconW}</span></td>
                        <td><span class="resIconText">${tr.c.toLocaleString()} ${iconC}</span></td>
                        <td><span class="resIconText">${tr.i.toLocaleString()} ${iconI}</span></td>
                        <td><button class="btnSophieDark send-direct-btn" data-row="${rowId}" data-src="${tr.srcId}" data-tid="${tr.targetId}" data-tx="${tr.targetX}" data-ty="${tr.targetY}" data-w="${tr.w}" data-c="${tr.c}" data-i="${tr.i}">Send resources</button></td>
                    </tr>
                `);
            });

            updateCounter();

            $(".send-direct-btn").off("click").on("click", function() {
                let btn = $(this);
                let rowId = btn.data("row");
                let rowElement = $(`#${rowId}`);

                btn.prop("disabled", true).text("Sending...");

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
                            btn.prop("disabled", false).text("Send resources");
                        } else {
                            UI.SuccessMessage("Recursos enviados com sucesso!");
                            rowElement.fadeOut(150, function() {
                                $(this).remove();
                                updateCounter();
                            });
                        }
                    },
                    error: function(xhr, status, err) {
                        logDebug(`HTTP ERROR (${xhr.status}): ${err}`);
                        UI.ErrorMessage(`Erro HTTP ${xhr.status}: Tenta novamente.`);
                        btn.prop("disabled", false).text("Send resources");
                    }
                });
            });
        }

        $("#ntLoadingStep").hide();
        $("#ntResultStep").show();
    });
})();
