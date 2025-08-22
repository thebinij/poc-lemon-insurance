# Bruno API Testing - Lemon Insurance Backend

## 🌍 **Environments**

### **Local Environment**
- **File**: `environments/local.bru`
- **Usage**: Development and local testing
- **Services**: Localhost URLs, LocalStack, Docker containers
- **No secrets required** - uses default development values

### **UAT Environment**
- **File**: `environments/uat.bru`
- **Usage**: User Acceptance Testing
- **Services**: UAT servers, AWS services
- **Default values provided** - update with actual values when needed

## 🔧 **Setting Up UAT Environment**

### **1. Edit UAT Environment File**
Edit `environments/uat.bru` and replace default values with actual ones:
```bru
vars {
  env: uat
  baseUrl: https://your-actual-uat-api.com
  parseUrl: https://your-actual-uat-parse.com
  parseAppId: "actual-app-id"
  parseMasterKey: "actual-master-key"
  parseJsKey: "actual-js-key"
  # ... update other values as needed
}
```

### **2. Use Default Values for Development**
- Default values are safe to commit
- Update only when testing against real UAT servers
- No separate secrets files needed

## 🚀 **Running Tests**

### **Local Development**
```bash
# Start backend services
npm run dev

# Run Bruno tests
cd bruno/insurance && npx @usebruno/cli run
cd bruno/parse && npx @usebruno/cli run
```

### **UAT Testing**
```bash
# Ensure UAT environment is configured
# Run tests against UAT servers
cd bruno/insurance && npx @usebruno/cli run --env uat
cd bruno/parse && npx @usebruno/cli run --env uat
```

## 📁 **File Structure**
```
bruno/
├── environments/
│   ├── local.bru          # Local development variables
│   └── uat.bru            # UAT environment with default values
├── insurance/              # Generic insurance collection API tests
├── parse/                  # Parse Server API tests
├── collection.bru          # Root collection configuration
└── bruno.json             # Collection metadata
```

## 🏥 **Generic Insurance Collection API Endpoints**

**Note**: This is a **Generic Collection API** that uses the same endpoints for different insurance types. All endpoints return `202 Accepted` status with request tracking information.

**Supported Insurance Types**: `travel`, `motor`, `health`, `general`

### **Unified API Endpoints**

#### **1. Get Available Plans**
- **Endpoint**: `POST /api/insurance/GetAvailablePlans`
- **Purpose**: Get available insurance plans for any insurance type
- **Auto-detects insurance type** from request payload:
  - **Travel**: `travelDetail`, `departureCountry`, `destinationCountry`
  - **Motor**: `vehicleDetail`, `vehicleType`, `licensePlate`
  - **Health**: `healthDetail`, `medicalHistory`, `coverageType`
- **Returns**: Session token for subsequent API calls

#### **2. Save Selected Plan**
- **Endpoint**: `POST /api/insurance/SaveSelectedPlan`
- **Purpose**: Save the selected insurance plan
- **Required**: `sessionToken`, `selectedPlan` array
- **Insurance Type**: Determined from session context

#### **3. Proceed Payment**
- **Endpoint**: `POST /api/insurance/ProceedPayment`
- **Purpose**: Process insurance payment
- **Required**: `amount`, `sessionToken`, `passengers` array
- **Insurance Type**: Determined from session context

#### **4. Confirm Purchase**
- **Endpoint**: `POST /api/insurance/ConfirmPurchase`
- **Purpose**: Finalize insurance purchase
- **Required**: `sessionToken`, `channelCode`, `channel`, `source`
- **Insurance Type**: Determined from session context

### **Legacy Endpoints (Backward Compatibility)**
- `POST /api/insurance/policies` → Redirects to `GetAvailablePlans`
- `POST /api/insurance/claims` → Redirects to `ProceedPayment`

## 🔄 **API Response Format**

All endpoints return `202 Accepted` with this structure:
```json
{
  "success": true,
  "message": "Travel available plans request received and queued for processing",
  "requestId": "uuid-v4",
  "eventId": "parse-object-id",
  "insuranceType": "travel",
  "status": "pending"
}
```

## 🏗️ **Architecture**

- **Main Baas Server**: Generic Collection API that receives requests and queues them to SQS
  - **Unified endpoints** for all insurance types
  - **Auto-detects insurance type** from request payload
  - **Creates typed events** in Parse Server for tracking
  - **Sends typed messages** to SQS for Lambda processing
- **Lambda Functions**: Handle all business logic for different insurance types
  - **Single Lambda function** handles all insurance types
  - **Type-specific logic** based on `insuranceType` field
  - **Processes requests** and stores results in Parse Server
- **Parse Server**: Stores event records and processed data
- **SQS**: Message queue for async processing with insurance type context

## 🚗 **Motor Insurance Example**

```json
{
  "insuredDetail": {
    "fullName": "John Doe",
    "extension": "+1",
    "mobileNumber": "5550123",
    "email": "john.doe@example.com"
  },
  "vehicleDetail": {
    "vehicleType": "car",
    "licensePlate": "ABC-123",
    "engineCapacity": "2000cc",
    "make": "Toyota",
    "model": "Camry",
    "year": "2020"
  }
}
```

## ✈️ **Travel Insurance Example**

```json
{
  "insuredDetail": {
    "fullName": "TEST Aug 21-11:29",
    "extension": "+968",
    "mobileNumber": "98201092",
    "email": "deedd@example.com"
  },
  "travelDetail": {
    "tripType": "one-way",
    "departureCountry": "OM",
    "destinationCountry": "AF",
    "departureDate": "2025-08-22",
    "adultCount": "1",
    "childCount": "0",
    "infantCount": "0"
  }
}
```

## 🔄 **API Flow**

1. **Get Available Plans** → Returns session token
2. **Save Selected Plan** → Uses session token
3. **Proceed Payment** → Uses session token
4. **Confirm Purchase** → Uses session token

## 🧪 **Testing Strategy**

### **Test Files**
- `generic-api.bru` - Tests all 4 generic endpoints with different insurance types
- `policies.bru` - Legacy policy tests (redirects to generic endpoints)
- `claims.bru` - Legacy claim tests (redirects to generic endpoints)
- `customers.bru` - Customer management tests
- `health.bru` - Health check tests

### **Test Scenarios**
- **Travel Insurance Flow**: Complete flow from plans to purchase
- **Motor Insurance Flow**: Complete flow from plans to purchase
- **Session Token Management**: Verify session token usage across endpoints
- **Insurance Type Detection**: Test auto-detection for different payloads

## ⚠️ **Security Notes**
- Default values in UAT environment are safe to commit
- Update values only when testing against real UAT servers
- No sensitive secrets stored in files
- Simple and straightforward environment management
