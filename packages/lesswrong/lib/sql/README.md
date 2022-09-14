# Mongo to Postgres

### Setting up a local Postgres DB

1. Install Postgres
	* Mac: `brew install postgresql && brew services start postgresql`
	* Linux: `sudo apt install postgresql`
2. Create a database and user
	* `psql postgres`
	* `CREATE DATABASE <databasename>;`
	* `CREATE ROLE <username> WITH LOGIN PASSWORD '<password>';`
	* `GRANT ALL PRIVILEGES ON DATABASE <databasename> TO <username>;`
	* `ALTER USER <username> CREATEDB;`
	* `exit;`
3. Start a server with `PG_URL=postgres://<username>:<password>@127.0.0.1:5432/<databasename> yarn ea-start`
   (or with whatever `yarn` command you usually use)

### Importing collections

For each collection you wish to import:
	* `./scripts/serverShellCommand.sh "Vulcan.mongoToSql('ReadStatuses')"`
	  (replace `ReadStatuses` with the name of the collection you wish to import)
	* Then go to the collection definition and add `postgres: true` to the call
	  to `createCollection`.

### Notes

Be careful not to `import "postgres"` in the `/lib` directory as it will break
the client build - only do that in `/server`.
