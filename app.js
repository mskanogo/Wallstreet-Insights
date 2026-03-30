const ALPHA_KEY = 'QFFWXW609ISDNJSY';
const NEWS_KEY  = 'c11d7dec059a4f4eb303b124e2974614';

const DEMO_MODE = true;

let watchlist          = JSON.parse(localStorage.getItem('wsi_watchlist') || '[]');
let stockData          = {};
let selectedForCompare = new Set();
let allNews            = [];
let activeNewsFilter   = 'All';
let currentSort        = 'symbol';

const DEMO_STOCKS = {
  AAPL:  { symbol:'AAPL',  name:'Apple Inc.',     price:'189.30', change:'+2.41',  changePct:'+1.29%', high:'190.50', low:'186.80', volume:'52,340,210', open:'187.10' },
  TSLA:  { symbol:'TSLA',  name:'Tesla Inc.',      price:'178.20', change:'-3.80',  changePct:'-2.09%', high:'183.90', low:'177.50', volume:'88,120,400', open:'182.00' },
  MSFT:  { symbol:'MSFT',  name:'Microsoft Corp.', price:'420.55', change:'+5.12',  changePct:'+1.23%', high:'422.00', low:'415.30', volume:'21,450,000', open:'416.00' },
  NVDA:  { symbol:'NVDA',  name:'NVIDIA Corp.',    price:'875.40', change:'+22.10', changePct:'+2.59%', high:'880.00', low:'860.50', volume:'45,600,000', open:'862.00' },
};

const DEMO_NEWS = [
  { title:'Apple reports record services revenue in Q1 2026', source:'Bloomberg', date:'2026-03-22', symbol:'AAPL', url:'#' },
  { title:'Tesla cuts prices in Europe amid slowing EV demand', source:'Reuters',  date:'2026-03-21', symbol:'TSLA', url:'#' },
  { title:'Microsoft Azure growth accelerates, beats estimates', source:'CNBC',    date:'2026-03-22', symbol:'MSFT', url:'#' },
  { title:'NVIDIA unveils next-gen Blackwell Ultra chips for AI', source:'TechCrunch', date:'2026-03-22', symbol:'NVDA', url:'#' },
];

if (!DEMO_MODE) {
  const saved = JSON.parse(localStorage.getItem('wsi_watchlist') || '[]');
  const demoSymbols = Object.keys(DEMO_STOCKS);
  const hasOnlyDemoStocks = saved.every(s => demoSymbols.includes(s));
  if (hasOnlyDemoStocks && saved.length > 0) {
    localStorage.removeItem('wsi_watchlist');
    watchlist = [];
  }
}

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('setupBanner').style.display = 'none';

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addStock();
  });

  if (DEMO_MODE && watchlist.length === 0) {
    watchlist = ['AAPL', 'TSLA', 'MSFT', 'NVDA'];
    saveWatchlist();
  }

  renderWatchlist();
  fetchAllNews();
});

async function addStock() {
  const input  = document.getElementById('searchInput');
  const symbol = input.value.trim().toUpperCase();

  if (!symbol) return;

  if (watchlist.includes(symbol)) {
    showStatus(`${symbol} is already in your watchlist.`, 'error');
    return;
  }

  showStatus(`Fetching data for ${symbol}...`, 'info');

  const data = await fetchStockQuote(symbol);

  if (!data) {
    showStatus(`Could not find "${symbol}". Check the ticker and try again.`, 'error');
    return;
  }

  watchlist.push(symbol);
  stockData[symbol] = data;
  saveWatchlist();
  renderWatchlist();
  fetchNewsForSymbol(symbol);
  input.value = '';
  showStatus('', '');
}

async function fetchStockQuote(symbol) {
  if (DEMO_MODE) {
    return DEMO_STOCKS[symbol] || {
      symbol, name: symbol,
      price:'100.00', change:'+0.00', changePct:'+0.00%',
      high:'100.00', low:'100.00', volume:'0', open:'100.00'
    };
  }

  try {
    const url  = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`;
    const res  = await fetch(url);

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const json = await res.json();
    const q    = json['Global Quote'];

    if (!q || !q['05. price']) return null;

    const change = parseFloat(q['09. change']);

    return {
      symbol,
      name:      symbol,
      price:     parseFloat(q['05. price']).toFixed(2),
      change:    (change >= 0 ? '+' : '') + change.toFixed(2),
      changePct: q['10. change percent'].trim(),
      high:      parseFloat(q['03. high']).toFixed(2),
      low:       parseFloat(q['04. low']).toFixed(2),
      volume:    parseInt(q['06. volume']).toLocaleString(),
      open:      parseFloat(q['02. open']).toFixed(2),
    };

  } catch (err) {
    console.error('Stock fetch error:', err);
    showStatus('Network error. Please try again.', 'error');
    return null;
  }
}

async function fetchAllNews() {
  if (DEMO_MODE) {
    allNews = [...DEMO_NEWS];
    const demoSymbols = Object.keys(DEMO_STOCKS);
    for (const sym of watchlist) {
      if (!demoSymbols.includes(sym)) {
        await fetchNewsForSymbol(sym);
      }
    }
    renderNews();
    return;
  }

  for (const sym of watchlist) {
    await fetchNewsForSymbol(sym);
  }
}

async function fetchNewsForSymbol(symbol) {
  if (DEMO_MODE) {
    const demoSymbols = Object.keys(DEMO_STOCKS);
    if (!demoSymbols.includes(symbol)) {
      const placeholderNews = [
        {
          title:  `${symbol} was added to your watchlist — live news loads when API mode is enabled`,
          source: 'WSI Demo',
          date:   new Date().toISOString().slice(0, 10),
          symbol,
          url:    '#'
        }
      ];
      allNews = [...allNews.filter(n => n.symbol !== symbol), ...placeholderNews];
      renderNews();
    }
    return;
  }

  try {
    const url  = `https://newsapi.org/v2/everything?q=${symbol}+stock&sortBy=publishedAt&pageSize=3&apiKey=${NEWS_KEY}`;
    const res  = await fetch(url);

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const json = await res.json();

    if (json.articles) {
      const articles = json.articles.map(a => ({
        title:  a.title,
        source: a.source.name,
        date:   a.publishedAt?.slice(0, 10),
        symbol,
        url:    a.url
      }));

      allNews = [...allNews.filter(n => n.symbol !== symbol), ...articles];
      renderNews();
    }

  } catch (err) {
    console.warn(`News fetch failed for ${symbol}:`, err);
  }
}

async function renderWatchlist() {
  const grid = document.getElementById('watchlistGrid');

  if (watchlist.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">📈</p>
        <h3 class="empty-title">Your watchlist is empty</h3>
        <p class="empty-sub">Search for a ticker symbol above to get started</p>
      </div>`;
    document.getElementById('watchlistCount').textContent = '0 stocks';
    updateCompare();
    return;
  }

  for (const sym of watchlist) {
    if (!stockData[sym]) {
      stockData[sym] = await fetchStockQuote(sym);
    }
  }

  let sorted = [...watchlist];

  if (currentSort === 'price') {
    sorted.sort((a, b) => parseFloat(stockData[b]?.price || 0) - parseFloat(stockData[a]?.price || 0));
  } else if (currentSort === 'change') {
    sorted.sort((a, b) => parseFloat(stockData[b]?.changePct || 0) - parseFloat(stockData[a]?.changePct || 0));
  } else {
    sorted.sort();
  }

  document.getElementById('watchlistCount').textContent =
    `${watchlist.length} stock${watchlist.length !== 1 ? 's' : ''}`;

  grid.innerHTML = sorted.map(sym => {
    const d    = stockData[sym];
    if (!d) return '';

    const isUp       = !d.change.startsWith('-');
    const isSelected = selectedForCompare.has(sym);

    return `
      <div class="stock-card ${isSelected ? 'selected' : ''}"
           id="card-${sym}"
           onclick="toggleCompare('${sym}')">

        <div class="card-top">
          <div>
            <div class="card-symbol">${d.symbol}</div>
            <div class="card-name">${d.name}</div>
          </div>
          <button class="card-remove"
                  onclick="event.stopPropagation(); removeStock('${sym}')"
                  title="Remove">×</button>
        </div>

        <div class="card-price">$${d.price}</div>

        <div class="card-change ${isUp ? 'up' : 'down'}">
          ${isUp ? '▲' : '▼'} ${d.change} (${d.changePct})
        </div>

        <div class="card-stats">
          <div class="stat-item">
            <div class="stat-label">High</div>
            <div class="stat-val">$${d.high}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Low</div>
            <div class="stat-val">$${d.low}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Open</div>
            <div class="stat-val">$${d.open}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Volume</div>
            <div class="stat-val">${d.volume}</div>
          </div>
        </div>

      </div>`;
  }).join('');

  updateCompare();
}

function removeStock(symbol) {
  watchlist          = watchlist.filter(s => s !== symbol);
  delete stockData[symbol];
  selectedForCompare.delete(symbol);
  allNews            = allNews.filter(n => n.symbol !== symbol);
  saveWatchlist();
  renderWatchlist();
  renderNews();
}

function toggleCompare(symbol) {
  if (selectedForCompare.has(symbol)) {
    selectedForCompare.delete(symbol);
  } else {
    if (selectedForCompare.size >= 5) {
      showStatus('Maximum 5 stocks can be compared at once.', 'error');
      return;
    }
    selectedForCompare.add(symbol);
  }
  renderWatchlist();
}

function updateCompare() {
  const section = document.getElementById('compareSection');
  const divider = document.getElementById('newsDivider');

  if (selectedForCompare.size < 2) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  divider.style.display = 'block';

  document.getElementById('compareCount').textContent =
    `${selectedForCompare.size} selected`;

  document.getElementById('compareBar').innerHTML =
    [...selectedForCompare].map(sym => `
      <div class="compare-tag">
        ${sym}
        <button onclick="toggleCompare('${sym}')">×</button>
      </div>`).join('');

  document.getElementById('compareBody').innerHTML =
    [...selectedForCompare].map(sym => {
      const d   = stockData[sym];
      if (!d) return '';
      const isUp = !d.change.startsWith('-');
      return `
        <tr>
          <td class="sym">${d.symbol}</td>
          <td>$${d.price}</td>
          <td style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${d.change}</td>
          <td style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${d.changePct}</td>
          <td>$${d.high}</td>
          <td>$${d.low}</td>
          <td>${d.volume}</td>
        </tr>`;
    }).join('');
}

function renderNews() {
  const section = document.getElementById('newsSection');
  const divider = document.getElementById('newsDivider');

  if (allNews.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  divider.style.display = 'block';

  const symbols = ['All', ...new Set(allNews.map(n => n.symbol))];

  document.getElementById('newsFilter').innerHTML = symbols.map(s => `
    <button class="filter-chip ${activeNewsFilter === s ? 'active' : ''}"
            onclick="filterNews('${s}')">
      ${s}
    </button>`).join('');

  const filtered = activeNewsFilter === 'All'
    ? allNews
    : allNews.filter(n => n.symbol === activeNewsFilter);

  document.getElementById('newsGrid').innerHTML = filtered.map(n => `
    <a class="news-card" href="${n.url}" target="_blank" rel="noopener noreferrer">
      <div class="news-source">${n.source} · ${n.symbol}</div>
      <div class="news-title">${n.title}</div>
      <div class="news-date">${n.date}</div>
    </a>`).join('');
}

function filterNews(symbol) {
  activeNewsFilter = symbol;
  renderNews();
}

function sortWatchlist(by) {
  currentSort = by;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sort-${by}`).classList.add('active');
  renderWatchlist();
}

function showStatus(msg, type) {
  const el    = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className   = 'status-msg ' + (type || '');

  if (msg && type !== 'info') {
    setTimeout(() => showStatus('', ''), 4000);
  }
}

function saveWatchlist() {
  localStorage.setItem('wsi_watchlist', JSON.stringify(watchlist));
}