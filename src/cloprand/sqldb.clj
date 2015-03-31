(ns cloprand.sqldb
  (:require ;[compojure.core :refer :all]
            ;[compojure.handler :as handler]
            ;[compojure.route :as route]
            ;[ring.util.response :refer [resource-response response]]
            ;[ring.middleware.json :as middleware]
            [clojure.java.jdbc :as jdbc])
  (:import (java.sql DriverManager)
           ;(java.util Properties)
           ;(java.io File)
           ))

;DROP TABLE IF EXISTS TEST;
;CREATE TABLE TEST(ID INT PRIMARY KEY, NAME VARCHAR(255));
;INSERT INTO TEST VALUES(1, 'Hello');
;INSERT INTO TEST VALUES(2, 'World');
;SELECT * FROM TEST ORDER BY ID;
;UPDATE TEST SET NAME='Hi' WHERE ID=1;
;DELETE FROM TEST WHERE ID=2;

(def db-spec {:classname   "org.h2.Driver" ; must be in classpath
              :subprotocol "h2"
              :subname "tcp://localhost/~/cloprand.db"
              ; Any additional keys are passed to the driver
              ; as driver-specific properties.
              :user     ""
              :password ""})

(defn create_table
  "Create the table"
  [table_name]
  (jdbc/with-db-transaction [db db-spec]
    (jdbc/execute! db [(jdbc/create-table-ddl (keyword table_name))])))

(defn delete_table
  "Drop the table"
  [table_name]
  (jdbc/with-db-transaction [db db-spec]
    (jdbc/execute! db [(jdbc/drop-table-ddl (keyword table_name))])))

(defn get_tables
  "Select the tables table"
  []
  (jdbc/with-db-transaction [db db-spec]
    (jdbc/query db
       ["SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES where TABLE_TYPE = 'TABLE'"]
       :result-set-fn doall
       :row-fn identity
       :identifiers clojure.string/lower-case
       :as-arrays? true)))
