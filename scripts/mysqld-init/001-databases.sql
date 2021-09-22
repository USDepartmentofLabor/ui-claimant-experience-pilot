/*
This file is mapped by docker-compose-services.yml
and read by the mysqlserver container on start up
*/

-- create database
CREATE DATABASE IF NOT EXISTS `unemployment`;
-- test db created/destroyed by test suite
-- CREATE DATABASE IF NOT EXISTS `test_unemployment`;

-- grant rights
GRANT ALL PRIVILEGES ON unemployment.* TO 'user'@'%';
GRANT ALL PRIVILEGES ON test_unemployment.* TO 'user'@'%';
