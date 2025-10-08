Placemate - Backend API Documentation
=====================================

This document provides the official technical documentation for the Placemate backend API. It details the architecture, key systems, and setup procedures for developers who will be consuming or contributing to this service.

1\. Core Purpose & Architecture
-------------------------------

The Placemate backend is a robust REST API built with **Django** and **Django REST Framework**. Its core purpose is to provide a secure, scalable, and centralized system for managing all data and business logic related to the campus recruitment process.

### Architectural Overview:

*   **Decoupled Design**: This backend is designed to be completely decoupled from the frontend. It exposes a versioned JSON API at /api/v1/ for any client application to consume.
    
*   **Database**: All data is stored in a **PostgreSQL** database, managed and hosted by **Supabase**.
    
*   **Deployment**: The application is configured for production deployment on **Render** (or a similar PaaS), using **Gunicorn** as the WSGI server and **WhiteNoise** for efficient static file serving.
    

2\. Key Systems (In-Depth)
--------------------------

This API is built on several professional-grade systems to ensure security, consistency, and maintainability.

###  Authentication System (Cookie-Based JWT)

Authentication is handled using a stateless JWT (JSON Web Token) approach with an emphasis on security.

*   **Mechanism**: Instead of storing tokens in browser local storage, this API uses secure, **HTTP-only cookies** to store access\_token and refresh\_token. This is a critical security measure to prevent XSS (Cross-Site Scripting) attacks.
    
*   **Token Flow**:
    
    1.  A user logs in via the POST /api/v1/token/ endpoint.
        
    2.  The server validates credentials and sets two HTTP-only cookies in the response.
        
    3.  On every subsequent request to a protected endpoint, the browser automatically sends the access\_token cookie.
        
    4.  Our custom CookieJWTAuthentication backend reads and validates the token from this cookie.
        
*   **Secure Logout**: The POST /api/v1/logout/ endpoint blacklists the refresh\_token and clears the authentication cookies, providing a secure session termination.
    

### 🔑 Permissions & RBAC (Role-Based Access Control)

The permissions system is multi-layered, combining Django's built-in framework with custom business logic.

*   **Model-Level Permissions**: Django's default permissions (add, change, view, delete) are assigned to custom **Roles** (e.g., Placement Head, Student) via the Django Admin.
    
*   **Object-Level Permissions**: Custom permission classes (e.g., IsOwnerOrReadOnly) are used to enforce fine-grained rules, such as allowing a student to edit only their own profile.
    
*   **Default Policy**: The API is **private by default**. All endpoints require authentication (IsAuthenticated) unless explicitly marked as public.
    

### 🗣️ Standardized API Responses

Every response from this API, whether a success or an error, follows a consistent and predictable JSON structure.

```
{ 
    "success": true, 
    "message": "Operation completed successfully", 
    "timestamp": "...", 
    "data": { ... }, 
    "pagination": { ... } // (if applicable)
}
```

```    
{ 
    "error": 
        { 
            "code": "not\_found", 
            "message": "The requested resource was not found.", "type": "NotFoundException" 
        }
}
```
    
* **Implementation**: This is achieved through a BaseViewSet and a suite of custom APIResponse classes that all standard CRUD views inherit from. A global custom\_exception\_handler ensures all errors are caught and formatted correctly.
    

###  File Management

The project uses a hybrid strategy for handling files, optimized for both development speed and production scalability.

*   **Media Files (User Uploads)**: In production, all user-uploaded files (résumés, profile pictures) are handled by **Cloudinary**. The DEFAULT\_FILE\_STORAGE setting is configured to use cloudinary\_storage, which uploads files directly to the cloud. In local development, files are saved to the /media directory.
    
*   **Static Files (CSS/JS)**: In production, static files (like the Django Admin's assets) are collected and served efficiently by **WhiteNoise**.
    

Local Development Setup
--------------------------

Follow these steps to get the backend server running locally.

1.  **Prerequisites**: Python 3.10+, pip.
    
2.  ```
    cp . .env
    ```
    
3.  ``` 
    #Create and activate a virtual environment
    python3 -m venv venvsource venv/bin/activate
            
    # Install dependencies
    pip install -r requirements.txt
    ```
    
4.  ```
    python manage.py runserver
    ```

The API is now running at http://127.0.0.1:8000/.

API Endpoints & Documentation
--------------------------------

Live, interactive API documentation is available when the server is running. This is the primary resource for understanding how to interact with the API.

*   **Swagger UI:** [http://127.0.0.1:8000/docs/api/](https://www.google.com/search?q=http://127.0.0.1:8000/docs/api/)
    
*   **ReDoc:** [http://127.0.0.1:8000/redoc/](https://www.google.com/search?q=http://127.0.0.1:8000/redoc/)
    

All application endpoints are versioned under the /api/v1/ prefix.