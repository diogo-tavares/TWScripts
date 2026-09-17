javascript:(function() {
    const SCRIPT_VERSION = "v17.1 - Sophie Inline & +10k Buffer Margin";

    const cssSophieTheme = `
    <style id="sophieNTStyles">
        #sophieNTContainer {
            width: 100%;
            margin: 10px auto;
            background-color: #242831;
            border: 2px solid #1a1c23;
            font-family: Verdana, Arial, sans-serif;
            font-size: 11px;
            color: #e0e0e0;
            border-radius: 3px;
            box-sizing: border-box;
        }
        .sophieTopBar {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            background: #181a20;
            border-bottom: 1px solid #363c48;
            padding: 8px 12px;
            font-size: 11px;
            gap: 8px;
        }
        .sophieTopBar div {
            color: #ffffff;
            font-weight: bold;
        }
        .sophieTitleBar {
            background-color: #1a1d24;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #363c48;
        }
        .sophieTitleBar span.title {
            color: #ffffff;
            font-weight: bold;
            font-size: 12px;
        }
        .sophieTable {
            width: 100%;
            border-collapse: collapse;
        }
        .sophieTable th {
            background-color: #1c1f26;
            color: #ffffff;
            padding: 6px;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #303642;
            text-align: center;
        }
        .sophieTable td {
            padding: 4px 6px;
            border: 1px solid #292e38;
            text-align: center;
            font-size: 11px;
            color: #ffffff;
        }
        .rowDarkA { background-color: #242831; }
        .rowDarkB { background-color: #1e222a; }
        .rowDarkA:hover, .rowDarkB:hover { background-color: #2e3440; }
        .coordLink {
            color: #4da6ff !important;
            text-decoration: none;
            font-weight: bold;
        }
        .coordLink:hover { text-decoration: underline; }
        .btnSophieDark {
            background: linear-gradient(to bottom, #9b7f64 0%, #7e5c3b 25%, #6e4620 100%);
            color: #ffffff !important;
            border: 1px solid #1f140a;
            padding: 2px 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
            border-radius: 2px;
            text-shadow: 1px 1px 1px #000;
            outline: none;
        }
        .btnSophieDark:focus {
            box-shadow: 0 0 4px 2px #4da6ff;
            border-color: #4da6ff;
        }
        .btnSophieDark:hover {
            background: linear-gradient(to bottom, #ad8f72 0%, #906a44 25%, #805327 100%);
        }
        .resIconText {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            color: #ffffff;
            font-weight: bold;
        }
        .debugConsole {
            background: #0d0f12;
            color: #00ff66;
            font-family: monospace;
            font-size: 10px;
            padding: 8px;
            max-height: 180px;
            overflow-y: auto;
            text-align: left;
            border-top: 1px solid #363c48;
        }
    </style>`;

    $("#sophieNTContainer, #sophieNTStyles, #sophieNTOverlay, #sophieNTModal").remove();
    $("head").append(cssSophieTheme);

    const CUSTO_NOBRE = { w: 40000, c: 50000, i: 50000 };
    const BUFFER_EXTRA = 10000; // Margem para gestor de conta / tropas

    let frameHtml = `
    <div id="sophieNTContainer">
        <div class="sophieTitleBar">
            <span class="title">⚔️ Warehouse Balancer - Fazer NTs (${SCRIPT_VERSION})</span>
            <span onclick="$('#sophieNTContainer').remove();" style="cursor:pointer;font-size:15px;color:#fff;font-weight:bold;">✖</span>
        </div>
        
        <div id="ntBody" style="padding: 10px;">
            <div id="ntConfigStep">
                <p style="color:#ddd; margin: 4px 0 6px 0;"><b>Aldeias Alvo (onde queres fazer NT):</b></p>
                <textarea id="targetCoordsInput" rows="2" style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#181a20; color:#fff; border:1px solid #363c48;">354|615 356|615 361|623 363|623 351|619 361|622 352|631</textarea>
                
                <p style="color:#ddd; margin: 8px 0 6px 0;"><b>Aldeias Dadoras [Vazio = todas do grupo atual]:</b></p>
                <textarea id="donorCoordsInput" rows="2" placeholder="Ex: 340|600 341|600..." style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#181a20; color:#fff; border:1px solid #363c48;"></textarea>

                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <label style="color:#ddd;"><b>Nobres pretendidos: </b></label>
                        <input type="number" id="noblesCountInput" value="4" min="1" max="10" style="width: 45px; text-align: center; background:#181a20; color:#fff; border:1px solid #363c48;">
                    </div>
                    <button class="btnSophieDark" id="btnRunOptimizer">Carregar e Calcular Envios</button>
                </div>
            </div>

            <div id="ntLoadingStep" style="display:none; text-align:center; padding: 20px;">
                <p style="font-size:12px; color:#fff;"><b>A contactar os mercados e a auditar transportes a chegar...</b></p>
                <div id="ntLoadingStatus" style="font-size:11px; color:#4da6ff; margin-top:5px;"></div>
            </div>

            <div id="ntResultStep" style="display:none;">
                <div class="sophieTopBar" id="ntStatsBar">
                    <div id="statTotalWood">Total wood: 0</div>
                    <div id="statTotalClay">Total clay: 0</div>
                    <div id="statTotalIron">Total iron: 0</div>
                </div>

                <div style="display:flex; justify-content: space-between; align-items:center; padding: 6px 0;">
                    <span id="ntSummaryText" style="font-weight:bold; font-size:11px; color:#fff;"></span>
                    <div>
                        <button class="btnSophieDark" id="btnToggleDebug" style="background:#363c48;margin-right:5px;">Debug</button>
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
                            <th style="width: 120px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="ntTableBody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    if ($("#content_value").length) {
        $("#content_value").prepend(frameHtml);
    } else {
        $("#main_layout").prepend(frameHtml);
    }

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
        logDebug(`>>> SCRIPT INICIADO: ${SCRIPT_VERSION} <<<`);

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
                }
            });
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

        // 3. CONSULTA DIRETA AO MERCADO - ISOLAMENTO DE "A CHEGAR"
        $("#ntLoadingStatus").text("A recolher recursos a chegar...");
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

        // 5. Cálculo dos Défices com Buffer de Segurança (+10k por recurso se faltar >= 1 nobre)
        let targets = [];
        let grandTotalW = 0, grandTotalC = 0, grandTotalI = 0;

        uniqueTargets.forEach(coord => {
            let [x, y] = coord.split("|").map(Number);
            let localV = accountVillages[coord] || { id: null, name: coord, w: 0, c: 0, i: 0, snobs: 0 };
            let inc = incomingRes[coord] || { w: 0, c: 0, i: 0 };
            let totalNobles = localV.snobs;

            let neededNobles = Math.max(0, targetNobles - totalNobles);

            let defW = 0, defC = 0, defI = 0;

            if (neededNobles > 0) {
                let totalReqW = neededNobles * CUSTO_NOBRE.w;
                let totalReqC = neededNobles * CUSTO_NOBRE.c;
                let totalReqI = neededNobles * CUSTO_NOBRE.i;

                let rawDefW = Math.max(0, totalReqW - (localV.w + inc.w));
                let rawDefC = Math.max(0, totalReqC - (localV.c + inc.c));
                let rawDefI = Math.max(0, totalReqI - (localV.i + inc.i));

                // Se houver qualquer défice, soma a margem de segurança de +10k
                defW = rawDefW > 0 ? (rawDefW + BUFFER_EXTRA) : 0;
                defC = rawDefC > 0 ? (rawDefC + BUFFER_EXTRA) : 0;
                defI = rawDefI > 0 ? (rawDefI + BUFFER_EXTRA) : 0;

                logDebug(`Alvo ${coord} (Faltam ${neededNobles} nobres): Défice c/ Buffer -> +${defW.toLocaleString()}W | +${defC.toLocaleString()}C | +${defI.toLocaleString()}I`);
            } else {
                logDebug(`Alvo ${coord} já tem ${totalNobles}/${targetNobles} nobres. Sem envios.`);
            }

            grandTotalW += defW;
            grandTotalC += defC;
            grandTotalI += defI;

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

        $("#statTotalWood").text(`Total wood: ${grandTotalW.toLocaleString()}`);
        $("#statTotalClay").text(`Total clay: ${grandTotalC.toLocaleString()}`);
        $("#statTotalIron").text(`Total iron: ${grandTotalI.toLocaleString()}`);

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

        function focusNextButton() {
            let firstBtn = $("#ntTableBody tr.task-row:first .send-direct-btn");
            if (firstBtn.length) {
                firstBtn.focus();
            }
        }

        function updateCounter() {
            let restantes = $("#ntTableBody tr.task-row").length;
            if (restantes === 0) {
                $("#ntSummaryText").html("<span style='color:#00ff88;'>✔️ Todos os recursos foram enviados!</span>");
                tbody.html("<tr><td colspan='7' style='padding: 15px; font-weight: bold; color: #00ff88; text-align:center;'>Ordens concluídas.</td></tr>");
            } else {
                $("#ntSummaryText").text(`Remaining orders: ${restantes}`);
                focusNextButton();
            }
        }

        const iconW = '<span class="icon header wood"> </span>';
        const iconC = '<span class="icon header stone"> </span>';
        const iconI = '<span class="icon header iron"> </span>';

        if (transfers.length === 0) {
            tbody.append(`<tr><td colspan='7' style='padding: 15px; color: #ff8888; font-weight: bold;'>Nenhum envio necessário.</td></tr>`);
            $("#ntSummaryText").text("0 ordens pendentes.");
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

            $(document).off("click keydown", ".send-direct-btn").on("click", ".send-direct-btn", function(e) {
                e.preventDefault();
                let btn = $(this);
                let rowId = btn.data("row");
                let rowElement = $(`#${rowId}`);

                let postData = {
                    target_id: btn.data("tid"),
                    x: btn.data("tx"),
                    y: btn.data("ty"),
                    wood: btn.data("w"),
                    stone: btn.data("c"),
                    iron: btn.data("i"),
                    h: game_data.csrf
                };

                let srcId = btn.data("src");

                rowElement.remove();
                updateCounter();

                $.post(`/game.php?village=${srcId}&screen=market&mode=send&action=send`, postData);
            });
        }

        $("#ntLoadingStep").hide();
        $("#ntResultStep").show();
        focusNextButton();
    });
})();
