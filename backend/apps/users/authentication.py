class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        print("🔐 CookieJWTAuthentication called")
        print("📨 Cookies received:", dict(request.COOKIES))
        
        access_token = request.COOKIES.get('access_token')
        print("🎫 Access token found:", bool(access_token))

        if not access_token:
            print("❌ No access token in cookies")
            return None

        try:
            print("🔑 Validating token...")
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            print(f"✅ Authentication successful for user: {user.email}")
            return (user, validated_token)
            
        except Exception as e:
            print(f"❌ Token validation failed: {e}")
            return None