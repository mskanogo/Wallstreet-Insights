# Wall Street Insights 📈

A real-time stock market dashboard that allows users to track stock prices, compare performance, and read the latest financial news — all in one place.

---
## Video demonstration
https://www.loom.com/share/b174ab1be1104faea45abedc6af23e66

## Live Demo

| Server | URL |
|---|---|
| Load Balancer | https://www.mskanogo.tech |
| Web01 | http://34.227.15.242 |
| Web02 | http://13.222.62.164 |

---

## Features

-  **Search & Add Stocks** — Look up any real ticker symbol and add it to your personal watchlist
-  **Stock Cards** — View live price, change, high, low, open and volume for each stock
-  **Live News Feed** — Latest financial news fetched per ticker symbol
-  **Filter News by Ticker** — Click any ticker chip to filter news to that stock only
-  **Sort Watchlist** — Sort your stocks by symbol, price or % change
-  **Compare Stocks** — Select up to 5 stocks to compare side by side in a table
-  **Persistent Watchlist** — Your watchlist is saved in localStorage and restored on reload
-  **Error Handling** — Invalid tickers are rejected with clear feedback; network errors are caught gracefully

---

## APIs Used

| API | Purpose | Documentation |
|---|---|---|
| [Alpha Vantage](https://www.alphavantage.co/documentation/) | Real-time stock quotes | https://www.alphavantage.co/documentation/ |
| [NewsAPI](https://newsapi.org/docs) | Stock-related news articles | https://newsapi.org/docs |

---

## Setup & Configuration

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge)
- A free Alpha Vantage API key — [get one here](https://www.alphavantage.co/support/#api-key)
- A free NewsAPI key — [get one here](https://newsapi.org/register)

### How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mskanogo/Wallstreet-Insights.git
   ```

2. **Navigate into the project folder:**
   ```bash
   cd Wallstreet-Insights
   ```

3. **Copy the example config file and rename it:**
   ```bash
   cp config.example.js config.js
   ```

4. **Open `config.js` and replace the placeholders with your real API keys:**
   ```js
   const CONFIG = {
     ALPHA_KEY: 'your_alpha_vantage_key_here',
     NEWS_KEY:  'your_newsapi_key_here'
   };
   ```

5. **Open `index.html` directly in your browser** — no build tools or server required.

>  `config.js` is listed in `.gitignore` and will never be uploaded to GitHub.
> Always keep your API keys out of version control.

---

## Project Structure

```
Wallstreet-Insights/
├── index.html          # Main HTML structure
├── style.css           # All styling
├── app.js              # Application logic and API calls
├── config.js           # Your real API keys (gitignored, not in repo)
├── config.example.js   # Template showing required config format
├── .gitignore          # Excludes config.js and other sensitive files
└── README.md           # Project documentation
```

---

## Deployment

The application is deployed on two web servers behind a load balancer using **Nginx**.

### Web Servers

Both **Web01** (`34.227.15.242`) and **Web02** (`13.222.62.164`) were configured identically using the following steps:

**1. Copy project files to the server using `scp`:**
```bash
scp -r ./Wallstreet-Insights ubuntu@34.227.15.242:/tmp/
scp -r ./Wallstreet-Insights ubuntu@13.222.62.164:/tmp/
```

**2. SSH into each server and move files to the Nginx web root:**
```bash
ssh ubuntu@34.227.15.242
sudo cp -r /tmp/Wallstreet-Insights/* /var/www/html/
```
Repeat for Web02:
```bash
ssh ubuntu@13.222.62.164
sudo cp -r /tmp/Wallstreet-Insights/* /var/www/html/
```

**3. Ensure Nginx is running on both servers:**
```bash
sudo systemctl status nginx
sudo systemctl start nginx   # if not already running
```

**4. Copy your `config.js` file directly to each server** (since it is gitignored, it must be transferred manually):
```bash
scp config.js ubuntu@34.227.15.242:/var/www/html/config.js
scp config.js ubuntu@13.222.62.164:/var/www/html/config.js
```

### Load Balancer Configuration

The load balancer at `https://www.mskanogo.tech` was configured using Nginx to distribute traffic between Web01 and Web02.

**1. SSH into the load balancer and edit the Nginx config:**
```bash
ssh ubuntu@<load-balancer-ip>
sudo nano /etc/nginx/sites-available/default
```

**2. Add the following upstream block to the config:**
```nginx
upstream wallstreet_insights {
    server 34.227.15.242;
    server 13.222.62.164;
}

server {
    listen 80;
    server_name mskanogo.tech www.mskanogo.tech;

    location / {
        proxy_pass http://wallstreet_insights;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**3. Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**4. Verify the load balancer is distributing traffic** by visiting `https://www.mskanogo.tech` and refreshing several times — requests will alternate between Web01 and Web02.

---

## Challenges & Solutions

### API Rate Limits

Both Alpha Vantage and NewsAPI enforce strict rate limits on their free plans:

- **Alpha Vantage** allows 25 requests per day on the free tier. To work around this during development, a `DEMO_MODE` flag was implemented that serves hardcoded stock data locally without consuming API quota. Setting `DEMO_MODE = false` in `app.js` switches the app to live API mode.

- **NewsAPI** allows 100 requests per day on the free plan but **restricts requests from deployed/production domains** — it only works on `localhost`. For the deployed version, the demo news placeholders are shown for any ticker added while in demo mode. To fully enable live news on the deployed servers, a paid NewsAPI plan or an alternative API would be required.

---

## Security

- API keys are stored in `config.js` which is listed in `.gitignore` and never committed to the repository
- A `config.example.js` template is provided so collaborators know what format is required without exposing real keys
- Input validation is applied to all ticker symbols — unknown or misspelled tickers are rejected before any API call is made

---

## Credits

- **[Alpha Vantage](https://www.alphavantage.co/)** — Stock market data API
- **[NewsAPI](https://newsapi.org/)** — Financial news aggregation API
- **[Nginx](https://nginx.org/)** — Web server and load balancer
- Developed by **Martha Stacey Wanjiku Kanogo** 
