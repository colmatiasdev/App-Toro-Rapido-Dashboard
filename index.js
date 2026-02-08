document.addEventListener("DOMContentLoaded", () => {
    try { sessionStorage.removeItem("toro_pedido"); } catch (e) {}

    const config = window.APP_CONFIG || {};
    const menuActivo = config.menuActivo || "menu-simple";
    const container = document.getElementById("hero-btns-menu");

    if (config.debug && Array.isArray(config.menuVersiones) && config.menuVersiones.length > 0 && container) {
        const label = (id) => id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        container.innerHTML = config.menuVersiones.map((id) =>
            `<a href="scr/menu/${id}/${id}.html" class="btn-primary btn-menu-version">Realiza tu pedido (${label(id)})</a>`
        ).join("");
    } else if (container) {
        const linkMenu = document.getElementById("link-menu-activo");
        if (linkMenu) linkMenu.href = `scr/menu/${menuActivo}/${menuActivo}.html`;
    }

    const slides = Array.from(document.querySelectorAll(".slide"));
    const randomInt = (max) => {
        if (max <= 0) return 0;
        if (window.crypto?.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] % max;
        }
        return Math.floor(Math.random() * max);
    };
    const shuffleIndices = (count) => {
        const indices = Array.from({ length: count }, (_, idx) => idx);
        for (let i = indices.length - 1; i > 0; i -= 1) {
            const j = randomInt(i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    };
    const setActiveSlide = (nextIndex) => {
        slides.forEach((slide) => slide.classList.remove("active"));
        slides[nextIndex].classList.add("active");
    };
    let order = slides.length ? shuffleIndices(slides.length) : [];
    if (order.length > 1) {
        const lastFirst = sessionStorage.getItem("toro_carousel_first");
        if (lastFirst !== null && Number(lastFirst) === order[0]) {
            order.push(order.shift());
        }
        sessionStorage.setItem("toro_carousel_first", String(order[0]));
    }
    let orderIndex = 0;
    if (order.length) {
        setActiveSlide(order[orderIndex]);
    }
    const advanceSlide = () => {
        if (slides.length < 2) return;
        orderIndex += 1;
        if (orderIndex >= order.length) {
            order = shuffleIndices(slides.length);
            orderIndex = 0;
        }
        setActiveSlide(order[orderIndex]);
    };
    if (slides.length > 1) {
        setInterval(advanceSlide, 5000);
    }

    const igConfig = window.APP_CONFIG?.instagram || {};
    const igLink = document.getElementById("ig-link");
    const igName = document.getElementById("ig-name");
    if (igLink) igLink.href = igConfig.url || "#";
    if (igName) igName.textContent = igConfig.name ? `@${igConfig.name}` : "@Instagram";

    const wspLink = document.getElementById("wsp-link");
    const wspNumber = window.APP_CONFIG?.telefonoNegocio || "";
    if (wspLink) wspLink.href = wspNumber ? `https://wa.me/${wspNumber}` : "#";
    if (wspLink) wspLink.setAttribute("aria-label", "Escribinos por WhatsApp");

    const pedidosYaLink = document.getElementById("pedidosya-link");
    if (pedidosYaLink) pedidosYaLink.href = window.APP_CONFIG?.plataformas?.pedidosYa || "#";
    const rappiLink = document.getElementById("rappi-link");
    if (rappiLink) rappiLink.href = window.APP_CONFIG?.plataformas?.rappi || "#";

    loadHorarioAtencion();
});

/** Horario: orden de días para mostrar */
const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
/** Días por getDay() (0 = Domingo, 1 = Lunes, ...) */
const DIA_HOY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Convierte nombre de día del sheet al canónico (ej. "Miercoles" → "Miércoles") para que coincida con ORDEN_DIAS. */
const normalizarNombreDia = (nombre) => {
    const n = normKey(nombre);
    const found = ORDEN_DIAS.find((d) => normKey(d) === n);
    return found != null ? found : nombre;
};

/** Normaliza para comparar nombres de columna (sin acentos, minúsculas). */
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

/** Formatea hora en 24h desde HORA y MINUTO (columnas de la hoja). */
const formatHora24 = (hora, minuto) => {
    const h = Math.min(23, Math.max(0, Number(hora) ?? 0));
    const m = Math.min(59, Math.max(0, Number(minuto) ?? 0));
    return `${pad2(h)}:${pad2(m)}`;
};

/** Timeout para peticiones al sheet (ms). Si no responde, no bloquear la página. */
const FETCH_SHEET_TIMEOUT = 12000;

/** Obtiene filas de cualquier hoja vía Apps Script (action=list&sheetName=...). */
const fetchSheetData = async (sheetName) => {
    const scriptUrl = window.APP_CONFIG?.appsScriptMenuUrl || window.APP_CONFIG?.appsScriptUrl || "";
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
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.rows) && Array.isArray(data.headers)) {
            const headers = data.headers.map((h) => (h != null ? String(h).trim() : ""));
            return data.rows.map((row) => {
                const obj = {};
                headers.forEach((h, i) => { obj[h] = row[i]; });
                return obj;
            });
        }
        if (data && Array.isArray(data.data)) return data.data;
    } catch (e) {
        if (e.name !== "AbortError") console.warn("Sheet desde Apps Script:", sheetName, e);
    }
    return null;
};

const fetchHorarioData = async () => fetchSheetData(window.APP_CONFIG?.horarioSheetName || "HORARIO-TORO-RAPIDO");

/** Agrupa filas por DIA y formatea franjas en 24h. Retorna { [dia]: ["07:00 - 15:00", "17:00 - 21:00"], ... } */
const parseHorarioRows = (rows) => {
    const byDay = {};
    const candidatesDia = ["DIA", "Día", "DÍA", "dia", "day", "Day"];
    const candidatesHoraDesde = ["HORA DESDE", "Hora Desde", "hora desde", "HoraDesde", "HORA DESDE ", "hora_desde"];
    const candidatesMinDesde = ["MINUTO DESDE", "Minuto Desde", "minuto desde", "MinutoDesde", "MIN DESDE", "min_desde"];
    const candidatesHoraHasta = ["HORA HASTA", "Hora Hasta", "hora hasta", "HoraHasta", "HORA HASTA ", "hora_hasta"];
    const candidatesMinHasta = ["MINUTO HASTA", "Minuto Hasta", "minuto hasta", "MinutoHasta", "MIN HASTA", "min_hasta"];
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

/** Parsea "HH:MM" a minutos desde medianoche (0-1439). */
const parseHoraAMinutos = (str) => {
    const m = String(str || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Math.min(23, Math.max(0, Number(m[1]) || 0));
    const min = Math.min(59, Math.max(0, Number(m[2]) || 0));
    return h * 60 + min;
};

/** Indica si el local está abierto ahora según byDay (horario por día). Considera rangos overnight (ej. 21:00 - 01:30). */
const estaAbiertoAhora = (byDay) => {
    if (!byDay || typeof byDay !== "object") return false;
    const now = new Date();
    const diaHoy = DIA_HOY_NAMES[now.getDay()];
    const rangos = byDay[diaHoy];
    if (!rangos || !Array.isArray(rangos) || rangos.length === 0) return false;
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

/** Devuelve la próxima hora de apertura (desde) según byDay: { minutosDesdeAhora, hora, minuto } o null. */
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

/** Devuelve segundos hasta el próximo cierre (para cuenta regresiva MM:SS). */
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

/** Devuelve minutos hasta el próximo cierre (hora "hasta" del rango actual) cuando el local está abierto, o null. */
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
        if (desde <= hasta) {
            return hasta - minutosAhora;
        }
        if (minutosAhora >= desde) {
            return (24 * 60 - minutosAhora) + hasta;
        }
        return hasta - minutosAhora;
    }
    return null;
};

let heroCountdownInterval = null;
const startHeroCountdown = () => {
    if (heroCountdownInterval) clearInterval(heroCountdownInterval);
    heroCountdownInterval = setInterval(() => {
        const els = document.querySelectorAll(".hero-countdown[data-end-ms]");
        if (!els.length) {
            if (heroCountdownInterval) clearInterval(heroCountdownInterval);
            return;
        }
        const endMs = Number(els[0].getAttribute("data-end-ms"));
        const rest = (endMs - Date.now()) / 1000;
        const text = rest <= 0 ? "00:00" : `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(Math.floor(rest % 60)).padStart(2, "0")}`;
        els.forEach((el) => {
            el.textContent = text;
            if (rest <= 0) el.removeAttribute("data-end-ms");
        });
        if (rest <= 0) {
            const fl = document.getElementById("hero-floating-countdown");
            if (fl) fl.remove();
            if (heroCountdownInterval) clearInterval(heroCountdownInterval);
        }
    }, 1000);
};

/** Actualiza el bloque hero "Local ABIERTO / CERRADO" según si estamos en horario de atención. Si está cerrado y hay byDay, puede mostrar "El local abre a las HH:MM" dentro del margen config. Si está abierto y faltan pocos min para cerrar, alerta para que realice el pedido. */
const updateHeroEstadoLocal = (abierto, byDay) => {
    const floatingEl = document.getElementById("hero-floating-countdown");
    if (floatingEl) floatingEl.remove();
    const el = document.getElementById("hero-estado-local");
    if (!el) return;
    if (abierto) {
        const minutosAntesCierre = Math.max(0, Number(window.APP_CONFIG?.minutosAntesCierre) || 30);
        const minHastaCierre = byDay ? getMinutosHastaCierre(byDay) : null;
        const segHastaCierre = byDay ? getSegundosHastaCierre(byDay) : null;
        const alertaCierre = minHastaCierre != null && minHastaCierre <= minutosAntesCierre;
        const minutosCuentaRegresiva = Math.max(0, Number(window.APP_CONFIG?.minutosCuentaRegresiva) || 10);
        const umbralCountdownSeg = minutosCuentaRegresiva * 60;
        const mostrarCountdown = alertaCierre && segHastaCierre != null && segHastaCierre > 0 && segHastaCierre <= umbralCountdownSeg;
        if (alertaCierre) {
            el.setAttribute("data-estado", "abierto-pronto-cierre");
            if (mostrarCountdown) {
                const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
                const m = Math.floor(segHastaCierre / 60);
                const s = segHastaCierre % 60;
                const initial = `${pad(m)}:${pad(s)}`;
                const endMs = Date.now() + segHastaCierre * 1000;
                el.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i><span class="hero-abierto-texto">Pedí antes del cierre</span><span class="hero-countdown" data-end-ms="${endMs}">${initial}</span><span class="hero-abierto-badge hero-cierre-pronto-badge">Local ABIERTO</span>`;
                const fl = document.createElement("div");
                fl.id = "hero-floating-countdown";
                fl.className = "floating-countdown";
                fl.innerHTML = `<i class="fa-solid fa-clock"></i><span class="hero-countdown" data-end-ms="${endMs}">${initial}</span>`;
                document.body.appendChild(fl);
                startHeroCountdown();
            } else {
                const texto = minHastaCierre <= 0 ? "Cerramos ya" : `¡Quedan ${minHastaCierre} min! Pedí antes del cierre`;
                el.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i><span class="hero-abierto-texto">${texto}</span><span class="hero-abierto-badge hero-cierre-pronto-badge">Local ABIERTO</span>`;
            }
        } else {
            el.setAttribute("data-estado", "abierto");
            el.innerHTML = '<i class="fa-solid fa-store"></i><span class="hero-abierto-texto">Estamos atendiendo</span><span class="hero-abierto-badge">Local ABIERTO</span>';
        }
    } else {
        el.setAttribute("data-estado", "cerrado");
        const minutosAntes = Math.max(0, Number(window.APP_CONFIG?.minutosAntesApertura) || 20);
        const proxima = byDay ? getProximaApertura(byDay) : null;
        const mostrarAbreEn = proxima && proxima.minutosDesdeAhora <= minutosAntes;
        const horaStr = proxima ? `${String(proxima.hora).padStart(2, "0")}:${String(proxima.minuto).padStart(2, "0")}` : "";
        if (mostrarAbreEn) {
            el.innerHTML = `<i class="fa-solid fa-clock"></i><span class="hero-abierto-texto">El local abre a las ${horaStr}</span><span class="hero-abierto-badge hero-cerrado-badge">Local CERRADO</span>`;
        } else {
            el.innerHTML = '<i class="fa-solid fa-store"></i><span class="hero-abierto-texto">Cerrado por el momento</span><span class="hero-abierto-badge hero-cerrado-badge">Local CERRADO</span>';
        }
    }
};

/** Feriados: candidatos para columnas */
const FERIADO_KEYS = {
    fecha: ["FECHA", "fecha", "Fecha"],
    fechaTexto: ["FECHA TEXTO", "Fecha texto", "FECHA VISIBLE", "FECHA MOSTRAR"],
    nombre: ["NOMBRE", "nombre", "Nombre"],
    seAtiende: ["SE_ATIENDE", "se atiende", "Se Atiende"],
    horaDesde: ["HORA DESDE", "Hora Desde", "hora desde"],
    minDesde: ["MINUTO DESDE", "Minuto Desde", "minuto desde"],
    horaHasta: ["HORA HASTA", "Hora Hasta", "hora hasta"],
    minHasta: ["MINUTO HASTA", "Minuto Hasta", "minuto hasta"],
    motivo: ["MOTIVO", "motivo", "Motivo"]
};

const fetchFeriadosData = async () => fetchSheetData(window.APP_CONFIG?.feriadoSheetName || "FERIADO-TORO-RAPIDO");

/** Parsea filas de feriados y devuelve array de { fechaStr, fecha (Date), fechaTexto, nombre, seAtiende, rango24h, motivo }. */
const parseFeriadosRows = (rows) => {
    const list = [];
    (rows || []).forEach((row) => {
        const fechaStr = String(getValue(row, FERIADO_KEYS.fecha)).trim();
        if (!fechaStr) return;
        const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        const fecha = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
        if (!fecha || Number.isNaN(fecha.getTime())) return;
        const fechaTexto = String(getValue(row, FERIADO_KEYS.fechaTexto)).trim();
        const nombre = String(getValue(row, FERIADO_KEYS.nombre)).trim() || "Feriado";
        const seAtiendeRaw = String(getValue(row, FERIADO_KEYS.seAtiende)).trim().toUpperCase();
        const seAtiende = seAtiendeRaw === "SI" || seAtiendeRaw === "SÍ";
        const motivo = String(getValue(row, FERIADO_KEYS.motivo)).trim();
        let rango24h = "";
        if (seAtiende) {
            const desde = formatHora24(getValue(row, FERIADO_KEYS.horaDesde), getValue(row, FERIADO_KEYS.minDesde));
            const hasta = formatHora24(getValue(row, FERIADO_KEYS.horaHasta), getValue(row, FERIADO_KEYS.minHasta));
            rango24h = `${desde} - ${hasta}`;
        }
        list.push({ fechaStr, fecha, fechaTexto, nombre, seAtiende, rango24h, motivo });
    });
    return list.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
};

/**
 * Devuelve el próximo feriado a mostrar según la fecha actual y SE_ATIENDE:
 * - SE_ATIENDE = NO: visible desde 2 días antes de FECHA hasta el último minuto del día FECHA.
 * - SE_ATIENDE = SI: visible solo el mismo día que FECHA.
 */
const getProximoFeriado = (feriados) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    for (const f of feriados || []) {
        const fechaDia = new Date(f.fecha);
        fechaDia.setHours(0, 0, 0, 0);
        if (f.seAtiende) {
            // SI: solo el mismo día
            if (hoy.getTime() === fechaDia.getTime()) return f;
        } else {
            // NO: desde N días antes hasta el día del feriado (inclusive); N = feriadoDiasAntes en config
            const diasAntes = Math.max(0, Number(window.APP_CONFIG?.feriadoDiasAntes) || 2);
            const fechaDesde = new Date(f.fecha);
            fechaDesde.setDate(fechaDesde.getDate() - diasAntes);
            fechaDesde.setHours(0, 0, 0, 0);
            if (hoy.getTime() >= fechaDesde.getTime() && hoy.getTime() <= fechaDia.getTime()) return f;
        }
    }
    return null;
};

/** Meses en español para fecha larga. */
const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** Formatea fecha: "El día 24 de Diciembre del 2026". */
const formatFechaCompleta = (date) => {
    const d = date.getDate();
    const mes = MESES_ES[date.getMonth()] || "";
    const anio = date.getFullYear();
    return `El día ${d} de ${mes} del ${anio}`;
};

/** Convierte rango 24h "21:00 - 02:30" a "21:00 hs hasta las 02:30 hs". */
const formatHorarioLeyenda = (rango24h) => {
    if (!rango24h) return "";
    const parts = String(rango24h).split(/\s*-\s*/).map((p) => p.trim());
    if (parts.length >= 2) return `${parts[0]} hs hasta las ${parts[1]} hs`;
    return rango24h;
};

const loadHorarioAtencion = async () => {
    const wrap = document.getElementById("horario-atencion-wrap");
    const loadingEl = document.getElementById("horario-loading");
    const listEl = document.getElementById("horario-list");
    const fallbackEl = document.getElementById("horario-fallback");
    const proximoFeriadoEl = document.getElementById("horario-proximo-feriado");
    if (!wrap) return;

    const hideLoadingShowFallback = () => {
        if (loadingEl) loadingEl.style.display = "none";
        if (fallbackEl) fallbackEl.style.display = "block";
        if (listEl) listEl.style.display = "none";
        updateHeroEstadoLocal(false);
    };

    const scriptUrl = window.APP_CONFIG?.appsScriptMenuUrl || window.APP_CONFIG?.appsScriptUrl || "";
    if (!scriptUrl) {
        hideLoadingShowFallback();
        updateHeroEstadoLocal(false);
        return;
    }

    const timeoutMs = 8000;
    const safetyTimeout = setTimeout(hideLoadingShowFallback, timeoutMs);

    let rawHorario = null;
    let rawFeriados = null;
    try {
        const [h, f] = await Promise.all([fetchHorarioData(), fetchFeriadosData()]);
        rawHorario = h;
        rawFeriados = f;
    } catch (err) {
        console.warn("Error cargando horarios/feriados:", err);
        updateHeroEstadoLocal(false);
    } finally {
        clearTimeout(safetyTimeout);
        if (loadingEl) loadingEl.style.display = "none";
    }

    const feriados = parseFeriadosRows(rawFeriados);
    const proximo = getProximoFeriado(feriados);
    if (proximo && proximoFeriadoEl) {
        const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const titulo = proximo.seAtiende ? "ABIERTO" : "CERRADO";
        const fechaFormateada = formatFechaCompleta(proximo.fecha);
        const nombreTexto = proximo.nombre ? esc(proximo.nombre) : "";
        let contenido = `<div class="horario-proximo-feriado-titulo horario-feriado-${proximo.seAtiende ? "abierto" : "cerrado"}">${titulo}</div>`;
        contenido += `<div class="horario-proximo-feriado-dia">${esc(fechaFormateada)}</div>`;
        contenido += `<div class="horario-proximo-feriado-nombre">${nombreTexto || "—"}</div>`;
        if (proximo.seAtiende) {
            const horarioLeyenda = formatHorarioLeyenda(proximo.rango24h);
            if (horarioLeyenda) contenido += `<div class="horario-proximo-feriado-leyenda-label">Horario de atención</div><div class="horario-proximo-feriado-horario">${esc(horarioLeyenda)}</div>`;
        }
        if (proximo.motivo) contenido += `<div class="horario-proximo-feriado-motivo">${esc(proximo.motivo)}</div>`;
        proximoFeriadoEl.innerHTML = contenido;
        proximoFeriadoEl.style.display = "block";
    } else if (proximoFeriadoEl) {
        proximoFeriadoEl.style.display = "none";
    }

    const byDay = parseHorarioRows(rawHorario);
    const diasConDatos = Object.keys(byDay).filter((d) => byDay[d].length > 0);

    if (rawHorario != null) {
        updateHeroEstadoLocal(estaAbiertoAhora(byDay), byDay);
    } else {
        updateHeroEstadoLocal(false);
    }

    if (diasConDatos.length === 0) {
        if (fallbackEl) {
            fallbackEl.style.display = "block";
            listEl.style.display = "none";
        }
        return;
    }

    const mostrarSoloHoy = !!proximo;
    const diaHoy = DIA_HOY_NAMES[new Date().getDay()];
    let ordenados = ORDEN_DIAS.filter((d) => byDay[d] && byDay[d].length > 0);
    if (mostrarSoloHoy && byDay[diaHoy] && byDay[diaHoy].length > 0) {
        ordenados = [diaHoy];
    } else if (mostrarSoloHoy) {
        ordenados = [];
    }
    const tituloRegular = mostrarSoloHoy ? '<div class="horario-regular-titulo">Horario habitual de atención</div>' : '';
    const fragmentos = ordenados.map((dia) => {
        const rangos = byDay[dia].map((r) => `<span class="horario-rango${r === "CERRADO" ? " horario-cerrado" : ""}">${r}</span>`).join("");
        return `<div class="horario-dia"><div class="horario-dia-col"><span class="horario-dia-nombre">${dia}</span></div><div class="horario-horarios-col">${rangos}</div></div>`;
    });
    listEl.innerHTML = tituloRegular + fragmentos.join("");
    listEl.style.display = "block";
    if (fallbackEl) fallbackEl.style.display = "none";
};
