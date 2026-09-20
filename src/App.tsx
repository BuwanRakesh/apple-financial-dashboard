import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  FileSearch,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Menu,
  Moon,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

const years = [2023, 2024, 2025] as const;
type Year = (typeof years)[number];

type FinancialYear = {
  sales: number;
  products: number;
  services: number;
  cost: number;
  gross: number;
  rd: number;
  sga: number;
  operating: number;
  income: number;
};

const financials: Record<Year, FinancialYear> = {
  2023: { sales: 383285, products: 298085, services: 85200, cost: 214137, gross: 169148, rd: 29915, sga: 24932, operating: 114301, income: 96995 },
  2024: { sales: 391035, products: 294866, services: 96169, cost: 210352, gross: 180683, rd: 31370, sga: 26097, operating: 123216, income: 93736 },
  2025: { sales: 416161, products: 307003, services: 109158, cost: 220960, gross: 195201, rd: 34550, sga: 27601, operating: 133050, income: 112010 },
};

const balanceRows = [
  ['Cash and cash equivalents', 35934, 29943],
  ['Marketable securities', 18763, 35228],
  ['Accounts receivable, net', 39777, 33410],
  ['Vendor non-trade receivables', 33180, 32833],
  ['Inventories', 5718, 7286],
  ['Other current assets', 14585, 14287],
  ['Total current assets', 147957, 152987],
  ['Property, plant and equipment, net', 49834, 45680],
  ['Other non-current assets', 83727, 74834],
  ['Total assets', 359241, 364980],
  ['Accounts payable', 69860, 68960],
  ['Other current liabilities', 66387, 78304],
  ['Term debt', 12350, 10912],
  ['Total current liabilities', 165631, 176392],
  ['Total non-current liabilities', 119877, 131638],
  ['Total liabilities', 285508, 308030],
  ["Total shareholders' equity", 73733, 56950],
  ["Total liabilities and shareholders' equity", 359241, 364980],
] as const;

const incomeRows = [
  ['Products', 307003, 294866, 298085],
  ['Services', 109158, 96169, 85200],
  ['Total net sales', 416161, 391035, 383285],
  ['Cost of sales', 220960, 210352, 214137],
  ['Gross margin', 195201, 180683, 169148],
  ['Research and development', 34550, 31370, 29915],
  ['Selling, general and administrative', 27601, 26097, 24932],
  ['Total operating expenses', 62151, 57467, 54847],
  ['Operating income', 133050, 123216, 114301],
  ['Other income/(expense), net', -321, 269, -565],
  ['Income before provision for income taxes', 132729, 123485, 113736],
  ['Provision for income taxes', 20719, 29749, 16741],
  ['Net income', 112010, 93736, 96995],
  ['Basic earnings per share', 7.49, 6.11, 6.16],
  ['Diluted earnings per share', 7.46, 6.08, 6.13],
] as const;

const forecastYears = [2023, 2024, 2025, 2026, 2027, 2028];

const formatValue = (value: number, compact = false) => compact ? `$${(value / 1000).toFixed(1)}B` : `$${value.toLocaleString()}M`;
const percent = (value: number) => `${value.toFixed(1)}%`;

const donutSegments = [
  { key: 'operating', label: 'Operating income', value: 133050, color: '#a9dfc4', cssClass: 'mint' },
  { key: 'cost', label: 'Cost of sales', value: 220960, color: '#8eb8d4', cssClass: 'blue' },
  { key: 'opex', label: 'R&D + SG&A', value: 62151, color: '#44636b', cssClass: 'slate' },
];

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, start);
  const o2 = polar(cx, cy, rOuter, end);
  const i1 = polar(cx, cy, rInner, end);
  const i2 = polar(cx, cy, rInner, start);
  return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

type CardId = 'kpi-sales' | 'kpi-income' | 'kpi-gross' | 'kpi-net' | 'panel-breakdown' | 'panel-ratios' | 'panel-forecast-controls' | 'panel-forecast-chart' | 'panel-trend-summary' | 'panel-deep-dive' | 'panel-dupont';

type ScenarioKey = 'base' | 'recession' | 'hyper' | null;

const scenarioPresets: { key: ScenarioKey; label: string; sub: string; growth: number; opex: number; icon: typeof TrendingUp }[] = [
  { key: 'base', label: 'Base Case', sub: '+6.4% rev · 14.9% opex', growth: 6.4, opex: 14.9, icon: TrendingUp },
  { key: 'recession', label: 'Recession Shock', sub: '-15% rev · 18.0% opex', growth: -10, opex: 18.0, icon: TrendingDown },
  { key: 'hyper', label: 'Hyper Growth', sub: '+20% rev · 12.5% opex', growth: 20, opex: 12.5, icon: Zap },
];

function App() {
  const [active, setActive] = useState('Overview');
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statement, setStatement] = useState<'Income Statement' | 'Balance Sheet'>('Income Statement');
  const [query, setQuery] = useState('');
  const [growthRate, setGrowthRate] = useState(6.4);
  const [opexMargin, setOpexMargin] = useState(14.9);
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [hoveredDonut, setHoveredDonut] = useState<string | null>(null);
  const [selectedDonut, setSelectedDonut] = useState<string | null>(null);
  const [hoveredStack, setHoveredStack] = useState<number | null>(null);
  const [selectedStack, setSelectedStack] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('base');

  const latest = financials[2025];
  const prior = financials[2024];
  const grossMargin = (latest.gross / latest.sales) * 100;
  const netMargin = (latest.income / latest.sales) * 100;
  const revenueGrowth = ((latest.sales - prior.sales) / prior.sales) * 100;
  const currentRatio = 147957 / 165631;
  const filteredIncome = useMemo(() => incomeRows.filter(([label]) => label.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredBalance = useMemo(() => balanceRows.filter(([label]) => label.toLowerCase().includes(query.toLowerCase())), [query]);

  const costRatio = latest.cost / latest.sales;
  const historicalOpexMargin = ((latest.rd + latest.sga) / latest.sales) * 100;
  const incomeRatio = latest.income / latest.operating;

  const projection = useMemo(() => {
    const rows: { year: number; sales: number; income: number; cost: number; opex: number; historical: boolean }[] = [];
    let prevSales = latest.sales;
    for (let i = 0; i < forecastYears.length; i++) {
      const year = forecastYears[i];
      if (year <= 2025) {
        const d = financials[year as Year];
        rows.push({ year, sales: d.sales, income: d.income, cost: d.cost, opex: d.rd + d.sga, historical: true });
        prevSales = d.sales;
      } else {
        const sales = prevSales * (1 + growthRate / 100);
        const cost = sales * costRatio;
        const gross = sales - cost;
        const opex = sales * (opexMargin / 100);
        const operating = gross - opex;
        const income = operating * incomeRatio;
        rows.push({ year, sales, income, cost, opex, historical: false });
        prevSales = sales;
      }
    }
    return rows;
  }, [growthRate, opexMargin, costRatio, incomeRatio, latest]);

  const fy2026 = projection[3];
  const cagr = (Math.pow(latest.sales / financials[2023].sales, 1 / 2) - 1) * 100;
  const expensesOutpacing = opexMargin > historicalOpexMargin;
  const projectedRevGrowth = growthRate;
  const projectedOpexGrowth = ((opexMargin - historicalOpexMargin) / historicalOpexMargin) * 100 + growthRate;

  const totalAssets2025 = 359241;
  const totalEquity2025 = 73733;
  const dupontHistorical = {
    profitMargin: (latest.income / latest.sales) * 100,
    assetTurnover: latest.sales / totalAssets2025,
    financialLeverage: totalAssets2025 / totalEquity2025,
    roe: (latest.income / latest.sales) * (latest.sales / totalAssets2025) * (totalAssets2025 / totalEquity2025) * 100,
  };
  const projectedAssets = totalAssets2025 * Math.pow(1 + growthRate / 100, 3);
  const projectedEquity = totalEquity2025 + (projection.slice(3).reduce((sum, p) => sum + p.income, 0));
  const dupontProjected = {
    profitMargin: (projection[5].income / projection[5].sales) * 100,
    assetTurnover: projection[5].sales / projectedAssets,
    financialLeverage: projectedAssets / projectedEquity,
    roe: (projection[5].income / projection[5].sales) * (projection[5].sales / projectedAssets) * (projectedAssets / projectedEquity) * 100,
  };

  const donutTotal = donutSegments.reduce((s, seg) => s + seg.value, 0);

  const nav = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Charts', icon: BarChart3 },
    { label: 'Statement Explorer', icon: FileSearch },
    { label: 'Ratio Analysis', icon: CircleDollarSign },
    { label: 'Forecasting', icon: LineChartIcon },
    { label: 'Deep Dive', icon: CircleDollarSign },
  ];

  const switchSection = (label: string) => {
    setActive(label);
    setMobileOpen(false);
    const target = label === 'Statement Explorer' ? 'statements' : label === 'Ratio Analysis' ? 'ratios' : label === 'Charts' ? 'charts' : label === 'Forecasting' ? 'forecast' : label === 'Deep Dive' ? 'deep-dive' : 'overview';
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleCard = (id: CardId) => setSelectedCard((prev) => (prev === id ? null : id));

  const applyScenario = (key: ScenarioKey) => {
    if (key === activeScenario) return;
    const preset = scenarioPresets.find((s) => s.key === key);
    if (!preset) return;
    setGrowthRate(preset.growth);
    setOpexMargin(preset.opex);
    setActiveScenario(key);
  };

  const onSliderChange = (setter: (v: number) => void, value: number) => {
    setter(value);
    setActiveScenario(null);
  };

  return (
    <div className={dark ? 'app-shell dark' : 'app-shell'}>
      <aside className={mobileOpen ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="brand"><div className="brand-mark">A</div><div><strong>APPLE</strong><span>Financial Intelligence</span></div><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <div className="company-card"><div className="company-logo"></div><div><strong>Apple Inc.</strong><span>NASDAQ · AAPL</span></div><ShieldCheck size={15} /></div>
        <p className="nav-label">WORKSPACE</p>
        <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => switchSection(label)}><Icon size={17} /><span>{label}</span>{label === 'Statement Explorer' && <span className="nav-badge">2</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="source-card"><BookOpen size={16} /><div><strong>2025 Form 10-K</strong><span>Filed Oct 31, 2025</span></div><ChevronDown size={15} /></div><button className="nav-item"><Settings2 size={17} /><span>Workspace settings</span></button><div className="analyst"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><span>Senior Analyst</span></div><ChevronDown size={15} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="crumb"><span>Portfolio</span><span>/</span><strong>Apple Inc.</strong></div><div className="top-actions"><div className="period"><span>Reporting period</span><strong>FY 2025 <ChevronDown size={14} /></strong></div><button className="icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><div className="top-avatar">AM</div></div></header>

        <div className="content-wrap">
          <section id="overview" className="hero"><div><div className="eyebrow"><span className="status-dot" /> FY 2025 · Audited results</div><h1>Executive overview</h1><p>Apple Inc. financial performance at a glance, prepared from the consolidated 10-K statements.</p></div><button className="export-btn"><FileSearch size={16} /> View source filing</button></section>

          <section className="kpi-grid">
            <Kpi id="kpi-sales" label="Total net sales" value={formatValue(latest.sales, true)} trend="+6.4%" detail="vs. FY 2024" positive selected={selectedCard === 'kpi-sales'} onClick={() => toggleCard('kpi-sales')} />
            <Kpi id="kpi-income" label="Net income" value={formatValue(latest.income, true)} trend="+19.5%" detail="vs. FY 2024" positive selected={selectedCard === 'kpi-income'} onClick={() => toggleCard('kpi-income')} />
            <Kpi id="kpi-gross" label="Gross profit margin" value={percent(grossMargin)} trend="+1.2 pts" detail="vs. FY 2024" positive selected={selectedCard === 'kpi-gross'} onClick={() => toggleCard('kpi-gross')} />
            <Kpi id="kpi-net" label="Net profit margin" value={percent(netMargin)} trend="+2.0 pts" detail="vs. FY 2024" positive selected={selectedCard === 'kpi-net'} onClick={() => toggleCard('kpi-net')} />
          </section>

          <section id="charts" className="analytics-grid">
            <div className="panel trend-panel">
              <PanelHeader eyebrow="PERFORMANCE" title="Revenue & earnings trend" action="3-year view" />
              <div className="legend"><span><i className="legend-sales" />Net sales</span><span><i className="legend-income" />Net income</span></div>
              <div className="bar-chart">
                {years.map((year) => {
                  const data = financials[year];
                  const barKey = `bar-${year}`;
                  const isHovered = hoveredBar === barKey;
                  const isSelected = selectedBar === barKey;
                  const hasSelection = selectedBar !== null;
                  return (
                    <div className="bar-group" key={year}>
                      <div className="bars">
                        <div
                          className={`bar sales ${isSelected && !isHovered ? 'dimmed' : ''} ${isHovered || isSelected ? 'bright' : ''}`}
                          style={{ height: `${(data.sales / 450000) * 100}%` }}
                          onMouseEnter={() => setHoveredBar(barKey)}
                          onMouseLeave={() => setHoveredBar(null)}
                          onClick={() => setSelectedBar((prev) => (prev === barKey ? null : barKey))}
                        >
                          <span>{(data.sales / 1000).toFixed(0)}B</span>
                          {(isHovered || isSelected) && <div className="bar-tooltip"><strong>{year} Net sales</strong><span>{formatValue(data.sales)}</span></div>}
                        </div>
                        <div
                          className={`bar income ${isSelected && !isHovered ? 'dimmed' : ''} ${isHovered || isSelected ? 'bright' : ''}`}
                          style={{ height: `${(data.income / 450000) * 100}%` }}
                          onMouseEnter={() => setHoveredBar(barKey)}
                          onMouseLeave={() => setHoveredBar(null)}
                          onClick={() => setSelectedBar((prev) => (prev === barKey ? null : barKey))}
                        >
                          <span>{(data.income / 1000).toFixed(0)}B</span>
                          {(isHovered || isSelected) && <div className="bar-tooltip tooltip-income"><strong>{year} Net income</strong><span>{formatValue(data.income)}</span></div>}
                        </div>
                      </div>
                      <strong>{year}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="axis-labels"><span>$0</span><span>$150B</span><span>$300B</span><span>$450B</span></div>
              {selectedBar && <div className="chart-hint">Click again to deselect · Bar selected: {selectedBar.replace('bar-', 'FY ')}</div>}
            </div>
            <div className="panel segment-panel">
              <PanelHeader eyebrow="REVENUE MIX" title="Product vs. service sales" action="In $M" />
              <div className="segment-summary"><div><span className="summary-dot product" />Products <strong>{formatValue(latest.products, true)}</strong></div><div><span className="summary-dot service" />Services <strong>{formatValue(latest.services, true)}</strong></div></div>
              <div className="stack-chart">
                {years.map((year, idx) => {
                  const data = financials[year];
                  const isHovered = hoveredStack === idx;
                  const isSelected = selectedStack === idx;
                  const hasSelection = selectedStack !== null;
                  return (
                    <div
                      className={`stack-group ${hasSelection && !isHovered && !isSelected ? 'dimmed' : ''} ${isHovered || isSelected ? 'bright' : ''}`}
                      key={year}
                      onMouseEnter={() => setHoveredStack(idx)}
                      onMouseLeave={() => setHoveredStack(null)}
                      onClick={() => setSelectedStack((prev) => (prev === idx ? null : idx))}
                    >
                      <div className="stack-bar" style={{ height: `${(data.sales / 450000) * 100}%` }}>
                        <div className="product-fill" style={{ height: `${(data.products / data.sales) * 100}%` }} />
                        <div className="service-fill" />
                      </div>
                      <strong>{year}</strong>
                      {(isHovered || isSelected) && (
                        <div className="stack-tooltip">
                          <strong>FY {year}</strong>
                          <span>Products: {formatValue(data.products)}</span>
                          <span>Services: {formatValue(data.services)}</span>
                          <span>Total: {formatValue(data.sales)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="segment-callout"><ArrowUpRight size={16} /><span>Services now represent <strong>{((latest.services / latest.sales) * 100).toFixed(1)}%</strong> of total sales, up from 22.3% in 2023.</span></div>
            </div>
          </section>

          <section className="lower-grid">
            <div className={`panel breakdown-panel interactive-card ${selectedCard === 'panel-breakdown' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-breakdown')}>
              <PanelHeader eyebrow="PROFITABILITY" title="Cost vs. profit breakdown" action="FY 2025" />
              <div className="donut-wrap">
                <DonutChart
                  segments={donutSegments}
                  total={donutTotal}
                  centerLabel={formatValue(latest.operating, true)}
                  centerSub="operating income"
                  hovered={hoveredDonut}
                  selected={selectedDonut}
                  onHover={setHoveredDonut}
                  onSelect={setSelectedDonut}
                />
                <div className="breakdown-list">
                  {donutSegments.map((seg) => (
                    <Breakdown
                      key={seg.key}
                      color={seg.cssClass}
                      label={seg.label}
                      value={seg.value}
                      total={donutTotal}
                      dimmed={selectedDonut !== null && selectedDonut !== seg.key}
                      highlighted={hoveredDonut === seg.key || selectedDonut === seg.key}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div id="ratios" className={`panel ratio-panel interactive-card ${selectedCard === 'panel-ratios' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-ratios')}>
              <PanelHeader eyebrow="HEALTH CHECK" title="Key financial ratios" action="Learn more" />
              <div className="ratio-row"><div className="ratio-icon mint-bg"><ArrowUpRight size={17} /></div><div className="ratio-copy"><span>YoY revenue growth</span><strong>{percent(revenueGrowth)}</strong><small>Strong top-line momentum</small></div><div className="mini-line"><i /><i /><i /><i /><i /><i /><i /></div></div>
              <div className="ratio-row"><div className="ratio-icon blue-bg"><CircleDollarSign size={17} /></div><div className="ratio-copy"><span>Current ratio</span><strong>{currentRatio.toFixed(2)}x</strong><small>Healthy short-term liquidity</small></div><div className="ratio-meter"><div style={{ width: `${Math.min(currentRatio / 2 * 100, 100)}%` }} /></div></div>
              <div className="ratio-footer"><span>Liquidity coverage</span><strong>Good standing</strong></div>
            </div>
          </section>

          <section id="forecast" className="forecast-section">
            <div className="forecast-head"><div><div className="eyebrow"><span className="status-dot forecast-dot" /> SCENARIO MODELING</div><h2>Financial forecasting &amp; trend analysis</h2><p>Adjust the drivers below to model a 3-year forward projection (FY 2026–2028) from the historical 2023–2025 baseline.</p></div><button className="export-btn" onClick={() => { setGrowthRate(6.4); setOpexMargin(14.9); setActiveScenario('base'); }}><RotateCcw size={16} /> Reset to baseline</button></div>

            <div className="forecast-grid">
              <div className={`panel forecast-controls interactive-card ${selectedCard === 'panel-forecast-controls' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-forecast-controls')}>
                <PanelHeader eyebrow="WHAT-IF DRIVERS" title="Scenario assumptions" action="Live" />
                <div className="slider-block">
                  <div className="slider-top"><span>Revenue growth rate</span><strong className={growthRate >= 0 ? 'positive' : 'negative'}>{growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%</strong></div>
                  <input type="range" min={-10} max={25} step={0.1} value={growthRate} onChange={(e) => onSliderChange(setGrowthRate, Number(e.target.value))} className="slider" />
                  <div className="slider-track-labels"><span>-10%</span><span>0%</span><span>+25%</span></div>
                  <p className="slider-hint">Applied compounded to FY 2025 net sales of {formatValue(latest.sales, true)}.</p>
                </div>
                <div className="slider-block">
                  <div className="slider-top"><span>Operating expense margin</span><strong className={opexMargin > historicalOpexMargin ? 'negative' : 'positive'}>{opexMargin.toFixed(1)}%</strong></div>
                  <input type="range" min={8} max={22} step={0.1} value={opexMargin} onChange={(e) => onSliderChange(setOpexMargin, Number(e.target.value))} className="slider" />
                  <div className="slider-track-labels"><span>8%</span><span>15%</span><span>22%</span></div>
                  <p className="slider-hint">R&amp;D + SG&amp;A as a share of sales. FY 2025 baseline: {historicalOpexMargin.toFixed(1)}%.</p>
                </div>
                <div className="driver-summary">
                  <div><span>Assumed cost of sales</span><strong>{(costRatio * 100).toFixed(1)}%</strong></div>
                  <div><span>Implied gross margin</span><strong>{((1 - costRatio) * 100).toFixed(1)}%</strong></div>
                  <div><span>Net conversion rate</span><strong>{(incomeRatio * 100).toFixed(1)}%</strong></div>
                </div>
              </div>

              <div className={`panel forecast-chart-panel interactive-card ${selectedCard === 'panel-forecast-chart' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-forecast-chart')}>
                <PanelHeader eyebrow="PROJECTION PATH" title="Revenue & income trajectory" action="2023–2028" />
                <div className="legend"><span><i className="legend-sales" />Net sales</span><span><i className="legend-income" />Net income</span><span><i className="legend-forecast" />Projected</span></div>
                <ForecastChart projection={projection} />
              </div>
            </div>

            <div className="tally-row">
              <div className="tally-card"><span>Where will the year end? · FY 2026</span><div className="tally-figures"><div><small>Projected revenue</small><strong>{formatValue(fy2026.sales, true)}</strong></div><div><small>Cost of goods sold</small><strong>{formatValue(fy2026.cost, true)}</strong></div><div><small>Net income</small><strong className="positive">{formatValue(fy2026.income, true)}</strong></div></div></div>
              <div className="tally-card tally-secondary"><span>3-year forward outlook · FY 2028</span><div className="tally-figures"><div><small>Projected revenue</small><strong>{formatValue(projection[5].sales, true)}</strong></div><div><small>Cost of goods sold</small><strong>{formatValue(projection[5].cost, true)}</strong></div><div><small>Net income</small><strong className="positive">{formatValue(projection[5].income, true)}</strong></div></div></div>
            </div>

            <div className={`panel trend-summary interactive-card ${selectedCard === 'panel-trend-summary' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-trend-summary')}>
              <div className="summary-head"><AlertTriangle size={16} className={expensesOutpacing ? 'warn' : 'ok'} /><strong>Trend analysis summary</strong></div>
              <p>
                Over the audited 3-year window (FY 2023–2025), Apple's net sales grew from {formatValue(financials[2023].sales, true)} to {formatValue(latest.sales, true)}, representing a <strong>compounded annual growth rate (CAGR) of {cagr.toFixed(1)}%</strong>. Net income over the same period expanded at a {((Math.pow(latest.income / financials[2023].income, 1 / 2) - 1) * 100).toFixed(1)}% CAGR, outpacing top-line growth and reflecting margin expansion.
              </p>
              <p>
                Under your active scenario, revenue is modeled to grow at <strong>{percent(projectedRevGrowth)} per annum</strong>, reaching {formatValue(projection[5].sales, true)} by FY 2028. {expensesOutpacing
                  ? <>However, your operating expense margin of <strong>{opexMargin.toFixed(1)}%</strong> exceeds the FY 2025 baseline of {historicalOpexMargin.toFixed(1)}%, meaning <strong>projected expenses are outpacing projected revenue growth</strong> (opex trending ~{projectedOpexGrowth.toFixed(1)}% YoY vs. {projectedRevGrowth.toFixed(1)}% revenue). This will compress operating margins and should be reviewed before locking the scenario.</>
                  : <>Operating expense margin of <strong>{opexMargin.toFixed(1)}%</strong> remains at or below the FY 2025 baseline of {historicalOpexMargin.toFixed(1)}%, so expense growth is <strong>contained within revenue growth</strong> and operating margins hold steady or expand.</>}
              </p>
            </div>
          </section>

          <section id="deep-dive" className="deep-dive-section">
            <div className={`panel deep-dive-panel interactive-card ${selectedCard === 'panel-deep-dive' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-deep-dive')}>
              <div className="deep-dive-head"><div><div className="eyebrow"><span className="status-dot forecast-dot" /> MACRO STRESS-TESTING</div><h2>Advanced accounting deep-dive</h2><p>Instantly reposition all scenario drivers with a macro preset, or fine-tune sliders above for a custom outlook.</p></div></div>
              <div className="scenario-presets">
                {scenarioPresets.map(({ key, label, sub, icon: Icon }) => (
                  <button key={key} className={`scenario-btn ${activeScenario === key ? 'scenario-active' : ''}`} onClick={() => applyScenario(key)}>
                    <div className="scenario-icon-wrap"><Icon size={18} /></div>
                    <div className="scenario-copy"><strong>{label}</strong><span>{sub}</span></div>
                    {activeScenario === key && <span className="scenario-check">Active</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className={`panel dupont-panel interactive-card ${selectedCard === 'panel-dupont' ? 'card-selected' : ''}`} onClick={() => toggleCard('panel-dupont')}>
              <div className="dupont-head"><div><div className="eyebrow"><span className="status-dot" /> DUPONT FRAMEWORK</div><h2>ROE decomposition matrix</h2><p>Return on Equity broken into three drivers: margin efficiency, asset utilization, and financial leverage.</p></div></div>
              <div className="dupont-grid">
                <div className="dupont-step">
                  <span className="dupont-step-num">1</span>
                  <div className="dupont-step-body">
                    <small>Profit Margin</small>
                    <strong>{percent(dupontHistorical.profitMargin)}</strong>
                    <span className="dupont-formula">Net Income ÷ Sales</span>
                  </div>
                </div>
                <div className="dupont-x">×</div>
                <div className="dupont-step">
                  <span className="dupont-step-num">2</span>
                  <div className="dupont-step-body">
                    <small>Asset Turnover</small>
                    <strong>{dupontHistorical.assetTurnover.toFixed(2)}x</strong>
                    <span className="dupont-formula">Sales ÷ Total Assets</span>
                  </div>
                </div>
                <div className="dupont-x">×</div>
                <div className="dupont-step">
                  <span className="dupont-step-num">3</span>
                  <div className="dupont-step-body">
                    <small>Financial Leverage</small>
                    <strong>{dupontHistorical.financialLeverage.toFixed(2)}x</strong>
                    <span className="dupont-formula">Assets ÷ Equity</span>
                  </div>
                </div>
                <div className="dupont-equals">=</div>
                <div className="dupont-roe">
                  <small>Return on Equity</small>
                  <strong>{percent(dupontHistorical.roe)}</strong>
                  <span className="dupont-formula">FY 2025 Historical</span>
                </div>
              </div>
              <div className="dupont-projected">
                <div className="dupont-proj-label"><Zap size={14} /> Projected FY 2028 under active scenario</div>
                <div className="dupont-proj-grid">
                  <div><small>Profit Margin</small><strong>{percent(dupontProjected.profitMargin)}</strong></div>
                  <div><small>Asset Turnover</small><strong>{dupontProjected.assetTurnover.toFixed(2)}x</strong></div>
                  <div><small>Financial Leverage</small><strong>{dupontProjected.financialLeverage.toFixed(2)}x</strong></div>
                  <div className="dupont-proj-roe"><small>Projected ROE</small><strong>{percent(dupontProjected.roe)}</strong></div>
                </div>
              </div>
            </div>
          </section>

          <section id="statements" className="panel statement-panel"><div className="statement-head"><div><div className="eyebrow">SOURCE STATEMENTS</div><h2>Statement explorer</h2><p>Verified figures in millions, as reported in Apple's consolidated financial statements.</p></div><div className="statement-tools"><div className="search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search line items" /></div></div></div><div className="tabs"><button className={statement === 'Income Statement' ? 'tab active' : 'tab'} onClick={() => setStatement('Income Statement')}>Income Statement <span>15</span></button><button className={statement === 'Balance Sheet' ? 'tab active' : 'tab'} onClick={() => setStatement('Balance Sheet')}>Balance Sheet <span>18</span></button></div><div className="table-scroll"><table><thead><tr><th>Line item</th>{statement === 'Income Statement' ? <><th>FY 2025</th><th>FY 2024</th><th>FY 2023</th></> : <><th>Sep 27, 2025</th><th>Sep 28, 2024</th><th>Change</th></>}</tr></thead><tbody>{statement === 'Income Statement' ? filteredIncome.map(([label, y25, y24, y23], index) => <tr className={['Total net sales', 'Gross margin', 'Operating income', 'Net income'].includes(label) ? 'emphasis' : ''} key={label}><td>{label}</td><td>{index > 12 ? `$${y25.toFixed(2)}` : formatValue(y25)}</td><td>{index > 12 ? `$${y24.toFixed(2)}` : formatValue(y24)}</td><td>{index > 12 ? `$${y23.toFixed(2)}` : formatValue(y23)}</td></tr>) : filteredBalance.map(([label, y25, y24]) => <tr className={label.startsWith('Total') ? 'emphasis' : ''} key={label}><td>{label}</td><td>{formatValue(y25)}</td><td>{formatValue(y24)}</td><td className={y25 >= y24 ? 'positive' : 'negative'}>{y25 >= y24 ? '+' : ''}{formatValue(y25 - y24)}</td></tr>)}</tbody></table></div></section>
          <footer><span>Apple Financial Intelligence</span><span>Source: Apple Inc. 2025 Form 10-K · Amounts in millions unless noted</span></footer>
        </div>
      </main>
    </div>
  );
}

function Kpi({ id, label, value, trend, detail, positive, selected, onClick }: { id: string; label: string; value: string; trend: string; detail: string; positive?: boolean; selected: boolean; onClick: () => void }) {
  return (
    <div
      className={`kpi-card interactive-card ${selected ? 'card-selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="kpi-top"><span>{label}</span><div className={positive ? 'trend positive' : 'trend negative'}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{trend}</div></div>
      <strong>{value}</strong>
      <small>{detail}</small>
      {selected && <span className="card-selected-badge">Selected</span>}
    </div>
  );
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action: string }) { return <div className="panel-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div><button className="panel-action">{action}<ChevronDown size={14} /></button></div>; }

function Breakdown({ color, label, value, total, dimmed, highlighted }: { color: string; label: string; value: number; total: number; dimmed?: boolean; highlighted?: boolean }) {
  return (
    <div className={`breakdown-item ${dimmed ? 'dimmed' : ''} ${highlighted ? 'highlighted' : ''}`}>
      <span className={`breakdown-dot ${color}`} />
      <span>{label}</span>
      <strong>{formatValue(value, true)}</strong>
      <small>{((value / total) * 100).toFixed(1)}%</small>
    </div>
  );
}

function DonutChart({ segments, total, centerLabel, centerSub, hovered, selected, onHover, onSelect }: {
  segments: { key: string; label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
  centerSub: string;
  hovered: string | null;
  selected: string | null;
  onHover: (key: string | null) => void;
  onSelect: (key: string | null) => void;
}) {
  const cx = 80, cy = 80, rOuter = 77, rInner = 50;
  let angle = 0;
  const arcs = segments.map((seg) => {
    const sweep = (seg.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...seg, start, end, path: arcPath(cx, cy, rOuter, rInner, start, end) };
  });
  const hasSelection = selected !== null;
  return (
    <div className="donut-container">
      <svg viewBox="0 0 160 160" className="donut-svg">
        {arcs.map((arc) => {
          const isHovered = hovered === arc.key;
          const isSelected = selected === arc.key;
          const dimmed = hasSelection && !isSelected;
          return (
            <path
              key={arc.key}
              d={arc.path}
              fill={arc.color}
              className={`donut-arc ${dimmed ? 'dimmed' : ''} ${isHovered || isSelected ? 'bright' : ''}`}
              style={isHovered || isSelected ? { transform: 'scale(1.04)', transformOrigin: '80px 80px' } : undefined}
              onMouseEnter={() => onHover(arc.key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(selected === arc.key ? null : arc.key)}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={rInner - 2} fill="var(--surface)" />
      </svg>
      <div className="donut-center-overlay">
        <strong>{centerLabel}</strong>
        <span>{centerSub}</span>
      </div>
      {(hovered || selected) && (() => {
        const active = segments.find((s) => s.key === (hovered || selected))!;
        return (
          <div className="donut-tooltip">
            <strong>{active.label}</strong>
            <span>{formatValue(active.value)}</span>
            <small>{((active.value / total) * 100).toFixed(1)}% of total</small>
          </div>
        );
      })()}
    </div>
  );
}

function ForecastChart({ projection }: { projection: { year: number; sales: number; income: number; historical: boolean }[] }) {
  const W = 640, H = 280;
  const padL = 52, padR = 24, padT = 22, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = 600000;
  const x = (i: number) => padL + (i / (projection.length - 1)) * plotW;
  const y = (v: number) => padT + (1 - v / maxV) * plotH;
  const toPoints = (key: 'sales' | 'income', range: [number, number]) => projection.slice(range[0], range[1] + 1).map((p, idx) => `${x(range[0] + idx)},${y(p[key])}`).join(' ');
  const salesHist = toPoints('sales', [0, 2]);
  const salesFc = toPoints('sales', [2, 5]);
  const incomeHist = toPoints('income', [0, 2]);
  const incomeFc = toPoints('income', [2, 5]);
  const gridLines = [0, 150000, 300000, 450000, 600000];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="forecast-svg" preserveAspectRatio="xMidYMid meet">
      {gridLines.map((g) => <g key={g}><line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} className="fc-grid" /><text x={padL - 8} y={y(g) + 3} className="fc-axis-label">${(g / 1000).toFixed(0)}B</text></g>)}
      <line x1={x(2)} y1={padT} x2={x(2)} y2={H - padB} className="fc-divider" />
      <text x={x(1)} y={padT - 6} className="fc-phase-label" textAnchor="middle">Historical</text>
      <text x={x(4)} y={padT - 6} className="fc-phase-label" textAnchor="middle">Projected</text>
      <polyline points={salesHist} className="fc-line fc-sales" />
      <polyline points={salesFc} className="fc-line fc-sales fc-dashed" />
      <polyline points={incomeHist} className="fc-line fc-income" />
      <polyline points={incomeFc} className="fc-line fc-income fc-dashed" />
      {projection.map((p, i) => <g key={p.year}><circle cx={x(i)} cy={y(p.sales)} r={3.5} className={p.historical ? 'fc-dot fc-sales-dot' : 'fc-dot fc-sales-dot fc-fc-dot'} /><circle cx={x(i)} cy={y(p.income)} r={3.5} className={p.historical ? 'fc-dot fc-income-dot' : 'fc-dot fc-income-dot fc-fc-dot'} /><text x={x(i)} y={H - padB + 16} className="fc-x-label" textAnchor="middle">{p.year}</text></g>)}
    </svg>
  );
}

export default App;
