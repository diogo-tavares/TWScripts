javascript:(function() {
    if (!window.location.href.includes("mode=prod")) {
        UI.ErrorMessage("Executa o script em: Visualizações -> Produção (com o grupo de envio selecionado)!");
        return;
    }

    const cssSophie = `
    <style>
        #sophieNTModal {
            position: fixed;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            width: 820px;
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
            <span>⚔️ NT Resource Balancer (Lista de Tarefas)</span>
            <span onclick="$('#sophieNTModal').remove();" style="cursor:pointer;font-size:16px;">✖</span>
        </div>
        <div id="ntBody" style="padding: 12px;">
            <div id="ntConfigStep">
                <p><b>1. Introduz as coordenadas das aldeias alvo</b> (Formato: <code>xxx|yyy</code>):</p>
                <textarea id="targetCoordsInput" rows="4" style="width: 100%; box-sizing: border-box; font-family: monospace; padding: 6px;"></textarea>
                
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <label><b>Nobres por aldeia: </b></label>
                        <input type="number" id="noblesCountInput" value="4" min="1" max="10" style="width: 45px; text-align: center;">
                    </div>
                    <button class="btnSophie" id="btnRunOptimizer">Calcular Envios por Menor Distância</button>
                </div>
            </div>

            <div id="ntResultStep" style="display:none;">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span id="ntSummaryText" style="font-weight:bold;"></span>
                    <button class="btnSophie" id="btnBackConfig">Voltar / Reconfigurar</button>
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
        $("#ntConfigStep").show();
    });

    $("#btnRunOptimizer").click(() => {
        let rawInput = $("#targetCoordsInput").val();
        let targetMatches = rawInput.match(/\d{3}\|\d{3}/g);

        if (!targetMatches || targetMatches.length === 0) {
            UI.ErrorMessage("Nenhuma coordenada válida encontrada!");
            return;
        }

        let uniqueTargets = [...new Set(targetMatches)];
        let noblesPerVillage = parseInt($("#noblesCountInput").val()) || 4;

        let targets = uniqueTargets.map(coord => {
            let [x, y] = coord.split("|").map(Number);
            return {
                coord: coord,
                x: x,
                y: y,
                req: {
                    w: noblesPerVillage * CUSTO_NOBRE.w,
                    c: noblesPerVillage * CUSTO_NOBRE.c,
                    i: noblesPerVillage * CUSTO_NOBRE.i
                }
            };
        });

        // Extrai dados da tabela de Produção
        let groupVillages = [];
        $("#production_table tbody tr").each(function() {
            let row = $(this);
            let link = row.find(".quickedit-vn");
            if (!link.length) return;

            let mCoord = link.text().match(/\((\d{3}\|\d{3})\)/);
            let idMatch = link.attr("data-id") || (row.find("a[href*='village=']").attr("href") || "").match(/village=(\d+)/);

            if (mCoord && idMatch) {
                let [x, y] = mCoord[1].split("|").map(Number);
                let w = parseInt(row.find(".wood").text().replace(/\./g, '')) || 0;
                let c = parseInt(row.find(".stone").text().replace(/\./g, '')) || 0;
                let i = parseInt(row.find(".iron").text().replace(/\./g, '')) || 0;

                let mercText = row.find("td:nth-last-child(2) a").text() || row.find("a[href*='mode=call']").text();
                let mercMatch = mercText.match(/(\d+)\/\d+/) || [0, 0];
                let merc = parseInt(mercMatch[1]) || 0;

                groupVillages.push({
                    id: idMatch[1],
                    coord: mCoord[1],
                    x: x,
                    y: y,
                    w: w,
                    c: c,
                    i: i,
                    merc: merc
                });
            }
        });

        if (groupVillages.length === 0) {
            UI.ErrorMessage("Erro: não foram detetadas aldeias na tabela de produção.");
            return;
        }

        // Algoritmo Guloso por menor distância
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
                $("#ntSummaryText").html("<span style='color:green;'>✔️ Todas as tarefas de envio foram concluídas!</span>");
                tbody.html("<tr><td colspan='8' style='padding: 15px; font-weight: bold; color: green;'>Plano de envios 100% finalizado com sucesso.</td></tr>");
            } else {
                $("#ntSummaryText").text(`Tarefas pendentes: ${restantes}`);
            }
        }

        if (transfers.length === 0) {
            tbody.append("<tr><td colspan='8' style='padding: 10px;'>Sem recursos ou mercadores suficientes disponíveis no grupo.</td></tr>");
            $("#ntSummaryText").text("Nenhum envio necessário ou possível.");
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

            // Ao clicar, envia via AJAX e elimina logo a linha da vista
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
                    function(response) {
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

        $("#ntConfigStep").hide();
        $("#ntResultStep").show();
    });
})();
