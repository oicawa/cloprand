(ns tames.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.pprint :as pprint]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [buddy.auth :refer [authenticated?]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.middleware.anti-forgery :refer [*anti-forgery-token*]]
            [ring.util.response :as response]
            [hiccup.core :refer [html]]
            [clojure.data.json :as json]
            [tames.systems :as systems]))

(defn print-request
  [req]
  (println "--- < Display Request > ---")
  (pprint/pprint req)
  (println "---------------------------"))

(defn login-get
  [req]
  (html
    [:div {:style "width:100%; text-align:center;height:100px;"}]
    [:h1 {:style "text-align:center;height:100px;"} "tames"]
    [:form {:method "post"}
      [:div {:style "width:100%; text-align:center;"}
        [:span {:style "display:inline-block;width:100px;"} "Login ID "]
        [:input {:type "text" :name "account_id"}]
        [:br]
        [:div {:style "width:100%;height:10px;"}]
        [:span {:style "display:inline-block;width:100px;"} "Password"]
        [:input {:type "password" :name "password"}]
        [:br]
        [:div {:style "width:100%;height:20px;"}]
        [:input {:type "hidden" :name "__anti-forgery-token" :value *anti-forgery-token*}]
        [:input {:type "submit" :value "Login"}]]]))

(defn login-post
  [req]
  (print-request req)
  (let [username (get-in req [:form-params "account_id"])
        next_url (get-in req [:query-params "next"] "/index.html")]
    (println "[username] :" username)
    (println "[next url] :" next_url)
    ;(println "[forgery]  :" 
    (-> (response/redirect next_url)
        ;(assoc-in [:session :identity] (keyword username))
        (assoc-in [:session :identity] username)
        )))

(defn logout
  [req]
  (-> (response/redirect "/index.html")
      (assoc :session {})))

(defn unauthorized
  [req meta]
  (let [result (authenticated? req)]
    (println "[Unauthenticated] :" result)
    (print-request req)
    (cond result (response/redirect "/index.html")
          (= (req :uri) "/index.html") (response/redirect (format "/login?next=%s" (:uri req)))
          :else (systems/create-authorized-result false (format "/login?next=%s" (:uri req)))
        )))

;(defn unauthorized
;  [req meta]
;  (let [res (authenticated? req)]
;    (println "[Unauthenticated] :" res)
;    (print-request req)
;    (if res
;        (systems/create-authorized-result true "/index.html")
;        (systems/create-authorized-result false (format "/login?next=%s" (:uri req))))))

(defroutes app-routes
  ;; for Menu Page
  (GET "/" []
    (response/redirect "/index.html"))
  (GET "/login" req
    (login-get req))
  (POST "/login" req
    (login-post req))
  (GET "/logout" req
    (logout req))
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
  ;; Session
  (GET "/session/:session-key" req
    (let [session-key (get-in req [:route-params :session-key] nil)
          user-name   (get-in req [:session :identity] nil)]
      (println (format "[GET] /session/:session-key = /session/%s" session-key))
      (print-request req)
      (format "{ \"%s\" : \"%s\"}" session-key user-name)))
  
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

