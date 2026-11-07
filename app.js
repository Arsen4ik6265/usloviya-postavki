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
    let state = { mode: 'sea', term: 'FOB', comparison: 'CIF', scope: 'domestic' };

    // Сценарные расстояния заданы для учебного примера, а не взяты из навигационного API.
    const ROUTES = {
        'nov-alex': { from: 'Новороссийск', to: 'Александрия', international: true, modes: {sea: 2800} },
        'msk-kras': { from: 'Москва', to: 'Краснодар', international: false, modes: {road: 1350, rail: 1500, multi: 1530} },
        'msk-spb': { from: 'Москва', to: 'Санкт-Петербург', international: false, modes: {road: 720, rail: 660, air: 650, multi: 780} },
        'kazan-msk': { from: 'Казань', to: 'Москва', international: false, modes: {road: 820, rail: 790, air: 720} },
        'spb-ham': { from: 'Санкт-Петербург', to: 'Гамбург', international: true, modes: {sea: 2100, multi: 2350} },
        'sha-vla': { from: 'Шанхай', to: 'Владивосток', international: true, modes: {sea: 2400} }
    };
    // Все ставки — демонстрационные, на них нельзя делать коммерческие расчёты.
    // Дополнительные альтернативы в ROUTES — модельные коридоры, не подтверждение перевозки.
    const RATES = {
        sea:   {tkm: 0.07, minimum: 450, origin: 130, destination: 150},
        road:  {tkm: 0.22, minimum: 600, origin: 100, destination: 100},
        rail:  {tkm: 0.12, minimum: 800, origin: 170, destination: 170},
        air:   {tkm: 3.50, minimum: 2500, origin: 250, destination: 250},
        multi: {tkm: 0.19, minimum: 950, origin: 240, destination: 240}
    };
    // Ставки внутренних перевозок: рубли. Только road опирается на открытый прайс,
    // остальные тарифы — учебные параметры, НЕ котировки перевозчиков.
    const DOMESTIC_RATES = {
        road: {tkm:58,minimum:15000,origin:2500,destination:2500}, // ₽/маш·км, до 20 т
        rail: {tkm:2.2,minimum:12000,origin:3500,destination:3500}, // ₽/т·км, модель
        air:  {tkm:220,minimum:60000,origin:8000,destination:8000}, // ₽/т·км, модель
        sea:  {tkm:1.8,minimum:14000,origin:4800,destination:4800}, // ₽/т·км, модель
        multi:{tkm:4.2,minimum:18000,origin:5500,destination:5500}  // ₽/т·км, модель
    };
    // Публичные тарифные ориентиры. Файл tariffs.json можно обновлять отдельно от кода.
    // Нет разрешённого общедоступного API с точной актуальной ставкой по направлению.
    // Поэтому показываем дату и источник, но НЕ называем данные «онлайн-котировкой».
    const MARKET_FALLBACK = {"version":"2026-11-05","description":"Опубликованные ориентиры. Не поток котировок; изменение тарифов требует обновления этого файла по проверенным источникам.","routes":{"msk-spb":[{"id":"cargorun-20261101","label":"CARGO.RUN · медиана заявок","rateKm":124.4,"date":"26.10–01.11.2026","url":"https://cargorun.ru/blog/stati/stavki-na-gruzoperevozki","vat":"с НДС","kind":"Недельная медиана закрытых заявок. Тент 20 т; выборка платформы, не все сделки рынка."},{"id":"maintransport-spb-2026","label":"MainTransport · среднее по компаниям","rateKm":93,"date":"обзор 2026 года","url":"https://maintransport.ru/pro/ftl","vat":"с НДС","kind":"Обзор опубликованных предложений FTL для фуры 20 т."},{"id":"clever-spb-20260907","label":"Клевер Логистик · тариф за рейс","priceTrip":111722,"referenceKm":710,"date":"07.09.2026","url":"https://clever-logistics.ru/route/msk/spb/","vat":"НДС в таблице не уточнён","kind":"Предварительная стоимость за рейс для тента 20 т. ₽/км рассчитаны делением на дистанцию источника."}],"msk-kras":[{"id":"maintransport-kras-20261023","label":"MainTransport · среднее по компаниям","rateKm":110,"date":"23.10.2026","url":"https://maintransport.ru/transportnye-kompanii/moskva/krasnodar","vat":"НДС уточняйте","kind":"Средняя ставка FTL 20 т по опубликованным данным компаний."},{"id":"clever-kras-20260907","label":"Клевер Логистик · тариф за рейс","priceTrip":177667,"referenceKm":1368,"date":"07.09.2026","url":"https://clever-logistics.ru/route/msk/krasnodar/","vat":"НДС в таблице не уточнён","kind":"Предварительная стоимость за рейс для тента 20 т. ₽/км рассчитаны делением на дистанцию источника."}],"kazan-msk":[{"id":"maintransport-kazan-20261104","label":"MainTransport · среднее по компаниям","rateKm":86,"date":"04.11.2026","url":"https://maintransport.ru/transportnye-kompanii/kazany/moskva","vat":"НДС уточняйте","kind":"Средняя ставка FTL 20 т по опубликованным данным компаний."},{"id":"clever-kazan-20260907","label":"Клевер Логистик · тариф за рейс","priceTrip":65240,"referenceKm":817,"date":"07.09.2026","url":"https://clever-logistics.ru/route/kazan/msk/","vat":"НДС в таблице не уточнён","kind":"Предварительная стоимость за рейс для тента 20 т. ₽/км рассчитаны делением на дистанцию источника."}]}};
    let marketCatalog = MARKET_FALLBACK;
    let marketCatalogStatus = 'Локальный справочник (резервная копия)';
    let marketQuoteChoice = 'auto';
    function validMarketCatalog(data){
        return data && typeof data === 'object' && data.routes &&
          Object.values(data.routes).every(items => Array.isArray(items) && items.every(q =>
            typeof q.id==='string' && typeof q.label==='string' && typeof q.url==='string' &&
            q.url.startsWith('https://') && typeof q.date==='string' &&
            ((Number.isFinite(Number(q.rateKm)) && Number(q.rateKm)>0) ||
             (Number(q.priceTrip)>0 && Number(q.referenceKm)>0))));
    }
    async function reloadMarketCatalog(){
        try {
            const ctrl=new AbortController();
            const timeout=setTimeout(()=>ctrl.abort(),5000);
            let response;
            try{ response=await fetch('./tariffs.json?v=14', {cache:'no-store',signal:ctrl.signal}); }
            finally{clearTimeout(timeout);}
            if(!response.ok)throw new Error('HTTP '+response.status);
            const data=await response.json();
            if(!validMarketCatalog(data)) throw new Error('Неверная структура тарифов');
            marketCatalog=data;
            marketCatalogStatus='Справочник проекта · редакция '+(data.version||'без даты');
            if(!manualRate){marketQuoteChoice='auto';setDefaultRate();}
            renderEstimate();
        }catch(error){
            marketCatalogStatus='Локальная копия тарифов; внешний файл недоступен';
            console.warn('Не удалось загрузить справочник тарифов:',error);
            renderEstimate();
        }
    }
    function roadTariffRoute(mode=state.mode){
        if(!scopeDomestic() || mode!=='road' || $('cargo').value!=='general') return null;
        return routeSelect.value;
    }
    function marketQuotesForRoute(mode=state.mode){
        const id=roadTariffRoute(mode);
        const arr=id && marketCatalog.routes[id];
        return Array.isArray(arr)?arr:[];
    }
    function quoteRate(q){
        return q && Number(q.rateKm)>0 ? Number(q.rateKm) :
          q && Number(q.priceTrip)>0 && Number(q.referenceKm)>0 ? Number(q.priceTrip)/Number(q.referenceKm) : null;
    }
    function selectedMarketQuote(mode=state.mode){
        if(marketQuoteChoice==='manual')return null;
        const options=marketQuotesForRoute(mode);
        return options.find(q=>q.id===marketQuoteChoice) || options[0] || null;
    }
    function roadRateValue(mode=state.mode){
        const q=selectedMarketQuote(mode);
        return q?quoteRate(q):null;
    }
    function marketQuoteSummary(mode=state.mode){
        const q=selectedMarketQuote(mode);
        if(!q) return null;
        const r=quoteRate(q);
        return q.label+' · '+q.date+' · '+r.toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽/маш·км';
    }
    // Доплаты вводит пользователь по предложению перевозчика; по умолчанию 0.
    // Для внутренней автомобильной перевозки исходная ставка НЕ включает эти строки автоматически.
    const ROAD_EXPENSES = [
        {id:'road-loading',name:'Погрузка и разгрузка (по предложению)'},
        {id:'road-tolls',name:'Платные дороги (по предложению)'},
        {id:'road-waiting',name:'Простой / ожидание (по предложению)'},
        {id:'road-other',name:'Прочие согласованные расходы'}
    ];
    function populateMarketOptions(){
        const wrap=$('market-rate-controls');
        const visible=scopeDomestic() && state.mode==='road';
        wrap.hidden=!visible;
        if(!visible) return;
        const options=marketQuotesForRoute();
        const sel=$('market-quote');
        sel.replaceChildren();
        options.forEach(q=>{
            const option=document.createElement('option');
            option.value=q.id;
            option.textContent=q.label+' · '+q.date;
            sel.append(option);
        });
        const manual=document.createElement('option');manual.value='manual';manual.textContent='Своя ставка, полученная от перевозчика';sel.append(manual);
        const selected=selectedMarketQuote();
        sel.value=marketQuoteChoice==='manual'?'manual':(selected?selected.id:'manual');
        $('market-data-status').textContent=marketCatalogStatus;
        ROAD_EXPENSES.forEach(({id})=>{$(id).disabled=false;});
    }
    function updateTariffUi(){
        $('tariff-label').textContent='Ставка, '+tariffUnits();
        $('cargo-value-label').textContent='Стоимость груза, '+(scopeDomestic()?'₽':'USD');
        populateMarketOptions();
        if($('rate-source-short'))$('rate-source-short').textContent=shortRateSource();
        const info=$('rate-source');
        const link=$('public-rate-link');
        const q=selectedMarketQuote();
        if(scopeDomestic() && state.mode==='road'){
            if(q){
                const perKm=quoteRate(q);
                const basis=q.priceTrip?'Опубликовано '+rub(Number(q.priceTrip))+' за '+q.referenceKm+' км; эквивалент '+perKm.toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽/км. ':'Опубликованная ставка '+perKm.toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽/км. ';
                info.textContent=q.label+' · '+q.date+' · '+basis+(q.vat||'НДС уточняйте')+'. '+(q.kind||'')+' '+(calcNumber('weight')>20?'Свыше 20 т модель делит груз на несколько машин: согласуйте применимость с перевозчиком. ':'')+'Цена перевозчика на дату заказа может отличаться.';
                link.href=q.url;
                link.hidden=false;
                link.textContent='Открыть источник ставки ↗';
            }else{
                info.textContent=marketQuoteChoice==='manual' && $('tariff').value.trim()
                  ?'Используется ваша ставка, введённая вручную. Она не проверялась по рынку.'
                  :($('cargo').value==='general'?'Для этого направления в справочнике нет опубликованной ставки тента 20 т. Укажите ставку по коммерческому предложению.':'Для зерна, цистерн и контейнеров ставки обычной тентованной фуры не подходят. Запросите ставку подходящего транспорта и введите её вручную.');
                link.hidden=true;
            }
        } else {
            info.textContent='Текущий тариф — учебное допущение, а не данные перевозчика. Ставку можно изменить вручную.';
            link.hidden=true;
        }
    }
    const usd = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
    const rub = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
    const money = n => scopeDomestic()?rub(n):usd(n);
    let usdRub = null, fxDate = '', fxKind = 'none', fxRequest = false;
    const fxSub = n => {
        if(!usdRub)return null;
        const converted=scopeDomestic()?n/usdRub:n*usdRub;
        // Do not format a currency conversion whose cents cannot be represented safely.
        return Number.isFinite(converted) && Number.isSafeInteger(Math.round(converted*100))
            ? (scopeDomestic()?usd(converted):rub(converted)) : null;
    };
    const rateModel = mode => scopeDomestic()?DOMESTIC_RATES[mode]:RATES[mode];
    const defaultTariff = (mode,weight) => scopeDomestic() && mode==='road' ?
        roadRateValue(mode) : rateModel(mode).tkm;
    const truckCount = weight => scopeDomestic() && weight>20 ? Math.ceil(weight/20):1;
    const tariffUnits = () => scopeDomestic()?(state.mode==='road'?'₽/маш·км':'₽/т·км'):'USD/т·км';
    function updateFxUi(){
        const status=$('fx-status');
        if(fxKind==='live'&&usdRub) status.textContent='Курс из неофициального JSON-зеркала данных ЦБ РФ: 1 USD = '+usdRub.toLocaleString('ru-RU',{maximumFractionDigits:4})+' ₽. Дата курса: '+fxDate+'. Обновляется при открытии страницы.';
        else if(fxKind==='manual'&&usdRub) status.textContent='Введён курс вручную. Пересчёт справочный, без учёта банковской комиссии.';
        else if(fxRequest) status.textContent='Загружаем курс USD/RUB…';
        else status.textContent='Курс недоступен. Рублёвые суммы в режиме ВЭД появятся после загрузки или ручного ввода курса.';
        $('fx-refresh').disabled=fxRequest;
    }
    async function refreshFx(){
        if(fxRequest)return;
        fxRequest=true;updateFxUi();
        const abort=new AbortController();
        const timeout=setTimeout(()=>abort.abort(),8500);
        try {
            const r=await fetch('https://www.cbr-xml-daily.com/daily_json.js',{signal:abort.signal,cache:'no-store'});
            if(!r.ok)throw new Error('HTTP '+r.status);
            const data=await r.json();
            const nominal=Number(data.Valute?.USD?.Nominal || 1);
            const raw=Number(data.Valute?.USD?.Value);
            const value=raw/nominal;
            if(!Number.isFinite(value)||value<10||value>1000)throw new Error('Некорректный курс');
            if(fxKind!=='manual'){
                usdRub=value;fxDate=(data.Date||'').slice(0,10)||'не указана';fxKind='live';
                $('fx-manual').value=value.toFixed(4);
            }
        }catch(e){
            // Курс не выдумываем: при отсутствии данных пересчёт просто не отображается.
            console.warn('Курс USD/RUB недоступен:',e);
        }finally{
            clearTimeout(timeout);fxRequest=false;updateFxUi();renderEstimate();
        }
    }
    function setDefaultRate(){
        if(!manualRate) { const next=defaultTariff(state.mode,calcNumber('weight')); $('tariff').value=next ? String(Number(next.toFixed(3))) : ''; }
        updateTariffUi();
    }

    const routeSelect = $('route-preset');
    const scopeDomestic = () => state.scope === 'domestic';
    const DOMESTIC_GOALS = {
        buyer: {label:'Получатель оплачивает',title:'Самовывоз / доставка за счёт получателя',description:'Получатель организует и оплачивает основную перевозку; погрузка и разгрузка распределены по учебному допущению.'},
        seller: {label:'Отправитель оплачивает',title:'Доставка за счёт отправителя',description:'Отправитель организует и оплачивает основную перевозку, разгрузка — за счёт получателя по учебному допущению.'},
        insured: {label:'Отправитель + страхование',title:'Доставка отправителем со страхованием',description:'Отправитель оплачивает перевозку и условную стоимость страхования груза.'},
        door: {label:'Отправитель + разгрузка',title:'Доставка с разгрузкой за счёт отправителя',description:'Отправитель оплачивает перевозку, обработку и разгрузку в месте назначения по учебной модели.'}
    };
    const INTL_GOALS = {
        buyer:'Перевозка: покупатель',
        seller:'Перевозка: продавец',
        insured:'Продавец + страхование',
        door:'Доставка до места назначения'
    };
    const ROUTE_NAMES = {
        'nov-alex':'Новороссийск → Александрия',
        'msk-kras':'Москва → Краснодар',
        'msk-spb':'Москва → Санкт-Петербург',
        'kazan-msk':'Казань → Москва',
        'spb-ham':'Санкт-Петербург → Гамбург',
        'sha-vla':'Шанхай → Владивосток'
    };
    function scopeHint() {
        return scopeDomestic()
          ? 'Внутренняя перевозка: расчёт доставки без экспортных и импортных процедур. Условия оплаты задают стороны договора.'
          : 'ВЭД: условия поставки Incoterms 2020, международные услуги оформления при необходимости. Пошлины и НДС не рассчитываются.';
    }
    function rebuildRouteOptions(preferred) {
        routeSelect.replaceChildren();
        const keys = Object.keys(ROUTES).filter(id => ROUTES[id].international !== scopeDomestic());
        keys.forEach(id => {
            const option=document.createElement('option');
            option.value=id;
            option.textContent=ROUTE_NAMES[id];
            routeSelect.append(option);
        });
        const custom=document.createElement('option');
        custom.value='custom';custom.textContent='Свой маршрут (ввести расстояние)';
        routeSelect.append(custom);
        routeSelect.value=(preferred && (preferred==='custom'||keys.includes(preferred)))?preferred:(scopeDomestic()?'msk-spb':'nov-alex');
    }
    function updateScopeUi() {
        document.body.classList.toggle('scope-domestic',scopeDomestic());
        document.body.classList.toggle('scope-international',!scopeDomestic());
        document.querySelectorAll('[data-scope]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.scope===state.scope)));
        $('scope-explainer').textContent=scopeHint();
        $('customs-row').hidden=scopeDomestic();
        $('customs-hint').hidden=scopeDomestic();
        $('incoterms-select').hidden=scopeDomestic();
        $('result-term-field').hidden=scopeDomestic();
        $('incoterms-detail').hidden=scopeDomestic();
        $('comparison').hidden=scopeDomestic();
        $('domestic-info').hidden=!scopeDomestic();
        $('incoterms-nav-link').hidden=scopeDomestic();
        $('delivery-goal-label').textContent=scopeDomestic()?'Кто оплачивает доставку?':'Условия поставки';
        $('copy-result').textContent=scopeDomestic()?'Скопировать расчёт':'Скопировать условия';
        $('hero-lead').textContent=scopeDomestic()
          ? 'Стоимость, сроки и условия доставки.'
          : 'Стоимость и условия международной доставки.';
        const goal=$('delivery-goal'),previous=goal.value;
        goal.replaceChildren();
        Object.entries(scopeDomestic()?DOMESTIC_GOALS:INTL_GOALS).forEach(([value,label])=>{
            const o=document.createElement('option');o.value=value;o.textContent=scopeDomestic()?label.label:label;goal.append(o);
        });
        goal.value=previous in DOMESTIC_GOALS ? previous : 'buyer';
    }
    function setScope(scope,preferred) {
        if(scope!== 'domestic' && scope!=='international')return;
        invalidateRoadDistance();
        const changed=state.scope!==scope;
        state.scope=scope;
        if(changed){
            // Стоимость груза вводится в валюте текущего режима — не смешиваем валюты.
            $('cargo-value').value=scopeDomestic()?'3000000':'30000';
            manualRate=false;
            marketQuoteChoice='auto';
            $('cargo').value=scopeDomestic()?'general':'bulk';
        }
        updateScopeUi();
        rebuildRouteOptions(preferred);
        setPresetRoute();
    }
    let manualDistance = false;
    let manualDistanceKey = null;
    let manualRate = false;
    let roadDistance = null;
    let roadRequestId = 0;
    let roadRequestLastAt = 0;
    let roadRequestController = null;
    let roadAutoTimer = null;
    const roadCache = new Map();
    let transportChartMetric = 'cost';

    // Центры городов. Для построения маршрута используется автомобильная сеть OSM,
    // поэтому результат не является точным расстоянием от склада до склада.
    // Формат координат: [широта, долгота].
    const CITY_COORDS = {
        'москва': [55.7558,37.6173],
        'санкт-петербург': [59.9343,30.3351],
        'санкт петербург': [59.9343,30.3351],
        'петербург': [59.9343,30.3351],
        'спб': [59.9343,30.3351],
        'краснодар': [45.0355,38.9753],
        'казань': [55.7961,49.1064],
        'нижний новгород': [56.3269,44.0059],
        'ростов-на-дону': [47.2357,39.7015],
        'ростов на дону': [47.2357,39.7015],
        'воронеж': [51.6608,39.2003],
        'волгоград': [48.7080,44.5133],
        'самара': [53.1959,50.1002],
        'саратов': [51.5336,46.0343],
        'уфа': [54.7388,55.9721],
        'екатеринбург': [56.8389,60.6057],
        'новороссийск': [44.7238,37.7687],
        'калуга': [54.5138,36.2612],
        'тверь': [56.8587,35.9176],
        'тула': [54.1930,37.6176],
        'владимир': [56.1291,40.4066],
        'сочи': [43.5855,39.7231],
        'псков': [57.8194,28.3327]
    };

    const cityPoint = value => CITY_COORDS[normalizedPlace(value)];
    const roadKey = () => normalizedPlace($('origin').value) + '|' + normalizedPlace($('destination').value);
    const durationLabel = seconds => {
        const minutes = Math.round(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return hours ? `${hours} ч ${minutes % 60} мин` : `${minutes} мин`;
    };
    function cancelRoadRequest() {
        if (roadAutoTimer !== null) {
            clearTimeout(roadAutoTimer);
            roadAutoTimer = null;
        }
        ++roadRequestId;
        if (roadRequestController) roadRequestController.abort();
        roadRequestController = null;
        const btn = $('road-route-btn');
        btn.disabled = false;
        btn.textContent = 'Пересчитать по автодорогам';
    }
    function updateRoadControls() {
        const block = $('road-route-block');
        block.hidden = state.mode !== 'road';
        if (block.hidden) return;
        const from = cityPoint($('origin').value);
        const to = cityPoint($('destination').value);
        const label = $('road-route-status');
        const key = roadKey();
        const button = $('road-route-btn');
        button.disabled = !from || !to || roadRequestController !== null;
        if (!from || !to) {
            label.textContent = 'Для этих городов пока нет координат в справочнике. Укажите расстояние вручную.';
        } else if (key.split('|')[0] === key.split('|')[1]) {
            button.disabled = true;
            label.textContent = 'Пункты отправления и назначения совпадают. Выберите другой маршрут.';
        } else if (roadDistance && roadDistance.key === key) {
            label.textContent = `OSRM: ${roadDistance.km.toLocaleString('ru-RU')} км · в движении ${durationLabel(roadDistance.seconds)}. Между центрами городов, без остановок и ограничений грузового транспорта.`;
        } else if (roadRequestController || roadAutoTimer !== null) {
            label.textContent = 'Получаем расстояние и время по автодорогам…';
        } else {
            label.textContent = 'При выборе маршрута расстояние рассчитывается автоматически. Если сервис недоступен, используйте ориентир из справочника или введите расстояние вручную.';
        }
    }
    function invalidateRoadDistance() {
        roadDistance = null;
        cancelRoadRequest();
    }
    function applyRoadResult(result, key) {
        if (state.mode !== 'road' || key !== roadKey()) return;
        $('distance').value = String(result.km);
        manualDistance = false;
        manualDistanceKey = null;
        roadDistance = { ...result, key };
        updateDistanceHint();
        updateRoadControls();
        renderEstimate();
    }
    // Автозапрос только при выборе маршрута или завершении ввода города.
    // Не посылаем запросы на каждую введённую букву.
    function scheduleRoadLookup() {
        if (state.mode !== 'road') return;
        const from = cityPoint($('origin').value);
        const to = cityPoint($('destination').value);
        const key = roadKey();
        if (!from || !to || key.split('|')[0] === key.split('|')[1]) {
            updateRoadControls();
            return;
        }
        if (roadDistance?.key === key || manualDistance) {
            updateRoadControls();
            return;
        }
        const cached = roadCache.get(key);
        if (cached) {
            applyRoadResult(cached, key);
            return;
        }
        if (roadAutoTimer !== null) clearTimeout(roadAutoTimer);
        // Чуть больше секунды между обращениями к общему демосерверу OSRM.
        const delay = Math.max(250, 1300 - (Date.now() - roadRequestLastAt));
        roadAutoTimer = setTimeout(() => {
            roadAutoTimer = null;
            getRoadDistance(false);
        }, delay);
        updateRoadControls();
    }
    async function getRoadDistance(force = true) {
        if (state.mode !== 'road') return;
        const from = cityPoint($('origin').value);
        const to = cityPoint($('destination').value);
        const status = $('road-route-status');
        if (!from || !to) {
            status.textContent = 'Неизвестный город. Укажите расстояние вручную.';
            return;
        }
        const key = roadKey();
        if (key.split('|')[0] === key.split('|')[1]) {
            status.textContent = 'Пункты отправления и назначения совпадают.';
            return;
        }
        if (!force && manualDistance) return; // Ручной ввод всегда имеет приоритет.
        if (force && roadAutoTimer !== null) {
            clearTimeout(roadAutoTimer);
            roadAutoTimer = null;
        }
        const wait = 1300 - (Date.now() - roadRequestLastAt);
        if (wait > 0) {
            // Повторный запрос тоже соблюдает ограничение частоты.
            roadAutoTimer = setTimeout(() => {
                roadAutoTimer = null;
                getRoadDistance(force);
            }, wait);
            updateRoadControls();
            return;
        }
        cancelRoadRequest();
        const id = ++roadRequestId;
        const button = $('road-route-btn');
        button.disabled = true;
        button.textContent = 'Строим маршрут…';
        status.textContent = 'Запрашиваем расстояние и время по автодорогам…';
        setDistanceStatus('Уточняем маршрут…');
        const abort = new AbortController();
        roadRequestController = abort;
        const timeout = setTimeout(() => abort.abort(), 10000);
        roadRequestLastAt = Date.now();
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false&steps=false`;
        try {
            const response = await fetch(url, { signal: abort.signal });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (data.code !== 'Ok') throw new Error(data.code || 'Маршрут не найден');
            const route = data.routes?.[0];
            const km = Math.round(route?.distance / 1000);
            const seconds = Number(route?.duration);
            if (!Number.isFinite(km) || km <= 0 || km > 50000 || !Number.isFinite(seconds) || seconds <= 0) {
                throw new Error('Некорректный ответ сервиса');
            }
            if (id !== roadRequestId || key !== roadKey() || state.mode !== 'road') return;
            const result = {km, seconds};
            roadCache.set(key, result);
            roadDistance = { ...result, key };
            $('distance').value = String(km);
            manualDistance = false;
            manualDistanceKey = null;
            updateDistanceHint();
            renderEstimate();
        } catch (error) {
            if (id !== roadRequestId) return;
            status.textContent = 'OSRM не ответил. Прежний километраж оставлен без изменений (если он задан). Можно ввести его вручную или повторить запрос.';
            setDistanceStatus('Маршрут не уточнён · проверьте километраж');
            console.warn('Демонстрационный OSRM недоступен:', error);
        } finally {
            clearTimeout(timeout);
            if (id === roadRequestId) {
                roadRequestController = null;
                button.disabled = false;
                button.textContent = 'Пересчитать по автодорогам';
                if (roadDistance?.key === key) updateRoadControls();
            }
        }
    }

    let manuallyChangedTerm = false;
    function calcNumber(id){return Number($(id).value);}
    function inputError(){
        const fields=[['weight','Масса партии'],['distance','Расстояние'],['tariff','Ставка'],['cargo-value','Стоимость груза']];
        if(scopeDomestic() && state.mode==='road')fields.push(...ROAD_EXPENSES.map(({id,name})=>[id,name]));
        for(const [id,label] of fields){
            const field=$(id),raw=field.value.trim();
            // Optional extra expenses may be empty: no extra charge was entered.
            if(raw==='' && ROAD_EXPENSES.some(item=>item.id===id))continue;
            const value=Number(raw);
            if(raw==='' || !Number.isFinite(value))return label+': введите число.';
            const min=field.min===''?null:Number(field.min),max=field.max===''?null:Number(field.max);
            if(min!==null && Number.isFinite(min) && value<min)return label+': значение должно быть не меньше '+min.toLocaleString('ru-RU')+'.';
            if(max!==null && Number.isFinite(max) && value>max)return label+': значение должно быть не больше '+max.toLocaleString('ru-RU')+'.';
        }
        // Check the actual monetary result, not an arbitrary tonnage ceiling.
        // A scenario bypasses hasValidInput inside estimateValues, avoiding recursion.
        const scenario={weight:calcNumber('weight'),distance:calcNumber('distance'),rate:calcNumber('tariff'),declaredValue:calcNumber('cargo-value'),mode:state.mode,cargo:$('cargo').value};
        return estimateValues(state.term,scenario)?'':'Слишком большие значения для точного денежного расчёта. Разделите партию на меньшие части или уменьшите параметры.';
    }
    function hasValidInput(){return !inputError();}
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
    function normalizedPlace(text){return text.trim().toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[.,]/g,'').replace(/\s+/g,' ');}
    function findKnownRoute(){
        const start=normalizedPlace($('origin').value);
        const finish=normalizedPlace($('destination').value);
        return Object.entries(ROUTES).find(([,route]) => normalizedPlace(route.from)===start && normalizedPlace(route.to)===finish);
    }
    function updateDistanceHint(){
        updateDistanceStatus();
        const known=currentRoute();
        const hint=$('distance-hint');
        if(roadDistance && roadDistance.key===roadKey()){
            hint.textContent='Расстояние уточнено через OSRM / OpenStreetMap (между центрами городов). Значение можно изменить вручную.';
        } else if(manualDistance && $('distance').value.trim()){
            hint.textContent='Расстояние изменено вручную. Оно используется в расчёте; вы можете изменить его ещё раз.';
        } else if(known && known.modes[state.mode]){
            hint.textContent='Ориентировочное расстояние из учебного сценария. Не навигационный расчёт. Значение можно изменить.';
        } else {
            hint.textContent='Для этого маршрута готового расстояния нет. Введите километраж вручную; при изменении данных сумма пересчитается.';
        }
    }
    function setPresetRoute(){
        invalidateRoadDistance();
        ROAD_EXPENSES.forEach(({id})=>{$(id).value='0';});
        const r=currentRoute();
        if (!r) {
            $('origin').value='';$('destination').value='';
            $('distance').value = '';
            manualDistance = true;
            manualDistanceKey = roadKey();
            manualRate=false;marketQuoteChoice='auto';setDefaultRate();
        }
        if (r){
            $('origin').value=r.from;$('destination').value=r.to;
            if (!(state.mode in r.modes)){
                const previousMode=state.mode;
                state.mode=Object.keys(r.modes)[0];
                renderHandover();
                if(state.mode==='sea' && previousMode!=='sea')
                    $('handover').value=$('cargo').value==='container'?'terminal':'onboard';
            }
            manualDistance=false; manualDistanceKey=null; manualRate=false;marketQuoteChoice='auto';
            $('distance').value=r.modes[state.mode];
            setDefaultRate();
            manuallyChangedTerm=false;
            state.term=recTerm().code;
        }
        updateDistanceHint();
        renderAll();
        scheduleRoadLookup();
    }
    function estimateValues(term, scenario = null){
        const t=TERMS[term], route=currentRoute();
        if (!scenario && !hasValidInput())return null;
        const weight=scenario ? scenario.weight : calcNumber('weight');
        const distance=scenario ? scenario.distance : calcNumber('distance');
        const rate=scenario ? scenario.rate : calcNumber('tariff');
        const declaredValue=scenario ? scenario.declaredValue : calcNumber('cargo-value');
        const mode=scenario ? scenario.mode : state.mode;
        const cargo=scenario ? scenario.cargo : $('cargo').value;
        if (![weight,distance,rate].every(n=>Number.isFinite(n)&&n>0) || !Number.isFinite(declaredValue) || declaredValue<0) return null;
        const params=rateModel(mode);
        const intl=!scopeDomestic();
        const goal=$('delivery-goal').value;
        // Внутренние авто — за машино-километр; НЕ умножать тариф на тонны.
        // Если груз >20 т: условно несколько фур по одинаковой ставке.
        const main=Math.max(params.minimum,(scopeDomestic()&&mode==='road')?
            distance*rate*truckCount(weight):weight*distance*rate);
        const handlingFactor=cargo==='container'?1.25:cargo==='general'?1.15:1;
        const origin=(!intl&&mode==='road')?0:(params.origin+weight*(intl?4:35))*handlingFactor;
        const destination=(!intl&&mode==='road')?0:(params.destination+weight*(intl?4:35))*handlingFactor;
        const roadExtras=(!intl&&mode==='road')?ROAD_EXPENSES.map(({id,name})=>({
            name,
            price:Math.max(0,Number.isFinite(calcNumber(id))?calcNumber(id):0),
            owner:goal==='buyer'?B:A
        })).filter(x=>x.price>0):[];
        const customs=intl && $('customs-applicable').checked;
        const exportDoc=customs?180:0;
        const importAdmin=customs?220:0;
        const insurance=intl
          ? ((term==='CIF'||term==='CIP')?Math.max(70,declaredValue*(term==='CIP'?0.006:0.003)):0)
          : (goal==='insured'?Math.max(500,declaredValue*.003):0);
        const items=[
            ...(intl && mode==='sea' && SEA.includes(term) ? [
                {name:'Подвоз и обработка до борта судна (модель)',price:origin*0.65,owner:A},
                {name:'Погрузка на борт судна (модель)',price:origin*0.35,owner:term==='FAS'?B:A}
            ] : [{name:'Погрузка / обработка при отправлении',price:origin,owner:intl?(term==='EXW'?B:A):(goal==='buyer'?B:A)}]),
            {name:'Основная перевозка',price:main,owner:intl?t.freight:(goal==='buyer'?B:A)},
            ...roadExtras,
            ...(customs?[{name:'Услуги по экспортному оформлению (условно)',price:exportDoc,owner:t.export}]:[]),
            {name:'Обработка / разгрузка в пункте назначения',price:destination,owner:intl?t.unloading:(goal==='door'?A:B)},
            ...(customs?[{name:'Услуги по импортному оформлению (без пошлин)',price:importAdmin,owner:t.import}]:[]),
            ...(insurance>0?[{name:intl?'Страхование по базису':'Добровольное страхование груза (модель)',price:insurance,owner:intl?t.insurance:A}]:[])
        ].filter(x=>x.price>0).map(x=>({...x,price:Math.round(x.price*100)/100}));
        if(!Number.isFinite(main) || !Number.isSafeInteger(Math.round(main*100)) ||
           items.some(x=>!Number.isFinite(x.price) || !Number.isSafeInteger(Math.round(x.price*100))))return null;
        // Round each visible item to cents before summing. This keeps table, payer totals
        // and final result exactly consistent even for fractional handling multipliers.
        const totalCents=items.reduce((sum,x)=>sum+Math.round(x.price*100),0);
        const sellerCents=items.filter(x=>x.owner===A).reduce((sum,x)=>sum+Math.round(x.price*100),0);
        if(!Number.isSafeInteger(totalCents) || !Number.isSafeInteger(sellerCents))return null;
        return {items,total:totalCents/100,seller:sellerCents/100,buyer:(totalCents-sellerCents)/100,main,route};
    }

    // V6: сравнение ограничено явно описанными учебными сценариями.
    // V11: сроки других видов транспорта не выводятся из выдуманной скорости.
    // По умолчанию доступны только расчётные оценки автоперевозок; другие сроки — ввод пользователя.
    const carrierTimes = new Map();
    const distanceNum = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n);
    const etaKey = (mode,distance) => [
        state.scope,roadKey(),mode,$('cargo').value,
        calcNumber('weight').toFixed(3),
        Number.isFinite(distance)?distance.toFixed(1):''
    ].join('|');
    const validEtaNumber = (id,min,max) => {
        const input=$(id), val=Number(input.value);
        return input.value.trim()!=='' && Number.isFinite(val)&&val>=min&&val<=max ? val : null;
    };
    function driveRoadTime(km){
        if(!Number.isFinite(km)||km<=0) return null;
        const speed=validEtaNumber('eta-speed',25,90);
        const prep=validEtaNumber('eta-prep',0,72),load=validEtaNumber('eta-load',0,72),unload=validEtaNumber('eta-unload',0,72),buffer=validEtaNumber('eta-buffer',0,168);
        if([speed,prep,load,unload,buffer].some(x=>x===null)) return null;
        const rd=roadDistance?.key===roadKey()?roadDistance:roadCache.get(roadKey());
        const osrm= !manualDistance && rd && Math.abs(rd.km-km)<1 ? rd : null;
        const osrmHours=osrm?osrm.seconds/3600:0;
        // OSRM рассчитывает легковой автомобиль. Не сокращаем время ниже оценки грузовика по средней скорости.
        const drive=Math.max(km/speed,osrmHours);
        // Дальние рейсы: модель не учитывает недельный отдых и ограничения состава экипажа.
        if(drive>49.5) return {longRoute:true,drive,osrm:!!osrm};
        let remaining=drive,breaks=0,daysOfDriving=0;
        while(remaining>0.00001){
            const shift=Math.min(9,remaining);
            // Перерыв 45 мин между блоками управления по 4,5 ч, не после завершения смены.
            breaks+=Math.max(0,Math.ceil(shift/4.5-1e-10)-1)*0.75;
            remaining-=shift;daysOfDriving++;
        }
        // При суммированном учёте 11 ч — один из типовых нормативов межсменного отдыха.
        const overnight=Math.max(0,daysOfDriving-1)*11;
        const minHours=drive+breaks+overnight+prep+load+unload;
        const maxHours=minHours+buffer;
        return {drive,breaks,overnight,prep,load,unload,buffer,minHours,maxHours,osrm:!!osrm};
    }
    function etaForScenario(mode,distance){
        // Domestic road only. International road transport needs its own rules,
        // border delays and a carrier-confirmed transit time.
        if(mode==='road' && scopeDomestic()){
            const road=driveRoadTime(distance);
            if(!road || road.longRoute) return {days:null,sourceTime:road?.longRoute?'Нужен график экипажа и недельного отдыха':'Неполные параметры'};
            const days=(road.minHours+road.maxHours)/48;
            return {days,daysMin:road.minHours/24,daysMax:road.maxHours/24,minHours:road.minHours,maxHours:road.maxHours,sourceTime:road.osrm?'OSRM + модель грузовика':'Километраж + модель грузовика',road};
        }
        const input=carrierTimes.get(etaKey(mode,distance));
        if(Number.isFinite(input)&&input>=.25&&input<=180){
            return {days:input,daysMin:input,daysMax:input,sourceTime:'Срок введён пользователем, не проверен'};
        }
        return {days:null,sourceTime:'Требуется срок из предложения перевозчика'};
    }
    const daysLabel = row => {
        if(!row||!Number.isFinite(row.days)) return 'Срок не указан';
        if(row.mode==='road' && Number.isFinite(row.minHours) && Number.isFinite(row.maxHours)){
            return '≈'+Math.ceil(row.minHours)+'–'+Math.ceil(row.maxHours)+' ч';
        }
        const value=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(row.days);
        return value+' сут. (ввод)';
    };
    function renderEtaPanel(){
        const road=state.mode==='road' && scopeDomestic();
        $('eta-road-options').hidden=!road;
        const timeDetails=$('eta-calculation-details');
        if(timeDetails)timeDetails.replaceChildren();
        const primaryField=$('carrier-eta-field'),primaryInput=$('carrier-eta-days');
        if(primaryField && primaryInput){
            primaryField.hidden=road || !hasValidInput();
            const stored=carrierTimes.get(etaKey(state.mode,calcNumber('distance')));
            if(document.activeElement!==primaryInput)primaryInput.value=stored===undefined?'':String(stored);
        }
        const root=$('eta-result');root.replaceChildren();
        if(!hasValidInput()){
            const note=document.createElement('p');note.className='eta-note';
            note.textContent='Срок появится после заполнения параметров.';
            root.append(note);return;
        }
        if(!road){
            const eta=etaForScenario(state.mode,calcNumber('distance'));
            if(Number.isFinite(eta.days)){
                const value=document.createElement('div');value.className='eta-value';
                value.textContent=daysLabel({...eta,mode:state.mode});
                const note=document.createElement('p');note.className='eta-note';
                note.textContent='По введённым данным · без автоматической проверки.';
                root.append(value,note);return;
            }
            const note=document.createElement('p');note.className='eta-note';
            note.textContent='Уточните срок у перевозчика и укажите ниже.';
            root.append(note);return;
        }
        const distance=calcNumber('distance');
        const data=driveRoadTime(distance);
        if(!data){
            const note=document.createElement('p');note.className='eta-note';note.textContent='Введите положительный километраж и корректные параметры срока (скорость 25–90 км/ч).';root.append(note);return;
        }
        if(data.longRoute){
            const note=document.createElement('p');note.className='eta-note';note.textContent='Очень длинный рейс: требуется отдельный график работы и отдыха, включая еженедельный отдых. Модель не выдаёт неподтверждённый срок. Запросите срок у перевозчика.';root.append(note);return;
        }
        const value=document.createElement('div');value.className='eta-value';value.textContent='≈'+Math.ceil(data.minHours)+'–'+Math.ceil(data.maxHours)+' ч';
        root.append(value);
        const dl=document.createElement('dl');
        const number=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n)+' ч';
        const parts=[
            ['Движение грузовика',number(data.drive)],
            ['Перерывы при вождении',number(data.breaks)],
            ['Отдых между сменами',number(data.overnight)],
            ['Подготовка и подача',number(data.prep)],
            ['Погрузка + разгрузка',number(data.load+data.unload)],
            ['Возможный дополнительный резерв','0–'+number(data.buffer)]
        ];
        parts.forEach(([name,val])=>{const line=document.createElement('div'),k=document.createElement('dt'),v=document.createElement('dd');k.textContent=name;v.textContent=val;line.append(k,v);dl.append(line);});
        root.append(dl);
        const info=document.createElement('p');info.className='eta-manual-note';
        info.textContent=data.osrm?'OSRM — ориентир движения легкового автомобиля; скорость грузовика и остальные этапы рассчитаны отдельно.':'Время движения оценено по введённому расстоянию и скорости грузовика; подтверждённого ответа OSRM для этого значения нет.';
        root.append(info);
        const caveat=document.createElement('p');caveat.className='eta-manual-note';caveat.textContent='Учебная оценка для одного водителя, не договорный срок. Не учитывает точный график складов, погодные ограничения, выходные, специальные разрешения и фактические пробки.';root.append(caveat);
        if(timeDetails)timeDetails.append(dl,info,caveat);
    }
    const goalLabel = {buyer:'Перевозку организует покупатель',seller:'Перевозку организует продавец',insured:'Продавец оплачивает перевозку и страхование',door:'Доставка до места назначения'};
    const scopeGoalLabel = goal => scopeDomestic() ? DOMESTIC_GOALS[goal].title : goalLabel[goal];
    function comparisonContext(){
        const route=($('origin').value.trim()||'Пункт отправления')+' → '+($('destination').value.trim()||'Пункт назначения');
        const condition=scopeDomestic()
            ? scopeGoalLabel($('delivery-goal').value)
            : 'расчёт по '+state.term;
        return route+' · '+condition;
    }
    function recForMode(mode) {
        const goal=$('delivery-goal').value;
        const isMarine=mode==='sea';
        const onboard=$('cargo').value!=='container' && (state.mode!=='sea' || handover()==='onboard');
        if (goal==='door') return 'DAP';
        if (goal==='insured') return isMarine && onboard ? 'CIF':'CIP';
        if (goal==='seller') return isMarine && onboard ? 'CFR':'CPT';
        if (isMarine && state.mode==='sea' && handover()==='alongside') return 'FAS';
        if (isMarine && onboard) return 'FOB';
        return 'FCA';
    }
    function scenarioRateSource(mode){
        if(!scopeDomestic()) return 'Учебная ставка, не рыночная котировка';
        if(mode!=='road') return 'Учебная ставка, не подтверждена перевозчиком';
        if(mode===state.mode && (manualRate || marketQuoteChoice==='manual'))
            return 'Ставка введена пользователем, не проверена';
        const quote=selectedMarketQuote(mode);
        return quote ? 'Опубликованный ориентир: '+quote.label+' · '+quote.date
                     : 'Нет рыночной ставки: требуется ставка перевозчика';
    }
    function rateConfidence(mode){
        if(!scopeDomestic())return 'model';
        if(mode===state.mode && (manualRate || marketQuoteChoice==='manual'))return 'user';
        if(mode==='road' && selectedMarketQuote('road'))return 'published';
        return 'model';
    }
    function transportScenarios(){
        if(!hasValidInput())return [];
        const route=currentRoute();
        const modes=route ? Object.keys(route.modes) : [state.mode];
        const weight=calcNumber('weight'),declaredValue=calcNumber('cargo-value');
        if (!Number.isFinite(weight) || weight<=0 || !Number.isFinite(declaredValue) || declaredValue<0) return [];
        const international=!scopeDomestic();
        const rows=[];
        for (const mode of modes){
            let distance;
            let distSource='Учебное расстояние';
            if(mode===state.mode){
                distance=calcNumber('distance');
                if(manualDistance) distSource='Километраж введён вручную';
                else if(mode==='road' && roadDistance?.key===roadKey()) distSource='OSRM / OpenStreetMap';
            } else if(mode==='road' && roadCache.has(roadKey())){
                distance=roadCache.get(roadKey()).km;
                distSource='OSRM / OpenStreetMap';
            } else {
                distance=route?.modes[mode];
            }
            if(!Number.isFinite(distance) || distance<=0) continue;
            const rate = mode===state.mode ? calcNumber('tariff') : defaultTariff(mode,weight);
            if(!Number.isFinite(rate) || rate<=0)continue;
            const recommendedTerm=scopeDomestic()?'':recForMode(mode);
            // Активная карточка всегда совпадает по стоимости с текущим калькулятором.
            const term=scopeDomestic()?'':(mode===state.mode ? state.term : recommendedTerm);
            const estimate=estimateValues(term,{weight,declaredValue,distance,rate,mode,cargo:$('cargo').value,international});
            if(!estimate)continue;
            const eta=etaForScenario(mode,distance);
            rows.push({mode,name:MODES[mode],distance,distSource,rate,term,recommendedTerm,total:estimate.total,freight:estimate.main,rateSource:scenarioRateSource(mode),rateConfidence:rateConfidence(mode),...eta});
        }
        return rows;
    }
    function transportWinners(rows){
        // One market benchmark and three training formulas do not form a market ranking.
        const verified=rows.filter(row=>row.rateConfidence==='published');
        const cheapest=verified.length>=2 && verified.length===rows.length
            ? [...verified].sort((a,b)=>a.total-b.total)[0] : null;
        const timed=rows.filter(row=>Number.isFinite(row.days));
        if(timed.length<2) return {cheapest,fastest:null,balanced:null};
        const costMin=Math.min(...timed.map(r=>r.total)),costMax=Math.max(...timed.map(r=>r.total));
        const timeMin=Math.min(...timed.map(r=>r.days)),timeMax=Math.max(...timed.map(r=>r.days));
        const fastest=[...timed].sort((a,b)=>a.days-b.days||a.total-b.total)[0];
        const balanced=[...timed].sort((a,b)=>{
            const aScore=.5*(a.total-costMin)/(costMax-costMin||1)+.5*(a.days-timeMin)/(timeMax-timeMin||1);
            const bScore=.5*(b.total-costMin)/(costMax-costMin||1)+.5*(b.days-timeMin)/(timeMax-timeMin||1);
            return aScore-bScore||a.total-b.total;
        })[0];
        return {cheapest,fastest,balanced};
    }
    function renderHighlights(chart,rows){
        const winners=transportWinners(rows);
        const highlights=document.createElement('div');highlights.className='mode-winners';
        [
            ...(winners.cheapest?[['Минимум среди сопоставимых ставок',winners.cheapest]]:[]),
            ...(winners.fastest?[['Меньший введённый / расчётный срок',winners.fastest]]:[]),
            ...(winners.balanced?[['Баланс учебных оценок (50/50)',winners.balanced]]:[])
        ].forEach(([caption,item])=>{
            const p=document.createElement('p');p.className='mode-winner';
            p.textContent=caption+': '+item.name+' · '+money(item.total)+' · '+daysLabel(item);highlights.append(p);
        });
        chart.querySelector('.mode-winners')?.remove();chart.append(highlights);
    }
    function renderScenarioChart(plot,rows){
        // The switches remain mounted, including the keyboard's current focus.
        let head=plot.querySelector('.mode-chart-head');
        if(!head){
            head=document.createElement('div');head.className='mode-chart-head';
            const title=document.createElement('h3');title.textContent='График вариантов';
            const switches=document.createElement('div');switches.className='mode-chart-tabs';
            switches.setAttribute('role','group');switches.setAttribute('aria-label','Что показать на графике');
            [['cost','Стоимость'],['time','Срок']].forEach(([metric,label])=>{
                const button=document.createElement('button');button.type='button';button.textContent=label;
                button.dataset.metric=metric;
                button.addEventListener('click',()=>{transportChartMetric=metric;renderScenarioChart(plot,transportScenarios());});
                switches.append(button);
            });
            head.append(title,switches);plot.append(head);
            const body=document.createElement('div');body.className='mode-chart-body';plot.append(body);
        }
        head.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.metric===transportChartMetric)));
        const body=plot.querySelector('.mode-chart-body');body.replaceChildren();
        const plotRows=transportChartMetric==='cost'?rows:rows.filter(row=>Number.isFinite(row.days));
        if(plotRows.length<2){
            const note=document.createElement('p');note.className='mode-compare-notice';
            note.textContent=plotRows.length?'Указан срок одного варианта. Добавьте ещё один для сравнения.':'Добавьте сроки перевозчиков в подробностях вариантов.';
            body.append(note);
        }
        if(!plotRows.length)return;
        const values=plotRows.map(row=>transportChartMetric==='cost'?row.total:row.days).sort((a,b)=>a-b);
        const outlier=transportChartMetric==='cost'&&values.length>=3&&values.at(-1)>5*values.at(-2);
        const maximum=Math.max(1,outlier?values.at(-2):values.at(-1));
        if(outlier){
            const note=document.createElement('p');note.className='mode-compare-notice';
            note.textContent='Самая высокая оценка показана отдельно, вне общего масштаба.';body.append(note);
        }
        // Same order as the list: changing the metric does not rearrange the modes.
        plotRows.forEach(item=>{
            const row=document.createElement('div');row.className='mode-chart-row';
            const line=document.createElement('div');line.className='mode-chart-line';
            const label=document.createElement('span');label.className='mode-chart-label';label.textContent=item.name;
            const value=document.createElement('strong');value.className='mode-chart-value';
            const outside=outlier&&item.total>maximum;
            value.textContent=(transportChartMetric==='cost'?money(item.total):daysLabel(item))+(outside?' · вне масштаба':'');
            line.append(label,value);
            const track=document.createElement('div');track.className='mode-chart-track';track.setAttribute('aria-hidden','true');
            const fill=document.createElement('div');fill.className='mode-chart-fill';
            fill.style.width=Math.min(100,Math.max(2,100*(transportChartMetric==='cost'?item.total:item.days)/maximum))+'%';
            if(outside)fill.classList.add('mode-chart-outlier');
            if(item.mode===state.mode)fill.classList.add('selected');
            track.append(fill);row.append(line,track);body.append(row);
        });
    }
    function renderTransportComparison(){
        const root=$('transport-comparison-result');if(!root)return;
        const expanded=new Set([...root.querySelectorAll('details[open]')].map(el=>el.id));
        const focus=document.activeElement;
        const focusId=root.contains(focus)?focus.id:null;
        const chartMetric=root.contains(focus)?focus.dataset?.metric:null;
        root.replaceChildren();
        const scenarioRoute=currentRoute(),rows=transportScenarios();
        $('transport-context').textContent=comparisonContext();
        const multiple=rows.length>1;
        const action=document.querySelector('.result-more');
        action.hidden=!rows.length;
        action.href=multiple?'#transport-comparison':'#cost-breakdown';
        action.replaceChildren(document.createTextNode(multiple?'Сравнить варианты':'Посмотреть расходы'));
        const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';action.append(arrow);
        document.querySelectorAll('[data-variants-nav]').forEach(link=>{link.hidden=!multiple;});
        $('transport-comparison').classList.toggle('single-scenario',!multiple);
        if(!rows.length){
            const empty=document.createElement('p');empty.className='mode-compare-empty';
            empty.textContent='Варианты появятся после заполнения параметров.';root.append(empty);return;
        }
        if(!multiple){
            const note=document.createElement('p');note.className='single-scenario-note';
            note.textContent='Для этого маршрута подготовлен один вариант. Его расходы и условия — в расчёте выше.';
            const link=document.createElement('a');link.href='#configurator';link.className='text-action';link.textContent='Изменить маршрут';
            root.append(note,link);return;
        }
        const notice=document.createElement('p');notice.className='mode-compare-notice compare-caution';
        notice.textContent=scopeDomestic()?'Авто — опубликованная или ваша ставка. Другие цены — учебные, поэтому выбирать самый дешёвый способ по ним нельзя.':'Цены — учебные. Сроки заполняются по предложениям перевозчиков.';
        root.append(notice);
        const cards=document.createElement('div');cards.className='mode-option-list';
        rows.forEach(item=>{
            const selected=item.mode===state.mode;
            const card=document.createElement('details');card.className='mode-option'+(selected?' mode-option-active':'');
            card.id='option-'+item.mode;card.open=expanded.has(card.id);
            const summary=document.createElement('summary');summary.className='mode-option-summary';summary.id='option-toggle-'+item.mode;
            const identity=document.createElement('span');identity.className='mode-option-identity';
            const title=document.createElement('strong');title.textContent=item.name;
            const type=document.createElement('span');type.className='mode-option-tag';
            type.textContent=(selected?'Выбрано · ':'')+(item.rateConfidence==='published'?'Опубликованный ориентир':item.rateConfidence==='user'?'Ваша ставка':'Учебный расчёт');
            identity.append(title,type);
            const amounts=document.createElement('span');amounts.className='mode-option-amounts';
            const total=document.createElement('b');total.textContent=money(item.total);
            const eta=document.createElement('span');eta.textContent=daysLabel(item);amounts.append(total,eta);
            summary.append(identity,amounts);card.append(summary);
            const body=document.createElement('div');body.className='mode-option-body';
            const facts=document.createElement('dl');facts.className='mode-option-facts';
            [
                ['Расстояние',distanceNum(item.distance)+' км'],
                ['Основная перевозка',money(item.freight)],
                ...(scopeDomestic()?[['Условия доставки',scopeGoalLabel($('delivery-goal').value)]]:[['Базис в расчёте',item.term],['По заданной цели',item.recommendedTerm]]),
                ['Источник расстояния',item.distSource],['Источник ставки',item.rateSource],
                ['Источник срока',item.sourceTime],
                ...(fxSub(item.total)?[['Справочно в другой валюте',fxSub(item.total)]]:[])
            ].forEach(([name,value])=>{
                const row=document.createElement('div'),label=document.createElement('dt'),text=document.createElement('dd');
                label.textContent=name;text.textContent=value;row.append(label,text);facts.append(row);
            });
            body.append(facts);
            if(item.mode!=='road'||!scopeDomestic()){
                if(selected){
                    const link=document.createElement('a');link.href='#carrier-eta-days';link.className='text-action';
                    link.textContent='Изменить срок в расчёте';body.append(link);
                }else{
                    const entry=document.createElement('label');entry.className='mode-eta-input';
                    const label=document.createElement('span');label.textContent='Срок перевозчика, суток';
                    const input=document.createElement('input');input.type='number';input.min='0.25';input.max='180';input.step='0.25';input.inputMode='decimal';input.placeholder='Не указан';input.id='scenario-time-'+item.mode;
                    input.setAttribute('aria-label','Срок перевозчика: '+item.name+', суток');
                    const help=document.createElement('small');help.id=input.id+'-help';help.textContent='По вашему предложению, без автоматической проверки.';
                    const error=document.createElement('span');error.id=input.id+'-error';error.className='field-error';error.hidden=true;
                    input.setAttribute('aria-describedby',help.id+' '+error.id);
                    const stored=carrierTimes.get(etaKey(item.mode,item.distance));if(stored!==undefined)input.value=String(stored);
                    const save=()=>{
                        const raw=input.value.trim(),days=Number(raw.replace(',','.'));
                        const valid=raw!==''&&Number.isFinite(days)&&days>=.25&&days<=180;
                        if(valid)carrierTimes.set(etaKey(item.mode,item.distance),days);else carrierTimes.delete(etaKey(item.mode,item.distance));
                        const invalid=raw!==''&&!valid;input.setAttribute('aria-invalid',String(invalid));
                        error.hidden=!invalid;error.textContent=invalid?'Укажите от 0,25 до 180 суток.':'';
                        eta.textContent=valid?daysLabel({mode:item.mode,days}):'Срок не указан';
                        const sourceRow=[...facts.children].find(row=>row.firstChild.textContent==='Источник срока');
                        if(sourceRow)sourceRow.lastChild.textContent=valid?'Срок введён пользователем, не проверен':'Требуется срок из предложения перевозчика';
                        renderEtaPanel();
                        const livePlot=root.querySelector('.mode-chart');
                        if(livePlot){const liveRows=transportScenarios();renderScenarioChart(livePlot,liveRows);renderHighlights(livePlot.parentElement,liveRows);}
                    };
                    input.addEventListener('input',save);
                    input.addEventListener('change',()=>{
                        save();
                        // Do not replace the active input or the next button during blur/click.
                        const updated=transportScenarios(),plot=root.querySelector('.mode-chart');
                        if(plot){renderScenarioChart(plot,updated);renderHighlights(plot.parentElement,updated);}
                    });
                    entry.append(label,input,help,error);body.append(entry);
                }
            }
            if(!selected){
                const button=document.createElement('button');button.type='button';button.className='mode-select-btn';button.textContent='Рассчитать этот вариант';
                button.setAttribute('aria-label','Рассчитать: '+item.name);
                button.addEventListener('click',()=>{manualRate=false;changeTransport(item.mode);visitResult();});
                body.append(button);
            }
            card.append(body);cards.append(card);
        });
        root.append(cards);
        const chart=document.createElement('details');chart.className='chart-disclosure';chart.id='comparison-chart';chart.open=expanded.has(chart.id);
        const chartLabel=document.createElement('summary');chartLabel.textContent='График стоимости и сроков';
        const plot=document.createElement('div');plot.className='mode-chart';chart.append(chartLabel,plot);root.append(chart);
        renderScenarioChart(plot,rows);
        renderHighlights(chart,rows);
        const methodology=document.createElement('details');methodology.className='comparison-methodology';methodology.id='comparison-methodology';methodology.open=expanded.has(methodology.id);
        const label=document.createElement('summary');label.textContent='Источники и ограничения';
        const text=document.createElement('p');text.className='mode-compare-disclaimer';
        text.textContent=(scenarioRoute?'Показаны расчётные сценарии по маршруту. ':'')+
            'Модельные цены не являются предложениями перевозчиков. Доступность рейсов и инфраструктура не проверяются. Сроки из предложений привязаны к маршруту, массе, типу груза и расстоянию. Время OSRM относится к автомобильным дорогам, а не к специальному маршруту грузовика.';
        methodology.append(label,text);root.append(methodology);
        // Preserve open state and keyboard position across external recalculations.
        if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
        else if(chartMetric)root.querySelector('[data-metric="'+chartMetric+'"]')?.focus({preventScroll:true});
    }

    function renderDomesticTerms(){
        if(!scopeDomestic())return;
        const goal=$('delivery-goal').value;
        const data=DOMESTIC_GOALS[goal];
        const container=$('domestic-summary');
        container.replaceChildren();
        const tag=document.createElement('div');tag.className='domestic-term';tag.textContent='ВНУТРЕННЯЯ ДОСТАВКА · ПО ДОГОВОРУ';
        const title=document.createElement('h3');title.textContent=data.title;
        const detail=document.createElement('p');detail.textContent=data.description;
        const route=document.createElement('p');route.textContent=($('origin').value.trim()||'Отправление')+' → '+($('destination').value.trim()||'Назначение');
        container.append(tag,title,detail,route);
        const matrix=$('domestic-matrix');matrix.replaceChildren();
        matrix.append(
          row('Основная перевозка',goal==='buyer'?B:A,goal==='buyer'?'Получатель':'Отправитель'),
          row('Погрузка при отправлении',goal==='buyer'?B:A,goal==='buyer'?'Получатель':'Отправитель'),
          row('Разгрузка в пункте назначения',goal==='door'?A:B,goal==='door'?'Отправитель':'Получатель'),
          row('Страхование',goal==='insured'?A:N,goal==='insured'?'Отправитель':'По соглашению сторон')
        );
    }
    // Presentation only: the calculation and scenario rules are unchanged.
    const touchedFields=new Set();
    const validationFields=['weight','distance','tariff','cargo-value','road-loading','road-tolls','road-waiting','road-other','eta-speed','eta-prep','eta-load','eta-unload','eta-buffer','carrier-eta-days','fx-manual'];
    let validationRequested=false;
    function shortRateSource(){
        if(scopeDomestic() && state.mode==='road'){
            if(manualRate || marketQuoteChoice==='manual')return 'Ваша ставка · без проверки';
            const quote=selectedMarketQuote();
            return quote ? quote.label.split(' · ')[0]+' · '+quote.date : 'Укажите ставку перевозчика';
        }
        return manualRate?'Ваша ставка · прочие расходы учебные':'Учебная ставка · можно изменить';
    }
    function setDistanceStatus(text){
        const hint=$('distance-source-short');
        if(hint && hint.textContent!==text)hint.textContent=text;
    }
    function updateDistanceStatus(){
        setDistanceStatus(manualDistance && $('distance').value.trim()?'Введено вручную':
            state.mode==='road' && roadDistance?.key===roadKey()?'По автодорогам · OSRM':
            currentRoute()?.modes[state.mode]?'Расстояние из примера':'Введите расстояние');
    }
    function updateOverview(){
        $('result-route').textContent=($('origin').value.trim()||'Откуда')+' → '+($('destination').value.trim()||'Куда');
        const cargo=$('cargo').selectedOptions[0]?.textContent||'Груз';
        const mass=calcNumber('weight');
        $('result-cargo').textContent=MODES[state.mode]+' · '+cargo+
            (Number.isFinite(mass)&&mass>0?' · '+mass.toLocaleString('ru-RU')+' т':'');
    }
    function fieldMessage(id){
        const field=$(id);
        if(!field)return '';
        const road=scopeDomestic()&&state.mode==='road';
        if(id.startsWith('road-')||id.startsWith('eta-')){
            if(!road)return '';
        }
        if(id==='carrier-eta-days' && road)return '';
        const raw=field.value.trim();
        const optional=id.startsWith('road-')||id==='carrier-eta-days'||id==='fx-manual';
        if(!raw && optional)return '';
        if(!raw || !Number.isFinite(Number(raw)))return 'Введите число.';
        const min=field.min===''?null:Number(field.min),max=field.max===''?null:Number(field.max);
        if(min!==null && Number(raw)<min)return 'Минимум — '+min.toLocaleString('ru-RU')+'.';
        if(max!==null && Number(raw)>max)return 'Максимум — '+max.toLocaleString('ru-RU')+'.';
        return '';
    }
    function syncFieldErrors(){
        validationFields.forEach(id=>{
            const field=$(id),note=$(id+'-error');
            if(!field||!note)return;
            const message=fieldMessage(id);
            // A temporarily empty field while typing is not announced as an error.
            const show=!!message && (validationRequested||touchedFields.has(id)) &&
                (field.value.trim()!==''||document.activeElement!==field||validationRequested);
            field.setAttribute('aria-invalid',String(show));
            note.hidden=!show;note.textContent=show?message:'';
        });
    }
    function goToSection(target){
        if(!target)return;
        for(let parent=target.parentElement;parent;parent=parent.parentElement){
            if(parent.tagName==='DETAILS')parent.open=true;
        }
        if(target.tagName==='DETAILS')target.open=true;
        const focusTarget=target.tagName==='DETAILS'?target.querySelector('summary'):target;
        if(focusTarget && !focusTarget.matches('input,select,button,a,summary,[tabindex]'))focusTarget.setAttribute('tabindex','-1');
        focusTarget?.focus({preventScroll:true});
        const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
    }
    function visitResult(){
        if(!hasValidInput()){
            validationRequested=true;syncFieldErrors();
            const invalid=['weight','distance','tariff','cargo-value',...ROAD_EXPENSES.map(x=>x.id)].find(id=>fieldMessage(id));
            goToSection(invalid?$(invalid):$('result-panel'));
            $('calculation-status').textContent=inputError();
            return;
        }
        goToSection($('result-panel'));
    }
    function setupInterface(){
        validationFields.forEach(id=>{
            const field=$(id);if(!field)return;
            field.addEventListener('input',()=>{touchedFields.add(id);syncFieldErrors();});
            field.addEventListener('blur',()=>{
                touchedFields.add(id);syncFieldErrors();
                $('calculation-status').textContent=fieldMessage(id)||(
                    hasValidInput()?'Расчёт обновлён: '+money(estimateValues(state.term).total):inputError());
            });
        });
        document.addEventListener('click',event=>{
            const link=event.target.closest('a[href^="#"]');
            if(!link)return;
            const id=link.getAttribute('href').slice(1);
            if(!id)return;
            const target=$(id);if(!target)return;
            event.preventDefault();
            if(id==='result-panel')visitResult();else goToSection(target);
        });
        if('IntersectionObserver' in window){
            const observer=new IntersectionObserver(entries=>{
                const visible=entries.find(entry=>entry.isIntersecting);if(!visible)return;
                document.querySelectorAll('.section-nav a').forEach(link=>{
                    if(link.getAttribute('href')==='#'+visible.target.id)link.setAttribute('aria-current','location');
                    else link.removeAttribute('aria-current');
                });
            },{rootMargin:'-10% 0px -70% 0px',threshold:0});
            ['configurator','result-panel','transport-comparison'].forEach(id=>observer.observe($(id)));
        }
    }

    function renderEstimate(){
        updateTariffUi();
        updateOverview();
        syncFieldErrors();
        // Route and delivery responsibilities must also update while numbers are invalid.
        if(scopeDomestic())renderDomesticTerms();
        const root=$('estimate-result');
        const detailsRoot=$('result-details');
        const costOpen=!!detailsRoot.querySelector('.cost-breakdown')?.open;
        const conditionsOpen=!!detailsRoot.querySelector('.estimate-summary')?.open;
        root.replaceChildren();detailsRoot.replaceChildren();
        const route=currentRoute();
        const rec=scopeDomestic()?null:recTerm();
        $('copy-result').disabled=!hasValidInput();
        if(!hasValidInput()){
            const error=document.createElement('div');error.className='estimate-empty';
            error.textContent=inputError();
            root.append(error);renderTransportComparison();renderEtaPanel();return;
        }
        const estimate=estimateValues(state.term);
        if(!estimate)return;
        const top=document.createElement('details');top.className='estimate-summary';top.id='result-conditions';top.open=conditionsOpen;
        const heading=document.createElement('summary');heading.textContent=scopeDomestic()?'Кто оплачивает доставку':'Условия '+state.term+(state.term!==rec.code?' · рекомендация '+rec.code:'');
        const recommendation=document.createElement('p');recommendation.className='estimate-recommend';
        recommendation.textContent=scopeDomestic()?DOMESTIC_GOALS[$('delivery-goal').value].title:
            state.term===rec.code ? rec.code+' — '+TERMS[rec.code].name :
            'В расчёте: '+state.term+' · по заданной цели: '+rec.code;
        const why=document.createElement('p');why.className='estimate-reason';
        why.textContent=scopeDomestic()?DOMESTIC_GOALS[$('delivery-goal').value].description:
            state.term===rec.code?rec.reason:
            'Вы вручную выбрали '+state.term+'. Суммы ниже рассчитываются по '+state.term+'. Цель «'+goalLabel[$('delivery-goal').value]+'» соответствует '+rec.code+'. '+rec.reason;
        top.append(heading,recommendation,why);
        if(!scopeDomestic() && state.term!==rec.code){
            const actions=document.createElement('div');actions.className='estimate-actions';
            const apply=document.createElement('button');apply.type='button';apply.textContent='Применить '+rec.code+' к расчёту';
            apply.addEventListener('click',()=>{state.term=rec.code;manuallyChangedTerm=false;renderAll();});
            actions.append(apply);top.append(actions);
        }
        const sum=document.createElement('div');sum.className='estimate-value';sum.textContent=money(estimate.total);
        const subFx=fxSub(estimate.total);
        if(subFx){const converted=document.createElement('div');converted.className='estimate-converted';converted.textContent='Справочно: '+subFx;root.append(converted);}
        const sumLabel=document.createElement('p');sumLabel.className='estimate-sub';sumLabel.textContent=scopeDomestic()&&state.mode==='road'?'Расходы на перевозку':'Всего расходов по модели';
        const range=document.createElement('p');range.className='estimate-sub';
        const marketChoices=marketQuotesForRoute();
        if(scopeDomestic() && state.mode==='road'){
          const quotes=marketChoices.map(q=>quoteRate(q)).filter(n=>Number.isFinite(n)&&n>0);
          if(quotes.length>=2){
            const distance=calcNumber('distance'), trucks=truckCount(calcNumber('weight'));
            range.textContent='Диапазон опубликованных ориентиров по этому направлению: '+money(Math.min(...quotes)*distance*trucks)+' — '+money(Math.max(...quotes)*distance*trucks)+' за основную перевозку (без дополнительных услуг). Разные источники и условия; не прогнозный интервал.';
          } else range.textContent='Цена основана на выбранной ставке ₽/км. Она не гарантирует цену рейса; актуальный тариф подтвердит перевозчик.';
        } else range.textContent='Иллюстративный диапазон ±25%: '+money(estimate.total*.75)+' — '+money(estimate.total*1.25)+' (не статистическая оценка).';
        root.append(sumLabel,sum);if(subFx){const x=root.querySelector('.estimate-converted');if(x)root.append(x);}
        const provenance=document.createElement('p');provenance.className='result-provenance';provenance.textContent=shortRateSource();root.append(provenance);
        const condition=document.createElement('p');condition.className='result-condition';
        condition.textContent=scopeDomestic()?DOMESTIC_GOALS[$('delivery-goal').value].title:'Расчёт по '+state.term+(state.term!==rec.code?' · по цели рекомендован '+rec.code:'');root.append(condition);
        const breakdown=document.createElement('details');breakdown.className='cost-breakdown';breakdown.id='cost-breakdown';breakdown.open=costOpen;
        const breakdownLabel=document.createElement('summary');breakdownLabel.textContent='Расходы по статьям';
        breakdown.append(breakdownLabel,range);detailsRoot.append(breakdown,top);
        const table=document.createElement('table');table.className='estimate-table';
        const thead=document.createElement('thead');thead.innerHTML='<tr><th>Статья</th><th>За счёт кого</th><th>Сумма</th></tr>';
        const body=document.createElement('tbody');
        estimate.items.forEach(item=>{
            const tr=document.createElement('tr');
            [item.name, item.owner===A?(scopeDomestic()?'Отправитель':'Продавец'):item.owner===B?(scopeDomestic()?'Получатель':'Покупатель'):'По договорённости',money(item.price)].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});
            body.append(tr);
        });
        table.append(thead,body);breakdown.append(table);
        const totals=document.createElement('p');totals.className='estimate-totals';
        totals.textContent=scopeDomestic()?'По учебной схеме: отправитель — '+money(estimate.seller)+', получатель — '+money(estimate.buyer)+'.':'По учебной схеме: продавец — '+money(estimate.seller)+', покупатель — '+money(estimate.buyer)+'.';
        breakdown.append(totals);
        if(!scopeDomestic()){
            const owners=document.createElement('dl');owners.className='result-owners';
            [['Продавец',estimate.seller],['Покупатель',estimate.buyer]].forEach(([name,amount])=>{
                const line=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');
                label.textContent=name;value.textContent=money(amount);line.append(label,value);owners.append(line);
            });
            root.append(owners);
        }
        const detail=document.createElement('p');detail.className='estimate-sub';
        detail.textContent=scopeDomestic()&&state.mode==='road'
         ? 'Автоперевозка: расстояние × опубликованная/введённая ставка ₽/маш·км'+(calcNumber('weight')>20?' × '+truckCount(calcNumber('weight'))+' расчётных машин':'')+' (не менее '+money(DOMESTIC_RATES.road.minimum)+') = '+money(estimate.main)+'. Расходы сверх ставки учитываются только по введённым пользователем суммам, без автоматического начисления.'
         : 'Основная перевозка: максимум из '+money(rateModel(state.mode).minimum)+' и (вес × расстояние × ставка) = '+money(estimate.main)+'. Остальные статьи рассчитаны по учебным ставкам.';
        breakdown.append(detail);
        if(!scopeDomestic() && state.mode==='sea' && SEA.includes(state.term)){
            const portNote=document.createElement('p');portNote.className='estimate-sub';
            portNote.textContent='Учебная стоимость обработки в порту разделена на 65% до борта и 35% за погрузку на судно. При FAS вторую часть оплачивает покупатель; при FOB, CFR, CIF — продавец. Это допущение, не тариф порта.';
            breakdown.append(portNote);
        }
        const caution=document.createElement('p');caution.className='estimate-sub';
        caution.textContent=scopeDomestic()?'Внутренняя перевозка: таможенные расходы не применяются. Распределение расходов показано как пример и определяется договором. НДС, стоимость товара и специальные сборы не учтены; суммы не являются котировкой.':'ВЭД: Incoterms распределяет задачи, затраты и риски, но не определяет рыночную цену перевозки. Таможенные пошлины, налоги, стоимость товара и специальные сборы не включены; суммы не являются котировкой.';
        breakdown.append(caution);
        renderEtaPanel();
        renderTransportComparison();
    }
    function changeTransport(mode){
        if (state.mode === mode) return;
        invalidateRoadDistance();
        state.mode=mode;
        // Километраж относится к конкретному способу перевозки;
        // не переносим ручное число с моря на автомобильную сеть и наоборот.
        manualDistance=false;
        manualDistanceKey=null;
        renderHandover();
        if (state.mode==='sea')$('handover').value=$('cargo').value==='container'?'terminal':'onboard';
        const r=currentRoute();
        $('distance').value = (r && r.modes[mode]) ? r.modes[mode] : '';
        manualRate=false;marketQuoteChoice='auto';setDefaultRate();
        if(!manuallyChangedTerm)state.term=recTerm().code;
        updateDistanceHint();
        renderAll();
        scheduleRoadLookup();
    }
    routeSelect.addEventListener('change',setPresetRoute);
    $('market-quote').addEventListener('change',e=>{
        marketQuoteChoice=e.target.value;
        manualRate=marketQuoteChoice==='manual';
        if(!manualRate)setDefaultRate();
        renderEstimate();
    });
    ROAD_EXPENSES.forEach(({id})=>$(id).addEventListener('input', renderEstimate));
    ['eta-speed','eta-prep','eta-load','eta-unload','eta-buffer'].forEach(id=>$(id).addEventListener('input',()=>{renderEtaPanel();renderTransportComparison();}));
    ['weight','distance','tariff','cargo-value'].forEach(id=>$(id).addEventListener('input',()=>{
        if(id==='distance'){invalidateRoadDistance();manualDistance=true;manualDistanceKey=roadKey();updateDistanceHint();updateRoadControls();}
        if(id==='tariff'){manualRate=true;marketQuoteChoice='manual';}
        if(id==='weight')setDefaultRate();
        renderEstimate();
    }));
    ['origin','destination'].forEach(id=>$(id).addEventListener('input',()=>{
        const hadRoadDistance = !!roadDistance;
        invalidateRoadDistance();
        if(hadRoadDistance || (manualDistance && manualDistanceKey !== roadKey())){
            manualDistance=false;
            manualDistanceKey=null;
        }
        const found=findKnownRoute();
        if(found){
            const [routeId,route]=found;
            const newScope=route.international?'international':'domestic';
            if(newScope!==state.scope){setScope(newScope,routeId);return;}
            routeSelect.value=routeId;
            if(!route.modes[state.mode]){
                const previousMode=state.mode;
                state.mode=Object.keys(route.modes)[0];
                renderHandover();
                if(state.mode==='sea' && previousMode!=='sea')
                    $('handover').value=$('cargo').value==='container'?'terminal':'onboard';
            }
            // Если пользователь уже ввёл свой километраж, не перезаписываем его.
            if(!manualDistance || !$('distance').value.trim()){
                $('distance').value=route.modes[state.mode];
                manualDistance=false;
                manualDistanceKey=null;
            }
            manualRate=false;marketQuoteChoice='auto';setDefaultRate();
        }else{
            routeSelect.value='custom';
            manualRate=false;marketQuoteChoice='auto';setDefaultRate();
            // Для своего маршрута тип поставки задаётся переключателем выше.
            if(!manualDistance){$('distance').value='';}
        }
        updateDistanceHint();
        renderAll();
    }));
    ['origin','destination'].forEach(id => $(id).addEventListener('blur', scheduleRoadLookup));
    $('road-route-btn').addEventListener('click', () => getRoadDistance(true));
    $('delivery-goal').addEventListener('change',()=>{manuallyChangedTerm=false;state.term=recTerm().code;renderAll();});
    $('customs-applicable').addEventListener('change',renderAll);
    document.querySelectorAll('[data-scope]').forEach(btn=>btn.addEventListener('click',()=>setScope(btn.dataset.scope)));

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
        const select=$('result-term');
        select.replaceChildren();
        [...ANY,...SEA].forEach(code=>{
            const option=document.createElement('option');
            option.value=code;
            option.textContent=code+' — '+TERMS[code].name;
            option.disabled=!compatible(code);
            select.append(option);
        });
        select.value=state.term;

        for (const [id, terms] of [['any-terms', ANY], ['sea-terms', SEA]]) {
            const root = $(id);
            root.replaceChildren();
            terms.forEach(code => {
                const x = document.createElement('button');
                x.type = 'button';
                x.className = 'term-btn';
                x.dataset.term=code;
                x.disabled = !compatible(code);
                x.setAttribute('aria-pressed', String(code === state.term));
                x.setAttribute('aria-label', code + ' — ' + TERMS[code].name + (x.disabled ? ' (недоступно)' : ''));
                const b = document.createElement('b');
                b.textContent = code;
                const s = document.createElement('small');
                s.textContent = code === 'FAS' ? 'вдоль борта' : code === 'FOB' ? 'на борту' : code === 'CFR' ? 'фрахт' : code === 'CIF' ? '+ страховка' : code === 'CIP' ? 'перевозка + полис' : code === 'DDP' ? '+ импорт' : code === 'DPU' ? '+ разгрузка' : code === 'DAP' ? 'до места' : code === 'CPT' ? 'перевозка' : code === 'FCA' ? 'перевозчик' : 'самовывоз';
                x.append(b, s);
                x.addEventListener('click', () => { state.term = code; manuallyChangedTerm = true; renderAll(); document.querySelector('[data-term=+code+]')?.focus({preventScroll:true}); });
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
    function renderAll() { updateRoadControls(); uiButtons(); if(!scopeDomestic()){ chooseFallback();renderTerms();const rec=recommendation();const box=$('compatibility');box.className='status'+(rec.type==='warn'?' warn':rec.type==='neutral'?' neutral':'');box.replaceChildren();const title=document.createElement('strong');title.textContent=rec.title;box.append(title,document.createTextNode(rec.message));details(state.term);renderComparison();}renderEstimate(); }
    document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => changeTransport(btn.dataset.mode)));
    $('cargo').addEventListener('change', () => {manualRate=false;marketQuoteChoice='auto';setDefaultRate(); if (state.mode === 'sea' && $('cargo').value === 'container')
        $('handover').value = 'terminal'; if (state.mode === 'sea' && $('cargo').value !== 'container' && $('handover').value === 'terminal')
        $('handover').value = 'onboard'; if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });
    $('handover').addEventListener('change', () => { if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });

    $('compare-term').addEventListener('change', e => { state.comparison = e.target.value; renderComparison(); });
    $('compare-open').addEventListener('click', () => { $('comparison').open=true;goToSection($('comparison')); });
    $('copy-domestic').addEventListener('click', async () => {
        const estimate=estimateValues('');
        if(!estimate){toast('Заполните параметры расчёта');return;}
        const rows=estimate.items.map(x=>x.name+': '+money(x.price)+' ('+(x.owner===A?'отправитель':'получатель')+')').join('\n');
        const report='Внутренняя перевозка\n'+$('origin').value+' → '+$('destination').value+'\n'+
          MODES[state.mode]+'\nУсловия: '+DOMESTIC_GOALS[$('delivery-goal').value].title+'\n'+rows+'\nИтого: '+money(estimate.total)+'\nУчебный расчёт, без таможенных статей. Распределение обязанностей определяется договором.';
        try { await navigator.clipboard.writeText(report);toast('Расчёт скопирован'); }
        catch(e){ const t=document.createElement('textarea');t.value=report;t.style.cssText='position:fixed;top:0;opacity:0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'Расчёт скопирован':'Копирование недоступно'); }
    });
    $('copy-result').addEventListener('click',()=>{
        $(scopeDomestic()?'copy-domestic':'copy').click();
    });
    $('copy').addEventListener('click', async () => {
        const c = state.term, t = TERMS[c], point = (t.place === 'origin' ? $('origin').value : $('destination').value).trim();
        const report = `Условия перевозки\nМаршрут: ${$('origin').value} → ${$('destination').value}\nВид перевозки: ${MODES[state.mode]}\nБазис: ${c} ${point}, Incoterms® 2020\nПереход риска: ${t.risk}\nЭкспортное оформление: ${person(t.export)}\nОсновная перевозка: ${person(t.freight)}\nСтрахование по базису: ${t.insurance === A ? 'Продавец' : 'Не обязателен'}\nИмпортное оформление: ${person(t.import)}\nРазгрузка: ${person(t.unloading)}\n\nУпрощённый учебный пример. Не является юридической консультацией.`;
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
    $('fx-refresh').addEventListener('click',refreshFx);
    $('carrier-eta-days').addEventListener('input',()=>{
        const input=$('carrier-eta-days'),days=Number(input.value.replace(',','.'));
        const key=etaKey(state.mode,calcNumber('distance'));
        if(input.value.trim()!=='' && Number.isFinite(days) && days>=.25 && days<=180)carrierTimes.set(key,days);
        else carrierTimes.delete(key);
        renderEtaPanel();
        syncFieldErrors();
        // This field is outside the comparison subtree, so refresh cards immediately
        // without replacing the focused input or dismissing a mobile keyboard.
        renderTransportComparison();
    });
    $('fx-manual').addEventListener('input',()=>{
        const raw=Number($('fx-manual').value.replace(',','.'));
        if(Number.isFinite(raw)&&raw>=10&&raw<=1000){usdRub=raw;fxKind='manual';}
        else {usdRub=null;fxKind='none';}
        updateFxUi();renderEstimate();
    });
    $('result-term').addEventListener('change',event=>{
        const code=event.target.value;
        if(![...ANY,...SEA].includes(code)||!compatible(code))return;
        state.term=code;manuallyChangedTerm=true;renderAll();
        $('calculation-status').textContent='Выбран '+code+'. Расчёт обновлён.';
    });
    setupInterface();
    renderHandover();
    setScope('domestic');
    refreshFx();
    reloadMarketCatalog();
})();


