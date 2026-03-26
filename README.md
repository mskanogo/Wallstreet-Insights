# Wall Street Insights

This is a real-time stock market watchlist and news tracker built with HTML, CSS and Javascript.
You can search for any stock by ticker symbol, track prices, compare performances side by side, and read the lastest financial news.

## Live demo

|Server | URL |
Load Balancer | `http://54.87.168.130` |
Web01 | `http://34.227.15.242` |
Web02 | `http://13.222.62.164` |

## Features

- **Search stocks** by ticker symbol (e.g AAPL, TSLA MSFT)
- **Compare stocks** side by side by clicking two cards to compare
- **Financial news** per stock with filter symbol
- **Sort watchlist** by symbol, price or percentage change
- **Persistent watchlist** saved in browser localstorage
- **Error handling** for invalid symbols and API failures
- **Responsice design** works on mobile and desktop

## Tech Stack & APIs

- Built with HTML5, CSS5, and vanilla Javascript.
- API for real time stock quotes is from Alpha Vantage.
- API for financila news articles is for NewsAPI.
- The font used; Fraunces, Lato, DM Mono is from Google fonts.

## Project Structure

wallstreet-insights/
├── index.html      # Page structure and layout
├── style.css       # All styling and animations  
├── app.js          # JavaScript logic and API calls
├── README.md       # Project documentation
└── .gitignore      # Excludes sensitive files

## Running locally

### What is needed:
- A modern web browser (Chrome, Firefox, Microsoft edge)
- VS code with the live server extension
- API keys from Alpha Vantage and NewsAPI

### Steps

1. Clone the repository

```bash
    git clone https://github.com/mskanogo/Wallstreet-Insights.git
    cd Wallstreet-Insights
```

2. Open 'app.js' and add your API keys at the top:

```javascript
   const ALPHA_KEY = 'your_alpha_vantage_key_here';
   const NEWS_key = 'your_newsapi_key_here';
```

3.Right click 'index.html' in VS code and select **Open with live server**

4. The app opens at 'http://127.0.0:5500'

> **NOTE** Alpha Vantage free tier allows 25 requests per day
> NewsAPI free tier works on localhost only - use a server for production

## Deployment

### Server Setup (Web01 & Web02)

Run these steps on **both** web servers:
```bash
# SSH into the server
ssh ubuntu@34.227.15.242 # web01
ssh ubuntu@13.222.62.164 # web02

# Install Nginx
sudo apt update
sudo apt install nginx -y

# Clone the repository
cd /var/www/html
sudo git clone https://github.com/mskanogo/Wallstreet-Insights.git .

# Set correct permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Restart Nginx
sudo systemctl restart nginx
```

### Load Balancer Setup (Lb01)
```bash
# SSH into the load balancer
ssh ubuntu@54.87.168.130

# Install Nginx
sudo apt update && sudo apt install nginx -y
```

Add this configuration to `/etc/nginx/sites-available/default`:
```nginx
upstream wallstreet_backend {
    server 34.227.15.242;
    server 13.222.62.164;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://wallstreet_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
```bash
# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### Verifying the Load Balancer
```bash
# Send 10 requests and check both servers receive traffic
for i in {1..10}; do curl -s -o /dev/null http://54.87.168.130; done

# Check access logs on Web01
ssh ubuntu@34.227.15.242 "sudo tail -f /var/log/nginx/access.log"

# Check access logs on Web02
ssh ubuntu@13.222.62.164 "sudo tail -f /var/log/nginx/access.log"
```

## Challenges and solutions

| Challenge | Solution |
|-----------|---------|
| Alpha Vantage free tier rate limit (25/day) | Implemented demo mode with sample data so app works without API calls |
| NewsAPI blocks requests from `file://` | Used Live Server locally and Nginx in production to serve over HTTP |
| localStorage saving demo stocks on first load | Added a check to clear demo data when real API keys are configured |
| Keeping API keys out of the repository | Used placeholder constants — real keys submitted via Canvas comments |

## Credits

- Alpha Vantage- Stock market data API.
- NewsAPI - News aggregation API.
- Google fonts - Fraunces, Lato, DM Mono typefaces
- Nginx - Web server and load balancer

## License

- MIT License - free to use and modify.


