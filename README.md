# NodeJS Complete Guide

This project was created as part of Maximilian's Schwarzmuller's NodeJS - The Complete Guide course.

## Installing MongoDB

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/

brew tap mongodb/brew
brew update
brew install mongodb-community@8.0
npm i mongodb

Brew installs an x86 version of mongodb, so download the latest macOS ARM version from...
https://www.mongodb.com/try/download/community-edition/releases

Install in ~/mongodb, then...
cd /usr/local/Cellar/mongodb-community/8.0.1/bin
sudo cp -p ~/mongodb/bin/* .
sudo chgrp admin *

## Starting MongoDB

mongod --config /usr/local/etc/mongod.conf --fork

## Stopping MongoDB

mongosh
db.shutdownServer()

## Sample MongoDB usage

https://www.mongodb.com/docs/manual/tutorial/manage-users-and-roles/
https://www.mongodb.com/docs/manual/crud/

## Creating a root user

use admin
db.createUser(
  {
    user: "root",
    pwd: passwordPrompt(), // or cleartext password
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
    ]
  }
)

## Creating a non-root user

use test
db.createUser(
  {
    user: "udemy",
    pwd:  "udemy",
    roles: [ { role: "readWrite", db: "test" } ]
  }
)
db.getUsers()
db.getUser('udemy')
db.grantRolesToUser(
    "udemy",
    [
      { role: "readWrite", db: "test" }
    ]
)
db.revokeRolesFromUser(
    "udemy",
    [
      { role: "readWrite", db: "udemy" }
    ]
)
db.dropUser('udemy')

## Sample test data for this app

db.products.insertOne({
  title: 'Snarks',
  price: 3.99',
  description: 'Snarks are friendly. Go ahead and scratch behind its ears.',
  imageUrl: 'https://cdn.pixabay.com/photo/2016/03/31/20/51/book-1296045_960_720.png'
})

db.users.insertOne({ name: 'Mike', email: 'mike@test.com' })
