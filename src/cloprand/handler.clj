(ns cloprand.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
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

(defroutes app-routes
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/index.html" []
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/:js-name.js" [js-name]
    (let [path (get_target_path "" "")]
      (-> (response/response (slurp (str path "/" js-name ".js")))
          (response/header "Contents-Type" "text/javascript; charset=utf-8"))))
  (GET "/api/template" [system_name application_name]
    ;(println (format "[WebAPI 'template' called] System Name: '%s', Application Name: '%s'" system_name application_name))
    ;(response/resource-response "template.html" {:root "public/core/site"}))
    (let [path (get_target_path system_name application_name)]
      (-> (response/response (slurp (format "%s/%s" path "template.html")))
          (response/header "Contents-Type" "text/html; charset=utf-8"))))
  (GET "/api/config" [system_name application_name]
    (let [path (get_target_path system_name application_name)]
      (response/response (slurp (format "%s/%s" path "config.json")))))
  (GET "/api/systems" []
    (let [path        (get_target_path "" "")
          systems-dir (File. path)
          files       (. systems-dir listFiles)
          system-dirs (filter #(. %1 isDirectory) files)]
      (response/response (slurp (format "%s/%s" path "config.json")))))
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
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8080"))]
    (run-jetty app-routes {:port port})))

