#!/bin/bash

# Restore the database dumps
echo "Restoring database dumps..."
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db admin /docker-entrypoint-initdb.d/dump/admin
echo "MongoDB initialization complete."