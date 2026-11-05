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
            try{ response=await fetch('./tariffs.json?v=9', {cache:'no-store',signal:ctrl.signal}); }
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
        $('road-extra').disabled=false;
    }
    function updateTariffUi(){
        $('tariff-label').textContent='Расчётная ставка, '+tariffUnits();
        $('cargo-value-label').textContent='Стоимость груза, '+(scopeDomestic()?'₽':'USD');
        populateMarketOptions();
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
    const usd = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
    const rub = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
    const money = n => scopeDomestic()?rub(n):usd(n);
    let usdRub = null, fxDate = '', fxKind = 'none', fxRequest = false;
    const fxSub = n => usdRub ? (scopeDomestic()?usd(n/usdRub):rub(n*usdRub)) : null;
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
        buyer: {label:'Самовывоз — перевозку оплачивает получатель',title:'Самовывоз / доставка за счёт получателя',description:'Получатель организует и оплачивает основную перевозку; погрузка и разгрузка распределены по учебному допущению.'},
        seller: {label:'Доставку до пункта оплачивает отправитель',title:'Доставка за счёт отправителя',description:'Отправитель организует и оплачивает основную перевозку, разгрузка — за счёт получателя по учебному допущению.'},
        insured: {label:'Доставка отправителем + добровольное страхование',title:'Доставка отправителем со страхованием',description:'Отправитель оплачивает перевозку и условную стоимость страхования груза.'},
        door: {label:'Доставка отправителем с разгрузкой',title:'Доставка с разгрузкой за счёт отправителя',description:'Отправитель оплачивает перевозку, обработку и разгрузку в месте назначения по учебной модели.'}
    };
    const INTL_GOALS = {
        buyer:'Основную перевозку организует покупатель',
        seller:'Основную перевозку организует продавец',
        insured:'Продавец оплачивает перевозку и страхование',
        door:'Продавец доставляет товар до места назначения'
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
        $('incoterms-detail').hidden=scopeDomestic();
        $('comparison').hidden=scopeDomestic();
        $('domestic-info').hidden=!scopeDomestic();
        $('incoterms-nav-link').hidden=scopeDomestic();
        $('delivery-goal-label').textContent=scopeDomestic()?'Кто организует и оплачивает доставку?':'Какое условие поставки нужно?';
        $('hero-lead').textContent=scopeDomestic()
          ? 'Рассчитайте доставку по России и сравните варианты перевозки. Таможенные процедуры и Incoterms здесь не используются.'
          : 'Международная поставка: оценка логистических расходов, распределение обязанностей и подбор Incoterms 2020.';
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
    function normalizedPlace(text){return text.trim().toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[.,]/g,'').replace(/\s+/g,' ');}
    function findKnownRoute(){
        const start=normalizedPlace($('origin').value);
        const finish=normalizedPlace($('destination').value);
        return Object.entries(ROUTES).find(([,route]) => normalizedPlace(route.from)===start && normalizedPlace(route.to)===finish);
    }
    function updateDistanceHint(){
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
        $('road-extra').value='0';
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
        const roadExtra=(!intl&&mode==='road')?Math.max(0,calcNumber('road-extra')):0;
        const customs=intl && $('customs-applicable').checked;
        const exportDoc=customs?180:0;
        const importAdmin=customs?220:0;
        const insurance=intl
          ? ((term==='CIF'||term==='CIP')?Math.max(70,declaredValue*(term==='CIP'?0.006:0.003)):0)
          : (goal==='insured'?Math.max(500,declaredValue*.003):0);
        const items=[
            {name:'Погрузка / обработка при отправлении',price:origin,owner:intl?(term==='EXW'?B:A):(goal==='buyer'?B:A)},
            {name:'Основная перевозка',price:main,owner:intl?t.freight:(goal==='buyer'?B:A)},
            ...(roadExtra>0?[{name:'Дополнительные услуги (введены вручную)',price:roadExtra,owner:goal==='buyer'?B:A}]:[]),
            ...(customs?[{name:'Услуги по экспортному оформлению (условно)',price:exportDoc,owner:t.export}]:[]),
            {name:'Обработка / разгрузка в пункте назначения',price:destination,owner:intl?t.unloading:(goal==='door'?A:B)},
            ...(customs?[{name:'Услуги по импортному оформлению (без пошлин)',price:importAdmin,owner:t.import}]:[]),
            ...(insurance>0?[{name:intl?'Страхование по базису':'Добровольное страхование груза (модель)',price:insurance,owner:intl?t.insurance:A}]:[])
        ].filter(x=>x.price>0);
        const total=items.reduce((s,x)=>s+x.price,0);
        const seller=items.filter(x=>x.owner===A).reduce((s,x)=>s+x.price,0);
        return {items,total,seller,buyer:total-seller,main,route};
    }

    // V6: сравнение ограничено явно описанными учебными сценариями.
    // Не предполагает фактической доступности морского, железнодорожного или авиационного сервиса.
    const DELIVERY_MODEL = {
        // Все сроки — диапазоны для модели "склад → склад", а не опубликованные расписания.
        road: {kmPerDay: 550, handlingDays: .8, uncertaintyDays: 1},
        rail: {kmPerDay: 550, handlingDays: 2.5, uncertaintyDays: 2},
        sea: {kmPerDay: 430, handlingDays: 4, uncertaintyDays: 4},
        air: {kmPerDay: 6000, handlingDays: 2.0, uncertaintyDays: 1},
        multi: {kmPerDay: 470, handlingDays: 3.5, uncertaintyDays: 2}
    };
    const distanceNum = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n);
    const daysLabel = row => (typeof row==='number'?'~'+row+' дн.':'~'+row.daysMin+'–'+row.daysMax+' дн.');
    const goalLabel = {buyer:'Перевозку организует покупатель',seller:'Перевозку организует продавец',insured:'Продавец оплачивает перевозку и страхование',door:'Доставка до места назначения'};
    const scopeGoalLabel = goal => scopeDomestic() ? DOMESTIC_GOALS[goal].title : goalLabel[goal];
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
    function transportScenarios(){
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
            const daily=DELIVERY_MODEL[mode];
            const roadResult=mode==='road' && (roadDistance?.key===roadKey()?roadDistance:roadCache.get(roadKey()));
            // При ручном исправлении километража время старого маршрута не применяется.
            const osrm=roadResult && roadResult.km===distance ? roadResult : null;
            // Чистое время OSRM — не срок доставки. Используем 9 ч движения/день,
            // плюс обработка, резерв и возможные ограничения. Другие виды — модель.
            const routeDays=osrm ? osrm.seconds/3600/9 : distance/daily.kmPerDay;
            const rawDays=routeDays+daily.handlingDays;
            const daysMin=Math.max(1,Math.ceil(rawDays));
            const daysMax=daysMin+daily.uncertaintyDays;
            const days=(daysMin+daysMax)/2; // Только для ранжирования и графика.
            rows.push({mode,name:MODES[mode],distance,distSource,rate,term,recommendedTerm,total:estimate.total,freight:estimate.main,days,daysMin,daysMax,sourceTime:osrm?'Движение OSRM + расчётные этапы':'Расчётная скорость + обработка и резерв'});
        }
        return rows;
    }
    function transportWinners(rows){
        const costMin=Math.min(...rows.map(r=>r.total)),costMax=Math.max(...rows.map(r=>r.total));
        const timeMin=Math.min(...rows.map(r=>r.days)),timeMax=Math.max(...rows.map(r=>r.days));
        const cheapest=[...rows].sort((a,b)=>a.total-b.total||a.days-b.days)[0];
        const fastest=[...rows].sort((a,b)=>a.days-b.days||a.total-b.total)[0];
        const balanced=[...rows].sort((a,b)=>{
            const aScore=.5*(a.total-costMin)/(costMax-costMin||1)+.5*(a.days-timeMin)/(timeMax-timeMin||1);
            const bScore=.5*(b.total-costMin)/(costMax-costMin||1)+.5*(b.days-timeMin)/(timeMax-timeMin||1);
            return aScore-bScore || a.total-b.total;
        })[0];
        return {cheapest,fastest,balanced};
    }
    function renderTransportComparison(){
        const root=$('transport-comparison-result');
        if(!root)return;
        root.replaceChildren();
        const scenarioRoute=currentRoute();
        const rows=transportScenarios();
        $('transport-context').textContent=($('origin').value.trim()||'Пункт отправления')+' → '+($('destination').value.trim()||'Пункт назначения')+' · '+(scopeGoalLabel($('delivery-goal').value)||'Сравнение схем');
        if (!rows.length){
            const empty=document.createElement('p');empty.className='mode-compare-empty';
            empty.textContent='Для сравнения нужны положительные вес и стоимость груза, а также расстояние и тариф. Проверьте параметры расчёта.';
            root.append(empty);return;
        }
        const summary=document.createElement('p');summary.className='mode-compare-disclaimer';
        summary.textContent=scenarioRoute ? (scopeDomestic()?'Россия: только для тентованных автоперевозок приведены проверяемые опубликованные ориентиры с датой; остальные виды транспорта — учебная модель. Сроки не подтверждены расписаниями.':'ВЭД: затраты в USD, курс ЦБ РФ — для пересчёта в рубли. Ставки и сроки доставки не подтверждены перевозчиками.') : 'Для своего маршрута показан только выбранный вид транспорта. Для сравнения нескольких видов выберите маршрут из примеров.';
        root.append(summary);
        if(rows.length>1){
            const winners=transportWinners(rows);
            const panels=document.createElement('div');panels.className='mode-winners';
            [
                ['Минимальные расходы (модель)',winners.cheapest,money(winners.cheapest.total)],
                ['Самый быстрый по модели',winners.fastest,daysLabel(winners.fastest)],
                ['Баланс 50/50 (модель)',winners.balanced,money(winners.balanced.total)+' · '+daysLabel(winners.balanced)]
            ].forEach(([label,item,value])=>{
                const card=document.createElement('div');card.className='mode-winner';
                const caption=document.createElement('span');caption.className='mode-winner-label';caption.textContent=label;
                const name=document.createElement('strong');name.textContent=item.name;
                const result=document.createElement('span');result.className='mode-winner-value';
                const converted=label==='Самый быстрый по модели'?null:fxSub(item.total);
                result.textContent=value+(converted?' · '+converted:'');
                card.append(caption,name,result);panels.append(card);
            });
            root.append(panels);
        }
        const plot=document.createElement('div');plot.className='mode-chart';
        const head=document.createElement('div');head.className='mode-chart-head';
        const headTitle=document.createElement('h3');headTitle.textContent='Сравнение сценариев (модель)';
        const switches=document.createElement('div');switches.className='mode-chart-tabs';switches.setAttribute('role','group');switches.setAttribute('aria-label','Что показать на графике');
        [['cost','Стоимость'],['time','Срок']].forEach(([value,label])=>{
            const button=document.createElement('button');button.type='button';button.textContent=label;
            button.setAttribute('aria-pressed',String(value===transportChartMetric));
            button.addEventListener('click',()=>{transportChartMetric=value;renderTransportComparison();});
            switches.append(button);
        });
        head.append(headTitle,switches);plot.append(head);
        const maximum=Math.max(...rows.map(r=>transportChartMetric==='cost'?r.total:r.days));
        [...rows].sort((a,b)=>transportChartMetric==='cost'?a.total-b.total:a.days-b.days).forEach(item=>{
            const row=document.createElement('div');row.className='mode-chart-row';
            const line=document.createElement('div');line.className='mode-chart-line';
            const n=document.createElement('span');n.className='mode-chart-label';n.textContent=item.name;
            const v=document.createElement('strong');v.className='mode-chart-value';v.textContent=transportChartMetric==='cost'?money(item.total):daysLabel(item);
            line.append(n,v);
            const track=document.createElement('div');track.className='mode-chart-track';
            const fill=document.createElement('div');fill.className='mode-chart-fill';
            fill.style.width=Math.max(2,100*(transportChartMetric==='cost'?item.total:item.days)/maximum)+'%';
            if(item.mode===state.mode)fill.classList.add('selected');
            track.append(fill);row.append(line,track);plot.append(row);
        });
        root.append(plot);
        const cards=document.createElement('div');cards.className='mode-option-grid';
        rows.forEach(item=>{
            const card=document.createElement('article');card.className='mode-option';
            if(item.mode===state.mode)card.classList.add('mode-option-active');
            const top=document.createElement('div');top.className='mode-option-head';
            const title=document.createElement('strong');title.textContent=item.name;
            const flag=document.createElement('span');flag.className='mode-option-tag';flag.textContent=item.mode===state.mode?'Выбранный':'Учебная альтернатива';
            top.append(title,flag);
            const amounts=document.createElement('div');amounts.className='mode-option-amounts';
            const total=document.createElement('b');total.textContent=money(item.total);
            const converted=fxSub(item.total);if(converted)total.title='Справочно: '+converted;
            const eta=document.createElement('span');eta.textContent=daysLabel(item);
            amounts.append(total,eta);
            const details=document.createElement('dl');details.className='mode-option-facts';
            [['Расстояние',distanceNum(item.distance)+' км'],['Основная перевозка',money(item.freight)],...(scopeDomestic()? [['Условия доставки',scopeGoalLabel($('delivery-goal').value)]] : [['Базис в расчёте',item.term],['Рекомендация Incoterms',item.recommendedTerm]]),['Источник расстояния',item.distSource],['Источник ставки',scopeDomestic()&&item.mode==='road'?(marketQuoteSummary()||'Ручной ввод, не проверено'):'Учебный тариф'],['Срок',daysLabel(item)+' · модель'],...(fxSub(item.total)?[['В другой валюте',fxSub(item.total)]]:[])].forEach(([key,value],i)=>{
                const wrap=document.createElement('div'),k=document.createElement('dt'),v=document.createElement('dd');
                k.textContent=key;v.textContent=value;wrap.append(k,v);details.append(wrap);
            });
            const button=document.createElement('button');button.type='button';button.className='mode-select-btn';
            button.textContent=item.mode===state.mode?'Выбран в калькуляторе':'Рассчитать этот вариант';
            button.disabled=item.mode===state.mode;
            button.addEventListener('click',()=>{
                // Reuse original changeTransport (same state transitions & guards).
                manualRate=false;
                changeTransport(item.mode);
                $('estimate-title').scrollIntoView({behavior:'smooth',block:'start'});
            });
            card.append(top,amounts,details,button);cards.append(card);
        });
        root.append(cards);
        const foot=document.createElement('p');foot.className='mode-compare-disclaimer';
        foot.textContent='Принцип: внутренняя автоставка — рубли за машино-километр (НЕ за тонно-километр). Другие ставки — модель. ВЭД — USD/т·км. Срок — диапазон, включающий обработку и резерв; OSRM определяет только чистое движение, для авто приняты 9 часов движения в день. Данные о реальных рейсах, границах, наличии вагонов, транспортных ограничениях и складских слотах отсутствуют. Рейтинг и баланс зависят от введённых допущений.';
        root.append(foot);
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
    function renderEstimate(){
        updateTariffUi();
        const root=$('estimate-result');
        root.replaceChildren();
        const route=currentRoute();
        const rec=scopeDomestic()?null:recTerm();
        if(!hasValidInput()){
            const error=document.createElement('div');error.className='estimate-empty';
            error.textContent='Укажите положительные вес, расстояние и ставку. Если опубликованных тарифов для груза или маршрута нет, внесите полученную от перевозчика ставку вручную. Стоимость груза не должна быть отрицательной.';
            root.append(error);renderTransportComparison();return;
        }
        const estimate=estimateValues(state.term);
        if(!estimate)return;
        const top=document.createElement('div');top.className='estimate-summary';
        const heading=document.createElement('h3');heading.textContent=scopeDomestic()?'Договорная схема доставки':'Подходящий базис под выбранную задачу';
        const recommendation=document.createElement('p');recommendation.className='estimate-recommend';
        recommendation.textContent=scopeDomestic()?DOMESTIC_GOALS[$('delivery-goal').value].title:rec.code+' — '+TERMS[rec.code].name;
        const why=document.createElement('p');why.className='estimate-reason';
        why.textContent=scopeDomestic()?DOMESTIC_GOALS[$('delivery-goal').value].description:rec.reason;
        top.append(heading,recommendation,why);
        if(!scopeDomestic() && state.term!==rec.code){
            const actions=document.createElement('div');actions.className='estimate-actions';
            const apply=document.createElement('button');apply.type='button';apply.textContent='Выбрать '+rec.code;
            apply.addEventListener('click',()=>{state.term=rec.code;manuallyChangedTerm=false;renderAll();});
            actions.append(apply);top.append(actions);
        }
        root.append(top);
        const sum=document.createElement('div');sum.className='estimate-value';sum.textContent=money(estimate.total);
        const subFx=fxSub(estimate.total);
        if(subFx){const converted=document.createElement('div');converted.className='estimate-converted';converted.textContent='Справочно: '+subFx;root.append(converted);}
        const sumLabel=document.createElement('p');sumLabel.className='estimate-sub';sumLabel.textContent=scopeDomestic()?(state.mode==='road'?'Ориентировочная стоимость по опубликованной/введённой ставке, без неуказанных услуг и таможенных статей':'Сумма условных расходов по внутренней перевозке, без таможенных статей'):'Сумма моделируемых транспортных и сопутствующих расходов · выбран базис '+state.term;
        const range=document.createElement('p');range.className='estimate-sub';
        const marketChoices=marketQuotesForRoute();
        if(scopeDomestic() && state.mode==='road'){
          const quotes=marketChoices.map(q=>quoteRate(q)).filter(n=>Number.isFinite(n)&&n>0);
          if(quotes.length>=2){
            const distance=calcNumber('distance'), trucks=truckCount(calcNumber('weight'));
            range.textContent='Диапазон опубликованных ориентиров по этому направлению: '+money(Math.min(...quotes)*distance*trucks)+' — '+money(Math.max(...quotes)*distance*trucks)+' за основную перевозку (без дополнительных услуг). Разные источники и условия; не прогнозный интервал.';
          } else range.textContent='Цена основана на выбранной ставке ₽/км. Она не гарантирует цену рейса; актуальный тариф подтвердит перевозчик.';
        } else range.textContent='Иллюстративный диапазон ±25%: '+money(estimate.total*.75)+' — '+money(estimate.total*1.25)+' (не статистическая оценка).';
        root.append(sum);if(subFx){const x=root.querySelector('.estimate-converted');if(x)root.append(x);}root.append(sumLabel,range);
        const table=document.createElement('table');table.className='estimate-table';
        const thead=document.createElement('thead');thead.innerHTML='<tr><th>Статья</th><th>За счёт кого</th><th>Сумма</th></tr>';
        const body=document.createElement('tbody');
        estimate.items.forEach(item=>{
            const tr=document.createElement('tr');
            [item.name, item.owner===A?(scopeDomestic()?'Отправитель':'Продавец'):item.owner===B?(scopeDomestic()?'Получатель':'Покупатель'):'По договорённости',money(item.price)].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td)});
            body.append(tr);
        });
        table.append(thead,body);root.append(table);
        const totals=document.createElement('p');totals.className='estimate-totals';
        totals.textContent=scopeDomestic()?'По учебной схеме: отправитель — '+money(estimate.seller)+', получатель — '+money(estimate.buyer)+'.':'По учебной схеме: продавец — '+money(estimate.seller)+', покупатель — '+money(estimate.buyer)+'.';
        root.append(totals);
        const detail=document.createElement('p');detail.className='estimate-sub';
        detail.textContent=scopeDomestic()&&state.mode==='road'
         ? 'Автоперевозка: расстояние × опубликованная/введённая ставка ₽/маш·км'+(calcNumber('weight')>20?' × '+truckCount(calcNumber('weight'))+' расчётных машин':'')+' (не менее '+money(DOMESTIC_RATES.road.minimum)+') = '+money(estimate.main)+'. Дополнительные услуги включаются только если указаны вручную.'
         : 'Основная перевозка: максимум из '+money(rateModel(state.mode).minimum)+' и (вес × расстояние × ставка) = '+money(estimate.main)+'. Остальные статьи рассчитаны по учебным ставкам.';
        root.append(detail);
        const caution=document.createElement('p');caution.className='estimate-sub';
        caution.textContent=scopeDomestic()?'Внутренняя перевозка: таможенные расходы не применяются. Распределение расходов показано как пример и определяется договором. НДС, стоимость товара и специальные сборы не учтены; суммы не являются котировкой.':'ВЭД: Incoterms распределяет задачи, затраты и риски, но не определяет рыночную цену перевозки. Таможенные пошлины, налоги, стоимость товара и специальные сборы не включены; суммы не являются котировкой.';
        root.append(caution);
        if(scopeDomestic())renderDomesticTerms();
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
    $('road-extra').addEventListener('input', renderEstimate);
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
    function renderAll() { updateRoadControls(); uiButtons(); if(!scopeDomestic()){ chooseFallback();renderTerms();const rec=recommendation();const box=$('compatibility');box.className='status'+(rec.type==='warn'?' warn':rec.type==='neutral'?' neutral':'');box.replaceChildren();const title=document.createElement('strong');title.textContent=rec.title;box.append(title,document.createTextNode(rec.message));details(state.term);renderComparison();}renderEstimate(); }
    document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => changeTransport(btn.dataset.mode)));
    $('cargo').addEventListener('change', () => {manualRate=false;marketQuoteChoice='auto';setDefaultRate(); if (state.mode === 'sea' && $('cargo').value === 'container')
        $('handover').value = 'terminal'; if (state.mode === 'sea' && $('cargo').value !== 'container' && $('handover').value === 'terminal')
        $('handover').value = 'onboard'; if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });
    $('handover').addEventListener('change', () => { if (!manuallyChangedTerm) state.term=recTerm().code; renderAll(); });

    $('compare-term').addEventListener('change', e => { state.comparison = e.target.value; renderComparison(); });
    $('compare-open').addEventListener('click', () => { $('comparison').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('copy-domestic').addEventListener('click', async () => {
        const estimate=estimateValues('');
        if(!estimate){toast('Заполните параметры расчёта');return;}
        const rows=estimate.items.map(x=>x.name+': '+money(x.price)+' ('+(x.owner===A?'отправитель':'получатель')+')').join('\n');
        const report='Внутренняя перевозка\n'+$('origin').value+' → '+$('destination').value+'\n'+
          MODES[state.mode]+'\nУсловия: '+DOMESTIC_GOALS[$('delivery-goal').value].title+'\n'+rows+'\nИтого: '+money(estimate.total)+'\nУчебный расчёт, без таможенных статей. Распределение обязанностей определяется договором.';
        try { await navigator.clipboard.writeText(report);toast('Расчёт скопирован'); }
        catch(e){ const t=document.createElement('textarea');t.value=report;t.style.cssText='position:fixed;top:0;opacity:0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'Расчёт скопирован':'Копирование недоступно'); }
    });
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
    $('fx-refresh').addEventListener('click',refreshFx);
    $('fx-manual').addEventListener('input',()=>{
        const raw=Number($('fx-manual').value.replace(',','.'));
        if(Number.isFinite(raw)&&raw>=10&&raw<=1000){usdRub=raw;fxKind='manual';}
        else {usdRub=null;fxKind='none';}
        updateFxUi();renderEstimate();
    });
    renderHandover();
    setScope('domestic');
    refreshFx();
    reloadMarketCatalog();
})();

