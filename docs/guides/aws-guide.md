**AWS Project API Usage Guide**

This document serves as a guide for frontend developers to interact with the backend API hosted on AWS. The API is available at the following base URL:

```
http://18.191.234.29:3000/
```

---

### **1. Base URL and Endpoints**
The base URL for all API requests is:
```
http://18.191.234.29:3000/
```

Common endpoints include:

- **Health Check**: Verify the API is running.
  ```http
  GET /api/v1/health
  ```

- **GraphQL Endpoint**: Access the GraphQL API.
  ```http
  POST /graphql
  ```
  - Use this endpoint to send GraphQL queries and mutations.
  - Example query request body:
    ```js
    query Users {
        users {
            users {
            created_at
            email
            }
        }
    }
    ```

### **2. API Documentation and Access**
The API documentation and schema can be explored using the GraphQL playground:
```
http://18.191.234.29:3000/graphql
```

Ensure that introspection is enabled to view the schema in the playground. For non-production environments, introspection is typically enabled by default.

### **3. Authentication**
The API uses Firebase for token-based authentication. All requests must include a valid Firebase JWT token in the `Authorization` header.

- **Example authenticated request**:
  ```bash
  curl -X POST http://18.191.234.29:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-firebase-jwt-token>" \
  -d '{
    "query": "mutation { firebaseAuth { success user { id email firebase_uid first_name last_name role status } errors { field message } } }"
  }'
  ```

- **Generating a Firebase token**:
  Frontend developers should authenticate using Firebase in their application to retrieve a valid token.

### **4. Request Format**
- **Headers**: Set the `Content-Type` to `application/json` and include the `Authorization` header with the token.
- **Method**: Use appropriate HTTP methods (GET, POST, PUT, DELETE).
- **Body**: For POST and PUT requests, include a JSON body.

Example POST request to `/graphql`:
```json
{
  "query": "mutation { createUser(data: { name: \"John Doe\", email: \"john.doe@example.com\" }) { id name } }"
}
```

### **5. Example Workflow**
1. **Health Check**:
   ```bash
   curl -X GET http://18.191.234.29:3000/api/v1/health
   ```
   Expected response:
   ```json
   { "status": "ok" }
   ```

2. **GraphQL Query**:
   Send a POST request to `/graphql` to retrieve data.

   Example request using `curl`:
   ```bash
   curl -X POST http://18.191.234.29:3000/graphql \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer <your-firebase-jwt-token>" \
   -d '{ "query": "{ users { id name email } }" }'
   ```

   Example response:
   ```json
   {
     "data": {
       "users": [
         { "id": "1", "name": "John Doe", "email": "john.doe@example.com" }
       ]
     }
   }
   ```

### **6. Error Handling**
- The API returns standard HTTP status codes.
- Common status codes:
  - `200 OK`: Request was successful.
  - `401 Unauthorized`: Authentication is required or the token is invalid.
  - `400 Bad Request`: There was an error in the request.
  - `500 Internal Server Error`: An unexpected error occurred on the server.

Example error response:
```json
{
  "errors": [
    {
      "message": "Invalid query",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["createUser"]
    }
  ]
}
```

### **7. Caching and Performance**
- **Redis** is used for caching to improve response times.
- Ensure that responses are cached where applicable to reduce API load.

### **8. Frontend Integration Tips**
- Use environment variables to manage the API base URL and token in your frontend application.
- Example configuration in React:
    ```javascript
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://18.191.234.29:3000';
    const token = 'your-firebase-jwt-token';

    fetch(`${API_BASE_URL}/api/v1/health`, {
        headers: {
        'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => console.log(data));
    ```

    ```js
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://18.191.234.29:3000';
        const token = 'your-firebase-jwt-token';

        async function fetchUsers() {
        const response = await fetch(`${API_BASE_URL}/graphql`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
            query: '{ users { id name email } }'
            })
        });

        const data = await response.json();
        console.log(data);
        }

        fetchUsers();
    ```


