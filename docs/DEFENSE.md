# FleetDesk — подготовка к защите

Документ объясняет, **как устроено приложение и почему именно так**. Все ссылки вида
`файл:строка` указывают на реальный код проекта (номера строк актуальны на момент сдачи).

---

## 1. Дерево компонентов и где живёт состояние

```
main.jsx
└─ <StrictMode>
   └─ App                                   router = createHashRouter(...)
      └─ RouterProvider
         └─ AppLayout                       шапка, навигация, <Outlet/>, <ScrollRestoration/>
            ├─ SimulatedErrorBanner         (читает ?simulateError из URL)
            │
            ├─ VehiclesPage  "#/"           state: searchInput, query, result, loadState, error, reloadKey
            │  ├─ FleetSummary              state: stats, loadState, reloadKey
            │  ├─ SearchBar                 (без состояния, controlled через props)
            │  ├─ FilterPanel → FormField×3 (без состояния)
            │  ├─ SortControl → FormField   (без состояния)
            │  ├─ ErrorMessage | Spinner | EmptyState | VehicleGrid
            │  │                                         └─ VehicleCard × N (key = vehicle.id)
            │  │                                            ├─ LicensePlate
            │  │                                            ├─ StatusBadge
            │  │                                            └─ FuelGauge
            │  └─ Pagination → FormField
            │
            ├─ VehicleDetailsPage "#/vehicles/:id"   state: tripMinutes  ← СОХРАНЯЕТСЯ между авто
            │  └─ VehicleDetails key={id}            state: vehicle, loadState, error, reloadKey  ← СБРАСЫВАЕТСЯ
            │     ├─ LicensePlate, StatusBadge, FuelGauge
            │     ├─ StatusHistory                   (key = entry.changedAt)
            │     ├─ StatusControl                   state: draftStatus, saving, error, savedStatus
            │     ├─ TripEstimator                   (без состояния: minutes приходит сверху)
            │     └─ SimilarVehicles                 state: vehicles, loadState, reloadKey
            │        └─ VehicleGrid → VehicleCard
            │
            ├─ NewVehiclePage "#/vehicles/new"
            │  └─ VehicleForm                        state: values, touched, submitAttempted,
            │                                               serverErrors, submitError, submitting
            └─ NotFoundPage "*" → EmptyState
```

**Компоненты: 22 в `src/components` + 4 страницы в `src/pages`.** `AppLayout`, `SimulatedErrorBanner`, `FleetSummary`,
`SearchBar`, `FilterPanel`, `SortControl`, `Pagination`, `VehicleGrid`, `VehicleCard`, `LicensePlate`,
`StatusBadge`, `FuelGauge`, `FormField`, `Spinner`, `ErrorMessage`, `EmptyState`, `VehicleDetails`,
`StatusControl`, `StatusHistory`, `TripEstimator`, `SimilarVehicles`, `VehicleForm`.
Примеры реального переиспользования: `VehicleGrid`/`VehicleCard` — в списке и в «похожих авто»;
`FormField` — в фильтрах, сортировке, пагинации, форме, смене статуса и калькуляторе;
`EmptyState` — пустой список, «авто не найдено», «страница не найдена», «нет альтернатив»;
`StatusBadge` — в карточке, в шапке деталей и в истории статусов.

### Почему состояние лежит именно там

| Состояние | Где | Почему |
| --- | --- | --- |
| `searchInput`, `query` (фильтры, сортировка, страница, размер страницы) | `VehiclesPage` (`src/pages/VehiclesPage.jsx:31`, `:33`) | Нужны только списку. Хранятся через `useSessionState`, чтобы пережить размонтирование при переходе в карточку и обратно. В `App` их держать незачем. |
| `result`, `loadState`, `error`, `reloadKey` | `VehiclesPage` (`:35–38`) | Это «серверное состояние» списка: результат последнего запроса и его статус. |
| `stats` | `FleetSummary` | Плиткам нужна своя сводка; родителю она не нужна — состояние «опущено» в компонент, который его использует. |
| `vehicle` и статус загрузки | `VehicleDetails` | Принадлежат одному конкретному авто; должны сбрасываться при смене `id` (см. раздел 6). |
| `tripMinutes` | `VehicleDetailsPage` (`src/pages/VehicleDetailsPage.jsx:9`) | **Поднято выше** границы `key`, чтобы сохраняться при переходе между авто (диспетчер сравнивает цены). |
| `draftStatus`, `saving`, ... | `StatusControl` | Локальное UI-состояние формы смены статуса; никому больше не нужно. |
| `values`, `touched`, ... | `VehicleForm` | Состояние формы живёт в форме. Страница `NewVehiclePage` знает только «что делать с готовыми данными» (`onSubmit`). |

**Что намеренно НЕ хранится в state (вычисляется при рендере):**
- `clientErrors` в форме — `validateVehicle(values)` (`src/components/VehicleForm.jsx:56`). Хранить ошибки
  отдельно значит рисковать рассинхроном с `values`.
- `hasActiveFilters`, `isSearchPending`, `isBusy` в списке (`VehiclesPage.jsx:110–113`).
- `totalPages` в `Pagination`, `isValid` в `TripEstimator`, «сервис просрочен» в карточке.

---

## 2. Поток данных через props

Данные идут **сверху вниз** через props, события — **снизу вверх** через callback-props.

- `VehiclesPage` → `SearchBar value={searchInput} onChange={handleSearchChange}` (`VehiclesPage.jsx:181`).
  `SearchBar` ничего не хранит: он показывает `value` и сообщает о вводе через `onChange`. Это
  «controlled component» на уровне компонента, а не только `<input>`.
- `VehiclesPage` → `FilterPanel filters={query} onFilterChange={handleFilterChange}` (`:183`).
  `FilterPanel` вызывает `onFilterChange('district', 'Medeu')` — родитель решает, как обновить state.
- `VehiclesPage` → `FleetSummary activeStatus={query.status} onStatusSelect={...}` (`:178`): компонент сам
  загружает статистику, но выбранный статус — это состояние родителя.
- `VehicleDetailsPage` → `VehicleDetails tripMinutes onTripMinutesChange` → `TripEstimator minutes onMinutesChange`
  (`VehicleDetails.jsx:152–156`): значение «пробрасывается» на два уровня вниз, а setter — как callback.
- `VehicleDetails` → `StatusControl onStatusChange={handleStatusChange}` (`VehicleDetails.jsx:150`):
  дочерний компонент сделал запрос, а **обновить авто** может только владелец state — родитель.
- `NewVehiclePage` → `VehicleForm onSubmit={handleCreate}` (`NewVehiclePage.jsx:29`): форма отдаёт
  готовые `values`, страница вызывает API и делает `navigate`.

**Композиция:** `EmptyState` и `FormField` принимают `children`. Родитель сам решает, что положить внутрь:
кнопку «Reset filters», ссылку «Back to fleet», `<select>` или `<textarea>`. Компонент не знает
о конкретном содержимом — это и есть композиция вместо «конфигурации через 20 props».

---

## 3. Как данные API попадают в UI (на примере списка)

1. Пользователь выбирает район → `onChange` у `<select>` в `FilterPanel` → `onFilterChange('district', value)`.
2. `handleFilterChange` (`VehiclesPage.jsx:71–73`) вызывает `setQuery(prev => ({ ...prev, district, page: 1 }))`.
3. React планирует **ре-рендер** `VehiclesPage`. В новом рендере `query` — новый объект.
4. После **commit** (DOM обновлён) React видит, что зависимость эффекта `query` изменилась
   (`VehiclesPage.jsx:63`), и:
   - сначала вызывает **cleanup** предыдущего эффекта → `controller.abort()` старого запроса;
   - затем запускает эффект заново (`:43–62`): создаёт `AbortController`, `setLoadState('loading')`,
     вызывает `listVehicles({ ...query, search }, { signal })`.
5. `setLoadState('loading')` → ре-рендер: старые карточки остаются, но полупрозрачные (`aria-busy`),
   в строке итогов появляется «· Updating…».
6. Через 400–900 мс API (`src/api/vehiclesApi.js:47`) читает «базу» из `localStorage`, фильтрует,
   сортирует, режет страницу и возвращает `{ items, total, page, pageSize }`.
7. В `.then` вызываются `setResult(data)` и `setLoadState('success')` — **один** ре-рендер (batching).
8. Рендер выбирает ветку `content` (`:115–154`): ошибка → `ErrorMessage`, нет данных → `Spinner`,
   `total === 0` → `EmptyState`, иначе → `VehicleGrid` + `Pagination`.
9. `VehicleGrid` рендерит `VehicleCard` для каждого `item` с `key={vehicle.id}`.

Детальная страница работает так же: `useParams()` → `id` → эффект `getVehicle(id, { signal })`
(`VehicleDetails.jsx:27–43`) → `setVehicle` → рендер.

**«Осмысленная интеграция», а не просто вывод:** API реально фильтрует/сортирует/пагинирует, плитки
сводки работают как фильтры, бизнес-правила API (зарядка только для электромобилей, аренда только при
≥ 15 % топлива, уникальный номер) возвращают ошибки, которые UI показывает у нужного поля или кнопки;
смена статуса сразу видна в бейдже и в истории; «похожие авто» — это отдельный запрос с параметрами,
вычисленными из текущего авто.

---

## 4. Что вызывает ре-рендер

Компонент перерисовывается, когда:
1. **Меняется его state** (вызван setter с новым значением). Если новое значение `Object.is`-равно старому,
   React пропускает обновление. Мы этим пользуемся: `setQuery(prev => (prev.page === 1 ? prev : {...}))`
   (`VehiclesPage.jsx:68`) и `setTouched(prev => (prev[name] ? prev : {...}))` (`VehicleForm.jsx:87`) —
   возвращаем тот же объект, если менять нечего.
2. **Перерисовывается родитель** — по умолчанию все дети рендерятся заново (мы не используем `memo`,
   потому что все компоненты дешёвые; React всё равно обновит в DOM только реально изменившееся).
3. **Меняется контекст**, который компонент читает. У нас это контекст роутера: `useParams`,
   `useLocation` (`SimulatedErrorBanner`), `NavLink`.

Ключевые места:
- Ввод в поиск → ре-рендер `VehiclesPage` (меняется `searchInput`) и всех его детей; запрос при этом
  **не** уходит — `search` меняется только через 400 мс тишины.
- Клик «Next» → `setQuery` → ре-рендер страницы → эффект → `setLoadState('loading')` → ещё ре-рендер →
  ответ → один ре-рендер с новыми данными.
- Смена статуса на детальной → в одном тике: `setVehicle` в `VehicleDetails` + `setSavedStatus`,
  `setSaving` в `StatusControl` → один общий ре-рендер.
- Ввод в калькулятор поездки → `setTripMinutes` в `VehicleDetailsPage` → ре-рендер всего поддерева
  деталей (state `VehicleDetails` при этом сохраняется — key не изменился).

---

## 5. State snapshots и batching

**Snapshot.** Значение state внутри рендера — это «снимок», постоянный для этого рендера. Вызов
setter не меняет переменную сейчас, он просит React отрисовать **следующий** рендер с новым значением.

- `VehicleForm.jsx:90–95`: `setSubmitAttempted(true)` и сразу проверка `errorCount`. `errorCount`
  посчитан из `values` **этого** рендера — это именно те данные, которые пользователь видит и отправляет.
  `submitAttempted` в этой же функции всё ещё `false` — новое значение будет только в следующем рендере.
- `VehicleForm.jsx:99`: `onSubmit(values)` отправляет снимок `values`, даже если пока идёт запрос, React
  перерисует форму (поля к этому времени заблокированы `disabled: submitting`).

**Функциональные обновления** нужны, когда новое значение зависит от предыдущего, — они получают
актуальное значение, а не снимок из замыкания:
- `setQuery(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc', page: 1 }))` (`VehiclesPage.jsx:89`).
- `setReloadKey(key => key + 1)` (`VehiclesPage.jsx:107`, `FleetSummary.jsx:35`, `VehicleDetails.jsx:71`).
- `setVehicle(prev => ({ ...prev, status, statusHistory }))` (`VehicleDetails.jsx:47–51`).
- `setValues(prev => ...)` (`VehicleForm.jsx:68`).

**Batching** (React 18 — автоматический, в том числе в промисах и таймерах): несколько `setX` в одном
обработчике/колбэке дают **один** ре-рендер.
- `handleResetFilters` (`VehiclesPage.jsx:101–104`): `setSearchInput('')` + `setQuery(...)` → один рендер.
- `handleReset` в форме (`VehicleForm.jsx:108–115`): пять setter-ов → один рендер.
- `.then` в эффекте списка (`VehiclesPage.jsx:47–51`): `setResult` + `setLoadState` → один рендер, поэтому
  невозможен кадр «статус success, но данные старые».
- `StatusControl.jsx:24–30`: после `await` вызываются `onStatusChange(updated)` (state родителя),
  `setSavedStatus`, `setSaving(false)` (state ребёнка) — React объединяет их в один рендер.

---

## 6. Keys, reconciliation, сохранение и сброс состояния

**Reconciliation:** после рендера React сравнивает новое дерево элементов со старым. Если на той же
позиции стоит компонент **того же типа с тем же key**, React сохраняет экземпляр (и его state) и только
обновляет props. Если тип или key другой — старый экземпляр размонтируется (state теряется), новый
монтируется с нуля.

**Стабильные keys в списках:**
- `VehicleGrid.jsx:7` — `key={vehicle.id}`: при смене страницы/сортировки React сопоставляет карточки по id,
  а не по позиции. Индекс как key запрещён правилом линтера `react/no-array-index-key`.
- `StatusHistory.jsx:11` — `key={entry.changedAt}`: у записи нет id, но время смены статуса уникально
  (две смены не могут произойти в одну миллисекунду — каждая проходит через API с задержкой).
  Новая запись добавляется **в начало**; с индексом в качестве key React «перепутал» бы все строки.
- `Pagination.jsx:52, :64` — номера страниц как key, а для многоточий — строки `'gap-start'`/`'gap-end'`
  (`Pagination.jsx:4–18`), чтобы два многоточия не конфликтовали.
- `FilterPanel.jsx:36` — `key={filter.name}`, `FleetSummary.jsx:54` — `key={tile.status}`.

**Сброс состояния через key (детальная страница).** Маршрут `vehicles/:id` при переходе с одного авто
на другое (клик по «похожему авто») **не размонтирует** `VehicleDetailsPage` — меняется только `id`.
Без key `VehicleDetails` сохранил бы state предыдущего авто: на мгновение показал бы старую машину
с новым id, `StatusControl` держал бы `draftStatus` и сообщение «Status changed…» от прошлого авто.
Поэтому `VehicleDetailsPage.jsx:19–24` рендерит `<VehicleDetails key={id} … />`: новый id → новый
экземпляр → весь state (данные, загрузка, ошибка, черновик статуса, «похожие авто») начинается с нуля.
Бонус: если запрос смены статуса завершится уже после перехода на другое авто, его `setState`
попадёт в **размонтированный** экземпляр и будет проигнорирован — обновление не «прилетит» не тому авто.

**Осознанное сохранение состояния.**
1. `tripMinutes` лежит в `VehicleDetailsPage` (`:9`), т.е. **выше** границы key — при переходе между
   авто значение «90 минут» сохраняется, и стоимость сразу пересчитывается по цене нового авто.
2. `SearchBar` стоит на одной и той же позиции дерева, а область результатов под ним переключается
   между `Spinner`/`ErrorMessage`/`EmptyState`/`VehicleGrid` — состояние ввода и фокус в поиске при этом
   не теряются, потому что у `SearchBar` не меняются ни тип, ни позиция.
3. Ошибка сервера в форме (например, дубликат номера) показывается **над** формой, а сама `VehicleForm`
   остаётся смонтированной — введённые данные сохраняются (`VehicleForm.jsx:101–105`).
4. Фильтры списка сохраняются даже при **размонтировании** страницы — через `sessionStorage`
   (`useSessionState`).

---

## 7. Render vs commit

- **Render** — React вызывает функции компонентов и получает дерево элементов (JSX). Это чистое
  вычисление: никаких запросов, подписок, таймеров, изменения DOM. У нас в рендере только вычисления:
  `validateVehicle(values)`, `getPageItems(...)`, выбор ветки `content`.
- **Commit** — React применяет разницу к реальному DOM (добавляет/удаляет карточки, меняет текст).
- **После commit** браузер рисует экран, а React запускает эффекты (`useEffect`). Поэтому запросы к API
  живут в эффектах и обработчиках событий, а не в теле компонента.

Пример: клик «Page 2» → render `VehiclesPage` с `page: 2` → commit (кнопка «2» получает
`aria-current`) → эффект: abort старого + новый запрос → `setLoadState('loading')` → новый render/commit
(сетка становится полупрозрачной) → ответ → render/commit с новыми карточками.

В dev-режиме `StrictMode` намеренно вызывает рендер дважды и монтирует эффекты дважды
(mount → cleanup → mount), чтобы найти нечистые рендеры и эффекты без cleanup. У нас первый запрос
просто отменяется cleanup-ом — это видно по тому, что приложение работает без дублей и ошибок.

---

## 8. Все `useEffect` проекта

| # | Где | Зачем | Зависимости | Cleanup | Что предотвращает |
| --- | --- | --- | --- | --- | --- |
| 1 | `VehiclesPage.jsx:43–63` | Загрузить страницу списка | `[query, search, reloadKey]` — всё, что попадает в запрос; `reloadKey` — для Retry | `controller.abort()` | Гонку: быстрые смены фильтров. Ответ на устаревшие параметры отменяется и не перезапишет новый. Также — `setState` после ухода со страницы. |
| 2 | `FleetSummary.jsx:14–28` | Загрузить счётчики по статусам | `[reloadKey]` — только повтор по Retry; при монтировании — один раз | `controller.abort()` | `setState` после размонтирования, двойной запрос в StrictMode. |
| 3 | `VehicleDetails.jsx:27–43` | Загрузить авто | `[id, reloadKey]` | `controller.abort()` | Быстрый уход со страницы или Retry. `id` внутри экземпляра не меняется (из-за `key={id}`), но он используется в эффекте — значит обязан быть в зависимостях (правило `exhaustive-deps`). |
| 4 | `SimilarVehicles.jsx:18–35` | Загрузить альтернативы | `[vehicleId, vehicleClass, district, reloadKey]` — все параметры запроса | `controller.abort()` | Те же гонки. |
| 5 | `useDebouncedValue.js:7–11` | Отложить обновление значения на 400 мс | `[value, delay]` | `clearTimeout(timerId)` | Каждый новый символ отменяет предыдущий таймер, поэтому запрос уходит только по последнему значению, а не по устаревшему «cam» после «camry». |
| 6 | `useSessionState.js:25–31` | Синхронизировать state с `sessionStorage` | `[key, value]` | не нужен — запись синхронная, отменять нечего | — |

**Почему `query` (объект) в зависимостях — это корректно.** `query` меняется только через `setQuery`
с новым объектом, и только когда реально меняется параметр запроса. А вот `searchInput` (меняется
при каждом нажатии клавиши) **не** входит в `query` — иначе запрос уходил бы на каждый символ.
В запрос идёт `search` — значение после debounce.

**Почему `page: 1` ставится в обработчиках, а не эффектом.** Вариант «`useEffect(() => setPage(1), [status])`»
дал бы лишний рендер и лишний запрос со старой страницей. В обработчике (`VehiclesPage.jsx:71–104`)
фильтр и страница меняются **одним** обновлением.

---

## 9. Stale closures и race conditions

**Stale closure** — функция «запомнила» значения из старого рендера.
- Обработчики используют функциональную форму (`setQuery(prev => …)`), поэтому не зависят от того,
  какой `query` был в замыкании.
- Эффекты объявляют все используемые значения в зависимостях (линтер `exhaustive-deps` настроен как
  error). Если убрать `search` из зависимостей эффекта списка, эффект продолжит использовать **старый**
  `search` из замыкания первого рендера — поиск «перестанет работать», пока не изменится что-то другое.
- Таймер debounce: если бы не было `clearTimeout`, старый таймер сработал бы со старым `value` из своего
  замыкания и перезаписал бы новое значение.

**Race condition** — два запроса в полёте, ответы приходят в другом порядке.
Пример: выбрали «Almaly» (ответ через 900 мс), затем «Zhetysu» (ответ через 400 мс). Без защиты ответ
Almaly пришёл бы последним и на экране был бы список Almaly при выбранном Zhetysu.
Защита: cleanup эффекта вызывает `controller.abort()`, simulated API на abort очищает таймер и
отклоняет Promise с `AbortError` (`src/api/network.js:32–57`), а `.catch` игнорирует `AbortError`
(`VehiclesPage.jsx:55`). Это проверено автотестом: пять быстрых смен района → все карточки из последнего.

**Дополнительно:** `key={id}` на деталях гарантирует, что поздний ответ `updateVehicleStatus` для
предыдущего авто не изменит новое (его setState уходит в размонтированный экземпляр).

---

## 10. Loading / error / empty / success

| Где | Loading | Error | Empty | Success |
| --- | --- | --- | --- | --- |
| Список (`VehiclesPage.jsx:115–154`) | первый раз — `Spinner`; повторно — старые карточки полупрозрачные + «Updating…» | `ErrorMessage` + **Retry** (увеличивает `reloadKey`) | `EmptyState` + **Reset filters** | `VehicleGrid` + `Pagination` + «Showing 1–12 of 180 vehicles» (`aria-live`) |
| Плитки (`FleetSummary.jsx`) | счётчики «…», `aria-busy` | `ErrorMessage` + Retry | — (в парке всегда есть авто) | числа + предупреждение о низком топливе |
| Детали (`VehicleDetails.jsx:54–74`) | `Spinner` | 404 → `EmptyState` «Vehicle not found»; иначе `ErrorMessage` + Retry | — | вся карточка |
| Альтернативы (`SimilarVehicles.jsx:37–56`) | `Spinner` | `ErrorMessage` + Retry | `EmptyState` «No alternatives nearby» | сетка карточек |
| Смена статуса (`StatusControl.jsx`) | кнопка «Saving…», select заблокирован | сообщение из API (например, «Cannot rent out a vehicle below 15 %…») | — | «Status changed to …» |
| Форма (`VehicleForm.jsx`) | кнопка «Saving…», все поля `disabled` | сводка + ошибки у полей (клиентские и серверные) | — | переход на страницу нового авто |

Как показать ошибки вживую: открыть `/?simulateError=1#/` (всё падает) или `/?simulateError=0.3#/`
(падает примерно 30 % запросов — удобно показать, что Retry работает).

---

## 11. События и controlled-компоненты

Controlled-компонент — значение поля хранится в React state и передаётся в `value`, а каждое изменение
идёт через `onChange` → `setState` → ре-рендер. Источник истины — state, а не DOM.

Обрабатываемые события: `onChange` (поиск, 3 фильтра, сортировка, размер страницы, 12 полей формы,
select статуса, минуты поездки), `onClick` (направление сортировки, Reset filters, плитки статусов,
пагинация, Retry, пресеты 15 мин/1 ч, Clear form, Cancel, очистка поиска), `onSubmit` (форма авто,
форма смены статуса), `onBlur` (отметка «поле тронуто» для показа ошибок).

Форма (`VehicleForm.jsx`):
- один объект `values`, один обработчик `handleChange` для всех полей через `name` (`:66–83`);
- `fieldProps(name)` (`:118–131`) раздаёт каждому полю `id`, `name`, `value`, `onChange`, `onBlur`,
  `aria-invalid`, `aria-describedby` — все поля одинаково controlled;
- все значения — строки (так их отдаёт `<input>`), числа приводит API;
- зависимые поля: смена класса с `electric` сбрасывает невозможный статус `charging` (`:71–73`);
  подпись «Fuel/Battery level» и список статусов вычисляются из `values.class`;
- `noValidate` на `<form>` — используется своя валидация с понятными сообщениями вместо браузерной.

---

## 12. Прямая работа с DOM

Её нет: ни `querySelector`, ни `innerHTML`, ни `getElementById` (кроме монтирования корня в
`main.jsx` — без DOM-узла React просто некуда смонтировать). Это **проверяет линтер**: правила
`no-restricted-properties` и `no-restricted-syntax` в `eslint.config.js`.
Единственный императивный вызов — `window.scrollTo` при смене страницы (`VehiclesPage.jsx:94`): это
API окна, а не изменение DOM-узлов; без него на телефоне после «Next» пользователь остался бы внизу.
Прокрутку при переходах между страницами выполняет `<ScrollRestoration />` из React Router.

---

## 13. Вероятные вопросы и короткие ответы

1. **Почему не всё состояние в `App`?** — Тогда любое изменение (символ в поиске) перерисовывало бы всё
   приложение, а компоненты стали бы зависимы от глобальной структуры. Состояние лежит в ближайшем
   общем владельце: фильтры — в странице списка, форма — в форме.
2. **Зачем `key={id}` у `VehicleDetails`, если эффект и так зависит от `id`?** — Эффект перезагрузил бы
   данные, но **остальной** state (старое авто на экране, черновик статуса, сообщение об успехе) остался бы.
   Key сбрасывает всё разом и без лишнего кода.
3. **Что будет, если убрать cleanup `controller.abort()`?** — Устаревшие ответы начнут перезаписывать
   новые (гонка), а в StrictMode каждый запрос будет выполняться дважды.
4. **Что будет, если убрать массив зависимостей у эффекта списка?** — Эффект запускается после каждого
   рендера, а сам вызывает `setLoadState` → бесконечный цикл запросов.
5. **А если оставить пустой массив `[]`?** — Список загрузится один раз, фильтры/поиск/пагинация
   перестанут работать (и линтер выдаст ошибку `exhaustive-deps`).
6. **Почему поиск не уходит в API на каждый символ?** — `useDebouncedValue` отдаёт новое значение только
   после 400 мс без ввода; предыдущий таймер очищается в cleanup.
7. **Почему `searchInput` и `search` — разные значения?** — `searchInput` нужен, чтобы поле мгновенно
   реагировало на ввод (controlled), `search` — чтобы не спамить API.
8. **Почему `page: 1` в обработчике, а не в эффекте?** — Одно обновление вместо двух, нет лишнего запроса
   со старой страницей, логика события («сменил фильтр → в начало») находится в обработчике события.
9. **Что такое batching и где он у вас?** — Объединение нескольких `setState` в один рендер.
   `handleReset` в форме — 5 обновлений → 1 рендер; `.then` в загрузке списка — 2 → 1.
10. **Почему `setVehicle(prev => ({ ...prev, ... }))`, а не `vehicle.status = ...`?** — Мутация не меняет
    ссылку, React не узнает об изменении и не перерисует; кроме того, мутация ломает snapshot прошлых
    рендеров. Spread создаёт новый объект.
11. **Почему key у истории статусов — `changedAt`, а не индекс?** — Новые записи добавляются в начало;
    с индексом каждая строка получила бы чужой key, и React переиспользовал бы не те элементы.
12. **Почему ошибки формы не хранятся в state?** — Они полностью вычисляются из `values`. В state лежат
    только `touched`/`submitAttempted` (когда показывать) и `serverErrors` (их нельзя вычислить на клиенте).
13. **Как форма узнаёт, что номер уже занят?** — API бросает `ApiError` 409 с `fieldErrors.plate`,
    `NewVehiclePage.handleCreate` пробрасывает ошибку, `VehicleForm` её ловит и кладёт в `serverErrors`.
14. **Почему после ошибки сервера данные формы не пропадают?** — `VehicleForm` не размонтируется: та же
    позиция и тот же тип компонента → state сохраняется.
15. **Как пережить переход «список → детали → назад» без потери фильтров?** — `useSessionState`: lazy
    initializer читает `sessionStorage` один раз при монтировании, эффект записывает изменения.
16. **Что такое lazy initializer?** — `useState(() => readSessionValue(...))`: функция вызывается только при
    первом рендере, а не на каждом (`useSessionState.js:23`, `VehicleForm.jsx:48`).
17. **Render vs commit на вашем примере?** — Render: вычислить JSX новой страницы. Commit: заменить
    карточки в DOM. Эффект с запросом — после commit.
18. **Почему HashRouter?** — Статический хостинг отдаёт `index.html` только для `/`. С `#/vehicles/…`
    сервер всегда получает `/`, а маршрут разбирает уже React Router — 404 при перезагрузке невозможен.
19. **Где «серверная» логика?** — Только в `src/api/`: фильтрация, сортировка, пагинация, валидация,
    бизнес-правила. Компоненты лишь передают параметры и показывают результат.
20. **Как проверить состояние ошибки?** — `?simulateError=1` в URL, баннер под шапкой подтверждает режим.
21. **Почему в dev каждый запрос «стартует дважды»?** — `StrictMode`: mount → cleanup → mount. Первый
    запрос отменяется cleanup-ом — это проверка того, что cleanup написан правильно.

---

## 14. Сценарии live-модификаций

### М1. Добавить ещё один фильтр (по марке)
1. `src/pages/VehiclesPage.jsx:20` — добавить `brand: 'all'` в `DEFAULT_FILTERS` (сброс и «активные
   фильтры» подхватят автоматически; `useSessionState` подставит значение по умолчанию и в уже
   сохранённый во вкладке `query`, так что select сразу будет controlled).
2. `src/components/FilterPanel.jsx:11–29` — добавить в `FILTERS` объект
   `{ name: 'brand', label: 'Brand', allLabel: 'All brands', options: BRANDS.map((value) => ({ value, label: value })) }`
   и импортировать `BRANDS` из `utils/constants.js`.
3. `src/api/vehiclesApi.js:50–66` — добавить `brand = 'all'` в деструктуризацию и условие
   `&& (brand === 'all' || vehicle.brand === brand)` в `filter`.
4. В CSS `.toolbar__controls` (`src/styles/pages.css`) на ≥1024 px добавить ещё одну колонку `minmax(0, 1fr)`.

### М2. Добавить controlled input (поле «Цвет» в форме)
1. `src/components/VehicleForm.jsx:21` — в `createInitialValues` добавить `color: ''`.
2. В JSX секции «Identification» добавить
   `<FormField id="vehicle-color" label="Colour" error={errorFor('color')}><input {...fieldProps('color')} className="input" type="text" /></FormField>`.
   `fieldProps` делает поле controlled автоматически.
3. `src/utils/validation.js` — при необходимости `if (isBlank(values.color)) errors.color = 'Colour is required.';`.
4. `src/api/vehiclesApi.js` — в `createVehicle` в объект `vehicle` добавить `color: String(data.color ?? '').trim()`.
5. Показать в деталях (см. М3).

### М3. Показать ещё одно поле API (год выпуска и число смен статуса в карточке)
`src/components/VehicleCard.jsx:32–41` — добавить в `<dl>`:
`<div><dt>Status changes</dt><dd>{vehicle.statusHistory.length}</dd></div>`.
Для деталей — новая пара `<div><dt>…</dt><dd>…</dd></div>` в `.spec-list` (`VehicleDetails.jsx`, рядом с «Fleet ID», строка ~132).

### М4. Добавить действие сброса
- «Reset all» в списке (фильтры + сортировка + размер страницы): в `VehiclesPage.jsx` добавить
  `function handleResetAll() { setSearchInput(''); setQuery(DEFAULT_QUERY); }` и кнопку рядом с
  «Reset filters» (`:190–197`). Два обновления — один рендер (batching).
- Сброс калькулятора поездки: в `TripEstimator.jsx` кнопка `onClick={() => onMinutesChange('60')}` —
  state живёт в `VehicleDetailsPage`, поэтому меняем его через callback.

### М5. Изменить зависимость эффекта и объяснить результат
`src/pages/VehiclesPage.jsx:63`:
- заменить `search` на `searchInput` (и использовать его в запросе) → запрос на каждый символ;
  гонок не будет (abort), но API нагружается и мелькает «Updating…»;
- убрать `reloadKey` → кнопка Retry перестаёт работать (state меняется, ре-рендер есть, но эффект не
  перезапускается). `exhaustive-deps` молчит — внутри эффекта `reloadKey` не читается, это специальный
  «триггер»; зато `no-unused-vars` сообщит, что переменная `reloadKey` больше нигде не используется;
- убрать `search` → линтер `exhaustive-deps` выдаёт ошибку; эффект использует устаревший `search` из
  замыкания (stale closure) — поиск применится только вместе со следующей сменой фильтра.

### М6. Добавить или изменить сортировку
- Добавить сортировку по марке: `src/utils/constants.js:70` — добавить в `SORT_FIELDS`
  `{ value: 'brand', label: 'Brand' }`. API (`compareVehicles` в `vehiclesApi.js`) сам сравнит строки
  через `localeCompare`, а `SortControl` построит `<option>` из массива.
- Изменить сортировку по умолчанию: `VehiclesPage.jsx:21–27` (`DEFAULT_QUERY`) — `sortBy: 'pricePerMinute', sortDir: 'desc'`.

### М7. Добавить условие loading/error
- Блокировать фильтры во время загрузки: в `VehiclesPage.jsx` передать `disabled={isBusy}` в
  `FilterPanel`, а в `FilterPanel.jsx` пробросить его в `<select disabled={disabled}>`.
- Отдельное сообщение для серверной ошибки 500 на деталях: в `VehicleDetails.jsx` (после ветки 404,
  ~строка 66) добавить `if (loadState === 'error' && error.status === 500) return <ErrorMessage title="Fleet server is down" … />`.
- Спиннер вместо «…» в плитках: в `FleetSummary.jsx` перед `const tiles` добавить
  `if (loadState === 'loading' && !stats) return <Spinner label="Loading fleet summary…" />;`.

### М8. Изменить обработчик события
- Для числовых полей сортировать по умолчанию по убыванию: `VehiclesPage.jsx:84–86` —
  `setQuery((prev) => ({ ...prev, sortBy, sortDir: sortBy === 'plate' ? 'asc' : 'desc', page: 1 }))`.
- Плитка статуса без «toggle» (повторный клик не снимает фильтр): `VehiclesPage.jsx:75–82` —
  `status: status` вместо `prev.status === status ? 'all' : status`.
- Не очищать сообщение об успехе при смене select статуса: удалить `setSavedStatus(null)` в
  `StatusControl.jsx:37`.

---

## 15. Как быстро показать всё на защите (≈ 3 минуты)

1. Список: плитки → клик «Charging» → фильтр класса → сортировка по цене ↓ → страница 2.
2. Поиск «camry» (видно «Updating…» во время debounce), затем «zzzz» → empty state → Reset filters.
3. Открыть авто → сменить статус → бейдж и история обновились; ввести 90 минут → открыть «похожее авто»
   → минуты сохранились, статус-форма сброшена (key).
4. «Назад» → фильтры на месте (sessionStorage).
5. Add vehicle → пустая отправка → ошибки → заполнить → переход на новое авто → F5 → авто на месте.
6. `?simulateError=1` → ошибка + Retry; `#/vehicles/veh-9999` → «Vehicle not found».
