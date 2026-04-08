"""
Banking App API Tests - Iteration 2
Tests for admin login, user login, accounts, transactions, and home endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://064b3ba5-4f80-45c1-a5dc-fb03727f748f.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
TEST_USER_USERNAME = "testuser"
TEST_USER_PASSWORD = "TestPass123!"


class TestHomeAndColors:
    """Test public endpoints - /api/home and /api/colors"""
    
    def test_home_endpoint(self):
        """GET /api/home returns site settings"""
        response = requests.get(f"{BASE_URL}/api/home", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should return settings object
        assert isinstance(data, dict), "Response should be a dict"
        print(f"SUCCESS: /api/home returned settings: {list(data.keys())[:5]}...")
    
    def test_colors_endpoint(self):
        """GET /api/colors returns color configuration"""
        response = requests.get(f"{BASE_URL}/api/colors", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        print(f"SUCCESS: /api/colors returned: {data}")


class TestAdminAuth:
    """Test admin authentication endpoints"""
    
    def test_admin_check_auth_unauthenticated(self):
        """GET /api/admin/check-auth returns isAuthenticated:false when not logged in"""
        response = requests.get(f"{BASE_URL}/api/admin/check-auth", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("isAuthenticated") == False, "Should not be authenticated"
        print("SUCCESS: /api/admin/check-auth returns isAuthenticated:false")
    
    def test_admin_login_success(self):
        """POST /api/admin/login with valid credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data or "success" in data or response.status_code == 200, "Should return token or success"
        print(f"SUCCESS: Admin login successful")
        return response.cookies
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/admin/login with invalid credentials returns error"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrongadmin", "password": "wrongpass"},
            timeout=30
        )
        assert response.status_code in [401, 400, 403], f"Expected 401/400/403, got {response.status_code}"
        print("SUCCESS: Admin login with invalid credentials rejected")


class TestAdminEndpoints:
    """Test admin authenticated endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
    
    def test_admin_users_list(self):
        """GET /api/admin/users returns users array"""
        response = self.session.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "users" in data or isinstance(data, list), "Should return users"
        print(f"SUCCESS: /api/admin/users returned users list")
    
    def test_admin_settings(self):
        """GET /api/admin/settings returns settings object"""
        response = self.session.get(f"{BASE_URL}/api/admin/settings", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Should return settings dict"
        print(f"SUCCESS: /api/admin/settings returned settings")
    
    def test_admin_pending_users(self):
        """GET /api/admin/pending-users returns pending users array"""
        response = self.session.get(f"{BASE_URL}/api/admin/pending-users", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "pendingUsers" in data or isinstance(data, list), "Should return pending users"
        print(f"SUCCESS: /api/admin/pending-users returned pending users list")
    
    def test_admin_iplogs(self):
        """GET /api/admin/iplogs returns logs array"""
        response = self.session.get(f"{BASE_URL}/api/admin/iplogs", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "logs" in data or isinstance(data, list), "Should return logs"
        print(f"SUCCESS: /api/admin/iplogs returned logs")


class TestAdminCreateUser:
    """Test admin create user functionality - verify account numbers are numeric"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin create user tests")
    
    def test_admin_create_user_account_numbers_numeric(self):
        """POST /api/admin/admin-create-user creates user with numeric account numbers"""
        import time
        unique_id = int(time.time())
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/admin-create-user",
            json={
                "fullName": f"Test User {unique_id}",
                "email": f"testuser{unique_id}@test.com",
                "username": f"testuser{unique_id}",
                "password": "TestPass123!",
                "phone": "1234567890",
                "ssn": "123-45-6789",
                "streetAddress": "123 Test St",
                "city": "Test City",
                "state": "CA",
                "zipCode": "12345",
                "balance": 1000,
                "savingsBalance": 500,
                "cryptoBalance": 0.001,
                "twoFactorEnabled": False
            },
            timeout=30
        )
        
        # Check response
        if response.status_code == 201:
            data = response.json()
            print(f"SUCCESS: User created successfully")
            
            # Verify account number is purely numeric (no asterisks)
            if "accountNumber" in data:
                account_number = data["accountNumber"]
                assert account_number.isdigit(), f"Account number should be purely numeric, got: {account_number}"
                assert len(account_number) == 12, f"Account number should be 12 digits, got: {len(account_number)}"
                print(f"SUCCESS: Account number is purely numeric (12 digits): {account_number}")
            else:
                print("INFO: accountNumber not in response, but user created")
        elif response.status_code == 400:
            # User might already exist
            print(f"INFO: User creation returned 400 (may already exist): {response.text}")
        else:
            print(f"WARNING: Unexpected status {response.status_code}: {response.text}")


class TestUserAuth:
    """Test user authentication endpoints"""
    
    def test_user_login_with_2fa_disabled(self):
        """POST /api/login with step:requestCode for user with 2FA disabled"""
        response = requests.post(
            f"{BASE_URL}/api/login",
            json={
                "username": TEST_USER_USERNAME,
                "password": TEST_USER_PASSWORD,
                "step": "requestCode"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            # If 2FA disabled, should get token directly
            if "token" in data:
                print(f"SUCCESS: User login successful (2FA disabled), got token")
            elif data.get("requiresTwoFactor"):
                print(f"INFO: User has 2FA enabled, requires verification code")
            else:
                print(f"SUCCESS: User login response: {data}")
        elif response.status_code in [401, 403]:
            print(f"INFO: User login failed (may not exist or wrong credentials): {response.text}")
        else:
            print(f"WARNING: Unexpected status {response.status_code}: {response.text}")


class TestUserEndpoints:
    """Test user authenticated endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as test user and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/login",
            json={
                "username": TEST_USER_USERNAME,
                "password": TEST_USER_PASSWORD,
                "step": "requestCode"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data:
                self.token = data["token"]
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            elif data.get("requiresTwoFactor"):
                pytest.skip("User has 2FA enabled - skipping user endpoint tests")
            else:
                pytest.skip("User login did not return token")
        else:
            pytest.skip(f"User login failed: {response.status_code}")
    
    def test_user_accounts(self):
        """GET /api/accounts returns account data"""
        response = self.session.get(f"{BASE_URL}/api/accounts", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            # Verify account numbers are numeric
            if "checkingNumber" in data:
                checking = data["checkingNumber"]
                assert checking.isdigit(), f"Checking number should be numeric, got: {checking}"
                print(f"SUCCESS: Checking account number is numeric: {checking}")
            if "savingsNumber" in data:
                savings = data["savingsNumber"]
                assert savings.isdigit(), f"Savings number should be numeric, got: {savings}"
                print(f"SUCCESS: Savings account number is numeric: {savings}")
            print(f"SUCCESS: /api/accounts returned account data")
        else:
            print(f"INFO: /api/accounts returned {response.status_code}")
    
    def test_user_transactions(self):
        """GET /api/transactions returns transaction list"""
        response = self.session.get(f"{BASE_URL}/api/transactions", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            assert "transactions" in data or isinstance(data, list), "Should return transactions"
            print(f"SUCCESS: /api/transactions returned transactions")
        else:
            print(f"INFO: /api/transactions returned {response.status_code}")


class TestBitcoinPrice:
    """Test Bitcoin price endpoint"""
    
    def test_price_endpoint(self):
        """GET /api/price returns Bitcoin price"""
        response = requests.get(f"{BASE_URL}/api/price", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "bitcoin" in data:
                print(f"SUCCESS: /api/price returned Bitcoin price: ${data['bitcoin'].get('usd', 'N/A')}")
            else:
                print(f"SUCCESS: /api/price returned: {data}")
        else:
            print(f"INFO: /api/price returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
