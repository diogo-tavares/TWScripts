javascript:(function() {
    const SCRIPT_TITLE = "Warehouse Filler - Encher Armazéns (v2.0 Native & Fast Enter)";

    const cssSophieTheme = `
    <style id="sophieFillStyles">
        #sophieFillContainer {
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
        .settingsBox {
            background: #181a20;
            border: 1px solid #363c48;
            padding: 6px 10px;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-radius: 2px;
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

    $("#sophieFillContainer, #sophieFillStyles, #sophieFillOverlay, #sophieFillModal").remove();
    $("head").append(cssSophieTheme);

    let frameHtml = `
    <div id="sophieFillContainer">
        <div class="sophieTitleBar">
            <span class="title">📦 ${SCRIPT_TITLE}</span>
            <span onclick="$('#sophieFillContainer').remove();" style="cursor:pointer;font-size:15px;color:#fff;font-weight:bold;">✖</span>
        </div>
        
        <div id="fillBody" style="padding: 10px;">
            <div id="fillConfigStep">
                <p style="color:#ddd; margin: 4px 0 6px 0;"><b>Aldeias Alvo (Aldeias cujo armazém pretendes encher a 100%):</b></p>
                <textarea id="fillTargetInput" rows="2" placeholder="Ex: 361|623 354|615 356|615..." style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#181a20; color:#fff; border:1px solid #363c48;"></textarea>
                
                <p style="color:#ddd; margin: 8px 0 6px 0;"><b>Aldeias Dadoras (De onde retirar excedentes) [Vazio = todas do grupo atual exceto alvos]:</b></p>
                <textarea id="fillDonorInput" rows="2" placeholder="Ex: 350|612 346|615..." style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px; background:#181a20; color:#fff; border:1px solid #363c48;"></textarea>

                <div class="settingsBox">
                    <span style="font-weight:bold; color:#e0c184;">⚙️ Definições de Reserva:</span>
                    <label style="color:#ddd;">Deixar pelo menos: 
                        <input type="number" id="reservePercInput" value="20" min="0" max="95" style="width: 45px; text-align: center; background:#242831; color:#fff; border:1px solid #363c48; padding:2px;"> 
                        <b>%</b> do armazém em cada dadora
                    </label>
                    <button class="btnSophieDark" id="btnRunFiller" style="margin-left:auto;">Calcular Envios</button>
                </div>
            </div>

            <div id="fillLoadingStep" style="display:none; text-align:center; padding: 20px;">
                <p style="font-size:12px; color:#fff;"><b>A analisar armazéns e transportes de mercado a caminho...</b></p>
                <div id="fillLoadingStatus" style="font-size:11px; color:#4da6ff; margin-top:5px;"></div>
            </div>

            <div id="fillResultStep" style="display:none;">
                <div class="sophieTopBar">
                    <div id="statTotalWood">Total wood: 0</div>
                    <div id="statTotalClay">Total clay: 0</div>
                    <div id="statTotalIron">Total iron: 0</div>
                </div>

                <div style="display:flex; justify-content: space-between; align-items:center; padding: 6px 0;">
                    <span id="fillSummaryText" style="font-weight:bold; font-size:11px; color:#fff;"></span>
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
                    <tbody id="fillTableBody"></tbody>
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
        $("#fillResultStep").hide();
        $("#fillLoadingStep").hide();
        $("#fillConfigStep").show();
    });

    $("#btnRunFiller").click(async function() {
        debugLines = [];
        logDebug(`>>> INICIANDO: ${SCRIPT_TITLE} <<<`);

        let rawTargets = ($("#fillTargetInput").val() || "").match(/\d{3}\|\d{3}/g);
        if (!rawTargets || rawTargets.length === 0) {
            UI.ErrorMessage("Insere pelo menos uma coordenada de alvo!");
            return;
        }

        let orderedTargets = [];
        rawTargets.forEach(c => { if (!orderedTargets.includes(c)) orderedTargets.push(c); });

        let rawDonors = ($("#fillDonorInput").val() || "").match(/\d{3}\|\d{3}/g);
        let explicitDonors = rawDonors ? [...new Set(rawDonors)] : [];
        let reserveRatio = (parseFloat($("#reservePercInput").val()) || 20) / 100.0;

        $("#fillConfigStep").hide();
        $("#fillLoadingStep").show();

        let accountVillages = {};

        // 1. Ler Produção
        $("#fillLoadingStatus").text("A recolher recursos e capacidades de armazém...");
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

                    let storage = 400000;
                    r.find("td").each(function() {
                        let val = parseInt($(this).text().replace(/\D/g, '')) || 0;
                        if ([400000, 342261, 292868, 250599, 214433, 183478, 156994, 134333, 114942, 98351, 84155, 72008].includes(val)) {
                            storage = val;
                            return false;
                        }
                    });

                    let merc = 0;
                    r.find("td").each(function() {
                        let m = $(this).text().trim().match(/^(\d+)\/(\d+)$/);
                        if (m) { merc = parseInt(m[1]) || 0; return false; }
                    });

                    accountVillages[coord] = {
                        id: vid,
                        name: villageName,
                        coord: coord,
                        x: x,
                        y: y,
                        w: w,
                        c: c,
                        i: i,
                        storage: storage,
                        merc: merc
                    };
                }
            });
        } catch(e) {
            logDebug(`Erro ao ler produção: ${e}`);
        }

        // 2. Mapear Transportes a Chegar aos Alvos
        $("#fillLoadingStatus").text("A auditar recursos a chegar aos alvos...");
        let incomingRes = {};

        for (let coord of orderedTargets) {
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
                            if (val < 2000000) incomingRes[coord].w += val;
                        });
                        incomingBlock.find("span.icon.header.stone, img[src*='stone'], .stone").each(function() {
                            let val = parseInt($(this).parent().text().replace(/\D/g, '')) || 0;
                            if (val < 2000000) incomingRes[coord].c += val;
                        });
                        incomingBlock.find("span.icon.header.iron, img[src*='iron'], .iron").each(function() {
                            let val = parseInt($(this).parent().text().replace(/\D/g, '')) || 0;
                            if (val < 2000000) incomingRes[coord].i += val;
                        });
                    }
                });
            } catch(err) {
                logDebug(`Erro no mercado de ${coord}: ${err}`);
            }
        }

        // 3. Pool de Dadoras com Filtro de Reserva
        let donorsPool = [];
        let candidateCoords = explicitDonors.length > 0 ? explicitDonors : Object.keys(accountVillages);

        candidateCoords.forEach(coord => {
            if (orderedTargets.includes(coord)) return;
            let v = accountVillages[coord];
            if (!v || v.merc <= 0) return;

            let safeFloor = Math.floor(v.storage * reserveRatio);
            let availW = Math.max(0, v.w - safeFloor);
            let availC = Math.max(0, v.c - safeFloor);
            let availI = Math.max(0, v.i - safeFloor);

            if ((availW + availC + availI) > 0) {
                donorsPool.push({
                    id: v.id,
                    name: v.name,
                    coord: v.coord,
                    x: v.x,
                    y: v.y,
                    w: availW,
                    c: availC,
                    i: availI,
                    merc: v.merc
                });
            }
        });

        // 4. Cálculo Sequencial Alvo a Alvo por Distância
        let transfers = [];
        let grandTotalW = 0, grandTotalC = 0, grandTotalI = 0;

        for (let coord of orderedTargets) {
            let targetV = accountVillages[coord];
            if (!targetV) continue;

            let inc = incomingRes[coord] || { w: 0, c: 0, i: 0 };
            let maxCapacity = targetV.storage;

            let defW = Math.max(0, maxCapacity - (targetV.w + inc.w));
            let defC = Math.max(0, maxCapacity - (targetV.c + inc.c));
            let defI = Math.max(0, maxCapacity - (targetV.i + inc.i));

            if ((defW + defC + defI) <= 0) continue;

            donorsPool.sort((a, b) => Math.hypot(a.x - targetV.x, a.y - targetV.y) - Math.hypot(b.x - targetV.x, b.y - targetV.y));

            for (let src of donorsPool) {
                if (defW === 0 && defC === 0 && defI === 0) break;
                if (src.coord === targetV.coord || src.merc <= 0) continue;

                let cap = src.merc * 1000;
                let sendW = Math.min(src.w, defW, cap);
                cap -= sendW;
                let sendC = Math.min(src.c, defC, cap);
                cap -= sendC;
                let sendI = Math.min(src.i, defI, cap);

                let totalSend = sendW + sendC + sendI;
                if (totalSend === 0) continue;

                let mercUsed = Math.ceil(totalSend / 1000);

                transfers.push({
                    srcId: src.id,
                    srcName: src.name,
                    srcCoord: src.coord,
                    targetId: targetV.id,
                    targetName: targetV.name,
                    targetCoord: targetV.coord,
                    targetX: targetV.x,
                    targetY: targetV.y,
                    dist: Math.round(Math.hypot(src.x - targetV.x, src.y - targetV.y)),
                    w: sendW,
                    c: sendC,
                    i: sendI,
                    merc: mercUsed
                });

                grandTotalW += sendW;
                grandTotalC += sendC;
                grandTotalI += sendI;

                src.w -= sendW;
                src.c -= sendC;
                src.i -= sendI;
                src.merc -= mercUsed;

                defW -= sendW;
                defC -= sendC;
                defI -= sendI;
            }
        }

        $("#statTotalWood").text(`Total wood: ${grandTotalW.toLocaleString()}`);
        $("#statTotalClay").text(`Total clay: ${grandTotalC.toLocaleString()}`);
        $("#statTotalIron").text(`Total iron: ${grandTotalI.toLocaleString()}`);

        // 5. Renderização e Envio Otimista
        let tbody = $("#fillTableBody");
        tbody.empty();

        function focusNextButton() {
            let firstBtn = $("#fillTableBody tr.task-row:first .send-direct-btn");
            if (firstBtn.length) {
                firstBtn.focus();
            }
        }

        function updateCounter() {
            let restantes = $("#fillTableBody tr.task-row").length;
            if (restantes === 0) {
                $("#fillSummaryText").html("<span style='color:#00ff88;'>✔️ Todos os armazéns foram completados!</span>");
                tbody.html("<tr><td colspan='7' style='padding: 15px; font-weight: bold; color: #00ff88; text-align:center;'>Todos os envios foram efetuados.</td></tr>");
            } else {
                $("#fillSummaryText").text(`Remaining orders: ${restantes}`);
                focusNextButton();
            }
        }

        const iconW = '<span class="icon header wood"> </span>';
        const iconC = '<span class="icon header stone"> </span>';
        const iconI = '<span class="icon header iron"> </span>';

        if (transfers.length === 0) {
            tbody.append(`<tr><td colspan='7' style='padding: 15px; color: #ff8888; font-weight: bold;'>Nenhum envio necessário. Armazéns já abastecidos ou limite de reserva atingido.</td></tr>`);
            $("#fillSummaryText").text("0 ordens pendentes.");
        } else {
            transfers.forEach((tr, index) => {
                let rowClass = index % 2 === 0 ? "rowDarkA" : "rowDarkB";
                let rowId = `fill_row_${index}`;

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

            // Disparo instantâneo: limpa a linha e muda o foco no mesmo milissegundo
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

        $("#fillLoadingStep").hide();
        $("#fillResultStep").show();
        focusNextButton();
    });
})();
