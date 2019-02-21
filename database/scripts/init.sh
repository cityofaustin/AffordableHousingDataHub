parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd $parent_path

source ../../.env
mysql -u $DB_USER -p$DB_PASSWORD < create_db.sql
mysql -u $DB_USER -p$DB_PASSWORD AffordableHousingDataHub < dump.sql
mysql -u $DB_USER -p$DB_PASSWORD AffordableHousingDataHub < add_test_user.sql
