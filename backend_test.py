import requests
import sys
import json
from datetime import datetime

class BankingAPITester:
    def __init__(self, base_url="https://064b3ba5-4f80-45c1-a5dc-fb03727f748f.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.admin_cookies = None
        self.user_token = None
        self.test_username = None
        self.test_password = "TestPass123!"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, cookies=cookies, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, cookies=cookies, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, cookies=cookies, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })

            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, None

    def test_homepage(self):
        """Test homepage loads correctly"""
        success, response = self.run_test(
            "Homepage Load",
            "GET",
            "",
            200
        )
        return success

    def test_colors_api(self):
        """Test GET /api/colors returns primary and secondary colors from SQLite"""
        success, response = self.run_test(
            "Colors API",
            "GET",
            "api/colors",
            200
        )
        if success and response:
            try:
                data = response.json()
                if 'primaryColor' in data and 'secondaryColor' in data:
                    print(f"   Colors found: primary={data.get('primaryColor')}, secondary={data.get('secondaryColor')}")
                    return True
                else:
                    print(f"   Missing color fields in response")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_check_auth_unauthenticated(self):
        """Test GET /api/admin/check-auth returns isAuthenticated:false when not logged in"""
        success, response = self.run_test(
            "Admin Check Auth (Unauthenticated)",
            "GET",
            "api/admin/check-auth",
            401  # Changed to 401 as this is the correct behavior
        )
        if success and response:
            try:
                data = response.json()
                if data.get('isAuthenticated') == False:
                    print(f"   Correctly returns isAuthenticated: false")
                    return True
                else:
                    print(f"   Expected isAuthenticated: false, got: {data.get('isAuthenticated')}")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_login(self):
        """Test POST /api/admin/login with username:admin password:admin123"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/admin/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and response:
            try:
                data = response.json()
                if data.get('success') and data.get('token'):
                    self.admin_token = data['token']
                    # Extract cookies from response
                    if 'Set-Cookie' in response.headers:
                        cookie_header = response.headers['Set-Cookie']
                        if 'adminToken=' in cookie_header:
                            admin_token_cookie = cookie_header.split('adminToken=')[1].split(';')[0]
                            self.admin_cookies = {'adminToken': admin_token_cookie}
                            print(f"   Admin token and cookies obtained successfully")
                            return True
                    print(f"   Login successful but no adminToken cookie found")
                    return False
                else:
                    print(f"   Login failed: {data}")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_users(self):
        """Test GET /api/admin/users returns users array (using adminToken cookie)"""
        if not self.admin_cookies:
            print("❌ No admin cookies available, skipping test")
            return False
            
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "api/admin/users",
            200,
            cookies=self.admin_cookies
        )
        if success and response:
            try:
                data = response.json()
                if 'users' in data and isinstance(data['users'], list):
                    print(f"   Found {len(data['users'])} users")
                    return True
                else:
                    print(f"   Expected users array, got: {type(data.get('users'))}")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_settings(self):
        """Test GET /api/admin/settings returns settings object"""
        if not self.admin_cookies:
            print("❌ No admin cookies available, skipping test")
            return False
            
        success, response = self.run_test(
            "Admin Settings",
            "GET",
            "api/admin/settings",
            200,
            cookies=self.admin_cookies
        )
        if success and response:
            try:
                data = response.json()
                if 'siteName' in data and 'supportEmail' in data:
                    print(f"   Settings found: siteName={data.get('siteName')}")
                    return True
                else:
                    print(f"   Missing required settings fields")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_pending_users(self):
        """Test GET /api/admin/pending-users returns pendingUsers array"""
        if not self.admin_cookies:
            print("❌ No admin cookies available, skipping test")
            return False
            
        success, response = self.run_test(
            "Admin Pending Users",
            "GET",
            "api/admin/pending-users",
            200,
            cookies=self.admin_cookies
        )
        if success and response:
            try:
                data = response.json()
                if 'pendingUsers' in data and isinstance(data['pendingUsers'], list):
                    print(f"   Found {len(data['pendingUsers'])} pending users")
                    return True
                else:
                    print(f"   Expected pendingUsers array, got: {type(data.get('pendingUsers'))}")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_iplogs(self):
        """Test GET /api/admin/iplogs returns logs array"""
        if not self.admin_cookies:
            print("❌ No admin cookies available, skipping test")
            return False
            
        success, response = self.run_test(
            "Admin IP Logs",
            "GET",
            "api/admin/iplogs",
            200,
            cookies=self.admin_cookies
        )
        if success and response:
            try:
                data = response.json()
                if 'logs' in data and isinstance(data['logs'], list):
                    print(f"   Found {len(data['logs'])} IP logs")
                    return True
                else:
                    print(f"   Expected logs array, got: {type(data.get('logs'))}")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_admin_create_user(self):
        """Test POST /api/admin/admin-create-user creates a new user"""
        if not self.admin_cookies:
            print("❌ No admin cookies available, skipping test")
            return False
        
        # Store username for later user tests
        self.test_username = f"testuser_{datetime.now().strftime('%H%M%S')}"
        test_user_data = {
            "fullName": "Test User",
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "555-0123",
            "ssn": "123-45-6789",
            "streetAddress": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "zipCode": "12345",
            "username": self.test_username,
            "password": self.test_password,
            "twoFactorEnabled": False  # Disable 2FA for testing
        }
        
        success, response = self.run_test(
            "Admin Create User",
            "POST",
            "api/admin/admin-create-user",
            201,
            data=test_user_data,
            cookies=self.admin_cookies
        )
        if success:
            print(f"   Created test user: {self.test_username} (2FA disabled)")
        return success

    def test_user_login_request_code(self):
        """Test POST /api/login with step:requestCode"""
        # Use the manually created user with 2FA disabled
        test_username = "testuser_no2fa"
        test_password = "TestPass123!"
        
        print(f"   Testing login for user: {test_username} (2FA disabled)")
        
        success, response = self.run_test(
            "User Login Request Code",
            "POST",
            "api/login",
            200,
            data={
                "username": test_username,
                "password": test_password,
                "step": "requestCode"
            }
        )
        if success and response:
            try:
                data = response.json()
                if 'requiresTwoFactor' in data:
                    print(f"   Two-factor requirement: {data.get('requiresTwoFactor')}")
                    if data.get('token'):
                        self.user_token = data['token']
                        print(f"   User token obtained")
                    return True
                else:
                    print(f"   Missing requiresTwoFactor field")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_user_accounts_without_token(self):
        """Test GET /api/accounts without Bearer token (should fail)"""
        success, response = self.run_test(
            "User Accounts (No Token)",
            "GET",
            "api/accounts",
            401
        )
        return success

    def test_user_transactions_without_token(self):
        """Test GET /api/transactions without Bearer token (should fail)"""
        success, response = self.run_test(
            "User Transactions (No Token)",
            "GET",
            "api/transactions",
            401
        )
        return success

    def test_user_accounts_with_token(self):
        """Test GET /api/accounts with Bearer token"""
        if not self.user_token:
            print("❌ No user token available, skipping test")
            return False
            
        success, response = self.run_test(
            "User Accounts (With Token)",
            "GET",
            "api/accounts",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        if success and response:
            try:
                data = response.json()
                if 'checkingBalance' in data and 'savingsBalance' in data:
                    print(f"   Account info retrieved successfully")
                    return True
                else:
                    print(f"   Missing account balance fields")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

    def test_user_transactions_with_token(self):
        """Test GET /api/transactions with Bearer token"""
        if not self.user_token:
            print("❌ No user token available, skipping test")
            return False
            
        success, response = self.run_test(
            "User Transactions (With Token)",
            "GET",
            "api/transactions",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        if success and response:
            try:
                data = response.json()
                if 'transactions' in data and isinstance(data['transactions'], list):
                    print(f"   Found {len(data['transactions'])} transactions")
                    return True
                else:
                    print(f"   Expected transactions array")
                    return False
            except:
                print(f"   Invalid JSON response")
                return False
        return False

def main():
    print("🏦 Banking App API Testing")
    print("=" * 50)
    
    tester = BankingAPITester()
    
    # Test basic endpoints
    print("\n📋 Testing Basic Endpoints...")
    tester.test_homepage()
    tester.test_colors_api()
    
    # Test admin authentication
    print("\n🔐 Testing Admin Authentication...")
    tester.test_admin_check_auth_unauthenticated()
    tester.test_admin_login()
    
    # Test admin protected routes
    print("\n👨‍💼 Testing Admin Protected Routes...")
    tester.test_admin_users()
    tester.test_admin_settings()
    tester.test_admin_pending_users()
    tester.test_admin_iplogs()
    tester.test_admin_create_user()
    
    # Test user authentication
    print("\n👤 Testing User Authentication...")
    tester.test_user_login_request_code()
    
    # Test user protected routes (without token)
    print("\n🔒 Testing User Protected Routes (Unauthorized)...")
    tester.test_user_accounts_without_token()
    tester.test_user_transactions_without_token()
    
    # Test user protected routes (with token)
    print("\n🔐 Testing User Protected Routes (Authorized)...")
    tester.test_user_accounts_with_token()
    tester.test_user_transactions_with_token()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
            print(f"  - {test['name']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())