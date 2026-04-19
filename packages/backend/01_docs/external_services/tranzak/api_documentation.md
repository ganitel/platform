# Tranzak API Documentation

## Introduction

### Welcome to the official documentation site for Tranzak

The purpose of this site is to provide an open collection of technical topics and details about Tranzak developer APIs that are frequently requested by developers and IT specialists working within the Tranzak ecosystem. [docs.developer.tranzak](https://docs.developer.tranzak.me)

For an overview of the solution and to learn more about the business applications of Tranzak, visit https://tranzak.net. [docs.developer.tranzak](https://docs.developer.tranzak.me)

For support needs, email: `support@tranzak.net`. [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Managing Apps and appKeys

All Tranzak APIs and Keys are linked to an Application. You can create this application from the developer portal or use the default application provided to you. You can also create multiple applications and manage their app keys separately. [docs.developer.tranzak](https://docs.developer.tranzak.me)

Once your organization has been onboarded to Tranzak, you will be given an account to the developer portal to view your dashboard, manage your apps related keys, as well as key scopes (`collection`, `disbursement` or both). [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Notes:**
- Sandbox appKeys are prefixed with `SAND_` (e.g., `SAND_C1B041767BBA4B5D808D91AFB18002A5`) [docs.developer.tranzak](https://docs.developer.tranzak.me)
- Production appKeys are prefixed with `PROD_` (e.g., `PROD_HB2141767BBA4B5D808D91AFB1812H38`) [docs.developer.tranzak](https://docs.developer.tranzak.me)

***

## Common Request Parameters

These Headers must be passed in all requests: [docs.developer.tranzak](https://docs.developer.tranzak.me)

| Scope | Parameter | Location | Description | Required |
|-------|-----------|----------|-------------|----------|
| - | Authorization | header | Authentication token, in the format `Bearer ${token}` | true |
| - | X-App-ID | header | Application's appId | false |

### Date and Time Format

All time and dates are formatted using ISO 8601 format: [docs.developer.tranzak](https://docs.developer.tranzak.me)
- Example: `2022-06-29T21:46:50+00:00`

***

## General Response Format

Tranzak API calls return HTTP status codes. Requests that do not generate errors (4xx, 5xx) will generally return HTTP status code 200. The `success` flag indicates whether the execution was successful: [docs.developer.tranzak](https://docs.developer.tranzak.me)

- **success = TRUE**: Indicates that the execution was successful
- **success = FALSE**: Indicates the request was not successfully executed [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Response Payload Examples

**Successful Request:**
```json
{
  "data": {
    "response": "pong"
  },
  "success": true
}
```

**Paginated List:**
```json
{
  "data": [],
  "totalItems": 984,
  "pageSize": 50,
  "currentPage": 3,
  "hasMore": true,
  "success": true
}
```

**Failed Request:**
```json
{
  "data": {},
  "success": false,
  "errorMsg": "Invalid or unsupported currency code:XAsF",
  "errorCode": 0
}
```

***

## Authentication

### Glossary

- **App ID**: Used to identify the caller of a Tranzak Partner API endpoint [docs.developer.tranzak](https://docs.developer.tranzak.me)
- **App Key**: The key generated from the Tranzak developer portal [docs.developer.tranzak](https://docs.developer.tranzak.me)
- **Bearer token**: A token placed in the header of an HTTP request to authenticate the merchant [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Base URL

| Environment | Base URL |
|-------------|----------|
| PRODUCTION | https://dsapi.tranzak.me |
| SANDBOX | https://sandbox.dsapi.tranzak.me |

### Security Considerations

- All Tranzak API endpoints must be accessed via HTTPS [docs.developer.tranzak](https://docs.developer.tranzak.me)
- Keep the app key safe as it carries a lot of privileges [docs.developer.tranzak](https://docs.developer.tranzak.me)
- Generating a new app key renders existing app keys for the same app ID unusable [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Generate Token

**Endpoint:** `POST /auth/token`

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appId | String | true | App Id |
| appKey | String | true | The app key generated from the developer portal |

**Request Example:**
```json
{
  "appId": "apabc123abc133",
  "appKey": "PROD_91AFB18002A5C1B041767BBA4B5D808D91AFB18MJU89"
}
```

**Response Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scope | String | true | Comma separated value showing different scopes (e.g., `collections,disbursement`) |
| token | String | true | The bearer token for Authorization header |
| expiresIn | Integer | true | Number of seconds till the token expires |

**Response Example:**
```json
{
  "data": {
    "scope": "collections",
    "appId": "ap6gf77v3tdyq4",
    "token": "50E41R0RDEYK1TPWE0MEWX801HM0T42K1TCEMMC0U2E1HR08",
    "expiresIn": 7200
  },
  "success": true
}
```

***

## Pagination

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | Integer | false | The page number |
| pageSize | Integer | false | Number of items per page (Default = 10, maximum = 50) |
| totalItems | Integer | false | Total number of items in the result-set |
| pageCount | Array | false | Minimum and maximum pageSize values (1 .. 50) |
| currentPage | Integer | false | Current page number |
| hasMore | Boolean | false | Whether there are more items beyond this page |

**Formula:** Total pages = totalItems/pageSize [docs.developer.tranzak](https://docs.developer.tranzak.me)

***

## Error Codes

### Payer-Related Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 1000 | PAYER_UNDEFINED_ERROR | Unspecified error relating to payer's account |
| 1001 | PAYER_INSUFF_BALANCE | Insufficient balance in payer's account |
| 1002 | PAYER_PAYMENT_METHOD_ERROR | Invalid payment method selected |
| 1003 | PAYER_PAYMENT_METHOD_UNSPECIFIED | No payment method specified |
| 1004 | PAYER_AUTHORIZATION_REQUIRED | Transaction requires authorization |
| 1010 | PAYER_INVALID_PIN | The payment PIN is not valid |
| 1011 | PAYER_INVALID_RNV_KYC | Payer has not completed KYC checks |
| 1201 | PAYER_SETTLEMENT_AMOUNT_VIOLATION | Settlement amount is not within transaction limits |

### Beneficiary/Merchant-Related Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 2000 | BENE_UNDEFINED_ERROR | Unspecified error relating to beneficiary's account |
| 2001 | BENE_ACCOUNT_INVALID | The destination account is not valid |
| 2002 | BENE_ACCOUNT_NAME_MISMATCH | The name of the beneficiary does not match |

### Transaction Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 3000 | TXN_GENERAL_FAILURE | Transaction general failure |
| 3001 | TXN_FAILED_OPERATOR_ERROR | Transaction failed due to operator's network problems |
| 3002 | TXN_PIN_AUTHORIZATION_REQUIRED | Payment authorization PIN required |
| 3003 | TXN_FAILED_INTERNAL_ERROR | Internal error |
| 3004 | TXN_EXPIRED | The transaction expired |
| 3005 | TXN_UNSUPPORTED_CURRENCY | Transaction currency code not supported |
| 3007 | TXN_INVALID_AMOUNT | Transaction amount not within acceptable limits |
| 3008 | TXN_CANCELLED | Transaction is cancelled and may no longer be processed |
| 3009 | TXN_INVALID_AUTHORIZATION_CODE | Invalid/wrong authorization code |
| 3010 | TXN_APPROVAL_REQUIRED | Transaction requires manual approval |
| 3011 | TXN_PAYMENT_METHOD_UNSUPPORTED | Payment method not supported |
| 3012 | TXN_CROSS_BORDER_PAYMENT_UNSUPPORTED | Cross-border payment not enabled |
| 3013 | TXN_LIMIT_EXCEEDED | Transaction limits exceeded |

### Authentication/Authorization Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 401 | INVALID_ACCESS_TOKEN | The access token is invalid |
| 4001 | AUTH_INVALID_CREDENTIALS | Invalid login credentials provided |

### General System Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 5001 | SYSTEM_PARSE_ERROR | Data input could not be parsed |
| 5002 | SYSTEM_GENERAL_VALIDATION_ERROR | One or more input parameters invalid |
| 5005 | SYSTEM_EXCEPTION | An internal error occurred |
| 5006 | SYSTEM_ADMIN_RESTRICTED | Account has been restricted |
| 5007 | SYSTEM_ADMIN_POLICY_VIOLATION | Transaction violated policy |
| 5008 | SYSTEM_INTERNAL_ERROR | Temporary internal error |

### Financial Partner/Operator Errors

| Error Code | String | Description |
|------------|--------|-------------|
| 7001 | OPERATOR_COMM_ERROR | Communication channel to operator not stable |
| 7002 | OPERATOR_PAYER_INSUFF_BALANCE | Operator reported insufficient balance |
| 7003 | OPERATOR_INVALID_ACCOUNT_HOLDER | Account not valid or restricted |
| 7004 | OPERATOR_TXN_FAILED | Transaction failed at operator's side |
| 7005 | OPERATOR_INTERNAL_TXN_FAILURE | Operator internal error |
| 7006 | OPERATOR_SYSTEM_INTERNAL_ERROR | Operator system internal error |
| 7007 | OPERATOR_INVALID_SERVICE_PROVIDER | Operator temporarily not available |

***

## Account

### Account Details

**Endpoint:** `GET /xp021/v1/account/details?accountId={ACCOUNT_ID}`

**Response Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | String | true | Account ID |
| name | String | true | Account name |
| description | String | true | Custom description |
| currencyCode | String(3) | true | Currency code |
| totalBalance | Number | true | Total balance |
| isActive | bool | true | Whether account is active |
| type | bool | true | Account type |
| createdAt | String | true | Creation time |

**Response Example:**
```json
{
  "data": {
    "accountId": "PO648WT786QZ18FETE39",
    "name": "payout account",
    "description": "",
    "currencyCode": "XAF",
    "isActive": true,
    "type": "payout account",
    "totalBalance": 72590411,
    "availableBalance": 72590411
  },
  "success": true
}
```

### List Merchant Sub-Accounts

**Endpoint:** `GET /mapi/xp021/v1/account/accounts`

Displays paginated list of accounts (primary and merchant sub-accounts). [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Disbursement Account Balance

**Endpoint:** `POST /xp021/v1/account/payout-account-details`

### Collection Account Details

**Endpoint:** `POST /xp021/v1/account/collection-account-details`

### Generate Authorization Code

**Endpoint:** `POST /xp021/v1/account/generate-auth-code`

**Available only on SANDBOX environment**. [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Response Example:**
```json
{
  "data": {
    "authCode": "316246910952747138393729"
  },
  "success": true
}
```

***

## API Activity

### Transaction Notifications (TPN)

**Endpoint:** `GET /xp021/v1/api-activity/notifications`

Displays log of transaction notifications sent to configured webhook endpoints. [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tpnId | String | true | Unique notification ID |
| customTransactionId | String | false | Custom transaction reference |
| parentId | String | false | Parent ID of the notification |
| appId | String | false | The app ID |
| eventType | String | false | Webhook event type |
| resourceId | String | false | Resource reference |
| webhookId | String | false | Webhook ID |
| authKey | String | false | Webhook authentication key |
| url | String | false | Callback URL |
| responseStatusCode | String | false | HTTP status code |

### TPN Details

**Endpoint:** `GET /xp021/v1/api-activity/tpn-details?tpnId={TPN_ID}`

### Trigger a TPN

**Endpoint:** `POST /xp021/v1/api-activity/trigger-tpn`

**Request Body:**
```json
{
  "tpnId": "TPNJUPU9U7NF3QQHILHHN61Q3PF"
}
```

### API Call History

**Endpoint:** `GET /xp021/v1/api-activity/api-calls`

Displays recent calls made to the merchant API endpoint. All API calls are automatically deleted after 7 days. [docs.developer.tranzak](https://docs.developer.tranzak.me)

***

## Payment Request (Collection API)

Payment requests provide trackable means of managing collections via Tranzak merchant API. [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Payment Request Status Codes

| Code | Description |
|------|-------------|
| PENDING | Payment request is pending and may receive payment |
| SUCCESSFUL | Transaction was successfully completed |
| CANCELLED | Request is cancelled and may not receive payment |
| CANCELLED_BY_PAYER | Request was cancelled by payer |
| FAILED | Transaction failed; request may no longer receive payment |
| PAYMENT_IN_PROGRESS | Transaction process triggered but not yet completed |
| CANCELLED/REFUNDED | Transaction was voided |
| PAYER_REDIRECT_REQUIRED | Payer should be redirected to `paymentAuthUrl` |

### Common Payment Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | true | Amount to charge (e.g., 1000) |
| currencyCode | String(3) | true | 3-letter currency code (e.g., XAF) |
| description | String(255) | true | Transaction description |
| payerNote | String(32) | false | Note displayed to payer |
| mchTransactionRef | String(64) | false | Custom transaction reference (unique for 30 days) |
| returnUrl | String(500) | false | URL to redirect after payment completion |
| cancelUrl | String(500) | false | URL to redirect if payment cancelled |
| receivingAccountId | String(32) | false | Account to receive funds |
| serviceDiscountAmount | Number | false | Discount amount for informational purposes |
| receivingEntityName | string(32) | false | Custom name for receiving entity |
| transactionTag | String(32) | false | Custom transaction tag |
| customization | object | false | Layout customization parameters |
| payerFeePercentage | Number | false | Percentage of fee borne by payer (0-100) |
| callbackUrl | String(1000) | false | URL to invoke after request is processed |

#### Customization Object

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| logoUrl | String | false | URL of logo to display |
| title | String | false | Caption displayed to payer |

### Create Web Redirect Payment

**Endpoint:** `POST /xp021/v1/request/create`

**Request Example:**
```json
{
  "amount": 2000,
  "currencyCode": "XAF",
  "description": "A plate of fufu and eru",
  "mchTransactionRef": "myorder234555666",
  "returnUrl": "https://partner.example.com/fapi/order/processOrder?123444"
}
```

### Create Mobile Money Charge

**Endpoint:** `POST /xp021/v1/request/create-mobile-wallet-charge`

**Supported services:** MTN Cameroon Mobile Money, Orange Money Cameroon. [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Additional Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mobileWalletNumber | String(255) | true | Mobile wallet number with country code (e.g., 237680657567) |
| mchTransactionRef | String(32) | true | Custom transaction reference |

### Create Direct Charge via QR Code

**Endpoint:** `POST /xp021/v1/request/create-in-store-charge`

**Additional Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| authCode | String(255) | true | Authorization code from QR code |
| mchTransactionRef | String(32) | true | Custom transaction reference |

### Request Details

**Endpoint:** `GET /xp021/v1/request/details?requestId={REQUEST_ID}`

**Response Example (PENDING):**
```json
{
  "data": {
    "requestId": "REQ220705LXLDET890D9",
    "amount": 1000,
    "currencyCode": "XAF",
    "description": "Merchant Payment",
    "status": "PENDING",
    "creationTime": "2022-07-05T16:15:35+00:00",
    "mchTransactionRef": "2333333",
    "appId": "c4jtk945h35i",
    "createdAt": "2022-07-05T16:15:35+00:00",
    "links": {
      "returnUrl": "https://local-api.tranzak.me/fapi/order/processOrder?123444",
      "paymentAuthUrl": "https://pay.tranzak.me/flow/REQ220705LXLDET890D9"
    }
  },
  "success": true
}
```

### Cancel a Request

**Endpoint:** `POST /xp021/v1/request/cancel`

**Request Body:**
```json
{
  "requestId": "REQ220705UL6WUKML4QX"
}
```

### Void a Request

**Endpoint:** `POST /xp021/v1/request/void`

Cancels an unpaid or paid request. If payment had been received, a refund will be triggered. [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Request History

**Endpoint:** `GET /xp021/v1/request/history`

Display list of requests sorted by most recent. [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Filters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requestId | String(32) | true | Request ID |
| invoiceId | String(32) | true | Invoice ID |
| receivingAccountId | String(32) | true | Reference ID |
| transactionId | String(32) | true | Transaction ID |

### Refresh Transaction Status

**Endpoint:** `POST /xp021/v1/request/refresh-transaction-status`

Forcefully obtains the latest transaction status from third-party provider. [docs.developer.tranzak](https://docs.developer.tranzak.me)

### Webhook Details

Webhooks are sent when payment request reaches SUCCESSFUL or FAILED states. [docs.developer.tranzak](https://docs.developer.tranzak.me)

**Event Type:** `REQUEST.COMPLETED`

**Callback Payload Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | String | true | TPN info (e.g., "Tranzak Payment Notification (TPN)") |
| version | String | true | TPN version (e.g., "1.0") |
| eventType | String | true | Event type that triggered callback |
| appId | String | true | AppId that created the request |
| resourceId | String | true | Unique identifier of the request |
| resource | JSON object | true | API response with transaction details |
| webhookId | String | true | Webhook reference |
| creationDateTime | String | true | Time request was generated |
| authKey | String | true | Authentication key for verification |

***

