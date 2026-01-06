#!/bin/bash
# reproduce_issue.sh
EMAIL="test_$(date +%s)@gmail.com"
PASSWORD="Pass12"
PHONE="773$(shuf -i 100000-999999 -n 1)"

echo "Trying to register with Email: $EMAIL, Password: $PASSWORD, Phone: $PHONE"

# Register
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"shopName\":\"Test Shop\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"phone\":\"$PHONE\"}" > register_res.json

echo "Register Response:"
cat register_res.json
echo ""

# Extract token just to check logic (optional, grep it)
if grep -q "token" register_res.json; then
  echo "Registration SUCCESS (Token received)"
else
  echo "Registration FAILED"
  exit 1
fi

echo "---------------------------------------------------"
echo "Now attempting LOGIN with same credentials..."

# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" > login_res.json

echo "Login Response:"
cat login_res.json
echo ""

if grep -q "token" login_res.json; then
  echo "Login SUCCESS"
else
  echo "Login FAILED - BUG REPRODUCED"
fi
