# Khula Smart Input - API Guide

## Quick Start

```bash
# 1. Setup (one command)
./setup.sh

# 2. Start the server
npm run start:dev

# 3. Access the API
# API: http://localhost:3000/api/v1
# Swagger Docs: http://localhost:3000/api/docs
```

---

## API Endpoints

### 🏪 Dealers

#### Register New Dealer
```bash
POST /api/v1/dealers
```

**Request Body:**
```json
{
  "name": "Fresh Farm Supplies",
  "email": "info@freshfarm.co.za",
  "phone": "+27123456799",
  "latitude": -26.1234,
  "longitude": 28.0567,
  "address": "Sandton, Johannesburg"
}
```

**Response:**
```json
{
  "id": "dealer-uuid",
  "name": "Fresh Farm Supplies",
  "email": "info@freshfarm.co.za",
  "rating": 5.0,
  "totalOrdersFulfilled": 0,
  "averageDeliveryTime": 0,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

#### List All Dealers
```bash
GET /api/v1/dealers
```

#### Get Dealer Details
```bash
GET /api/v1/dealers/:id
```

---

### 📦 Products

#### Create Product with Pricing Tiers
```bash
POST /api/v1/products
```

**Request Body:**
```json
{
  "name": "Premium Maize Seeds",
  "description": "High-yield hybrid seeds",
  "category": "Seeds",
  "unit": "kg",
  "pricingTiers": [
    { "minQuantity": 0, "maxQuantity": 25, "pricePerUnit": 150 },
    { "minQuantity": 25, "maxQuantity": 50, "pricePerUnit": 140 },
    { "minQuantity": 50, "pricePerUnit": 130 }
  ]
}
```

**Pricing Tiers Explained:**
- **0-25 kg**: R150/kg (small orders)
- **25-50 kg**: R140/kg (medium orders)
- **50+ kg**: R130/kg (bulk orders - no max limit)

**Response:**
```json
{
  "id": "product-uuid",
  "name": "Premium Maize Seeds",
  "category": "Seeds",
  "unit": "kg",
  "pricingTiers": [...],
  "createdAt": "2026-01-15T10:00:00Z"
}
```

#### List All Products
```bash
GET /api/v1/products
```

#### Get Product Details
```bash
GET /api/v1/products/:id
```

---

### 🛒 Orders (Smart Matching)

#### Place New Order
```bash
POST /api/v1/orders
```

**Request Body:**
```json
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

**Smart Matching Process:**
1. ✅ Validates all products exist
2. ✅ Finds dealers with sufficient stock
3. ✅ Calculates total cost using pricing tiers
4. ✅ Measures distance to each dealer (Haversine formula)
5. ✅ Selects best dealer based on:
   - Stock availability (must have all items)
   - Lowest total cost
   - Nearest location
6. ✅ Reserves inventory automatically
7. ✅ Estimates delivery time based on distance

**Response:**
```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-1768473101921-O2F0XZCPV",
  "farmerName": "John Mokoena",
  "status": "CONFIRMED",
  "totalAmount": 1440,
  "distanceKm": 9.02,
  "estimatedDeliveryHours": 3,
  "dealer": {
    "id": "dealer-uuid",
    "name": "Green Valley Agri Supplies",
    "phone": "+27123456789",
    "address": "Johannesburg, Gauteng"
  },
  "orderItems": [
    {
      "productId": "product-uuid",
      "quantity": 80,
      "pricePerUnit": 18,
      "totalPrice": 1440
    }
  ],
  "createdAt": "2026-01-15T10:31:41Z"
}
```

#### List All Orders
```bash
GET /api/v1/orders
```

#### Get Order Details
```bash
GET /api/v1/orders/:id
```

#### Update Order Status
```bash
PATCH /api/v1/orders/:id/status
```

**Request Body:**
```json
{
  "status": "DELIVERED"
}
```

**Available Statuses:**
- `PENDING` - Initial state
- `CONFIRMED` - Dealer assigned (automatic)
- `PROCESSING` - Being prepared
- `OUT_FOR_DELIVERY` - In transit
- `DELIVERED` - Completed (sets deliveredAt timestamp)
- `CANCELLED` - Order cancelled
- `BACKORDERED` - Waiting for stock

---

## Example Workflow

### 1. Register a Dealer
```bash
curl -X POST http://localhost:3000/api/v1/dealers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Green Valley Agri",
    "email": "contact@greenvalley.co.za",
    "phone": "+27123456789",
    "latitude": -26.2041,
    "longitude": 28.0473,
    "address": "Johannesburg, Gauteng"
  }'
```

### 2. Create a Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NPK Fertilizer",
    "category": "Fertilizers",
    "unit": "kg",
    "pricingTiers": [
      {"minQuantity": 0, "maxQuantity": 50, "pricePerUnit": 20},
      {"minQuantity": 50, "maxQuantity": 100, "pricePerUnit": 18},
      {"minQuantity": 100, "pricePerUnit": 15}
    ]
  }'
```

### 3. Place an Order (Smart Matching)
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "farmerName": "John Mokoena",
    "farmerPhone": "+27123456789",
    "deliveryLatitude": -26.1234,
    "deliveryLongitude": 28.0567,
    "deliveryAddress": "Farm 123",
    "items": [{"productId": "product-uuid", "quantity": 80}]
  }'
```

**Result:**
- ✅ System found best dealer (Green Valley - 9.02km away)
- ✅ Applied tier pricing: 80kg @ R18/kg = R1,440
- ✅ Estimated delivery: 3 hours
- ✅ Inventory reserved automatically

### 4. Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/v1/orders/order-uuid/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DELIVERED"}'
```

---

## Testing

### Run All Tests
```bash
npm test
```

**Test Coverage:**
- ✅ 51 tests passing
- ✅ 6 test suites
- ✅ Dealers: 14 tests
- ✅ Products: 20 tests
- ✅ Orders: 17 tests

### View Database
```bash
npm run prisma:studio
```

Opens http://localhost:5555 to browse data

---

## Pricing Logic Example

**Farmer orders 80kg of NPK Fertilizer:**

**Pricing Tiers:**
- 0-50kg: R20/kg
- 50-100kg: R18/kg ← **Applied**
- 100+kg: R15/kg

**Calculation:**
- Quantity: 80kg
- Falls in 50-100kg tier
- Price: 80 × R18 = **R1,440**

---

## Distance Calculation

Uses **Haversine formula** for accurate distance:

```
Farmer location: -26.1234, 28.0567
Dealer location: -26.2041, 28.0473
Distance: 9.02 km
```

---

## Delivery Time Estimation

**Formula:**
- Base time: 2 hours
- Additional: 1 hour per 50km

**Example:**
- Distance: 9.02 km
- Delivery time: 2 + (9.02/50) = **3 hours**

---

## Error Handling

### No Dealer Has Stock
```json
{
  "statusCode": 400,
  "message": "No dealer found with sufficient stock to fulfill this order",
  "error": "Bad Request"
}
```

### Invalid Product
```json
{
  "statusCode": 404,
  "message": "Product with ID xyz not found",
  "error": "Not Found"
}
```

### Invalid Pricing Tiers
```json
{
  "statusCode": 400,
  "message": "Gap or overlap detected between pricing tiers",
  "error": "Bad Request"
}
```

---

## Advanced Features

### ✅ Implemented
- Smart dealer matching (stock + price + distance)
- Quantity-based pricing tiers
- Haversine distance calculation
- Automatic inventory reservation
- Delivery time estimation
- Order status tracking
- Performance metrics (dealer rating, avg delivery time)

### 🔮 Future Enhancements
- Backordering logic (partial fulfillment)
- Real-time inventory updates
- Payment integration
- SMS/Email notifications
- Multi-dealer fulfillment
- Route optimization

---

## Support

- **Swagger Docs**: http://localhost:3000/api/docs
- **Database Studio**: http://localhost:5555 (via `npm run prisma:studio`)
- **Health Check**: http://localhost:3000/api/v1/health
