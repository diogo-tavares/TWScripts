javascript:(function() {
    const cssSophie = `
    <style>
        #sophieNTModal {
            position: fixed;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            width: 860px;
            max-height: 85vh;
            background-color: #F4E4BC;
            border: 3px solid #803000;
            z-index: 999999;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
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
        }
        .sophRowA { background-color: #F4E4BC; }
        .sophRowB { background-color: #fff5da; }
        .sophTable { width: 100%; border-collapse: collapse; }
        .sophTable th { background-color: #c6a768; color: #803000; padding: 6px; border: 1px solid #803000; }
        .sophTable td { padding: 5px; text-align: center; border: 1px solid #d2b48c; }
        .btnSophie {
            background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%);
            color: white !important;
            border: 1px solid #3b240f;
            padding: 4px 10px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 2px;
        }
        .btnSophie:hover { background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%); }
        .btnSophie:disabled { background: #888; cursor: not-allowed; }
        .resWood { color: #804000; font-weight: bold; }
        .resStone { color: #a84000; font-weight: bold; }
        .resIron { color: #505050; font-weight: bold; }
    </style>`;

    $("#sophieNTModal").remove();

    const CUSTO_NOBRE = { w: 40000, c: 50000, i: 50000 };

    let modalHtml = `
    ${cssSophie}
    <div id="sophieNTModal">
        <div class="sophHeader">
            <span>⚔️ NT Resource Balancer (v3 - Robust Fix)</span>
            <span onclick="$('#sophieNTModal').remove();" style="cursor:pointer;font-size:16px;">✖</span>
        </div>
        <div id="ntBody" style="padding: 12px;">
            <div id="ntConfigStep">
                <p><b>1. Introduz as coordenadas alvo</b> (formato: <code>xxx|yyy</code>):</p>
                <textarea id="targetCoordsInput" rows="3" style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px;">354|615 356|615 361|623 363|623 351|619 361|622 352|631</textarea>
                
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <label><b>Nobres por aldeia: </b></label>
                        <input type="number" id="noblesCountInput" value="4" min="1" max="10" style="width: 45px; text-align: center;">
                    </div>
                    <button class="btnSophie" id="btnRunOptimizer">Calcular Envios</button>
                </div>
            </div>

            <div id="ntLoadingStep" style="display:none; text-align:center; padding: 20px;">
                <p><b>A processar transportes e aldeias disponíveis...</b></p>
                <div id="ntLoadingStatus" style="font-size:12px; color:#803000;"></div>
            </div>

            <div id="ntResultStep" style="display:none;">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span id="ntSummaryText" style="font-weight:bold;"></span>
                    <button class="btnSophie" id="btnBackConfig">Voltar</button>
                </div>
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

    $("#btnBackConfig").click(() => {
        $("#ntResultStep").hide();
        $("#ntLoadingStep").hide();
        $("#ntConfigStep").show();
    });

    $("#btnRunOptimizer").click(async function() {
        let rawInput = $("#targetCoordsInput").val();
        let targetMatches = rawInput.match(/\d{3}\|\d{3}/g);

        if (!targetMatches || targetMatches.length === 0) {
            UI.ErrorMessage("Nenhuma coordenada válida encontrada!");
            return;
        }

        let uniqueTargets = [...new Set(targetMatches)];
        let targetNobles = parseInt($("#noblesCountInput").val()) || 4;

        $("#ntConfigStep").hide();
        $("#ntLoadingStep").show();
        $("#ntLoadingStatus").text("A ler tabela de aldeias...");

        // 1. Extração robusta das aldeias na vista de Produção
        let groupVillages = [];
        let allVillagesMap = {};

        let table = $("#production_table").length ? $("#production_table") : $("#combined_table");

        table.find("tbody tr, tr").each(function() {
            let row = $(this);
            let text = row.text();
            let coordMatch = text.match(/(\d{3}\|\d{3})/);
            let link = row.find("a[href*='village=']").first();

            if (coordMatch && link.length) {
                let coord = coordMatch[1];
                let [x, y] = coord.split("|").map(Number);
                let idMatch = (link.attr("href") || "").match(/village=(\d+)/);

                let w = parseInt(row.find(".wood").text().replace(/\./g, '')) || 0;
                let c = parseInt(row.find(".stone").text().replace(/\./g, '')) || 0;
                let i = parseInt(row.find(".iron").text().replace(/\./g, '')) || 0;

                // Mercadores livres (procura padrão n/total)
                let merc = 0;
                let mercMatch = text.match(/(\d+)\/(\d+)/);
                if (mercMatch) {
                    merc = parseInt(mercMatch[1]) || 0;
                }

                if (idMatch) {
                    let vData = {
                        id: idMatch[1],
                        coord: coord,
                        x: x,
                        y: y,
                        w: w,
                        c: c,
                        i: i,
                        merc: merc
                    };
                    groupVillages.push(vData);
                    allVillagesMap[coord] = vData;
                }
            }
        });

        // 2. Fetch dos Transportes em trânsito (não-bloqueante)
        $("#ntLoadingStatus").text("A verificar recursos a caminho...");
        let incomingRes = {};
        try {
            let traderUrl = `/game.php?village=${game_data.village.id}&screen=overview_villages&mode=trader`;
            let traderHtml = await $.get(traderUrl);
            let docTrader = $(traderHtml);
            
            docTrader.find("#trades_table tr").each(function() {
                let r = $(this);
                let destMatch = r.text().match(/(\d{3}\|\d{3})/);
                if (destMatch) {
                    let coord = destMatch[1];
                    if (!incomingRes[coord]) incomingRes[coord] = { w: 0, c: 0, i: 0 };
                    incomingRes[coord].w += parseInt(r.find(".wood").text().replace(/\./g, '')) || 0;
                    incomingRes[coord].c += parseInt(r.find(".stone").text().replace(/\./g, '')) || 0;
                    incomingRes[coord].i += parseInt(r.find(".iron").text().replace(/\./g, '')) || 0;
                }
            });
        } catch(e) {
            console.log("Aviso: Falha ao ler transportes em curso", e);
        }

        // 3. Determinação dos défices por aldeia alvo
        let targets = [];
        uniqueTargets.forEach(coord => {
            let [x, y] = coord.split("|").map(Number);
            let localV = allVillagesMap[coord] || { w: 0, c: 0, i: 0 };
            let inc = incomingRes[coord] || { w: 0, c: 0, i: 0 };

            let totalReqW = targetNobles * CUSTO_NOBRE.w;
            let totalReqC = targetNobles * CUSTO_NOBRE.c;
            let totalReqI = targetNobles * CUSTO_NOBRE.i;

            let defW = Math.max(0, totalReqW - ((localV.w || 0) + (inc.w || 0)));
            let defC = Math.max(0, totalReqC - ((localV.c || 0) + (inc.c || 0)));
            let defI = Math.max(0, totalReqI - ((localV.i || 0) + (inc.i || 0)));

            if ((defW + defC + defI) > 0) {
                targets.push({
                    coord: coord,
                    x: x,
                    y: y,
                    req: { w: defW, c: defC, i: defI }
                });
            }
        });

        // 4. Algoritmo Guloso por menor distância
        let transfers = [];
        targets.forEach(t => {
            // Ordena as dadoras por proximidade
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
                $("#ntSummaryText").html("<span style='color:green;'>✔️ Todas as tarefas foram concluídas!</span>");
                tbody.html("<tr><td colspan='8' style='padding: 15px; font-weight: bold; color: green;'>Plano de envios concluído com sucesso.</td></tr>");
            } else {
                $("#ntSummaryText").text(`Tarefas pendentes: ${restantes}`);
            }
        }

        if (transfers.length === 0) {
            tbody.append(`<tr><td colspan='8' style='padding: 12px; color: #a00; font-weight: bold;'>Não foram encontrados excedentes ou mercadores livres nas aldeias carregadas para abastecer estas coordenadas.</td></tr>`);
            $("#ntSummaryText").text("Nenhum envio gerado.");
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
                        <td><button class="btnSophie send-direct-btn" data-row="${rowId}" data-src="${tr.srcId}" data-tx="${tr.targetX}" data-ty="${tr.targetY}" data-w="${tr.w}" data-c="${tr.c}" data-i="${tr.i}">Enviar</button></td>
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
                    target_x: btn.data("tx"),
                    target_y: btn.data("ty"),
                    wood: btn.data("w"),
                    stone: btn.data("c"),
                    iron: btn.data("i"),
                    h: game_data.csrf
                };

                TribalWars.post(
                    'market',
                    { ajaxaction: 'map_send', village: btn.data("src") },
                    postData,
                    function() {
                        UI.SuccessMessage("Recursos enviados com sucesso!");
                        rowElement.remove();
                        updateCounter();
                    },
                    function(error) {
                        UI.ErrorMessage("Erro ao enviar: " + (error || "Tenta novamente"));
                        btn.prop("disabled", false).text("Enviar");
                    }
                );
            });
        }

        $("#ntLoadingStep").hide();
        $("#ntResultStep").show();
    });
})();
