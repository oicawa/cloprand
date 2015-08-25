(ns tames.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.pprint :as pprint]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.util.response :as response]
            [clojure.data.json :as json]
            [tames.systems :as systems]))

(defroutes app-routes
  ;; for Menu Page
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/index.html" []
    (println "/index.html")
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/dialog.html" []
    (println "/dialog.html")
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/:css-name.css" [css-name]
    (println "/:css-name.css =" css-name)
    (systems/get-file nil (format "%s.css" css-name) "text/css"))
  (GET "/:js-name.js" [js-name]
    (println "/:js-name.js =" js-name)
    (systems/get-file nil (format "%s.js" js-name) "text/javascript; charset=utf-8"))
  (GET "/:template-name.html" [template-name]
    (println "/:template-name.html =" template-name)
    (systems/get-file nil (format "%s.html" template-name) "text/html; charset=utf-8"))
  (GET "/:json-name.json" [json-name]
    (println "/:json-name.json =" json-name)
    (systems/get-file nil (format "%s.json" json-name) "text/json; charset=utf-8"))
  ;; REST API for CRUD
  (GET "/api/:class-id" [class-id]
    (println (str "[GET] /api/:class-id = /api/" class-id))
    (systems/get-data class-id nil))
  (GET "/api/:class-id/:object-id" [class-id object-id]
    (println (format "[GET] /api/:class-id/:object-id = /api/%s/%s" class-id object-id))
    (systems/get-data class-id object-id))
  (POST "/api/:class-id" [class-id & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (println (str "[POST] /api/:class-id = /api/" class-id))
    (systems/post-data class-id (json/read-str (params :value))))
  (PUT "/api/:class-id/:object-id" [class-id object-id & params]
    (println (str "[PUT] /api/:class-id/:object-id = /api/" class-id "/" object-id))
    (println "----------")
    (pprint/pprint (json/read-str (params :value)))
    (println "----------")
    (systems/put-data class-id object-id (json/read-str (params :value))))
  (DELETE "/api/:class-id/:object-id" [class-id object-id]
    (println (str "[DELETE] /api/:class-id/:object-id = /api/" class-id "/" object-id))
    (systems/delete-data class-id object-id))
  ; extensions
  (GET "/:class-id/:object-id/extension" [class-id object-id]
    (println "/:class-id/:object-id/extension =" (str "/" class-id "/" object-id "/extension"))
    (systems/get-extension-file-list class-id object-id))
  (GET "/:class-id/:object-id/extension/:file-name" [class-id object-id file-name]
    (println "/:class-id/:object-id/extension/:file-name =" (str "/" class-id "/" object-id "/extension/" file-name))
    (systems/get-extension-file class-id object-id file-name))
  (POST "/:class-id/:object-id/extension/:file-name" [class-id object-id file-name & params]
    (println "/:class-id/:object-id/extension/:file-name =" (str "/" class-id "/" object-id "/extensions/" file-name))
    (systems/post-extension-file class-id object-id file-name (json/read-str (params :value))))
  
  (GET "/:class-id/index.html" [class-id]
    (println "/:class-id/index.html =" class-id)
    (response/resource-response "index.html" {:root "public/core"}))
  (GET ["/:class-id/:js-name.js" :class-id systems/REGEXP_UUID :js-name #"[\w]+"] [class-id js-name]
    (println "/:class-id/:js-name.js =" (str "/" class-id "/" js-name))
    (systems/get-file class-id (format "%s.js" js-name) "text/javascript; charset=utf-8"))
  (GET "/:class-id/:template-name.html" [class-id template-name]
    (println "/:class-id/:template-name.html =" (str "/" class-id "/" template-name))
    (systems/get-file class-id (format "%s.html" template-name) "text/html; charset=utf-8"))
  (GET "/:class-id/:json-name.json" [class-id json-name]
    (println "/:class-id/:json-name.json =" (str "/" class-id "/" json-name))
    (systems/get-file class-id (format "%s.json" json-name) "text/json; charset=utf-8"))
  
  (route/resources "/")
  (route/not-found "Not Found"))

