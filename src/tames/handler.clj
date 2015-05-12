(ns tames.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.util.response :as response]
            [tames.systems :as systems]))

(defroutes app-routes
  ;; Basic
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/index.html" []
    (response/resource-response "index.html" {:root "public/core"}))
  (GET "/:css-name.css" [css-name]
    (println "css-name:" css-name)
    (systems/get-file "class" (format "%s.css" css-name) "text/css"))
  (GET "/:js-name.js" [js-name]
    (println "js-name:" js-name)
    (systems/get-file "class" (format "%s.js" js-name) "text/javascript; charset=utf-8"))
  (GET "/:template-name.html" [template-name]
    (println "template-name:" template-name)
    (systems/get-file "class" (format "%s.html" template-name) "text/html; charset=utf-8"))
  (GET "/:json-name.json" [json-name]
    (println "json-name:" json-name)
    (systems/get-file "class" (format "%s.json" json-name) "text/json; charset=utf-8"))
  (GET "/api/:class-id" [class-id]
    (println "class-id:" class-id)
    (systems/get-data class-id))
  (POST "/api/:class-id" [class-id & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (println "POST class-id:" class-id)
    (println "params:" params)
    (systems/post-data class-id params))
  (PUT "/api/:class-id/:object-id" [class-id object-id & params]
    (println "PUT class-id:" class-id)
    (println "params:" params)
    (systems/put-data class-id object-id params))
  (DELETE "/api/:class-id/:object-id" [class-id object-id]
    (println "DELETE class-id:" class-id)
    (systems/delete-data class-id object-id))
  (GET "/:class-id/index.html" [class-id]
    (println "class-id:" class-id)
    (response/resource-response "index.html" {:root "public/core"}))
  
  (route/resources "/")
  (route/not-found "Not Found"))

