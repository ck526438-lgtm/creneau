#!/usr/bin/env bash
# Après « cap add android » : numéro de version, signature release (si les secrets existent).
set -euo pipefail
GRADLE=android/app/build.gradle
CODE="${VERSION_CODE:-1}"
NAME="${VERSION_NAME:-1.0.0}"
sed -i "s/versionCode [0-9]*/versionCode ${CODE}/" "$GRADLE"
sed -i "s/versionName \"[^\"]*\"/versionName \"${NAME}\"/" "$GRADLE"

if [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > android/app/creneau-release.jks
  cat >> "$GRADLE" <<'GRADLE'

android {
    signingConfigs {
        release {
            storeFile file('creneau-release.jks')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
GRADLE
  echo "Signature release configurée."
else
  echo "Pas de clé de signature : APK debug (voir README, section Applis)."
fi
