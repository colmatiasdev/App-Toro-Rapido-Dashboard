/**
 * Lógica compartida de horario de atención (apertura/cierre).
 * Usado en Resumen del pedido y portada del menú para mostrar avisos de "abre a las HH:MM" y "quedan X min".
 */
(function (global) {
    const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const DIA_HOY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    const normKey = (s) =>
        (s ?? "")
            .toString()
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const getValue = (row, candidates) => {
        const key = Object.keys(row || {}).find((k) =>
            candidates.some((c) => normKey(c) === normKey(k))
        );
        return key != null ? row[key] : "";
    };

    const pad2 = (n) => String(Number(n) ?? 0).padStart(2, "0");
    const formatHora24 = (hora, minuto) => {
        const h = Math.min(23, Math.max(0, Number(hora) ?? 0));
        const m = Math.min(59, Math.max(0, Number(minuto) ?? 0));
        return `${pad2(h)}:${pad2(m)}`;
    };

    const normalizarNombreDia = (nombre) => {
        const n = normKey(nombre);
        const found = ORDEN_DIAS.find((d) => normKey(d) === n);
        return found != null ? found : nombre;
    };

    const parseHorarioRows = (rows) => {
        const byDay = {};
        const candidatesDia = ["DIA", "Día", "DÍA", "dia", "day", "Day"];
        const candidatesHoraDesde = ["HORA DESDE", "Hora Desde", "hora desde", "HoraDesde"];
        const candidatesMinDesde = ["MINUTO DESDE", "Minuto Desde", "minuto desde", "MinutoDesde"];
        const candidatesHoraHasta = ["HORA HASTA", "Hora Hasta", "hora hasta", "HoraHasta"];
        const candidatesMinHasta = ["MINUTO HASTA", "Minuto Hasta", "minuto hasta", "MinutoHasta"];
        (rows || []).forEach((row) => {
            const diaRaw = String(getValue(row, candidatesDia)).trim();
            if (!diaRaw) return;
            const dia = normalizarNombreDia(diaRaw);
            const hDesde = Number(getValue(row, candidatesHoraDesde)) || 0;
            const mDesde = Number(getValue(row, candidatesMinDesde)) || 0;
            const hHasta = Number(getValue(row, candidatesHoraHasta)) || 0;
            const mHasta = Number(getValue(row, candidatesMinHasta)) || 0;
            const cerrado = hDesde === 0 && mDesde === 0 && hHasta === 0 && mHasta === 0;
            const rango = cerrado ? "CERRADO" : `${formatHora24(hDesde, mDesde)} - ${formatHora24(hHasta, mHasta)}`;
            if (!byDay[dia]) byDay[dia] = [];
            byDay[dia].push(rango);
        });
        return byDay;
    };

    const parseHoraAMinutos = (str) => {
        const m = String(str || "").trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const h = Math.min(23, Math.max(0, Number(m[1]) || 0));
        const min = Math.min(59, Math.max(0, Number(m[2]) || 0));
        return h * 60 + min;
    };

    const estaAbiertoAhora = (byDay) => {
        if (!byDay || typeof byDay !== "object") return false;
        const now = new Date();
        const diaHoy = DIA_HOY_NAMES[now.getDay()];
        const rangos = byDay[diaHoy];
        if (!rangos || !Array.isArray(rangos)) return false;
        const minutosAhora = now.getHours() * 60 + now.getMinutes();
        for (const r of rangos) {
            if (r === "CERRADO") continue;
            const parts = String(r).split(/\s*-\s*/).map((p) => p.trim());
            if (parts.length < 2) continue;
            const desde = parseHoraAMinutos(parts[0]);
            const hasta = parseHoraAMinutos(parts[1]);
            if (desde == null || hasta == null) continue;
            if (desde <= hasta) {
                if (minutosAhora >= desde && minutosAhora < hasta) return true;
            } else {
                if (minutosAhora >= desde || minutosAhora < hasta) return true;
            }
        }
        return false;
    };

    const getProximaApertura = (byDay) => {
        if (!byDay || typeof byDay !== "object") return null;
        const now = new Date();
        const diaIndex = now.getDay();
        const minutosAhora = now.getHours() * 60 + now.getMinutes();
        const collectDesde = (diaNombre) => {
            const rangos = byDay[diaNombre];
            if (!rangos || !Array.isArray(rangos)) return [];
            const list = [];
            for (const r of rangos) {
                if (r === "CERRADO") continue;
                const parts = String(r).split(/\s*-\s*/).map((p) => p.trim());
                if (parts.length < 2) continue;
                const desde = parseHoraAMinutos(parts[0]);
                if (desde != null) list.push(desde);
            }
            return list;
        };
        for (let offset = 0; offset < 7; offset++) {
            const idx = (diaIndex + offset) % 7;
            const diaNombre = DIA_HOY_NAMES[idx];
            const desdes = collectDesde(diaNombre);
            if (desdes.length === 0) continue;
            desdes.sort((a, b) => a - b);
            if (offset === 0) {
                for (const d of desdes) {
                    if (d > minutosAhora) {
                        return { minutosDesdeAhora: d - minutosAhora, hora: Math.floor(d / 60), minuto: d % 60 };
                    }
                }
            } else {
                const d = desdes[0];
                const minutosHastaMedianoche = 24 * 60 - minutosAhora;
                const minutosHastaApertura = minutosHastaMedianoche + (offset - 1) * 24 * 60 + d;
                return { minutosDesdeAhora: minutosHastaApertura, hora: Math.floor(d / 60), minuto: d % 60 };
            }
        }
        return null;
    };

    const getMinutosHastaCierre = (byDay) => {
        if (!byDay || typeof byDay !== "object") return null;
        const now = new Date();
        const diaHoy = DIA_HOY_NAMES[now.getDay()];
        const rangos = byDay[diaHoy];
        if (!rangos || !Array.isArray(rangos)) return null;
        const minutosAhora = now.getHours() * 60 + now.getMinutes();
        for (const r of rangos) {
            if (r === "CERRADO") continue;
            const parts = String(r).split(/\s*-\s*/).map((p) => p.trim());
            if (parts.length < 2) continue;
            const desde = parseHoraAMinutos(parts[0]);
            const hasta = parseHoraAMinutos(parts[1]);
            if (desde == null || hasta == null) continue;
            let dentro = false;
            if (desde <= hasta) {
                dentro = minutosAhora >= desde && minutosAhora < hasta;
            } else {
                dentro = minutosAhora >= desde || minutosAhora < hasta;
            }
            if (!dentro) continue;
            if (desde <= hasta) return hasta - minutosAhora;
            if (minutosAhora >= desde) return (24 * 60 - minutosAhora) + hasta;
            return hasta - minutosAhora;
        }
        return null;
    };

    /** Segundos hasta el próximo cierre (para cuenta regresiva). */
    const getSegundosHastaCierre = (byDay) => {
        if (!byDay || typeof byDay !== "object") return null;
        const now = new Date();
        const diaHoy = DIA_HOY_NAMES[now.getDay()];
        const rangos = byDay[diaHoy];
        if (!rangos || !Array.isArray(rangos)) return null;
        const segundosAhora = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const minutosAhora = now.getHours() * 60 + now.getMinutes();
        for (const r of rangos) {
            if (r === "CERRADO") continue;
            const parts = String(r).split(/\s*-\s*/).map((p) => p.trim());
            if (parts.length < 2) continue;
            const desde = parseHoraAMinutos(parts[0]);
            const hasta = parseHoraAMinutos(parts[1]);
            if (desde == null || hasta == null) continue;
            let dentro = false;
            if (desde <= hasta) {
                dentro = minutosAhora >= desde && minutosAhora < hasta;
            } else {
                dentro = minutosAhora >= desde || minutosAhora < hasta;
            }
            if (!dentro) continue;
            if (desde <= hasta) return hasta * 60 - segundosAhora;
            if (minutosAhora >= desde) return (24 * 3600 - segundosAhora) + hasta * 60;
            return hasta * 60 - segundosAhora;
        }
        return null;
    };

    const formatCountdown = (totalSegundos) => {
        const s = Math.max(0, Math.floor(totalSegundos));
        const m = Math.floor(s / 60);
        const seg = s % 60;
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(m)}:${pad(seg)}`;
    };

    const FETCH_SHEET_TIMEOUT = 10000;

    async function fetchHorarioByDay() {
        const scriptUrl = global.APP_CONFIG?.appsScriptMenuUrl || global.APP_CONFIG?.appsScriptUrl || "";
        const sheetName = global.APP_CONFIG?.horarioSheetName || "HORARIO-TORO-RAPIDO";
        if (!scriptUrl || !sheetName) return null;
        const sep = scriptUrl.includes("?") ? "&" : "?";
        const url = `${scriptUrl}${sep}action=list&sheetName=${encodeURIComponent(sheetName)}&_ts=${Date.now()}`;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), FETCH_SHEET_TIMEOUT);
            const response = await fetch(url, { cache: "no-store", signal: controller.signal });
            clearTimeout(id);
            if (!response.ok) return null;
            const text = await response.text();
            let data = null;
            try { data = JSON.parse(text); } catch (e) { return null; }
            if (!data || data.error || data.result === "error") return null;
            let rows = null;
            if (Array.isArray(data)) rows = data;
            else if (data && Array.isArray(data.rows) && Array.isArray(data.headers)) {
                const headers = data.headers.map((h) => (h != null ? String(h).trim() : ""));
                rows = data.rows.map((row) => {
                    const obj = {};
                    headers.forEach((h, i) => { obj[h] = row[i]; });
                    return obj;
                });
            } else if (data && Array.isArray(data.data)) rows = data.data;
            return rows != null ? parseHorarioRows(rows) : null;
        } catch (e) {
            if (e.name !== "AbortError") console.warn("Horario menú:", e);
            return null;
        }
    }

    /**
     * Devuelve el estado para mostrar en menú: { abierto, tipo, mensaje }.
     * tipo: "abierto" | "abierto-pronto-cierre" | "cerrado-abre-en" | "cerrado"
     */
    function getEstadoHorario(byDay) {
        if (!byDay) return { abierto: false, tipo: "cerrado", mensaje: "Cerrado por el momento" };
        const abierto = estaAbiertoAhora(byDay);
        const minutosAntesCierre = Math.max(0, Number(global.APP_CONFIG?.minutosAntesCierre) || 30);
        const minutosAntesApertura = Math.max(0, Number(global.APP_CONFIG?.minutosAntesApertura) || 20);

        if (abierto) {
            const minHastaCierre = getMinutosHastaCierre(byDay);
            const segundosHastaCierre = getSegundosHastaCierre(byDay);
            const alertaCierre = minHastaCierre != null && minHastaCierre <= minutosAntesCierre;
            if (alertaCierre) {
                const texto = minHastaCierre <= 0 ? "Cerramos ya" : `¡Quedan ${minHastaCierre} min! Pedí antes del cierre`;
                return { abierto: true, tipo: "abierto-pronto-cierre", mensaje: texto, segundosHastaCierre: segundosHastaCierre != null ? Math.max(0, segundosHastaCierre) : null };
            }
            return { abierto: true, tipo: "abierto", mensaje: "Estamos atendiendo" };
        }

        const proxima = getProximaApertura(byDay);
        const mostrarAbreEn = proxima && proxima.minutosDesdeAhora <= minutosAntesApertura;
        const horaStr = proxima ? `${String(proxima.hora).padStart(2, "0")}:${String(proxima.minuto).padStart(2, "0")}` : "";
        const horasReserva = Math.max(0, Number(global.APP_CONFIG?.horasAntesAperturaParaReserva) || 2);
        const puedeReservar = proxima && proxima.minutosDesdeAhora <= horasReserva * 60;
        if (mostrarAbreEn) {
            return { abierto: false, tipo: "cerrado-abre-en", mensaje: `El local abre a las ${horaStr}`, horaApertura: horaStr, puedeReservar };
        }
        return { abierto: false, tipo: "cerrado", mensaje: "Cerrado por el momento", puedeReservar: !!puedeReservar };
    }

    global.HorarioAtencion = {
        fetchHorarioByDay,
        getEstadoHorario,
        formatCountdown
    };
})(typeof window !== "undefined" ? window : this);
