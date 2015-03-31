(ns cloprand.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.util.response :refer [resource-response response]]
            [ring.middleware.json :as middleware])
  (:import (java.util Properties)
           (java.io File)))

(defn get_tabcontents
  "Get selected tab contents by tab ID."
  [tab_id]
  (if (= tab_id "management")
      { :label "管理" }
      { :label (format "'%s'はまだ用意されていません <(_ _)>", tab_id) }))

(defn get-files
  [type ids]
  (let [classpath     (System/getProperty "java.class.path")
        absolute_path (. (File. ".") getAbsolutePath)]
    ;(println classpath)
    (println absolute_path)))

(defroutes app-routes
  (GET "/get_data" [type ids] (response (get-files type ids)))
  ;(POST "/create_table" [table_name]
  ;  (create_table table_name)
  ;  (response {:value table_name}))
  ;(POST "/delete_table" [table_name]
  ;  (delete_table table_name)
  ;  (response {:value table_name}))
  ;(POST "/get_tables" []
  ;  (response {:value (get_tables)}))
  ;(POST "/get_tabcontents" [tab_id]
  ;  (response (get_tabcontents tab_id)))
  (route/files "/")
  (route/resources "/")
  (route/not-found "Not Found"))

(def app
  (-> (handler/api app-routes)
      (middleware/wrap-json-body)
      (middleware/wrap-json-response)))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8080"))]
    (run-jetty app-routes {:port port})))

