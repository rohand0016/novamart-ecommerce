# NovaMart — E-Commerce Product Catalog

A full-stack e-commerce web application built with the MERN stack, featuring product browsing, product details, shopping cart management, favorites, and checkout.

## Features

- **Product Catalog:** Browse products with pagination.
- **Product Details:** View individual product information.
- **Shopping Cart:** Manage products before checkout.
- **Favorites:** Save products for later.
- **Checkout:** Submit orders through the backend API.
- **REST API:** Backend endpoints for products and orders.
- **MongoDB Integration:** Store product and order data.
- **Responsive UI:** React-based user interface.
- **Environment Configuration:** Keep database configuration in environment variables.

## Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

## Project Structure

```text
E-Commerce-Product-Catalog/
├── client/       # React frontend
├── server/       # Express backend
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install Node.js, npm, and MongoDB before running the application.

### 1. Clone the repository

```bash
git clone https://github.com/rohand0016/novamart-ecommerce.git
cd novamart-ecommerce
```

### 2. Configure the backend

Open the server directory:

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/novamart
```

Start the backend:

```bash
node server.js
```

The API should run at `http://localhost:5000`.

### 3. Start the frontend

Open a **second terminal** in the project root and run:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check backend status |
| GET | `/api/products` | Retrieve products |
| POST | `/api/orders` | Submit an order |

The available endpoints may depend on the current backend implementation.

## Author

**Rohan Dhope**

GitHub: [@rohand0016](https://github.com/rohand0016)

## License

This project was developed for educational and internship purposes.
