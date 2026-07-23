#!/bin/sh
set -eu

SONAR_URL="http://sonarqube:9000"
NEW_PASSWORD="2401603@sit.singaporetech.edu.sg"

echo "Waiting for SonarQube to become available..."
until curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; do
  sleep 5
done
echo "SonarQube is up."

# api/authentication/validate always returns 200, with {"valid": true|false}
# depending on whether the given credentials are correct.
still_default=$(curl -sf -u admin:admin "$SONAR_URL/api/authentication/validate" | grep -c '"valid":true' || true)

if [ "$still_default" -gt 0 ]; then
  echo "Default admin credentials still active — setting new admin password..."
  curl -sf -u admin:admin -X POST "$SONAR_URL/api/users/change_password" \
    --data-urlencode "login=admin" \
    --data-urlencode "password=$NEW_PASSWORD" \
    --data-urlencode "previousPassword=admin"
  echo "Admin password updated."
else
  echo "Default admin credentials no longer valid — password already set, nothing to do."
fi
