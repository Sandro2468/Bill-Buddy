# split_bill App Api Docs

## Available Endpoints

- `post` /register
- `post` /login
- `get` /logout
- `post` /ocr-receipt

## `POST` /register

This endpoint is used to register a new user in the system.

### Request

- Method: POST
- Endpoint: /register
- Body:

```json
{
  "email": "string",
  "password": "string"
}
```

### Response

_201 - Created_

- Body:

```json
{
  "message": "Success create user",
  "data": {
    "_id": "string",
    "email": "string"
  }
}
```

_400 - Bad Request_

````json

{
  "message": "Invalid email format"
}
OR
{
  "message": "Email or password is required"
}
```

_500 - Internal Server Error_
``` json
{
  "message": "Internal server error"
}
````

## `POST` /login

This endpoint is used for the user login process into the system.

### Request

- Method: POST
- Endpoint: /login
- Body:

```json
{
  "email": "string",
  "password": "string"
}
```

### Response

_200 - OK_

- Body:

```json
{
  "message": "Login success",
  "data": {
    "_id": "string",
    "email": "string",
    "access_token": "<access_token>"
  }
}
```

_400 - Bad Request_

```json
{
  "message": "Invalid email/password"
}
OR
{
  "message": "Email or password is required"
}
```

_500 - Internal Server Error_

```json
{
  "message": "Internal server error"
}
```

## `GET` /logout

This endpoint is used to log out the user from the system.

### Request

- Method: GET
- Endpoint: /logout

_302 - Found_
Redirects to the login page after successfully logging out.

## `POST` /ocr-receipt

This endpoint is used for OCR (Optical Character Recognition) processing of receipts.

### Request

- Method: POST
- Endpoint: /ocr-receipt
- Body: Form data with a field named photo containing the image file to be processed.

### Response

_201 - Created_

- Body:

```json
{
  "message": "Success",
  "data": {
    "_id": "string"
  },
  "rawData": {
    "merchantName": "string",
    "items": [
      {
        "description": "string",
        "qty": "number",
        "unitPrice": "number",
        "amount": "number"
      }
    ],
    "image": "string (secure URL)"
  }
}
```

_500 - Internal Server Error_
``` json
{
  "message": "Internal server error"
}
````
