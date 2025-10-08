# Restaurant Intelligence Dashboard

A comprehensive competitive intelligence system for analyzing Boston Indian restaurants through real-time data collection, sentiment analysis, and market insights.

[Restaurant Dashboard](image.png)

[SWOT Analysis](image-1.png)

## 🚀 Features

### Real-Time Data Collection
- **18 Boston Restaurants** actively monitored
- **Live WebSocket** connections for real-time updates
- **147 Menu Items** tracked across all venues
- Automated scraping from Toast, Clover, and GrubHub platforms

### Analytics & Insights
- **Sentiment Analysis** of customer reviews
- **RFM Analysis** (Recency, Frequency, Magnitude)
- **Live SWOT Analysis** with real-time market positioning
- **AI-Generated Priority Recommendations** from live data
- **Competitive Pricing** intelligence
- **Menu Item Tracking** and popularity metrics

### Dashboard Components
- **Overview Dashboard** - System status and key metrics
- **Restaurant Directory** - Complete Boston venue listing
- **Analytics Hub** - Business insights and trends
- **Reviews Monitor** - Real-time sentiment analysis
- **Live Feed** - Real-time data updates

## 🛠 Technology Stack

### Backend
- **FastAPI** - High-performance API framework
- **Selenium** - Web scraping automation
- **BeautifulSoup** - HTML parsing
- **SQLite** - Database with JSON storage architecture
- **WebSocket** - Real-time data streaming

### Frontend
- **React/Next.js** - Modern UI framework
- **TypeScript** - Type-safe development
- **Custom WebSocket Hooks** - Real-time data integration
- **HooBank Theme** - Dark glassmorphism design
- **Responsive Design** - Mobile-first approach

## 📊 System Status

- **Connection Status**: Connected ✅
- **Data Collection**: Active 🟢
- **Last Update**: 11:51:30 AM
- **Monitoring**: 18 restaurants with live data feeds

## 🎯 Key Metrics

| Metric | Value | Status |
|--------|--------|--------|
| Boston Restaurants | 18 | Active monitoring |
| Active Data Collection | 18 | Live data |
| Menu Items | 147 | Per restaurant average: 8 |
| System Status | Online | Real-time updates |

## 📊 SWOT Analysis & Recommendations

The dashboard provides real-time SWOT analysis with AI-generated priority recommendations:

### Live Market Intelligence
- **Customer Sentiment**: 50% (below market standard)
- **Market Rank**: #10 position
- **Data Updates**: Every few minutes (11:53:06 AM)

### SWOT Framework
- **Strengths**: Strong market position
- **Weaknesses**: Weak online presence, Low customer engagement  
- **Opportunities**: Improve online presence, Address customer service, Add delivery service
- **Threats**: Real-time competitive monitoring

### AI-Powered Recommendations
The system generates prioritized action items based on live data:

1. **Address customer service quality immediately** (HIGH priority)
   - Investment: $8K-15K in staff training
   - Expected Impact: 20-30% improvement in retention
   - Timeline: 1-2 months

2. **Digital presence transformation** (HIGH priority)
   - Current score: 15/100 vs market avg 15
   - Expected Impact: 35-50% increase in online orders
   - Investment: $12K-20K in digital marketing platform
   - Timeline: 2-3 months

## 🔧 Installation & Setup
- Node.js 18+
- Python 3.8+
- Chrome/Chromium browser

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd restaurant-intelligence

# Install Python dependencies
pip install fastapi selenium beautifulsoup4 sqlite3

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌐 API Endpoints

### Restaurant Data
- `GET /api/restaurants` - Get all monitored restaurants
- `GET /api/restaurants/{id}` - Get specific restaurant data
- `GET /api/restaurants/{id}/menu` - Get restaurant menu items

### Analytics
- `GET /api/analytics/sentiment` - Review sentiment analysis
- `GET /api/analytics/pricing` - Competitive pricing data
- `GET /api/analytics/rfm` - RFM analysis results

### WebSocket
- `WS /ws/live-updates` - Real-time data stream
- `WS /ws/restaurant/{id}` - Restaurant-specific updates

## 🎨 UI Components

### Custom Hooks
- `useRestaurantWebSocket` - WebSocket connection management
- `useRealTimeData` - Live data updates
- `useSentimentAnalysis` - Review analysis

### Key Components
- `RestaurantCard` - Individual restaurant display
- `LiveDataFeed` - Real-time update stream
- `AnalyticsDashboard` - Business insights visualization
- `SWOTAnalysis` - Live competitive analysis
- `PriorityRecommendations` - AI-powered action items

## 📱 Features in Detail

### Data Collection System
The system continuously monitors 18 Boston Indian restaurants, collecting:
- Menu items and pricing
- Customer reviews and ratings
- Operating hours and availability
- Special offers and promotions

### Real-Time Updates
Live WebSocket connections provide:
- Instant menu changes
- New review notifications
- Pricing updates
- System status changes

### Competitive Intelligence
Advanced analytics including:
- Market positioning analysis
- Pricing strategy insights
- Customer sentiment trends
- Menu popularity rankings

## 🔒 Data Architecture

```
SQLite Database
├── restaurants/          # Restaurant profiles
├── menu_items/          # Menu data with JSON fields
├── reviews/             # Customer reviews
├── analytics/           # Processed insights
└── system_logs/         # Operation logs
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Variables
```env
DATABASE_URL=sqlite:///restaurant_data.db
WEBSOCKET_URL=ws://localhost:8000/ws
API_BASE_URL=http://localhost:8000/api
```

## 📈 Roadmap

- [ ] Machine learning price prediction
- [ ] Customer behavior analytics
- [ ] Mobile app companion
- [ ] Multi-city expansion
- [ ] AI-powered menu recommendations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

**Developer**: Yash Harale  
**University**: Northeastern University - Data Analytics  
**Focus**: Restaurant competitive intelligence & SaaS platforms

---

Built with ❤️ for the Boston restaurant community