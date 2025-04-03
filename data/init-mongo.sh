#!/bin/bash

# Restore the database dumps
echo "Restoring database dumps..."
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db admin /docker-entrypoint-initdb.d/dump/admin
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db test /docker-entrypoint-initdb.d/dump/test
echo "MongoDB initialization complete."