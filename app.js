// ==========================================
// CONTROL DE GASTOS QUINCENALES
// ==========================================
let gastos = JSON.parse(
    localStorage.getItem("gastos_quincenales")
) || [];
let chartInstance = null;
// ==========================================
// INICIO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    inicializarPresupuesto();
    inicializarGrafica();
    configurarEventos();
    actualizarInterfaz();
});
// ==========================================
// PRESUPUESTO
// ==========================================
function inicializarPresupuesto() {
    const presupuestoGuardado =
        localStorage.getItem("presupuesto_quincenal");
    if (presupuestoGuardado !== null) {
        document.getElementById("presupuestoInput").value =
            presupuestoGuardado;
    }
}
// ==========================================
// EVENTOS
// ==========================================
function configurarEventos() {
    document
        .getElementById("gastoForm")
        .addEventListener("submit", agregarGasto);
    document
        .getElementById("presupuestoInput")
        .addEventListener("input", actualizarInterfaz);
    document
        .getElementById("btnExcel")
        .addEventListener("click", exportarExcel);
    document
        .getElementById("btnLimpiar")
        .addEventListener("click", limpiarTodo);
}
// ==========================================
// AGREGAR GASTO
// ==========================================
function agregarGasto(e) {
    e.preventDefault();
    const desc =
        document.getElementById("descGasto").value.trim();
    const monto =
        parseFloat(document.getElementById("montoGasto").value);
    const categoria =
        document.getElementById("catGasto").value;
    if (!desc) {
        alert("Escribe una descripción para el gasto.");
        return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
        alert("Ingresa un monto válido mayor a $0.");
        return;
    }
    const fecha = new Date().toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
    gastos.push({
        id: Date.now(),
        fecha: fecha,
        desc: desc,
        categoria: categoria,
        monto: Math.round(monto * 100) / 100
    });
    guardarEnAlmacenamiento();
    document.getElementById("gastoForm").reset();
    actualizarInterfaz();
}
// ==========================================
// ELIMINAR GASTO
// ==========================================
function eliminarGasto(id) {
    gastos = gastos.filter(
        g => g.id !== id
    );
    guardarEnAlmacenamiento();
    actualizarInterfaz();
}
// ==========================================
// LIMPIAR TODO
// ==========================================
function limpiarTodo() {
    if (
        !confirm(
            "¿Estás seguro de que quieres borrar todos los gastos de esta quincena?"
        )
    ) {
        return;
    }
    gastos = [];
    localStorage.removeItem(
        "gastos_quincenales"
    );
    actualizarInterfaz();
}
// ==========================================
// LOCAL STORAGE
// ==========================================
function guardarEnAlmacenamiento() {
    localStorage.setItem(
        "gastos_quincenales",
        JSON.stringify(gastos)
    );
}
// ==========================================
// ACTUALIZAR INTERFAZ
// ==========================================
function actualizarInterfaz() {
    const presupuesto =
        parseFloat(
            document.getElementById("presupuestoInput").value
        ) || 0;
    localStorage.setItem(
        "presupuesto_quincenal",
        presupuesto
    );
    let totalGastado = 0;
    const totalesPorCategoria = {
        Vivienda: 0,
        Alimentos: 0,
        Transporte: 0,
        Servicios: 0,
        Entretenimiento: 0,
        Otros: 0
    };
    const tablaCuerpo =
        document.getElementById("tablaCuerpo");
    tablaCuerpo.innerHTML = "";
    if (gastos.length === 0) {
        tablaCuerpo.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center p-8 text-gray-400">
                    No hay gastos registrados en esta quincena.
                </td>
            </tr>
        `;
    } else {
        gastos.forEach(g => {
            totalGastado += Number(g.monto) || 0;
            if (
                Object.prototype.hasOwnProperty.call(
                    totalesPorCategoria,
                    g.categoria
                )
            ) {
                totalesPorCategoria[g.categoria] +=
                    Number(g.monto) || 0;
            }
            const fila =
                document.createElement("tr");
            fila.className =
                "hover:bg-gray-50 transition";
            fila.innerHTML = `
                <td class="p-3 text-gray-500">
                    ${g.fecha}
                </td>
                <td class="p-3 font-medium">
                    ${escapeHTML(g.desc)}
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-600 font-medium">
                        ${escapeHTML(g.categoria)}
                    </span>
                </td>
                <td class="p-3 text-right font-semibold">
                    $${Number(g.monto).toLocaleString(
                        "es-MX",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}
                </td>
                <td class="p-3 text-center">
                    <button
                        type="button"
                        class="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer"
                        data-id="${g.id}"
                        title="Eliminar gasto">
                        ❌
                    </button>
                </td>
            `;
            fila
                .querySelector("button")
                .addEventListener(
                    "click",
                    () => eliminarGasto(g.id)
                );
            tablaCuerpo.appendChild(fila);
        });
    }
    const saldo =
        presupuesto - totalGastado;
    const porcentajeGastado =
        presupuesto > 0
            ? (totalGastado / presupuesto) * 100
            : 0;
    // ------------------------------------------
    // TARJETA GASTADO
    // ------------------------------------------
    document.getElementById(
        "cardGastado"
    ).innerText =
        formatoMoneda(totalGastado);
    // ------------------------------------------
    // SALDO
    // ------------------------------------------
    const cardSaldo =
        document.getElementById("cardSaldo");
    cardSaldo.innerText =
        formatoMoneda(saldo);
    // ------------------------------------------
    // PROGRESO
    // ------------------------------------------
    const barraProgreso =
        document.getElementById("barraProgreso");
    barraProgreso.style.width =
        `${Math.min(Math.max(porcentajeGastado, 0), 100)}%`;
    const badgeEstado =
        document.getElementById("badgeEstado");
    // ------------------------------------------
    // ESTADO
    // ------------------------------------------
    if (saldo < 0) {
        cardSaldo.className =
            "text-3xl font-bold text-red-600 mt-2";
        badgeEstado.className =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-3";
        badgeEstado.innerText =
            "Déficit / Deuda";
        barraProgreso.className =
            "bg-red-600 h-2 rounded-full transition-all duration-500";
    }
    else if (porcentajeGastado >= 85) {
        cardSaldo.className =
            "text-3xl font-bold text-amber-600 mt-2";
        badgeEstado.className =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-3";
        badgeEstado.innerText =
            "Límite Crítico";
        barraProgreso.className =
            "bg-amber-500 h-2 rounded-full transition-all duration-500";
    }
    else {
        cardSaldo.className =
            "text-3xl font-bold text-emerald-600 mt-2";
        badgeEstado.className =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-3";
        badgeEstado.innerText =
            "Presupuesto Saludable";
        barraProgreso.className =
            "bg-indigo-600 h-2 rounded-full transition-all duration-500";
    }
    // ------------------------------------------
    // MAYOR CATEGORÍA
    // ------------------------------------------
    let mayorCategoria = "Ninguna";
    let mayorMonto = 0;
    for (
        const [cat, monto]
        of Object.entries(totalesPorCategoria)
    ) {
        if (monto > mayorMonto) {
            mayorMonto = monto;
            mayorCategoria = cat;
        }
    }
    document.getElementById(
        "cardMayorGasto"
    ).innerText =
        mayorMonto > 0
            ? mayorCategoria
            : "Ninguno";
    document.getElementById(
        "cardMayorGastoMonto"
    ).innerText =
        mayorMonto > 0
            ? `Total: ${formatoMoneda(mayorMonto)}`
            : "Registra un gasto para analizar";
    // ------------------------------------------
    // GRÁFICA
    // ------------------------------------------
    if (chartInstance) {
        chartInstance.data.datasets[0].data =
            Object.values(totalesPorCategoria);
        chartInstance.update();
    }
    // ------------------------------------------
    // DIAGNÓSTICO
    // ------------------------------------------
    generarDiagnostico(
        presupuesto,
        totalGastado,
        saldo,
        porcentajeGastado,
        mayorCategoria,
        mayorMonto
    );
}
// ==========================================
// DIAGNÓSTICO
// ==========================================
function generarDiagnostico(
    presupuesto,
    total,
    saldo,
    porcentaje,
    maxCat,
    maxMonto
) {
    const contenedor =
        document.getElementById(
            "diagnosticoContenedor"
        );
    if (gastos.length === 0) {
        contenedor.innerHTML = `
            <p class="text-gray-400 italic">
                No hay datos suficientes. Empieza a capturar
                tus compras para generar un diagnóstico financiero.
            </p>
        `;
        return;
    }
    let html = "";
    if (saldo < 0) {
        html += `
            <p class="text-red-700 font-medium">
                ⚠️ Has excedido tu límite por
                <strong>${formatoMoneda(Math.abs(saldo))}</strong>.
                Es recomendable recortar gastos no esenciales.
            </p>
        `;
    }
    else if (porcentaje >= 85) {
        html += `
            <p class="text-amber-700 font-medium">
                💡 Atención: Has consumido el
                <strong>${porcentaje.toFixed(1)}%</strong>
                de tu presupuesto.
                Procura limitar gastos no esenciales.
            </p>
        `;
    }
    else {
        html += `
            <p class="text-emerald-700 font-medium">
                ✨ ¡Buen ritmo!
                Te queda disponible un
                <strong>${Math.max(
                    0,
                    100 - porcentaje
                ).toFixed(1)}%</strong>
                de tu presupuesto quincenal.
            </p>
        `;
    }
    if (maxMonto > 0) {
        const impactoMax =
            ((maxMonto / (total || 1)) * 100)
            .toFixed(1);
        html += `
            <p class="pt-2 border-t border-gray-200">
                📌 Tu categoría con mayor peso es
                <strong>${escapeHTML(maxCat)}</strong>,
                representando el
                <strong>${impactoMax}%</strong>
                de tus egresos totales.
            </p>
        `;
    }
    contenedor.innerHTML = html;
}
// ==========================================
// CHART.JS
// ==========================================
function inicializarGrafica() {
    const canvas =
        document.getElementById("graficaGastos");
    if (!canvas) {
        return;
    }
    // Evita que la aplicación se rompa si Chart.js
    // no pudo cargar.
    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js no pudo cargarse."
        );
        return;
    }
    const ctx =
        canvas.getContext("2d");
    chartInstance =
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: [
                    "Vivienda",
                    "Alimentos",
                    "Transporte",
                    "Servicios",
                    "Entretenimiento",
                    "Otros"
                ],
                datasets: [{
                    data: [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ],
                    backgroundColor: [
                        "#f43f5e",
                        "#3b82f6",
                        "#eab308",
                        "#10b981",
                        "#a855f7",
                        "#64748b"
                    ],
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
}
// ==========================================
// EXPORTAR EXCEL
// ==========================================
function exportarExcel() {
    if (gastos.length === 0) {
        alert(
            "No hay gastos registrados para exportar."
        );
        return;
    }
    if (typeof XLSX === "undefined") {
        alert(
            "No se pudo cargar la librería de Excel. " +
            "Verifica tu conexión a Internet."
        );
        return;
    }
    const presupuesto =
        parseFloat(
            document.getElementById(
                "presupuestoInput"
            ).value
        ) || 0;
    let totalGastado = 0;
    const resumenCat = {
        Vivienda: 0,
        Alimentos: 0,
        Transporte: 0,
        Servicios: 0,
        Entretenimiento: 0,
        Otros: 0
    };
    const datosDesglose =
        gastos.map((g, index) => {
            const monto =
                Number(g.monto) || 0;
            totalGastado += monto;
            if (resumenCat[g.categoria] !== undefined) {
                resumenCat[g.categoria] += monto;
            }
            return {
                "N°": index + 1,
                "Fecha": g.fecha,
                "Descripción": g.desc,
                "Categoría": g.categoria,
                "Monto ($)": monto
            };
        });
    const datosResumen = [
        {
            "Indicador / Categoría":
                "--- CONTROL GENERAL ---",
            "Monto ($)": ""
        },
        {
            "Indicador / Categoría":
                "Presupuesto Inicial",
            "Monto ($)": presupuesto
        },
        {
            "Indicador / Categoría":
                "Total Gastado",
            "Monto ($)": totalGastado
        },
        {
            "Indicador / Categoría":
                "Saldo Remanente",
            "Monto ($)":
                presupuesto - totalGastado
        },
        {
            "Indicador / Categoría": "",
            "Monto ($)": ""
        },
        {
            "Indicador / Categoría":
                "--- GASTOS POR CATEGORÍA ---",
            "Monto ($)": ""
        }
    ];
    for (
        const [cat, monto]
        of Object.entries(resumenCat)
    ) {
        datosResumen.push({
            "Indicador / Categoría": cat,
            "Monto ($)": monto
        });
    }
    const wb =
        XLSX.utils.book_new();
    const wsDesglose =
        XLSX.utils.json_to_sheet(
            datosDesglose
        );
    XLSX.utils.book_append_sheet(
        wb,
        wsDesglose,
        "Desglose General"
    );
    const wsResumen =
        XLSX.utils.json_to_sheet(
            datosResumen
        );
    XLSX.utils.book_append_sheet(
        wb,
        wsResumen,
        "Análisis de Datos"
    );
    XLSX.writeFile(
        wb,
        `Reporte_Gastos_Quincenales_${fechaArchivo()}.xlsx`
    );
}
// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function formatoMoneda(valor) {
    return `$${Number(valor).toLocaleString(
        "es-MX",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}
function fechaArchivo() {
    const fecha = new Date();
    return fecha.toISOString().slice(0, 10);
}
// Evita insertar HTML directamente desde
// la descripción escrita por el usuario.
function escapeHTML(texto) {
    const div =
        document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}