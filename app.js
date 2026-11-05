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

    // Сценарные расстояния заданы для учебного примера, а не взяты из навигационного API.
    const ROUTES = {
        'nov-alex': { from: 'Новороссийск', to: 'Александрия', international: true, modes: {sea: 2800} },
        'msk-kras': { from: 'Москва', to: 'Краснодар', international: false, modes: {road: 1350, rail: 1500} },
        'msk-spb': { from: 'Москва', to: 'Санкт-Петербург', international: false, modes: {road: 720, rail: 660} },
        'kazan-msk': { from: 'Казань', to: 'Москва', international: false, modes: {road: 820, rail: 790} },
        'spb-ham': { from: 'Санкт-Петербург', to: 'Гамбург', international: true, modes: {sea: 2100, multi: 2350} },
        'sha-vla': { from: 'Шанхай', to: 'Владивосток', international: true, modes: {sea: 2400} }
    };
    // Все ставки — демонстрационные, на них нельзя делать коммерческие расчёты.
    const RATES = {
        sea:   {tkm: 0.07, minimum: 450, origin: 130, destination: 150},
        road:  {tkm: 0.22, minimum: 600, origin: 100, destination: 100},
        rail:  {tkm: 0.12, minimum: 800, origin: 170, destination: 170},
        air:   {tkm: 3.50, minimum: 2500, origin: 250, destination: 250},
        multi: {tkm: 0.19, minimum: 950, origin: 240, destination: 240}
    };
    const usd = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
    const routeSelect = $('route-preset');
    let manualDistance = false;
    let manualRate = false;
    let manuallyChangedTerm = false;
    function calcNumber(id){return Number($(id).value);}
    function hasValidInput(){return [calcNumber('weight'),calcNumber('distance'),calcNumber('tariff')].every(x=>Number.isFinite(x)&&x>0)&&calcNumber('cargo-value')>=0;}
    function recTerm(){
        const goal = $('delivery-goal').value;
        const marine = state.mode === 'sea';
        const h = handover();
        if (goal === 'door') return {code:'DAP', reason:'Продавец доставляет товар до названного пункта назначения, готовый к разгрузке. Импортное оформление обычно остаётся за покупателем.'};
        if (goal === 'insured') return marine && h === 'onboard' ? {code:'CIF',reason:'Продавец организует фрахт и предусмотренное страхование; риск переходит на борту судна в порту отправления.'} : {code:'CIP',reason:'Продавец оплачивает перевозку и предусмотренное страхование, а риск переходит при передаче перевозчику.'};
        if (goal === 'seller') return marine && h === 'onboard' ? {code:'CFR',reason:'Продавец оплачивает фрахт до порта назначения, но риск переходит покупателю при погрузке на судно.'} : {code:'CPT',reason:'Продавец оплачивает доставку до указанного места; риск переходит при передаче первому перевозчику.'};
        if (marine && h === 'alongside') return {code:'FAS',reason:'Покупатель организует морскую перевозку; продавец передаёт товар вдоль борта судна.'};
        if (marine && h === 'onboard' && $('cargo').value !== 'container') return {code:'FOB',reason:'Покупатель организует морскую перевозку; продавец поставляет груз на борт судна в порту отправления.'};
        return {code:'FCA',reason:'Покупатель организует основную перевозку; продавец передаёт груз назначенному перевозчику в согласованном месте.'};
    }
    function currentRoute(){return ROUTES[routeSelect.value];}
    function setPresetRoute(){
        const r=currentRoute();
        $('international-row').hidden=!!r;
        if (!r) {
            $('distance').value = '';
            manualDistance = true;
        }
        if (r){
            $('origin').value=r.from;$('destination').value=r.to;
            if (!(state.mode in r.modes)){
                state.mode=Object.keys(r.modes)[0];
                renderHandover();
            }
            manualDistance=false; manualRate=false;
            $('distance').value=r.modes[state.mode];
            $('tariff').value=RATES[state.mode].tkm;
            manuallyChangedTerm=false;
            state.term=recTerm().code;
        }
        renderAll();
    }
    function estimateValues(term){
        const t=TERMS[term], route=currentRoute();
        if(route && !(state.mode in route.modes))return null;
        if (!hasValidInput())return null;
        const weight=calcNumber('weight'), distance=calcNumber('distance'), rate=calcNumber('tariff'), declaredValue=calcNumber('cargo-value');
        const params=RATES[state.mode];
        const intl=route?route.international:$('international').checked;
        const main=Math.max(params.minimum,weight*distance*rate);
        const handlingFactor=$('cargo').value==='container'?1.25:$('cargo').value==='general'?1.15:1;
        const origin=(params.origin+weight*4)*handlingFactor;
        const destination=(params.destination+weight*4)*handlingFactor;
        const exportDoc=intl?180:0;
        const importAdmin=intl?220:0;
        const insurance=(term==='CIF'||term==='CIP')?Math.max(70,declaredValue*(term==='CIP'?0.006:0.003)):0;
        const items=[
            {name:'Погрузка / обработка при отправлении',price:origin,owner:term==='EXW'?B:A},
            {name:'Основная перевозка',price:main,owner:t.freight},
            {name:'Экспортные документы (условно)',price:exportDoc,owner:t.export},
            {name:'Обработка / разгрузка в пункте назначения',price:destination,owner:t.unloading},
            {name:'Импортное оформление — услуги (без пошлин)',price:importAdmin,owner:t.import},
            {name:'Обязательное страхование по базису',price:insurance,owner:t.insurance}
        ].filter(x=>x.price>0);
        const total=items.reduce((s,x)=>s+x.price,0);
        const seller=items.filter(x=>x.owner===A).reduce((s,x)=>s+x.price,0);
        return {items,total,seller,buyer:total-seller,main,route};
    }
    function renderEstimate(){
        const root=$('estimate-result');
        root.replaceChildren();
        const route=currentRoute();
        const rec=recTerm();
        if(route && !(state.mode in route.modes)){
            const error=document.createElement('div');error.className='estimate-empty';
            error.textContent='Для этого демонстрационного маршрута выбранный вид транспорта не предусмотрен. Выберите поддерживаемый вариант или создайте свой маршрут.';
            root.append(error);return;
        }
        if(!hasValidInput()){
            const error=document.createElement('div');error.className='estimate-empty';
            error.textContent='Укажите положительные вес, расстояние и тариф. Для своего маршрута расстояние нужно ввести самостоятельно. Стоимость груза не должна быть отрицательной.';
            root.append(error);return;
        }
        const estimate=estimateValues(state.term);
        if(!estimate)return;
        const top=document.createElement('div');top.className='estimate-summary';
        const heading=document.createElement('h3');heading.textContent='Подходящий базис под выбранную задачу';
        const recommendation=document.createElement('p');recommendation.className='estimate-recommend';recommendation.textContent=rec.code+' — '+TERMS[rec.code].name;
        const why=document.createElement('p');why.className='estimate-reason';why.textContent=rec.reason;
        top.append(heading,recommendation,why);
        if(state.term!==rec.code){
            const actions=document.createElement('div');actions.className='estimate-actions';
            const apply=document.createElement('button');apply.type='button';apply.textContent='Выбрать '+rec.code;
            apply.addEventListener('click',()=>{state.term=rec.code;manuallyChangedTerm=false;renderAll();});
            actions.append(apply);top.append(actions);
        }
        root.append(top);
        const sum=document.createElement('div');sum.className='estimate-value';sum.textContent=usd(estimate.total);
        const sumLabel=document.createElement('p');sumLabel.className='estimate-sub';sumLabel.textContent='Сумма моделируемых транспортных и сопутствующих расходов · выбран базис '+state.term;
        const range=document.createElement('p');range.className='estimate-sub';range.textContent='Иллюстративный диапазон ±25%: '+usd(estimate.total*.75)+' — '+usd(estimate.total*1.25)+' (не статистическая оценка).';
        root.append(sum,sumLabel,range);
        const table=document.createElement('table');table.className='estimate-table';
        const thead=document.createElement('thead');thead.innerHTML='<tr><th>Статья</th><th>За счёт кого</th><th>Сумма</th></tr>';
        const body=document.createElement('tbody');
        estimate.items.forEach(item=>{
            const tr=document.createElement('tr');
            [item.name, item.owner===A?'Продавец':item.owner===B?'Покупатель':'По выбору сторон',usd(item.price)].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});
            body.append(tr);
        });
        table.append(thead,body);root.append(table);
        const totals=document.createElement('p');totals.className='estimate-totals';
        totals.textContent='Из смоделированных расходов: продавец — '+usd(estimate.seller)+', покупатель — '+usd(estimate.buyer)+'.';
        root.append(totals);
        const detail=document.createElement('p');detail.className='estimate-sub';
        detail.textContent='Фрахт: максимум из '+usd(RATES[state.mode].minimum)+' и (вес × расстояние × тариф) = '+usd(estimate.main)+'. Погрузка, оформление и страхование рассчитаны по условным ставкам.';
        root.append(detail);
        const caution=document.createElement('p');caution.className='estimate-sub';
        caution.textContent='Важно: Incoterms распределяет затраты и риски, но не определяет рыночную цену перевозки. Этот расчёт не включает стоимость товара, налоги, пошлины и индивидуальные сборы; суммы не являются котировкой.';
        root.append(caution);
    }
    function changeTransport(mode){
        state.mode=mode;
        renderHandover();
        if (state.mode==='sea')$('handover').value=$('cargo').value==='container'?'terminal':'onboard';
        if(!manualDistance){
            const r=currentRoute();
            if(r && r.modes[mode])$('distance').value=r.modes[mode];
        }
        if(!manualRate){$('tariff').value=RATES[mode].tkm;}
        if(!manuallyChangedTerm)state.term=recTerm().code;
        renderAll();
    }
    routeSelect.addEventListener('change',setPresetRoute);
    ['weight','distance','tariff','cargo-value'].forEach(id=>$(id).addEventListener('input',()=>{
        if(id==='distance')manualDistance=true;
        if(id==='tariff')manualRate=true;
        renderEstimate();
    }));
    ['origin','destination'].forEach(id=>$(id).addEventListener('input',()=>{
        if(currentRoute()){
            routeSelect.value='custom';
            $('international-row').hidden=false;
            $('distance').value='';
            manualDistance=true;
        }
        renderAll();
    }));
    $('delivery-goal').addEventListener('change',()=>{manuallyChangedTerm=false;state.term=recTerm().code;renderAll();});
    $('international').addEventListener('change',renderEstimate);

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
                x.addEventListener('click', () => { state.term = code; manuallyChangedTerm = true; renderAll(); });
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
    function renderAll() { chooseFallback(); uiButtons(); renderTerms(); const rec = recommendation(); const box = $('compatibility'); box.className = 'status' + (rec.type === 'warn' ? ' warn' : rec.type === 'neutral' ? ' neutral' : ''); box.replaceChildren(); const title = document.createElement('strong'); title.textContent = rec.title; box.append(title, document.createTextNode(rec.message)); details(state.term); renderComparison(); renderEstimate(); }
    document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => changeTransport(btn.dataset.mode)));
    $('cargo').addEventListener('change', () => { if (state.mode === 'sea' && $('cargo').value === 'container')
        $('handover').value = 'terminal'; if (state.mode === 'sea' && $('cargo').value !== 'container' && $('handover').value === 'terminal')
        $('handover').value = 'onboard'; if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });
    $('handover').addEventListener('change', () => { if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });

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
    setPresetRoute();
})();

