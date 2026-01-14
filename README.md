# Khula Smart Input - Product Ordering System

Backend API for agri-dealers to manage product inventory and process farmer orders intelligently.

## Features

- **Dealer Management**: Register and manage agri-dealers with location tracking
- **Product Inventory**: Create products with quantity-based pricing tiers
- **Smart Order Matching**: Automatically match orders to the best dealer based on:
  - Stock availability
  - Proximity to farmer location (Haversine distance)
  - Lowest price for the quantity ordered
- **Order Fulfillment Tracking**: Track order status from placement to delivery
- **Automatic Stock Reservation**: Reserve inventory when orders are placed
- **Dealer Performance Ranking**: Track fulfillment performance and delivery times

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

   The project is configured with `.npmrc` to automatically use `--legacy-peer-deps`.

   If you encounter npm cache permission issues, try:
   ```bash
   sudo chown -R $(whoami) ~/.npm
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/khula_db?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

3. **Create the database**:

   ```bash
   createdb khula_db
   ```

   Or using PostgreSQL client:
   ```sql
   CREATE DATABASE khula_db;
   ```

4. **Run database migrations**:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Seed the database** (optional - adds sample data):

   ```bash
   npx prisma db seed
   ```

## Running the Application

### Development mode:
```bash
npm run start:dev
```

### Production mode:
```bash
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api/v1`

## API Documentation

Swagger documentation is available at: `http://localhost:3000/api/docs`

## API Endpoints

### Dealers
- `POST /api/v1/dealers` - Register a new agri-dealer
- `GET /api/v1/dealers` - List all dealers
- `GET /api/v1/dealers/:id` - Get dealer details

### Products
- `POST /api/v1/products` - Create a new product with pricing tiers
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get product details

### Orders
- `POST /api/v1/orders` - Place a new order (with smart dealer matching)
- `GET /api/v1/orders/:id` - View order status and details
- `PATCH /api/v1/orders/:id/status` - Update order fulfillment status

## Order Matching Logic

When an order is placed, the system:

1. **Validates stock availability**: Finds dealers with sufficient inventory
2. **Calculates distance**: Uses Haversine formula to find nearest dealers
3. **Compares pricing**: Applies quantity-based pricing tiers
4. **Selects best dealer**: Chooses based on:
   - Stock availability (must have full quantity)
   - Lowest total price
   - Nearest location
   - Dealer performance rating
5. **Reserves stock**: Automatically updates inventory
6. **Estimates delivery**: Calculates delivery time based on distance

## Pricing Tiers

Products support quantity-based pricing:
```
Example: NPK Fertilizer
- 0-50 kg:    R20/kg
- 50-100 kg:  R18/kg
- 100+ kg:    R15/kg
```

## Database Schema

### Tables:
- **dealers**: Agri-dealer information and location
- **products**: Product catalog
- **pricing_tiers**: Quantity-based pricing for products
- **inventory**: Stock levels per dealer per product
- **orders**: Customer orders with status tracking
- **order_items**: Individual products in each order

### Key Relationships:
- A dealer has many products in inventory
- A product has multiple pricing tiers
- An order belongs to a dealer and contains multiple order items

## Testing

### Run unit tests:
```bash
npm test
```

### Run tests with coverage:
```bash
npm run test:cov
```

### Run e2e tests:
```bash
npm run test:e2e
```

## Development Tools

### View database in Prisma Studio:
```bash
npm run prisma:studio
```

### Format code:
```bash
npm run format
```

### Lint code:
```bash
npm run lint
```

## Project Structure

```
khula/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Database seeding
│   └── migrations/        # Database migrations
├── src/
│   ├── common/            # Shared utilities, DTOs, interfaces
│   ├── dealers/           # Dealer module
│   ├── products/          # Product module
│   ├── orders/            # Order module
│   ├── prisma/            # Prisma service
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── test/                  # E2E tests
└── package.json
```

## Sample API Workflow

### 1. Register a Dealer:
```bash
POST /api/v1/dealers
{
  "name": "Green Valley Agri Supplies",
  "email": "contact@greenvalley.co.za",
  "phone": "+27123456789",
  "latitude": -26.2041,
  "longitude": 28.0473,
  "address": "Johannesburg, Gauteng"
}
```

### 2. Create a Product:
```bash
POST /api/v1/products
{
  "name": "NPK Fertilizer",
  "category": "Fertilizers",
  "unit": "kg",
  "pricingTiers": [
    { "minQuantity": 0, "maxQuantity": 50, "pricePerUnit": 20 },
    { "minQuantity": 50, "maxQuantity": 100, "pricePerUnit": 18 },
    { "minQuantity": 100, "pricePerUnit": 15 }
  ]
}
```

### 3. Place an Order:
```bash
POST /api/v1/orders
{
  "farmerName": "John Mokoena",
  "farmerPhone": "+27123456789",
  "farmerEmail": "john@farm.co.za",
  "deliveryLatitude": -26.1234,
  "deliveryLongitude": 28.0567,
  "deliveryAddress": "Farm 123, Johannesburg South",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 80
    }
  ]
}
```

**Response includes**:
- Assigned dealer (best match)
- Total cost with applied pricing tiers
- Estimated delivery time
- Order confirmation number

### 4. Update Order Status:
```bash
PATCH /api/v1/orders/:id/status
{
  "status": "DELIVERED"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `API_PREFIX` | API route prefix | api/v1 |

## Bonus Features Implemented

- ✅ **Distance Calculation**: Haversine formula for accurate distance
- ✅ **Dealer Ranking**: Performance tracking (orders fulfilled, delivery time)
- ✅ **Backordering Logic**: Partial fulfillment support (coming soon)
- ✅ **Stock Reservation**: Automatic inventory updates
- ✅ **Swagger Documentation**: Complete API docs

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

ISC
