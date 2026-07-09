
/* ---------------- helpers ---------------- */
function fmt(n, cur){
  const s = Math.round(n).toLocaleString('en-IN');
  return cur + s;
}
function fmtPlain(n){ return Math.round(n).toLocaleString('en-IN'); }

function bindRange(id, valId, suffix, isCurrency, currencyId){
  const el = document.getElementById(id);
  const out = document.getElementById(valId);
  if(!el || !out) return;
  const update = () => {
    let v = parseFloat(el.value);
    if(isCurrency){
      const cur = currencyId ? document.getElementById(currencyId).value : '';
      out.textContent = fmtPlain(v);
    } else {
      out.textContent = v + suffix;
    }
  };
  el.addEventListener('input', update);
  update();
}

function bindNumberToRange(rangeId){
  const range = document.getElementById(rangeId);
  const num = document.getElementById(rangeId + 'Num');
  if(!range || !num) return;
  num.value = range.value;
  range.addEventListener('input', () => { num.value = range.value; });
  num.addEventListener('input', () => {
    const v = parseFloat(num.value);
    if(isNaN(v)) return;
    range.value = v; // native range input clamps to its own min/max
    range.dispatchEvent(new Event('input', {bubbles:true}));
  });
  num.addEventListener('blur', () => { num.value = range.value; });
  num.addEventListener('keydown', (e) => { if(e.key === 'Enter') num.blur(); });
}
function syncNumFromRange(rangeId){
  const range = document.getElementById(rangeId);
  const num = document.getElementById(rangeId + 'Num');
  if(range && num) num.value = range.value;
}

document.querySelectorAll('input[type="range"]').forEach(r => bindNumberToRange(r.id));

bindRange('sipAmount','sipAmountVal','',true);
bindRange('sipReturn','sipReturnVal','%');
bindRange('sipYears','sipYearsVal',' yrs');
bindRange('sipStep','sipStepVal','%');
bindRange('swpCorpus','swpCorpusVal','',true);
bindRange('swpWithdraw','swpWithdrawVal','',true);
bindRange('swpReturn','swpReturnVal','%');
bindRange('swpYears','swpYearsVal',' yrs');
bindRange('loanAmount','loanAmountVal','',true);
bindRange('loanRate','loanRateVal','%');
bindRange('loanTenure','loanTenureVal',' yrs');
bindRange('loanFee','loanFeeVal','%');
if(document.getElementById('loanIncome')){
  document.getElementById('loanIncome').addEventListener('input', function(){
    const v = parseFloat(this.value);
    document.getElementById('loanIncomeVal').textContent = v>0 ? fmtPlain(v) : 'Optional';
  });
}
bindRange('depositRate','depositRateVal','%');
bindRange('depositTenure','depositTenureVal',' yrs');
bindRange('retireCurAge','retireCurAgeVal','');
bindRange('retireAge','retireAgeVal','');
bindRange('retireLife','retireLifeVal','');
bindRange('retireExpense','retireExpenseVal','',true);
bindRange('retireInflation','retireInflationVal','%');
bindRange('retirePreReturn','retirePreReturnVal','%');
bindRange('retirePostReturn','retirePostReturnVal','%');
bindRange('retireExisting','retireExistingVal','',true);
if(document.getElementById('depositAmount')){
  document.getElementById('depositAmount').addEventListener('input', function(){
    document.getElementById('depositAmountVal').textContent = fmtPlain(parseFloat(this.value));
  });
}
if(document.getElementById('govtAmount')){
  document.getElementById('govtAmount').addEventListener('input', function(){
    document.getElementById('govtAmountVal').textContent = fmtPlain(parseFloat(this.value));
  });
}
bindRange('govtRate','govtRateVal','%');
if(document.getElementById('govtTenure')){
  document.getElementById('govtTenure').addEventListener('input', function(){
    document.getElementById('govtTenureVal').textContent = this.value + ' yrs';
  });
}

/* ---------------- SVG area chart ---------------- */
function drawAreaChart(svgId, seriesA, seriesB, colorA, colorB, labelA, labelB){
  const svg = document.getElementById(svgId);
  const W = 900, H = 280, padL = 46, padR = 20, padT = 20, padB = 30;
  const n = seriesA.length;
  const maxVal = Math.max(...seriesA, ...seriesB, 1);
  const x = i => padL + (i/(n-1)) * (W - padL - padR);
  const y = v => padT + (1 - v/maxVal) * (H - padT - padB);

  function pathFor(series){
    let d = `M ${x(0)} ${y(series[0])}`;
    for(let i=1;i<n;i++) d += ` L ${x(i)} ${y(series[i])}`;
    return d;
  }
  function areaFor(series){
    let d = pathFor(series);
    d += ` L ${x(n-1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
    return d;
  }

  const gridLines = [0,0.25,0.5,0.75,1].map(f => {
    const yy = padT + (1-f)*(H-padT-padB);
    return `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}" stroke="var(--line)" stroke-width="1"/>
            <text x="${padL-8}" y="${yy+4}" text-anchor="end" font-family="JetBrains Mono" font-size="10" fill="var(--ink-soft)">${Math.round(maxVal*f/1000)}k</text>`;
  }).join('');

  svg.innerHTML = `
    <defs>
      <linearGradient id="${svgId}gradA" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colorA}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${colorA}" stop-opacity="0.02"/>
      </linearGradient>
      <linearGradient id="${svgId}gradB" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colorB}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${colorB}" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaFor(seriesB)}" fill="url(#${svgId}gradB)"/>
    <path d="${pathFor(seriesB)}" fill="none" stroke="${colorB}" stroke-width="2.5"/>
    <path d="${areaFor(seriesA)}" fill="url(#${svgId}gradA)"/>
    <path d="${pathFor(seriesA)}" fill="none" stroke="${colorA}" stroke-width="2.5"/>
    <circle cx="${x(n-1)}" cy="${y(seriesA[n-1])}" r="4" fill="${colorA}"/>
    <circle cx="${x(n-1)}" cy="${y(seriesB[n-1])}" r="4" fill="${colorB}"/>
    <g font-family="Inter" font-size="12" font-weight="600">
      <circle cx="${W-190}" cy="14" r="5" fill="${colorA}"/>
      <text x="${W-178}" y="18" fill="var(--ink)">${labelA}</text>
      <circle cx="${W-90}" cy="14" r="5" fill="${colorB}"/>
      <text x="${W-78}" y="18" fill="var(--ink)">${labelB}</text>
    </g>
  `;
}

/* ---------------- SIP math ---------------- */
let sipSchedule = null;

function calcSIP(){
  const amount0 = parseFloat(document.getElementById('sipAmount').value);
  const annualReturn = parseFloat(document.getElementById('sipReturn').value);
  const years = parseInt(document.getElementById('sipYears').value);
  const stepUp = parseFloat(document.getElementById('sipStep').value);
  const cur = document.getElementById('sipCurrency').value;
  const i = annualReturn/100/12;
  const months = years*12;

  let balance = 0, invested = 0, monthlyAmt = amount0;
  const monthly = [];
  for(let m=1; m<=months; m++){
    if(m>1 && (m-1)%12===0) monthlyAmt = monthlyAmt * (1+stepUp/100);
    balance = balance*(1+i) + monthlyAmt; // annuity due: contribution then growth handled via order below
    invested += monthlyAmt;
    monthly.push({month:m, contribution:monthlyAmt, invested, balance});
  }

  const yearly = [];
  for(let y=1; y<=years; y++){
    const rec = monthly[y*12-1];
    const prevInvested = y===1 ? 0 : monthly[(y-1)*12-1].invested;
    yearly.push({
      year:y,
      investedThisYr: rec.invested - prevInvested,
      cumInvested: rec.invested,
      value: rec.balance,
      gain: rec.balance - rec.invested
    });
  }

  const fv = monthly[months-1].balance;
  const totalInvested = monthly[months-1].invested;
  const gain = fv - totalInvested;

  document.getElementById('sipFV').textContent = fmt(fv, cur);
  document.getElementById('sipInvested').textContent = fmt(totalInvested, cur);
  document.getElementById('sipGain').textContent = fmt(gain, cur);

  const tbody = document.querySelector('#sipTable tbody');
  tbody.innerHTML = yearly.map(r => `
    <tr>
      <td>${r.year}</td>
      <td>${fmtPlain(r.investedThisYr)}</td>
      <td>${fmtPlain(r.cumInvested)}</td>
      <td>${fmtPlain(r.value)}</td>
      <td>${fmtPlain(r.gain)}</td>
    </tr>`).join('');

  drawAreaChart('sipChart',
    yearly.map(r=>r.cumInvested),
    yearly.map(r=>r.value),
    '#0B6E4F', '#B8912B',
    'Value', 'Invested'
  );

  sipSchedule = {inputs:{amount0,annualReturn,years,stepUp,cur}, monthly, yearly, fv, totalInvested, gain};
}

/* ---------------- SWP math ---------------- */
let swpSchedule = null;

function calcSWP(){
  const corpus0 = parseFloat(document.getElementById('swpCorpus').value);
  const withdraw0 = parseFloat(document.getElementById('swpWithdraw').value);
  const annualReturn = parseFloat(document.getElementById('swpReturn').value);
  const years = parseInt(document.getElementById('swpYears').value);
  const cur = document.getElementById('swpCurrency').value;
  const i = annualReturn/100/12;
  const months = years*12;

  let balance = corpus0, totalOut = 0, depletedAt = null;
  const monthly = [];
  for(let m=1; m<=months; m++){
    if(balance <= 0){
      monthly.push({month:m, withdrawal:0, totalOut, growth:0, balance:0});
      continue;
    }
    const growth = balance * i;
    let w = withdraw0;
    if(balance + growth < w){ w = balance + growth; if(depletedAt===null) depletedAt = m; }
    balance = balance + growth - w;
    if(balance < 0) balance = 0;
    totalOut += w;
    monthly.push({month:m, withdrawal:w, totalOut, growth, balance});
  }

  const yearly = [];
  for(let y=1; y<=years; y++){
    const rec = monthly[y*12-1];
    const prevOut = y===1 ? 0 : monthly[(y-1)*12-1].totalOut;
    const yearGrowth = monthly.slice((y-1)*12, y*12).reduce((s,r)=>s+r.growth,0);
    yearly.push({
      year:y,
      withdrawnThisYr: rec.totalOut - prevOut,
      cumWithdrawn: rec.totalOut,
      growth: yearGrowth,
      balance: rec.balance
    });
  }

  const closing = monthly[months-1].balance;
  const totalOutFinal = monthly[months-1].totalOut;

  document.getElementById('swpTotalOut').textContent = fmt(totalOutFinal, cur);
  document.getElementById('swpClosing').textContent = fmt(closing, cur);

  const warnEl = document.getElementById('swpWarn');
  if(depletedAt){
    const yrs = Math.floor(depletedAt/12), mos = depletedAt%12;
    document.getElementById('swpLasts').textContent = `${yrs}y ${mos}m`;
    warnEl.innerHTML = `<span class="badge-warn">Corpus depletes in year ${Math.ceil(depletedAt/12)} — withdrawal exceeds growth.</span>`;
  } else {
    document.getElementById('swpLasts').textContent = `${years} yrs+`;
    warnEl.innerHTML = '';
  }

  const tbody = document.querySelector('#swpTable tbody');
  tbody.innerHTML = yearly.map(r => `
    <tr class="${r.balance<=0?'depleted':''}">
      <td>${r.year}</td>
      <td>${fmtPlain(r.withdrawnThisYr)}</td>
      <td>${fmtPlain(r.cumWithdrawn)}</td>
      <td>${fmtPlain(r.growth)}</td>
      <td>${fmtPlain(r.balance)}</td>
    </tr>`).join('');

  drawAreaChart('swpChart',
    yearly.map(r=>r.balance),
    yearly.map(r=>r.cumWithdrawn),
    '#A64B2A', '#B8912B',
    'Balance', 'Withdrawn'
  );

  swpSchedule = {inputs:{corpus0,withdraw0,annualReturn,years,cur}, monthly, yearly, closing, totalOutFinal, depletedAt};
}

/* ---------------- Excel export ---------------- */
function exportSIP(){
  if(!sipSchedule){ calcSIP(); }
  const {inputs, yearly, monthly, fv, totalInvested, gain} = sipSchedule;
  const wb = XLSX.utils.book_new();

  const summary = [
    ['SIP Calculator — Summary'],
    [],
    ['Monthly investment (starting)', inputs.amount0],
    ['Expected annual return (%)', inputs.annualReturn],
    ['Investment period (years)', inputs.years],
    ['Annual step-up (%)', inputs.stepUp],
    [],
    ['Total invested', totalInvested],
    ['Future value', fv],
    ['Wealth gained', gain],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:32},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const yearlyRows = [['Year','Invested this year','Cumulative invested','Year-end value','Cumulative gain']];
  yearly.forEach(r => yearlyRows.push([r.year, Math.round(r.investedThisYr), Math.round(r.cumInvested), Math.round(r.value), Math.round(r.gain)]));
  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows);
  wsYearly['!cols'] = [{wch:8},{wch:18},{wch:20},{wch:16},{wch:16}];
  XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Schedule');

  const monthlyRows = [['Month','Contribution','Cumulative invested','Balance']];
  monthly.forEach(r => monthlyRows.push([r.month, Math.round(r.contribution), Math.round(r.invested), Math.round(r.balance)]));
  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
  wsMonthly['!cols'] = [{wch:8},{wch:14},{wch:18},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Schedule');

  XLSX.writeFile(wb, 'SIP_Plan.xlsx');
}

function exportSWP(){
  if(!swpSchedule){ calcSWP(); }
  const {inputs, yearly, monthly, closing, totalOutFinal, depletedAt} = swpSchedule;
  const wb = XLSX.utils.book_new();

  const summary = [
    ['SWP Calculator — Summary'],
    [],
    ['Starting corpus', inputs.corpus0],
    ['Monthly withdrawal', inputs.withdraw0],
    ['Expected annual return (%)', inputs.annualReturn],
    ['Withdrawal period (years)', inputs.years],
    [],
    ['Total withdrawn', Math.round(totalOutFinal)],
    ['Closing balance', Math.round(closing)],
    ['Depletion month', depletedAt ? depletedAt : 'Corpus not depleted in period'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:32},{wch:20}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const yearlyRows = [['Year','Withdrawn this year','Cumulative withdrawn','Growth earned','Year-end balance']];
  yearly.forEach(r => yearlyRows.push([r.year, Math.round(r.withdrawnThisYr), Math.round(r.cumWithdrawn), Math.round(r.growth), Math.round(r.balance)]));
  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows);
  wsYearly['!cols'] = [{wch:8},{wch:18},{wch:20},{wch:16},{wch:16}];
  XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Schedule');

  const monthlyRows = [['Month','Withdrawal','Cumulative withdrawn','Growth','Balance']];
  monthly.forEach(r => monthlyRows.push([r.month, Math.round(r.withdrawal), Math.round(r.totalOut), Math.round(r.growth), Math.round(r.balance)]));
  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
  wsMonthly['!cols'] = [{wch:8},{wch:14},{wch:18},{wch:12},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Schedule');

  XLSX.writeFile(wb, 'SWP_Plan.xlsx');
}

/* ---------------- Loan EMI: type presets (India market) ---------------- */
const loanTypes = {
  home: {
    title: 'Home loan details',
    tipsTitle: 'Practical suggestions — Home Loan',
    amount: {min:100000, max:20000000, step:10000, def:3500000},
    rate:   {min:7, max:12, step:0.1, def:8.5},
    tenure: {min:1, max:30, step:1, def:20},
    fee:    {def:0.5},
    tips: [
      'Principal repaid is deductible up to ₹1.5L/year under Section 80C, and interest up to ₹2L/year under Section 24(b) for a self-occupied property — factor this into your real, post-tax cost.',
      'A longer tenure lowers the EMI but sharply raises total interest — for a 20-year loan, roughly half your early EMIs go to interest. Prepay by even 1 extra EMI a year to cut years off the loan.',
      'Compare the effective rate (including processing fee, and any mandatory insurance the bank bundles in) across at least 3 lenders — a 0.5% rate difference on a 20-year home loan is a meaningful sum.',
      'Most banks fund 75–90% of property value (LTV) depending on loan size — plan your down payment accordingly, and keep 3–6 months of EMI as a buffer before you commit.'
    ]
  },
  personal: {
    title: 'Personal loan details',
    tipsTitle: 'Practical suggestions — Personal Loan',
    amount: {min:20000, max:4000000, step:5000, def:500000},
    rate:   {min:10, max:24, step:0.1, def:13},
    tenure: {min:1, max:7, step:1, def:4},
    fee:    {def:2},
    tips: [
      'Personal loans carry no collateral, which is why rates run 10–24% — reserve them for genuine short-term needs, not to fund things a cheaper secured loan could cover (like gold or a loan against FD/securities).',
      'There is no tax benefit on a personal loan (unless the funds are demonstrably used for home renovation or business, with proper documentation) — the full EMI is a real cost.',
      'Keep tenure as short as you can comfortably afford. A 5-year personal loan at 13% pays nearly 40% of the principal again in interest — a 2–3 year tenure changes that math significantly.',
      'Check the foreclosure/prepayment clause before signing — many personal loans allow free prepayment only after 12 months, with a 2–5% charge before that.'
    ]
  },
  education: {
    title: 'Education loan details',
    tipsTitle: 'Practical suggestions — Education Loan',
    amount: {min:100000, max:5000000, step:10000, def:1000000},
    rate:   {min:8, max:14, step:0.1, def:10.5},
    tenure: {min:3, max:15, step:1, def:7},
    fee:    {def:1},
    tips: [
      'Under Section 80E, the entire interest paid is tax-deductible (no upper cap) for 8 years starting the year repayment begins — this materially lowers the real cost, unlike a personal loan.',
      'Most education loans have a moratorium: EMIs typically start 6–12 months after course completion, not immediately. This EMI figure assumes repayment has already started — budget for it post-graduation.',
      'Loans above ₹7.5L usually need collateral or a guarantor; below that, many PSU banks offer collateral-free education loans under IBA guidelines — worth checking before pledging an asset.',
      'Paying at least the interest during the moratorium (a "simple interest" EMI) keeps the loan from capitalizing and meaningfully reduces the total interest over the full tenure.'
    ]
  },
  vehicle: {
    title: 'Car & bike loan details',
    tipsTitle: 'Practical suggestions — Car & Bike Loan',
    amount: {min:30000, max:3000000, step:5000, def:800000},
    rate:   {min:8, max:18, step:0.1, def:9.5},
    tenure: {min:1, max:7, step:1, def:5},
    fee:    {def:1},
    tips: [
      'A vehicle depreciates 15–20% a year, so keep the loan tenure at or below 5 years for a car and 3 years for a bike — stretching it further means owing more than the vehicle is worth for longer.',
      'There is no tax benefit on a personal vehicle loan (self-employed/business use with proper books is an exception) — treat the EMI as pure cost, not an investment.',
      'Banks typically finance 80–90% of on-road price — a larger down payment lowers both your EMI and the interest paid over the loan, and improves your negotiating position on the vehicle price itself.',
      'Compare the dealer-arranged loan against your own bank/NBFC pre-approved offer — dealer financing is convenient but often carries a higher rate or bundled insurance you did not ask for.'
    ]
  }
};
let currentLoanType = 'home';
let loanSchedule = null;

function applyLoanTypeDefaults(type){
  const cfg = loanTypes[type];
  const amt = document.getElementById('loanAmount');
  const rate = document.getElementById('loanRate');
  const ten = document.getElementById('loanTenure');
  const fee = document.getElementById('loanFee');

  amt.min = cfg.amount.min; amt.max = cfg.amount.max; amt.step = cfg.amount.step; amt.value = cfg.amount.def;
  rate.min = cfg.rate.min; rate.max = cfg.rate.max; rate.step = cfg.rate.step; rate.value = cfg.rate.def;
  ten.min = cfg.tenure.min; ten.max = cfg.tenure.max; ten.step = cfg.tenure.step; ten.value = cfg.tenure.def;
  fee.value = cfg.fee.def;
  ['loanAmount','loanRate','loanTenure','loanFee'].forEach(syncNumFromRange);

  document.getElementById('loanAmountVal').textContent = fmtPlain(cfg.amount.def);
  document.getElementById('loanRateVal').textContent = cfg.rate.def + '%';
  document.getElementById('loanTenureVal').textContent = cfg.tenure.def + ' yrs';
  document.getElementById('loanFeeVal').textContent = cfg.fee.def + '%';

  document.getElementById('loanPanelTitle').textContent = cfg.title;
  document.getElementById('tipsTitle').textContent = cfg.tipsTitle;
  document.getElementById('tipsList').innerHTML = cfg.tips.map(t => `<li>${t}</li>`).join('');
}

document.querySelectorAll('#loanTypeTabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#loanTypeTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLoanType = btn.dataset.type;
    applyLoanTypeDefaults(currentLoanType);
    calcLoan();
  });
});

function calcLoan(){
  const P = parseFloat(document.getElementById('loanAmount').value);
  const annualRate = parseFloat(document.getElementById('loanRate').value);
  const years = parseInt(document.getElementById('loanTenure').value);
  const feePct = parseFloat(document.getElementById('loanFee').value);
  const income = parseFloat(document.getElementById('loanIncome').value);
  const cur = document.getElementById('loanCurrency').value;
  const i = annualRate/100/12;
  const months = years*12;

  const emi = i===0 ? P/months : P * i * Math.pow(1+i, months) / (Math.pow(1+i, months) - 1);

  let balance = P;
  const monthly = [];
  let cumInterest = 0, cumPrincipal = 0;
  for(let m=1; m<=months; m++){
    const interestPortion = balance * i;
    let principalPortion = emi - interestPortion;
    if(principalPortion > balance) principalPortion = balance;
    balance -= principalPortion;
    if(balance < 0) balance = 0;
    cumInterest += interestPortion;
    cumPrincipal += principalPortion;
    monthly.push({month:m, principal:principalPortion, interest:interestPortion, cumPrincipal, cumInterest, balance});
  }

  const yearly = [];
  for(let y=1; y<=years; y++){
    const idx = Math.min(y*12, months)-1;
    const rec = monthly[idx];
    const prevIdx = (y-1)*12 - 1;
    const prevPrincipal = y===1 ? 0 : monthly[prevIdx].cumPrincipal;
    const prevInterest = y===1 ? 0 : monthly[prevIdx].cumInterest;
    yearly.push({
      year:y,
      principalPaid: rec.cumPrincipal - prevPrincipal,
      interestPaid: rec.cumInterest - prevInterest,
      cumInterest: rec.cumInterest,
      balance: rec.balance
    });
  }

  const totalPayment = emi*months;
  const totalInterest = totalPayment - P;
  const processingFee = P * feePct/100;

  document.getElementById('loanEMI').textContent = fmt(emi, cur);
  document.getElementById('loanInterest').textContent = fmt(totalInterest, cur);
  document.getElementById('loanTotal').textContent = fmt(totalPayment, cur);

  const tbody = document.querySelector('#loanTable tbody');
  tbody.innerHTML = yearly.map(r => `
    <tr>
      <td>${r.year}</td>
      <td>${fmtPlain(r.principalPaid)}</td>
      <td>${fmtPlain(r.interestPaid)}</td>
      <td>${fmtPlain(r.cumInterest)}</td>
      <td>${fmtPlain(r.balance)}</td>
    </tr>`).join('');

  drawAreaChart('loanChart',
    yearly.map(r=>P - r.balance),
    yearly.map(r=>r.cumInterest),
    '#2B5C7A', '#B8912B',
    'Principal paid', 'Interest paid'
  );

  const foirLine = document.getElementById('foirLine');
  const foirPill = document.getElementById('foirPill');
  if(income > 0){
    foirLine.classList.remove('hide');
    const pct = (emi/income)*100;
    foirPill.textContent = pct.toFixed(1) + '%';
    foirPill.className = 'foir-pill ' + (pct<=40 ? 'foir-good' : pct<=50 ? 'foir-warn' : 'foir-bad');
  } else {
    foirLine.classList.add('hide');
  }

  loanSchedule = {inputs:{type:currentLoanType, P, annualRate, years, feePct, income, cur}, monthly, yearly, emi, totalInterest, totalPayment, processingFee};
}

function exportLoan(){
  if(!loanSchedule){ calcLoan(); }
  const {inputs, yearly, monthly, emi, totalInterest, totalPayment, processingFee} = loanSchedule;
  const wb = XLSX.utils.book_new();
  const typeLabel = loanTypes[inputs.type].title.replace(' details','');

  const summary = [
    [typeLabel + ' — Summary'],
    [],
    ['Loan amount', inputs.P],
    ['Interest rate (annual %)', inputs.annualRate],
    ['Tenure (years)', inputs.years],
    ['Processing fee (%)', inputs.feePct],
    ['Estimated processing fee', Math.round(processingFee)],
    [],
    ['Monthly EMI', Math.round(emi)],
    ['Total interest payable', Math.round(totalInterest)],
    ['Total payment (principal + interest)', Math.round(totalPayment)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:34},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const yearlyRows = [['Year','Principal paid','Interest paid','Cumulative interest','Year-end balance']];
  yearly.forEach(r => yearlyRows.push([r.year, Math.round(r.principalPaid), Math.round(r.interestPaid), Math.round(r.cumInterest), Math.round(r.balance)]));
  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows);
  wsYearly['!cols'] = [{wch:8},{wch:16},{wch:16},{wch:18},{wch:16}];
  XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Schedule');

  const monthlyRows = [['Month','Principal','Interest','Cumulative principal','Cumulative interest','Balance']];
  monthly.forEach(r => monthlyRows.push([r.month, Math.round(r.principal), Math.round(r.interest), Math.round(r.cumPrincipal), Math.round(r.cumInterest), Math.round(r.balance)]));
  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
  wsMonthly['!cols'] = [{wch:8},{wch:12},{wch:12},{wch:18},{wch:18},{wch:12}];
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Schedule');

  XLSX.writeFile(wb, typeLabel.replace(/\s+/g,'_') + '_EMI_Plan.xlsx');
}

/* ---------------- Deposits: FD / RD / PPF ---------------- */
const depositTypes = {
  fd: {
    title:'Fixed deposit details', tipsTitle:'Practical suggestions — Fixed Deposit',
    amountLabel:'Deposit amount', kpi1:'Maturity value', kpi2:'Principal invested', kpi3:'Interest earned',
    amount:{min:5000,max:5000000,step:5000,def:500000}, rate:{def:7.25}, tenure:{min:1,max:10,def:5}, showCompounding:true,
    tips:[
      'FD interest is fully taxable at your income slab rate, and banks deduct TDS if interest exceeds ₹40,000/year (₹50,000 for senior citizens) — factor this into your real, post-tax return.',
      'Laddering — splitting one large FD into several smaller FDs with staggered maturities — gives you liquidity without breaking the whole deposit if you need funds early.',
      'Small finance banks often offer 0.5–1.5% higher FD rates than large PSU/private banks for the same tenure — worth comparing, within DICGC\'s ₹5 lakh insurance cover per bank.',
      'Senior citizens typically get an extra 0.25–0.5% over the standard rate — always ask specifically, as it is not always applied by default.'
    ]
  },
  rd: {
    title:'Recurring deposit details', tipsTitle:'Practical suggestions — Recurring Deposit',
    amountLabel:'Monthly deposit', kpi1:'Maturity value', kpi2:'Total deposited', kpi3:'Interest earned',
    amount:{min:500,max:200000,step:500,def:10000}, rate:{def:7}, tenure:{min:1,max:10,def:3}, showCompounding:false,
    tips:[
      'An RD forces monthly discipline the way an FD (lump sum) cannot — useful if you are saving toward a specific near-term goal like a deposit or a planned expense.',
      'Missing an RD installment usually attracts a small penalty and can reduce the effective maturity value — auto-debit is the easiest way to avoid this.',
      'RD interest is taxable and subject to TDS just like FD interest — it is not a tax-saving instrument, only a savings-discipline one.',
      'For goals more than 3–5 years away, a SIP into a low-cost equity or hybrid fund has historically outpaced RD returns — RD suits short, certain-timeline goals best.'
    ]
  },
  ppf: {
    title:'PPF details', tipsTitle:'Practical suggestions — PPF',
    amountLabel:'Annual investment', kpi1:'Maturity value (tax-free)', kpi2:'Total invested', kpi3:'Interest earned',
    amount:{min:500,max:150000,step:500,def:150000}, rate:{def:7.1}, tenure:{min:15,max:50,def:15}, showCompounding:false,
    tips:[
      'PPF is capped at ₹1.5 lakh/year and enjoys EEE status — contribution, interest, and maturity are all tax-free, and the current rate is 7.1% p.a. (Jul–Sep 2026 quarter), reviewed by the government every quarter.',
      'Interest is calculated on the lowest balance between the 5th and last day of each month — depositing your full amount before the 5th of April captures a full year of interest instead of losing a month.',
      'The account has a 15-year lock-in but can be extended indefinitely in blocks of 5 years, with or without further contributions — a genuinely long-term, risk-free core holding.',
      'A loan against your PPF balance is available from the 3rd to 6th year, and partial withdrawals from the 7th year — useful to know, but best left untouched to let compounding do its work.'
    ]
  }
};
let currentDepositType = 'fd';
let depositSchedule = null;

function applyDepositTypeDefaults(type){
  const cfg = depositTypes[type];
  const amt = document.getElementById('depositAmount');
  const rate = document.getElementById('depositRate');
  const ten = document.getElementById('depositTenure');

  amt.min = cfg.amount.min; amt.max = cfg.amount.max; amt.step = cfg.amount.step; amt.value = cfg.amount.def;
  rate.value = cfg.rate.def;
  ten.min = cfg.tenure.min; ten.max = cfg.tenure.max; ten.value = cfg.tenure.def;
  ['depositAmount','depositRate','depositTenure'].forEach(syncNumFromRange);

  document.getElementById('depositAmountVal').textContent = fmtPlain(cfg.amount.def);
  document.getElementById('depositRateVal').textContent = cfg.rate.def + '%';
  document.getElementById('depositTenureVal').textContent = cfg.tenure.def + ' yrs';
  document.getElementById('depositAmountLabel').childNodes[0].textContent = cfg.amountLabel + ' ';
  document.getElementById('depositPanelTitle').textContent = cfg.title;
  document.getElementById('depositTipsTitle').textContent = cfg.tipsTitle;
  document.getElementById('depositTipsList').innerHTML = cfg.tips.map(t => `<li>${t}</li>`).join('');
  document.getElementById('depositKpi1Lbl').textContent = cfg.kpi1;
  document.getElementById('depositKpi2Lbl').textContent = cfg.kpi2;
  document.getElementById('depositKpi3Lbl').textContent = cfg.kpi3;
  document.getElementById('compoundingField').style.display = cfg.showCompounding ? '' : 'none';
}

document.querySelectorAll('#depositTypeTabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#depositTypeTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDepositType = btn.dataset.type;
    applyDepositTypeDefaults(currentDepositType);
    calcDeposit();
  });
});

function calcDeposit(){
  const type = currentDepositType;
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const annualRate = parseFloat(document.getElementById('depositRate').value);
  const years = parseInt(document.getElementById('depositTenure').value);
  const cur = document.getElementById('depositCurrency').value;
  const months = years*12;
  let yearly = [], maturity = 0, totalInvested = 0;

  if(type === 'fd'){
    const n = parseInt(document.getElementById('depositCompounding').value);
    const rPerPeriod = annualRate/100/n;
    totalInvested = amount;
    for(let y=1;y<=years;y++){
      const periods = n*y;
      const value = amount * Math.pow(1+rPerPeriod, periods);
      yearly.push({year:y, investedThisYr: y===1?amount:0, cumInvested: amount, value, gain: value-amount});
    }
    maturity = yearly[years-1].value;
  } else if(type === 'rd'){
    const i = annualRate/100/12;
    let balance = 0, invested = 0;
    const monthly = [];
    for(let m=1;m<=months;m++){
      balance = balance*(1+i) + amount;
      invested += amount;
      monthly.push({invested, balance});
    }
    for(let y=1;y<=years;y++){
      const rec = monthly[y*12-1];
      const prevInvested = y===1?0:monthly[(y-1)*12-1].invested;
      yearly.push({year:y, investedThisYr: rec.invested-prevInvested, cumInvested: rec.invested, value: rec.balance, gain: rec.balance-rec.invested});
    }
    totalInvested = monthly[months-1].invested;
    maturity = monthly[months-1].balance;
  } else { // ppf - annual compounding, contribution at start of year
    let balance = 0, invested = 0;
    for(let y=1;y<=years;y++){
      balance = (balance + amount) * (1 + annualRate/100);
      invested += amount;
      yearly.push({year:y, investedThisYr: amount, cumInvested: invested, value: balance, gain: balance-invested});
    }
    totalInvested = invested;
    maturity = balance;
  }

  const gain = maturity - totalInvested;
  document.getElementById('depositKpi1').textContent = fmt(maturity, cur);
  document.getElementById('depositKpi2').textContent = fmt(totalInvested, cur);
  document.getElementById('depositKpi3').textContent = fmt(gain, cur);

  const tbody = document.querySelector('#depositTable tbody');
  tbody.innerHTML = yearly.map(r => `
    <tr>
      <td>${r.year}</td>
      <td>${fmtPlain(r.investedThisYr)}</td>
      <td>${fmtPlain(r.cumInvested)}</td>
      <td>${fmtPlain(r.value)}</td>
      <td>${fmtPlain(r.gain)}</td>
    </tr>`).join('');

  drawAreaChart('depositChart',
    yearly.map(r=>r.cumInvested),
    yearly.map(r=>r.value),
    '#B8912B', '#8A6A1F',
    'Invested', 'Value'
  );

  depositSchedule = {inputs:{type, amount, annualRate, years, cur}, yearly, maturity, totalInvested, gain};
}

function exportDeposit(){
  if(!depositSchedule){ calcDeposit(); }
  const {inputs, yearly, maturity, totalInvested, gain} = depositSchedule;
  const cfg = depositTypes[inputs.type];
  const wb = XLSX.utils.book_new();

  const summary = [
    [cfg.title + ' — Summary'],
    [],
    [cfg.amountLabel, inputs.amount],
    ['Interest rate (annual %)', inputs.annualRate],
    ['Tenure (years)', inputs.years],
    [],
    [cfg.kpi2, Math.round(totalInvested)],
    [cfg.kpi1, Math.round(maturity)],
    [cfg.kpi3, Math.round(gain)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:32},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const yearlyRows = [['Year','Invested this year','Cumulative invested','Year-end value','Cumulative interest']];
  yearly.forEach(r => yearlyRows.push([r.year, Math.round(r.investedThisYr), Math.round(r.cumInvested), Math.round(r.value), Math.round(r.gain)]));
  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows);
  wsYearly['!cols'] = [{wch:8},{wch:18},{wch:20},{wch:16},{wch:16}];
  XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Schedule');

  XLSX.writeFile(wb, cfg.title.replace(/\s+/g,'_') + '.xlsx');
}

/* ---------------- Retirement goal planner ---------------- */
let retireSchedule = null;

function simulateSWPGrowingWithdrawal(corpus, monthlyReturn, initialWithdrawal, inflationAnnual, months){
  let balance = corpus, withdrawal = initialWithdrawal;
  for(let m=1;m<=months;m++){
    if(m>1 && (m-1)%12===0) withdrawal *= (1+inflationAnnual/100);
    balance = balance*(1+monthlyReturn) - withdrawal;
    if(balance < 0) return {depleted:true, balance:0};
  }
  return {depleted:false, balance};
}

function corpusRequired(monthlyReturn, initialWithdrawal, inflationAnnual, months){
  let lo = 0, hi = initialWithdrawal * months * 3;
  for(let iter=0; iter<60; iter++){
    const mid = (lo+hi)/2;
    const r = simulateSWPGrowingWithdrawal(mid, monthlyReturn, initialWithdrawal, inflationAnnual, months);
    if(r.depleted) lo = mid; else hi = mid;
  }
  return hi;
}

function calcRetirement(){
  const curAge = parseInt(document.getElementById('retireCurAge').value);
  const retireAge = parseInt(document.getElementById('retireAge').value);
  const lifeAge = parseInt(document.getElementById('retireLife').value);
  const expenseToday = parseFloat(document.getElementById('retireExpense').value);
  const inflation = parseFloat(document.getElementById('retireInflation').value);
  const preReturn = parseFloat(document.getElementById('retirePreReturn').value);
  const postReturn = parseFloat(document.getElementById('retirePostReturn').value);
  const existing = parseFloat(document.getElementById('retireExisting').value);
  const cur = document.getElementById('retireCurrency').value;

  if(retireAge <= curAge || lifeAge <= retireAge){
    alert('Please make sure retirement age is after current age, and life expectancy is after retirement age.');
    return;
  }

  const yearsToRetire = retireAge - curAge;
  const monthsToRetire = yearsToRetire*12;
  const yearsInRetirement = lifeAge - retireAge;
  const monthsInRetirement = yearsInRetirement*12;

  const futureExpense = expenseToday * Math.pow(1+inflation/100, yearsToRetire);
  const iPost = postReturn/100/12;
  const iPre = preReturn/100/12;

  const corpusNeeded = corpusRequired(iPost, futureExpense, inflation, monthsInRetirement);
  const corpusFromExisting = existing * Math.pow(1+iPre, monthsToRetire);
  const corpusGap = Math.max(0, corpusNeeded - corpusFromExisting);

  const requiredSIP = iPre===0 ? corpusGap/monthsToRetire :
    corpusGap / ( (Math.pow(1+iPre,monthsToRetire)-1)/iPre * (1+iPre) );

  document.getElementById('retireCorpus').textContent = fmt(corpusNeeded, cur);
  document.getElementById('retireSIP').textContent = fmt(requiredSIP, cur);
  document.getElementById('retireFutureExpense').textContent = fmt(futureExpense, cur);

  // Build year-by-year projection: accumulation phase then decumulation phase
  const rows = [];
  let balance = existing;
  for(let y=1; y<=yearsToRetire; y++){
    const startBalance = balance;
    for(let m=1;m<=12;m++){ balance = balance*(1+iPre) + requiredSIP; }
    rows.push({age: curAge+y, phase:'Accumulating', flow: requiredSIP*12, balance});
  }
  let withdrawal = futureExpense;
  for(let y=1; y<=yearsInRetirement; y++){
    let yearWithdrawn = 0;
    for(let m=1;m<=12;m++){
      if(!(y===1 && m===1)) { /* inflation applied at year boundaries below */ }
      balance = balance*(1+iPost) - withdrawal;
      yearWithdrawn += withdrawal;
      if(balance < 0) balance = 0;
    }
    rows.push({age: retireAge+y, phase:'Withdrawing', flow: -yearWithdrawn, balance});
    withdrawal *= (1+inflation/100);
  }

  const tbody = document.querySelector('#retireTable tbody');
  tbody.innerHTML = rows.map(r => `
    <tr class="${r.balance<=0 && r.phase==='Withdrawing' ? 'depleted':''}">
      <td>${r.age}</td>
      <td>${r.phase}</td>
      <td>${r.flow>=0?'+':''}${fmtPlain(r.flow)}</td>
      <td>${fmtPlain(r.balance)}</td>
    </tr>`).join('');

  drawAreaChart('retireChart',
    rows.map(r=>r.balance),
    rows.map((r,idx)=> idx < yearsToRetire ? r.balance : 0),
    '#6B4A85', '#B8912B',
    'Corpus', 'Accumulation phase'
  );

  retireSchedule = {inputs:{curAge,retireAge,lifeAge,expenseToday,inflation,preReturn,postReturn,existing,cur}, rows, corpusNeeded, requiredSIP, futureExpense};
}

function exportRetirement(){
  if(!retireSchedule){ calcRetirement(); }
  const {inputs, rows, corpusNeeded, requiredSIP, futureExpense} = retireSchedule;
  const wb = XLSX.utils.book_new();

  const summary = [
    ['Retirement Plan — Summary'],
    [],
    ['Current age', inputs.curAge],
    ['Retirement age', inputs.retireAge],
    ['Life expectancy', inputs.lifeAge],
    ['Monthly expense today', inputs.expenseToday],
    ['Expected inflation (%)', inputs.inflation],
    ['Return before retirement (%)', inputs.preReturn],
    ['Return after retirement (%)', inputs.postReturn],
    ['Existing retirement savings', inputs.existing],
    [],
    ['Monthly expense at retirement (inflation-adjusted)', Math.round(futureExpense)],
    ['Retirement corpus required', Math.round(corpusNeeded)],
    ['Required monthly SIP', Math.round(requiredSIP)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:40},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const rows2 = [['Age','Phase','Annual contribution / withdrawal','Year-end corpus']];
  rows.forEach(r => rows2.push([r.age, r.phase, Math.round(r.flow), Math.round(r.balance)]));
  const wsRows = XLSX.utils.aoa_to_sheet(rows2);
  wsRows['!cols'] = [{wch:8},{wch:14},{wch:28},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsRows, 'Yearly Projection');

  XLSX.writeFile(wb, 'Retirement_Plan.xlsx');
}

/* ---------------- Government Schemes: SSY / SCSS / NSC / KVP / POMIS ---------------- */
const govtSchemes = {
  ssy: {
    title:'Sukanya Samriddhi Yojana details', tipsTitle:'Practical suggestions — Sukanya Samriddhi Yojana',
    amountLabel:'Annual deposit', amount:{min:250,max:150000,step:250,def:150000},
    rate:{def:8.2}, tenure:{min:21,max:21,def:21}, tenureLabelText:'Tenure (fixed)',
    kpi1:'Maturity value (tax-free)', kpi2:'Total invested', kpi3:'Interest earned',
    eligibility:'For a girl child below 10 years at account opening. Min ₹250 / max ₹1,50,000 per year. Deposits allowed for 15 years; account matures 21 years after opening (or on marriage after 18). Rate shown is 8.2% p.a. (Jul–Sep 2026 quarter).',
    tips:[
      'SSY carries the highest rate among small savings schemes today (8.2%) and is fully EEE tax-free — contribution, interest, and maturity — making it the strongest pure-safety option for a daughter\'s long-term goals.',
      'You only need to deposit for the first 15 years; the balance keeps compounding untouched for the remaining 6 years until maturity — a genuinely "set and forget" long-term plan.',
      'Up to 50% of the balance can be withdrawn once she turns 18, specifically for higher education or marriage expenses — plan withdrawals against real milestones, not impulsively.',
      'Missing the minimum ₹250/year deposit attracts a small penalty to keep the account active — a standing instruction avoids this entirely.'
    ]
  },
  scss: {
    title:'Senior Citizens\' Savings Scheme details', tipsTitle:'Practical suggestions — Senior Citizens\' Savings Scheme',
    amountLabel:'Deposit amount', amount:{min:1000,max:3000000,step:1000,def:1500000},
    rate:{def:8.2}, tenure:{min:5,max:8,def:5}, tenureLabelText:'Tenure (5 yrs, extendable to 8)',
    kpi1:'Total value (principal + payouts)', kpi2:'Principal invested', kpi3:'Total interest received',
    eligibility:'For individuals 60+ (55+ for retirees under VRS, subject to conditions). Max ₹30 lakh per individual. 5-year tenure, extendable once by 3 years. Interest is paid out quarterly, not compounded, and is fully taxable — TDS applies above ₹50,000/year in interest.',
    tips:[
      'SCSS pays quarterly — treat it as a genuine income stream in retirement, not a growth investment; the principal itself does not compound since interest is paid out each quarter.',
      'The ₹30 lakh cap is per individual, so a couple can jointly hold up to ₹60 lakh across two accounts — useful for larger retirement corpora.',
      'Interest is fully taxable at your slab rate with TDS above ₹50,000/year — submit Form 15H (if eligible) to avoid unnecessary TDS deduction.',
      'Premature withdrawal is allowed after 1 year but with a penalty (1–1.5% of the deposit) — treat this as a 5-year commitment, not a flexible account.'
    ]
  },
  nsc: {
    title:'National Savings Certificate details', tipsTitle:'Practical suggestions — National Savings Certificate',
    amountLabel:'Investment amount', amount:{min:1000,max:5000000,step:1000,def:100000},
    rate:{def:7.7}, tenure:{min:5,max:5,def:5}, tenureLabelText:'Tenure (fixed)',
    kpi1:'Maturity value', kpi2:'Principal invested', kpi3:'Interest earned',
    eligibility:'No maximum limit, minimum ₹1,000. Fixed 5-year tenure. Interest compounds annually but is paid out only at maturity. The investment qualifies for Section 80C (up to ₹1.5L); interest is taxable each year but is deemed reinvested and also 80C-eligible, except in the final year.',
    tips:[
      'NSC interest is taxable every year even though you receive nothing until maturity ("phantom income") — but each year\'s accrued interest (except the last) also counts toward your 80C limit, which can offset the tax if you have room left.',
      'Useful for a simple, once-a-year 80C investment when you\'ve already maxed out PPF/ELSS/insurance for the year and want a low-risk, government-backed option.',
      'The rate is locked at purchase — buying when rates are relatively higher locks in that return for the full 5 years, unlike a floating-rate instrument.',
      'NSC can be used as collateral for a bank loan, which is a lesser-known but useful feature if you need short-term liquidity without breaking the certificate.'
    ]
  },
  kvp: {
    title:'Kisan Vikas Patra details', tipsTitle:'Practical suggestions — Kisan Vikas Patra',
    amountLabel:'Investment amount', amount:{min:1000,max:5000000,step:1000,def:100000},
    rate:{def:7.5}, tenure:{min:1,max:1,def:1}, tenureLabelText:'Doubling period (auto-computed)',
    kpi1:'Maturity value (~2x)', kpi2:'Principal invested', kpi3:'Interest earned',
    eligibility:'No maximum limit, minimum ₹1,000. At the current 7.5% p.a., the investment doubles in approximately 115 months (about 9 years 7 months). No tax deduction on investment; interest is fully taxable.',
    tips:[
      'KVP\'s single selling point is simplicity: your money doubles in a fixed, known period — useful for a concrete goal with no tax planning angle.',
      'Unlike NSC, KVP gives no Section 80C benefit, and interest is taxed every year on an accrual basis just like NSC — the "doubling" is a pre-tax number.',
      'KVP certificates are transferable and can be used as loan collateral, which gives it more liquidity flexibility than some other small savings instruments.',
      'For most tax-paying investors, PPF or ELSS mutual funds tend to give a better post-tax, long-term return — KVP suits those who specifically want capital-guaranteed doubling with no market exposure.'
    ]
  },
  pomis: {
    title:'Post Office Monthly Income Scheme details', tipsTitle:'Practical suggestions — Post Office MIS',
    amountLabel:'Deposit amount', amount:{min:1000,max:1500000,step:1000,def:900000},
    rate:{def:7.4}, tenure:{min:5,max:5,def:5}, tenureLabelText:'Tenure (fixed)',
    kpi1:'Total value (principal + payouts)', kpi2:'Principal invested', kpi3:'Total interest received',
    eligibility:'Max ₹9 lakh for a single account, ₹15 lakh for a joint account. Fixed 5-year tenure. Interest is paid out monthly, not compounded, and is fully taxable with no TDS deducted at source (you must declare it yourself).',
    tips:[
      'POMIS is built for a monthly income stream, not growth — pair it with a separate growth instrument (equity SIP) if you also need your corpus to outpace inflation.',
      'No TDS is deducted on POMIS interest, but it is still fully taxable — track and declare it yourself at tax filing time to avoid a mismatch notice.',
      'A joint account effectively doubles your investment cap to ₹15 lakh — useful for a retired couple looking to maximize guaranteed monthly income.',
      'Premature closure is allowed after 1 year with a small penalty (up to 2% before 3 years, 1% between 3–5 years) — treat the 5-year term as the real commitment.'
    ]
  }
};
let currentGovtType = 'ssy';
let govtSchedule = null;

function applyGovtTypeDefaults(type){
  const cfg = govtSchemes[type];
  const amt = document.getElementById('govtAmount');
  const rate = document.getElementById('govtRate');
  const ten = document.getElementById('govtTenure');

  amt.min = cfg.amount.min; amt.max = cfg.amount.max; amt.step = cfg.amount.step; amt.value = cfg.amount.def;
  rate.value = cfg.rate.def;
  ten.min = cfg.tenure.min; ten.max = cfg.tenure.max; ten.value = cfg.tenure.def;
  ['govtAmount','govtRate','govtTenure'].forEach(syncNumFromRange);

  document.getElementById('govtAmountVal').textContent = fmtPlain(cfg.amount.def);
  document.getElementById('govtRateVal').textContent = cfg.rate.def + '%';
  document.getElementById('govtTenureVal').textContent = cfg.tenure.def + ' yrs';
  document.getElementById('govtAmountLabel').childNodes[0].textContent = cfg.amountLabel + ' ';
  document.getElementById('govtTenureLabel').childNodes[0].textContent = cfg.tenureLabelText + ' ';
  document.getElementById('govtPanelTitle').textContent = cfg.title;
  document.getElementById('govtTipsTitle').textContent = cfg.tipsTitle;
  document.getElementById('govtTipsList').innerHTML = cfg.tips.map(t => `<li>${t}</li>`).join('');
  document.getElementById('govtKpi1Lbl').textContent = cfg.kpi1;
  document.getElementById('govtKpi2Lbl').textContent = cfg.kpi2;
  document.getElementById('govtKpi3Lbl').textContent = cfg.kpi3;
  document.getElementById('govtEligibility').textContent = cfg.eligibility;
}

document.querySelectorAll('#govtTypeTabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#govtTypeTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGovtType = btn.dataset.type;
    applyGovtTypeDefaults(currentGovtType);
    calcGovt();
  });
});

function calcGovt(){
  const type = currentGovtType;
  const amount = parseFloat(document.getElementById('govtAmount').value);
  const annualRate = parseFloat(document.getElementById('govtRate').value);
  const cur = document.getElementById('govtCurrency').value;
  const i = annualRate/100;
  let yearly = [], maturity = 0, totalInvested = 0;

  if(type === 'ssy'){
    const depositYears = 15, totalYears = 21;
    let balance = 0, invested = 0;
    for(let y=1;y<=totalYears;y++){
      if(y<=depositYears){ balance = (balance+amount)*(1+i); invested += amount; }
      else { balance = balance*(1+i); }
      yearly.push({year:y, investedThisYr: y<=depositYears?amount:0, cumInvested:invested, value:balance, gain:balance-invested});
    }
    totalInvested = invested; maturity = balance;
  } else if(type === 'scss' || type === 'pomis'){
    const years = parseInt(document.getElementById('govtTenure').value);
    const periodsPerYear = type==='scss' ? 4 : 12;
    const payout = amount * i / periodsPerYear;
    let cumGain = 0;
    for(let y=1;y<=years;y++){
      cumGain += payout*periodsPerYear;
      yearly.push({year:y, investedThisYr: y===1?amount:0, cumInvested:amount, value:amount+cumGain, gain:cumGain});
    }
    totalInvested = amount; maturity = amount + cumGain;
  } else if(type === 'nsc'){
    const years = 5;
    for(let y=1;y<=years;y++){
      const value = amount*Math.pow(1+i,y);
      yearly.push({year:y, investedThisYr: y===1?amount:0, cumInvested:amount, value, gain:value-amount});
    }
    totalInvested = amount; maturity = yearly[years-1].value;
  } else if(type === 'kvp'){
    const doublingYears = Math.log(2)/Math.log(1+i);
    const fullYears = Math.floor(doublingYears);
    for(let y=1;y<=fullYears;y++){
      const value = amount*Math.pow(1+i,y);
      yearly.push({year:y, investedThisYr: y===1?amount:0, cumInvested:amount, value, gain:value-amount});
    }
    const finalValue = amount*2;
    yearly.push({year: Math.round(doublingYears*10)/10, investedThisYr:0, cumInvested:amount, value:finalValue, gain:finalValue-amount});
    document.getElementById('govtTenureVal').textContent = (Math.round(doublingYears*12)) + ' months';
    totalInvested = amount; maturity = finalValue;
  }

  const gain = maturity - totalInvested;
  document.getElementById('govtKpi1').textContent = fmt(maturity, cur);
  document.getElementById('govtKpi2').textContent = fmt(totalInvested, cur);
  document.getElementById('govtKpi3').textContent = fmt(gain, cur);

  const tbody = document.querySelector('#govtTable tbody');
  tbody.innerHTML = yearly.map(r => `
    <tr>
      <td>${r.year}</td>
      <td>${fmtPlain(r.investedThisYr)}</td>
      <td>${fmtPlain(r.cumInvested)}</td>
      <td>${fmtPlain(r.value)}</td>
      <td>${fmtPlain(r.gain)}</td>
    </tr>`).join('');

  drawAreaChart('govtChart',
    yearly.map(r=>r.cumInvested),
    yearly.map(r=>r.value),
    '#3F4E8C', '#8A6A1F',
    'Invested', 'Value'
  );

  govtSchedule = {inputs:{type, amount, annualRate, cur}, yearly, maturity, totalInvested, gain};
}

function exportGovt(){
  if(!govtSchedule){ calcGovt(); }
  const {inputs, yearly, maturity, totalInvested, gain} = govtSchedule;
  const cfg = govtSchemes[inputs.type];
  const wb = XLSX.utils.book_new();

  const summary = [
    [cfg.title + ' — Summary'],
    [],
    [cfg.amountLabel, inputs.amount],
    ['Interest rate (annual %)', inputs.annualRate],
    [],
    [cfg.kpi2, Math.round(totalInvested)],
    [cfg.kpi1, Math.round(maturity)],
    [cfg.kpi3, Math.round(gain)],
    [],
    ['Eligibility & rules', cfg.eligibility],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{wch:34},{wch:60}];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const yearlyRows = [['Year','Invested this year','Cumulative invested','Year-end value','Cumulative gain']];
  yearly.forEach(r => yearlyRows.push([r.year, Math.round(r.investedThisYr), Math.round(r.cumInvested), Math.round(r.value), Math.round(r.gain)]));
  const wsYearly = XLSX.utils.aoa_to_sheet(yearlyRows);
  wsYearly['!cols'] = [{wch:8},{wch:18},{wch:20},{wch:16},{wch:16}];
  XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Schedule');

  XLSX.writeFile(wb, cfg.title.replace(/\s+/g,'_') + '.xlsx');
}

/* ---------------- init ---------------- */
if(document.getElementById('sipAmount')) calcSIP();
if(document.getElementById('swpCorpus')) calcSWP();
if(document.getElementById('loanAmount')){ applyLoanTypeDefaults('home'); calcLoan(); }
if(document.getElementById('depositAmount')){ applyDepositTypeDefaults('fd'); calcDeposit(); }
if(document.getElementById('retireCurAge')) calcRetirement();
if(document.getElementById('govtAmount')){ applyGovtTypeDefaults('ssy'); calcGovt(); }
