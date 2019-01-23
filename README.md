# AffordableHousingDataHub
The AffordableHousingDataHub is a web application created as part of a Code for America Community Fellowship in Austin TX. It allows users to access and update an affordable housing database. An instance of this application was deployed for Austin TX so that government agencies and non profits could access and update a single comprehensive source of affordable housing.

### Technologies
AffordableHousingDataHub uses node.js on the backend and react.js on the front end. The database configured by default is mysql.

### Installation
1. npm install.
2. open .env.default and save as '.env' file. By default git will ignore this file under the app folder.
3. in the '.env' file update the entries
  - NODE_ENV = environment
  - DB_USER = database user name
  - DB_PASSWORD = database user password
  - DB_HOST = host name of mysql server
  - DB_NAME = name of database to use
    - NOTE: MySQL will use internet socket (addr:port) 'localhost' for connections, and port 3306 by default.
    - NOTE: if you get this message: "Client does not support authentication protocol requested by server; consider upgrading  MySQL client" - use this sql statment to identify the user with the password: ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY '[your password]'; if you are on windows you may have to use 'root'@'localhost' instead of just 'root'.
  - session_secret = secret text for sessions.

4. make sure that you have mysql installed on whatever machine is running the app. the version used for this project was version: 8.0.12 MySQL Community Server. if you have to define a scheme or a database name, call it 'AffordableHousingDataHub'
5. under app/sql you'll find development_db.sql. import this into your sql instance, and it will create / replace with a database called AffordableHousingDataHub. This will contain property data as of 12/18/18. It will also include one user account that you can use for testing. Email is 'test@gmail.com'. Password is 'password'.

6. create "logs" folder in root directory. add a logfile called "app.log" under the "logs" folder. error logging will be written here.
7. set the environmental variable NODE_ENV to "DEVELOPMENT" for development and "PRODUCTION" for production. *globally* install the package `nodemon` so that it is accessible from your command line PATH. we use this to continuously watch development changes on the server. run `npm run dev` to run the backend in development. this will run the node server and watch for any backend changes.
	- NOTE: on production we currently use the node package `pm2` which is a process manager. we run app.js with the NODE_ENV=PRODUCTION using pm2 (pm2 start app.js). it is advised to install `pm2` globally for production.
8. run `npm run build-dev`. this will bundle js files from public/js into public/dist and watch for any changes in public/js.
9. note that node version 9.2.1 was used to run this app in production. npm version 5.6.0 was used.
