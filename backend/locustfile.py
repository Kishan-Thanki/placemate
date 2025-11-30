from locust import HttpUser, task, between

class StudentUser(HttpUser):
    wait_time = between(1, 3) 

    def on_start(self):
        """Called once per user, to log in and get auth cookies."""
        response = self.client.post("/api/v1/token/", json={
            "email": "load_test_student@example.com", 
            "password": "test_password123"
        })
        
        # Save the auth cookies for all future requests
        if response.status_code == 200:
            self.client.cookies = response.cookies
        else:
            print(f"Login failed with status {response.status_code}")

    @task(10) # 10x more likely to run this
    def browse_drives(self):
        """This is your highest-traffic, read-only endpoint."""
        self.client.get("/api/v1/placements/company-drives/")

    @task(2) # 2x more likely
    def browse_companies(self):
        self.client.get("/api/v1/companies/")

    @task(1) # Least likely
    def view_own_profile(self):
        self.client.get("/api/v1/students/me/")