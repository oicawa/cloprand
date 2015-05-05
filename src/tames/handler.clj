(ns tames.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.util.response :as response]
            [tames.systems :as systems]))

(defroutes app-routes
  ;; for 'systems'
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/index.html" []
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/api/:api-name" [api-name]
    (println "api-name:" api-name)
    (systems/get-data "" "" api-name "text/json"))
  (POST "/api/:api-name" [api-name & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (println "POST api-name:" api-name)
    (println "params:" params)
    (systems/post-data "" "" api-name params))
  (PUT "/api/:api-name/:id" [api-name id & params]
    (println "PUT api-name:" api-name)
    (println "params:" params)
    (systems/put-data "" "" api-name id params))
  (DELETE "/api/:api-name/:id" [api-name id]
    (println "DELETE api-name:" api-name)
    (systems/delete-data "" "" api-name id))
  (GET "/:css-name.css" [css-name]
    (println "css-name:" css-name)
    (systems/get-file "" "" (format "%s.css" css-name) "text/css"))
  (GET "/:js-name.js" [js-name]
    (println "js-name:" js-name)
    (systems/get-file "" "" (format "%s.js" js-name) "text/javascript; charset=utf-8"))
  (GET "/:template-name.html" [template-name]
    (println "template-name:" template-name)
    (systems/get-file "" "" (format "%s.html" template-name) "text/html; charset=utf-8"))
  (GET "/:json-name.json" [json-name]
    (println "json-name:" json-name)
    (systems/get-file "" "" (format "%s.json" json-name) "text/json; charset=utf-8"))
  ;; for 'systems'
;  ;(GET "/api/get_data" [type ids]
;  ;  (response/response (get-files type ids)))
;  (GET "/:system-name" [system-name]
;    (response/redirect (str "/" system-name "/index.html")))
;  (GET "/:system-name/" [system-name]
;    (response/redirect (str "/" system-name "/index.html")))
;  (GET "/:system-name/index.html" [system-name]
;    (if (system-exists? system-name)
;        (response/resource-response "index.html" {:root "public/core"})
;        (response/redirect "/index.html")))
;  ;(GET "/:system-name/:application-name/index.html" [system-name application-name]
;  (GET "/:system-name/:application-name/index.html" [system-name application-name]
;    (println (format "System Name     : %s\nApplication Name: %s\n" system-name application-name))
;    (response/resource-response "index.html" {:root "public/core"}))
;  ;(GET "/get_config/:system-name/:application-name" [system-name application-name]
;  ;  (let [base-path   (format"./resources/public/systems/%s" system-name)
;  ;        system-path (. (File. base-path getAbsolutePath))
;  ;        system-config 
;  ;  (response/resource-response "index.html" {:root "public/tames"}))
;  ;(POST "/create_table" [table_name]
;  ;  (create_table table_name)
;  ;  (response {:value table_name}))
;  ;(POST "/delete_table" [table_name]
;  ;  (delete_table table_name)
;  ;  (response {:value table_name}))
;  ;(POST "/get_tables" []
;  ;  (response {:value (get_tables)}))
;  ;(POST "/get_tabcontents" [tab_id]
;  ;  (response (get_tabcontents tab_id)))
;  ;(route/files "/")
  ;(GET "/" []
  ;  (let [path (str (get-target-path "" "") "/index.html")]
  ;    (println path)
  ;    (response/redirect "/systems/index.html")))
  ;(GET "/systems" []
  ;  (response/redirect "/systems/index.html"))
  ;(GET "/systems/index.html" []
  ;  (let [path (str (get-target-path "" "") "/index.html")]
  ;    (println path)
  ;    (response/file-response path)))
  ;(GET "/systems/:system-name" [system-name]
  ;  (response/redirect "/systems/index.html"))
  ;(route/files "/")
  ;(route/files "/systems")
  ;(route/files "/systems/")
  (route/resources "/")
  (route/not-found "Not Found"))

