# HarvestDirect: Farm-to-Wholesale E-commerce Platform

HarvestDirect is a comprehensive e-commerce platform designed to connect farmers and fishermen directly with wholesalers, eliminating middlemen in the agricultural and marine product supply chain. The platform provides a streamlined marketplace for trading fresh produce and seafood, with features for product listings, order management, secure payments, and analytics.

## Features

### For Farmers/Fishermen (Sellers)
- **Product Management**: Create, update, and manage product listings with descriptions, prices, quantities, and photos
- **Order Processing**: Manage incoming orders from wholesalers
- **Analytics Dashboard**: Track sales, popular products, and buyer trends
- **Inventory Management**: Update product availability and quantities
- **Payment Processing**: Secure payment collection via Stripe integration

### For Wholesalers (Buyers)
- **Product Discovery**: Browse and search for available products from various sellers
- **Shopping Cart**: Add items and manage quantities before checkout
- **Order Placement**: Complete purchases with delivery information
- **Payment Options**: Secure checkout with Stripe payment processing
- **Order History**: View past orders and their status
- **Analytics**: Track purchase history and spending patterns

## Technology Stack

- **Frontend**: React.js, TypeScript, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Drizzle ORM
- **Authentication**: Passport.js, Express Session
- **Payment Processing**: Stripe API integration

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- Stripe account (for API keys)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file:
   ```
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/harvestdirect
   PGHOST=localhost
   PGUSER=your_postgres_username
   PGPASSWORD=your_postgres_password
   PGDATABASE=harvestdirect
   PGPORT=5432

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

   # Session
   SESSION_SECRET=your_random_session_secret
   ```
4. Initialize the database: `npm run db:push`
5. Start the development server: `npm run dev`
6. Access the application at http://localhost:5000

### Test Accounts

The system automatically creates these accounts on first run:

- **Wholesaler**: username: `wholesaler`, password: `password123`
- **Farmer**: username: `farmer`, password: `password123`

## Project Structure

```
harvestdirect/
├── client/               # Frontend code
├── server/               # Backend code
├── shared/               # Shared code and schemas
└── package.json          # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/register`: Register a new user
- `POST /api/login`: Authenticate a user
- `POST /api/logout`: Log out the current user
- `GET /api/user`: Get the current user's information

### Products
- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get a specific product
- `POST /api/products`: Create a new product
- `PUT /api/products/:id`: Update a product
- `DELETE /api/products/:id`: Delete a product

### Orders
- `GET /api/orders`: Get orders (filtered by user role)
- `GET /api/orders/:id`: Get a specific order
- `POST /api/orders`: Create a new order

### Cart
- `GET /api/cart`: Get the current user's cart
- `POST /api/cart`: Add an item to the cart
- `DELETE /api/cart/:id`: Remove an item from the cart
- `DELETE /api/cart`: Clear the cart

## Future Enhancements

- Advanced search and filtering
- Inventory management system
- Subscription model for recurring orders
- Mobile app support
- Enhanced user profiles with ratings and reviews
- Real-time chat between buyers and sellers
- Logistics integration for shipping

## License

This project is licensed under the MIT License.
