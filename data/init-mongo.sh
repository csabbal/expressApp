#!/bin/bash

# Restore the database dumps
echo "Restoring database dumps..."
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db admin /docker-entrypoint-initdb.d/dump/admin
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db auth /docker-entrypoint-initdb.d/dump/auth
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db movie /docker-entrypoint-initdb.d/dump/movie
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db general /docker-entrypoint-initdb.d/dump/general
mongorestore --host 127.0.0.1 --port 27017 --username root --password password --authenticationDatabase admin --db learning /docker-entrypoint-initdb.d/dump/learning
echo "MongoDB initialization complete."