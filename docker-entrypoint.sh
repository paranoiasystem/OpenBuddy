#!/bin/sh
set -e

# Ensure the data volume is writable by the app user before dropping privileges.
# Named Docker volumes mount as root:root, so we fix ownership at runtime.
chown -R openbuddy:openbuddy /data

exec su-exec openbuddy "$@"
