(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const A = 'seller', B = 'buyer', N = 'optional';
    const TERMS = {
        EXW: { name: 'Ex Works · Самовывоз', place: 'origin', risk: 'Товар предоставлен покупателю в согласованном месте, обычно на складе продавца, без обязанности продавца погрузить его на транспорт покупателя.', step: 0, export: B, freight: B, insurance: N, import: B, unloading: B },
        FCA: { name: 'Free Carrier · Франко перевозчик', place: 'origin', risk: 'Товар передан перевозчику, назначенному покупателем, в согласованном месте. При передаче на территории продавца он загружает товар на транспорт покупателя.', step: 1, export: A, freight: B, insurance: N, import: B, unloading: B },
        FAS: { name: 'Free Alongside Ship · Вдоль борта судна', place: 'origin', risk: 'Товар размещён вдоль борта судна в согласованном порту отгрузки.', step: 1, export: A, freight: B, insurance: N, import: B, unloading: B },
        FOB: { name: 'Free On Board · Франко борт', place: 'origin', risk: 'Товар погружен на борт судна в согласованном порту отгрузки. С этого момента риск несёт покупатель.', step: 1, export: A, freight: B, insurance: N, import: B, unloading: B },
        CFR: { name: 'Cost and Freight · Стоимость и фрахт', place: 'destination', risk: 'Риск переходит при погрузке товара на борт судна в порту отправления — НЕ в порту назначения, хотя продавец оплачивает фрахт до указанного порта.', step: 1, export: A, freight: A, insurance: N, import: B, unloading: B },
        CIF: { name: 'Cost, Insurance and Freight · Стоимость, страхование и фрахт', place: 'destination', risk: 'Риск переходит при погрузке на борт судна в порту отправления. Продавец оплачивает фрахт и обеспечивает предусмотренное договором страхование до порта назначения.', step: 1, export: A, freight: A, insurance: A, import: B, unloading: B },
        CPT: { name: 'Carriage Paid To · Перевозка оплачена до', place: 'destination', risk: 'Риск переходит при передаче товара перевозчику, обычно первому, хотя продавец оплачивает перевозку до согласованного пункта назначения.', step: 1, export: A, freight: A, insurance: N, import: B, unloading: B },
        CIP: { name: 'Carriage and Insurance Paid To · Перевозка и страхование оплачены до', place: 'destination', risk: 'Риск переходит при передаче перевозчику, обычно первому. Продавец оплачивает перевозку и предусмотренное страхование до согласованного пункта назначения.', step: 1, export: A, freight: A, insurance: A, import: B, unloading: B },
        DAP: { name: 'Delivered at Place · Поставка в месте назначения', place: 'destination', risk: 'Товар предоставлен покупателю на прибывшем транспортном средстве, готовый к разгрузке, в согласованном месте назначения.', step: 3, export: A, freight: A, insurance: N, import: B, unloading: B },
        DPU: { name: 'Delivered at Place Unloaded · Поставка с разгрузкой', place: 'destination', risk: 'Товар разгружен с прибывшего транспорта и предоставлен покупателю в согласованном месте назначения.', step: 3, export: A, freight: A, insurance: N, import: B, unloading: A },
        DDP: { name: 'Delivered Duty Paid · Поставка с оплатой пошлин', place: 'destination', risk: 'Товар предоставлен покупателю на прибывшем транспорте, готовый к разгрузке, в согласованном месте назначения; продавец также организует импортное оформление.', step: 3, export: A, freight: A, insurance: N, import: A, unloading: B }
    };
    const ANY = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
    const SEA = ['FAS', 'FOB', 'CFR', 'CIF'];
    const MODES = { sea: 'Морская / речная', road: 'Автомобильная', rail: 'Железнодорожная', air: 'Авиационная', multi: 'Мультимодальная' };
    let state = { mode: 'sea', term: 'FOB', comparison: 'CIF' };
    let toastTimer;
    function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 3500); }
    function handover() { return $('handover').value; }
    function validSea(code) { if (state.mode !== 'sea')
        return false; if (code === 'FAS')
        return handover() === 'alongside'; return handover() === 'onboard'; }
    function compatible(code) { return ANY.includes(code) || validSea(code); }
    function recommendation() {
        const h = handover(), c = $('cargo').value;
        if (state.mode !== 'sea')
            return { type: 'neutral', title: 'Неморская или мультимодальная схема', message: 'Для этого сценария доступны 7 универсальных базисов. FOB, FAS, CFR и CIF не предлагаются.' };
        if (h === 'terminal')
            return { type: 'warn', title: 'Передача до погрузки на судно', message: 'Для контейнера на терминале обычно рассматривают FCA, CPT или CIP. Морские базисы здесь скрыты в упрощённой модели.' };
        if (h === 'alongside')
            return { type: 'neutral', title: 'Передача вдоль борта судна', message: 'Доступен FAS. Для FOB, CFR и CIF выберите передачу на борту судна.' };
        if (c === 'container')
            return { type: 'warn', title: 'Контейнер: проверьте точку передачи', message: 'FOB/CFR/CIF возможны в специальных случаях передачи на борту; для обычной передачи контейнера терминалу ICC рекомендует FCA/CPT/CIP.' };
        return { type: 'good', title: 'Морская поставка с погрузкой на судно', message: 'FOB, CFR и CIF доступны наряду с универсальными базисами. FAS требует передачи вдоль борта.' };
    }
    function renderHandover() {
        const s = $('handover'), old = s.value;
        if (state.mode === 'sea') {
            s.innerHTML = '<option value="onboard">На борту судна</option><option value="alongside">Вдоль борта судна</option><option value="terminal">Перевозчику / терминалу</option>';
            s.value = ['onboard', 'alongside', 'terminal'].includes(old) ? old : ($('cargo').value === 'container' ? 'terminal' : 'onboard');
            s.disabled = false;
            $('handover-hint').textContent = 'Уточняет применимость морских правил.';
        }
        else {
            s.innerHTML = '<option value="terminal">Перевозчику / в согласованном месте</option>';
            s.value = 'terminal';
            s.disabled = true;
            $('handover-hint').textContent = 'Морская погрузка здесь не рассматривается.';
        }
    }
    function availableTerms() { return [...ANY, ...SEA.filter(compatible)]; }
    function chooseFallback() { if (!compatible(state.term)) {
        const old = state.term;
        state.term = 'FCA';
        toast(old + ' недоступен для выбранного сценария. Установлен FCA.');
    } }
    function uiButtons() { document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === state.mode))); }
    function renderTerms() {
        for (const [id, terms] of [['any-terms', ANY], ['sea-terms', SEA]]) {
            const root = $(id);
            root.replaceChildren();
            terms.forEach(code => {
                const x = document.createElement('button');
                x.type = 'button';
                x.className = 'term-btn';
                x.disabled = !compatible(code);
                x.setAttribute('aria-pressed', String(code === state.term));
                x.setAttribute('aria-label', code + ' — ' + TERMS[code].name + (x.disabled ? ' (недоступно)' : ''));
                const b = document.createElement('b');
                b.textContent = code;
                const s = document.createElement('small');
                s.textContent = code === 'FAS' ? 'вдоль борта' : code === 'FOB' ? 'на борту' : code === 'CFR' ? 'фрахт' : code === 'CIF' ? '+ страховка' : code === 'CIP' ? 'перевозка + полис' : code === 'DDP' ? '+ импорт' : code === 'DPU' ? '+ разгрузка' : code === 'DAP' ? 'до места' : code === 'CPT' ? 'перевозка' : code === 'FCA' ? 'перевозчик' : 'самовывоз';
                x.append(b, s);
                x.addEventListener('click', () => { state.term = code; renderAll(); });
                root.append(x);
            });
        }
    }
    function person(x) { return x === A ? 'Продавец' : x === B ? 'Покупатель' : 'По договорённости'; }
    function row(name, owner, label) { const line = document.createElement('div'); line.className = 'matrix-row'; const key = document.createElement('div'); key.className = 'matrix-name'; key.textContent = name; const val = document.createElement('div'); val.className = 'matrix-value ' + (owner === B ? 'buyer' : owner === N ? 'other' : ''); val.textContent = label || person(owner); line.append(key, val); return line; }
    function details(code) {
        const t = TERMS[code];
        const mat = $('matrix');
        mat.replaceChildren();
        mat.append(row('Экспортное оформление', t.export), row('Основная перевозка до оговорённого пункта', t.freight), row('Обязательное страхование по базису', t.insurance, t.insurance === A ? 'Продавец' : 'Не обязателен'), row('Импортное оформление и пошлины', t.import), row('Разгрузка в конечном пункте', t.unloading));
        $('insurance-note').textContent = code === 'CIF' ? 'Для CIF страхование обязан обеспечить продавец; по Incoterms® 2020 стандартный минимальный уровень покрытия — Institute Cargo Clauses (C), если стороны не согласовали иное.' : code === 'CIP' ? 'Для CIP страхование обязан обеспечить продавец; по Incoterms® 2020 стандартный уровень покрытия — Institute Cargo Clauses (A), если стороны не согласовали иное.' : 'Для остальных базисов Incoterms® 2020 не устанавливают обязательного страхования продавцом по условиям CIF/CIP; стороны могут договориться о страховании отдельно.';
        $('term-code').textContent = code;
        $('term-title').textContent = t.name;
        const point = (t.place === 'origin' ? $('origin').value : $('destination').value).trim() || '[укажите место]';
        $('named-place').textContent = code + ' ' + point + ', Incoterms® 2020';
        $('risk-description').textContent = t.risk;
        $('risk-note').textContent = code === 'CIF' || code === 'CFR' || code === 'CPT' || code === 'CIP' ? 'Обратите внимание: оплата доставки продавцом НЕ означает, что риск остаётся у него до прибытия.' : 'Схема отображает типовой момент перехода риска; точная точка определяется договором.';
        document.querySelectorAll('[data-timeline]').forEach((el, i) => { el.classList.toggle('done', i <= t.step); el.classList.toggle('point', i === t.step); });
    }
    function renderComparison() {
        const avail = availableTerms();
        const choices = avail.filter(x => x !== state.term);
        if (!choices.includes(state.comparison))
            state.comparison = choices.includes('CIF') ? 'CIF' : choices.includes('DAP') ? 'DAP' : choices[0];
        const sel = $('compare-term');
        sel.replaceChildren();
        choices.forEach(code => { const opt = document.createElement('option'); opt.value = code; opt.textContent = code; sel.append(opt); });
        sel.value = state.comparison;
        const root = $('comparison-cards');
        root.replaceChildren();
        [state.term, state.comparison].forEach(code => {
            const t = TERMS[code];
            const block = document.createElement('article');
            block.className = 'compare-card';
            const head = document.createElement('strong');
            head.textContent = code;
            const info = document.createElement('div');
            info.className = 'mini-info';
            info.textContent = t.name;
            const dl = document.createElement('dl');
            [
                ['Экспорт', t.export], ['Фрахт / главная перевозка', t.freight], ['Страхование по базису', t.insurance], ['Импорт и пошлины', t.import], ['Разгрузка', t.unloading]
            ].forEach(([k, v]) => { const wrap = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v === N ? 'Не обязателен' : person(v); wrap.append(dt, dd); dl.append(wrap); });
            const risk = document.createElement('p');
            risk.className = 'mini-info';
            risk.style.marginTop = '15px';
            risk.textContent = 'Риск: ' + t.risk;
            block.append(head, info, dl, risk);
            root.append(block);
        });
    }
    function renderAll() { chooseFallback(); uiButtons(); renderTerms(); const rec = recommendation(); const box = $('compatibility'); box.className = 'status' + (rec.type === 'warn' ? ' warn' : rec.type === 'neutral' ? ' neutral' : ''); box.replaceChildren(); const title = document.createElement('strong'); title.textContent = rec.title; box.append(title, document.createTextNode(rec.message)); details(state.term); renderComparison(); }
    document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => { const prev = state.mode; state.mode = btn.dataset.mode; renderHandover(); if (prev !== 'sea' && state.mode === 'sea')
        $('handover').value = $('cargo').value === 'container' ? 'terminal' : 'onboard'; renderAll(); }));
    $('cargo').addEventListener('change', () => { if (state.mode === 'sea' && $('cargo').value === 'container')
        $('handover').value = 'terminal'; if (state.mode === 'sea' && $('cargo').value !== 'container' && $('handover').value === 'terminal')
        $('handover').value = 'onboard'; renderAll(); });
    $('handover').addEventListener('change', renderAll);
    ['origin', 'destination'].forEach(id => $(id).addEventListener('input', () => details(state.term)));
    $('compare-term').addEventListener('change', e => { state.comparison = e.target.value; renderComparison(); });
    $('compare-open').addEventListener('click', () => { $('comparison').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('copy').addEventListener('click', async () => {
        const c = state.term, t = TERMS[c], point = (t.place === 'origin' ? $('origin').value : $('destination').value).trim();
        const report = `Условия поставки\nМаршрут: ${$('origin').value} → ${$('destination').value}\nВид перевозки: ${MODES[state.mode]}\nБазис: ${c} ${point}, Incoterms® 2020\nПереход риска: ${t.risk}\nЭкспортное оформление: ${person(t.export)}\nОсновная перевозка: ${person(t.freight)}\nСтрахование по базису: ${t.insurance === A ? 'Продавец' : 'Не обязателен'}\nИмпортное оформление: ${person(t.import)}\nРазгрузка: ${person(t.unloading)}\n\nУпрощённый учебный пример. Не является юридической консультацией.`;
        try {
            await navigator.clipboard.writeText(report);
            toast('Краткий отчёт скопирован');
        }
        catch (e) {
            const ta = document.createElement('textarea');
            ta.value = report;
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            document.body.append(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            toast(ok ? 'Краткий отчёт скопирован' : 'Копирование недоступно — проверьте разрешения браузера');
        }
    });
    renderHandover();
    renderAll();
})();

