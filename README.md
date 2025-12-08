# VillageConnect - Connect Local Producers with Buyers

VillageConnect bridges the gap between rural producers and urban consumers. It allows local producers to list their products (crops, handicrafts, livestock, etc.) and buyers to discover and connect with them directly.

## 🚀 Features

- **User Authentication**: Secure registration and login for users.
- **Product Management**:
    - Users can post products with images, description, price, and category.
    - Full CRUD (Create, Read, Update, Delete) capabilities for own products.
- **Product Discovery**:
    - Browse products by category (Agriculture, Handicrafts, Livestock, etc.).
    - Search functionality to find specific items.
    - **Filter by Village**: Find products from specific locations.
- **Dashboard**: User dashboard to manage posted products and saved items.
- **Saved Products**: Users can save products they are interested in.
- **Real-time Notifications**: Notifications for new product posts using Socket.IO.
- **Responsive Design**: Mobile-friendly interface for easy access on any device.

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Semantic structure and custom styling.
- **JavaScript (Vanilla)**: Dynamic client-side logic.
- **Google Fonts & FontAwesome**: Typography and icons.

### Backend
- **Node.js & Express.js**: RESTful API server.
- **MongoDB**: NoSQL database for storing users, products, and notifications.
- **Mongoose**: ODM for MongoDB.
- **Cloudinary**: Cloud storage for product images.
- **Socket.IO**: Real-time bidirectional event-based communication.
- **Multer**: Middleware for handling `multipart/form-data`.
- **JWT (JSON Web Tokens)**: (Implied via code structure, though 'token' field used in User model).

## 📂 Project Structure

```
villageconnect/
├── backend/                # Node.js Backend
│   ├── models/             # Mongoose Models (User, Product, Notification)
│   ├── uploads/            # Temporary upload directory
│   ├── .env                # Environment variables
│   ├── server.js           # Main server entry point
│   ├── package.json        # Backend dependencies
│   └── seed.js             # Database seeder
│
├── frontend/               # Static Frontend
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side scripts
│   ├── img/                # Assests
│   ├── index.html          # Landing Page
│   ├── products.html       # Product listing
│   ├── dashboard.html      # User dashboard
│   ├── ... (other html files)
│
└── uploads/                # Root uploads directory (if used)
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js installed on your machine.
- MongoDB installed locally or a MongoDB Atlas account.
- Cloudinary account for image hosting.

### 1. Clone the Repository
```bash
git clone https://github.com/mitulaghara/villageconnect.git
cd villageconnect
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# JWT_SECRET=your_jwt_secret (if applicable)
```

Start the server:
```bash
npm start
# OR for development
npm run dev
```
The server will start on `http://localhost:5001`.

### 3. Frontend Setup
The frontend is a static web application. You can serve it in a few ways:

- **Option A (Via Backend)**: In production mode (`NODE_ENV=production`), the backend server is configured to serve the frontend files from `../frontend`.
- **Option B (VS Code Live Server)**: Open the `frontend/index.html` file using the "Live Server" extension in VS Code.

Ensure the frontend knows where the backend API is located. Check `frontend/js/main.js` or script blocks to ensure `API_BASE_URL` points to your running backend (default is usually `http://localhost:5001/api`).

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the ISC License.

## 👤 Author
**Mitul Aghara**
- GitHub: [@mitulaghara](https://github.com/mitulaghara)
- LinkedIn: [Mitul Aghara](https://www.linkedin.com/in/mitul-aghara-602a72332/)
