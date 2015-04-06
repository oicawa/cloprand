(ns cloprand.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            ;[ring.adapter.jetty :as jetty]
            [ring.util.response :as response]
            [ring.middleware.json :as middleware]
            [clojure.data.json :as json])
  (:import (java.util Properties)
           (java.io File)
           (java.nio.file Paths Path)))

(defn get-base-path
  []
  (let [absolute_path (. (File. "") getAbsolutePath)]
    absolute_path))

(defn system-exists?
  [system-name]
  (let [system-path (format "%s/systems/%s" (get-base-path) system-name)
        system-dir  (File. system-path)]
    (and (. system-dir exists) (. system-dir isDirectory))))

(defn get_target_path
  [system_name application_name]
  (let [systems-path (format "%s/systems" (get-base-path))]
    (if (empty? system_name)
        systems-path
        (let [system_path (format "%s/%s" systems-path system_name)]
          (if (empty? application_name)
              system_path
              (format "%s/applications/%s" system_path system_name))))))

(defn response-with-content-type
  [resp content-type]
  (-> resp
      (response/header "Contents-Type" content-type)))
  
(defn get-file
  [system-name application-name file-name content-type]
  (let [path (get_target_path system-name application-name)
        res  (response/response (slurp (str path "/" file-name)))]
    (response-with-content-type res content-type)
    ;(-> (response/response (slurp (str path "/" file-name)))
    ;    (response/header "Contents-Type" content-type))
    ))
  
(defroutes app-routes
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/index.html" []
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/:js-name.js" [js-name]
    (get-file "" "" (format "%s.js" js-name) "text/javascript; charset=utf-8"))
  (GET "/api/template" [system_name application_name]
    (get-file system_name application_name "template.html" "text/html; charset=utf-8"))
  (GET "/api/config" [system_name application_name]
    (get-file system_name application_name "config.json" "text/json; charset=utf-8"))
  (GET "/api/systems" []
    (let [path        (get_target_path "" "")
          systems-dir (File. path)
          files       (. systems-dir listFiles)
          system-dirs (filter #(. %1 isDirectory) files)
          systems     (map #(. %1 getName) system-dirs)
          json-str    (json/write-str systems)]
      (response-with-content-type (response/response json-str) "text/json; charset=utf-8")))
  ;(GET "/api/get_data" [type ids]
  ;  (response/response (get-files type ids)))
  (GET "/:system-name" [system-name]
    (response/redirect (str "/" system-name "/index.html")))
  (GET "/:system-name/" [system-name]
    (response/redirect (str "/" system-name "/index.html")))
  (GET "/:system-name/index.html" [system-name]
    (if (system-exists? system-name)
        (response/resource-response "index.html" {:root "public/core"})
        (response/redirect "/index.html")))
  ;(GET "/:system-name/:application-name/index.html" [system-name application-name]
  (GET "/:system-name/:application-name/index.html" [system-name application-name]
    (println (format "System Name     : %s\nApplication Name: %s\n" system-name application-name))
    (response/resource-response "index.html" {:root "public/core"}))
  ;(GET "/get_config/:system-name/:application-name" [system-name application-name]
  ;  (let [base-path   (format"./resources/public/systems/%s" system-name)
  ;        system-path (. (File. base-path getAbsolutePath))
  ;        system-config 
  ;  (response/resource-response "index.html" {:root "public/cloprand"}))
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
  (handler/site app-routes))
;  (-> (handler/api app-routes)
;      (middleware/wrap-json-body)
;      (middleware/wrap-json-response)))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "3000"))]
    (println "Start jetty...")
    ;(jetty/run-jetty app-routes {:port port})))
    (run-jetty app-routes {:port port})))

