(ns cloprand.handler
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.util.response :refer [resource-response response]]
            [ring.middleware.json :as middleware]
            [clojure.java.jdbc :as jdbc])
  (:import (java.sql DriverManager)
           (java.util Properties)))

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

(defn get_tabcontents
  "Get selected tab contents by tab ID."
  [tab_id]
  (if (= tab_id "management")
      { :label "管理" }
      { :label (format "'%s'はまだ用意されていません <(_ _)>", tab_id) }))

(defroutes app-routes
  (POST "/create_table" [table_name]
    (create_table table_name)
    (response {:value table_name}))
  (POST "/delete_table" [table_name]
    (delete_table table_name)
    (response {:value table_name}))
  (POST "/get_tables" []
    (response {:value (get_tables)}))
  (POST "/get_tabcontents" [tab_id]
    (response (get_tabcontents tab_id)))
  (route/files "/")
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (-> (handler/api app-routes)
      (middleware/wrap-json-body)
      (middleware/wrap-json-response)))

