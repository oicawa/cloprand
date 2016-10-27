(ns tames.handler
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [buddy.auth :refer [authenticated?]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.middleware.anti-forgery :refer [*anti-forgery-token*]]
            [ring.util.response :as response]
            [hiccup.core :refer [html]]
            [clojure.data.json :as json]
            [tames.systems :as systems])
  (:import (java.io File)
           (java.net URLDecoder URLEncoder)))

(def content-types {""     ""
                    "css"  "text/css"
                    "js"   "text/javascript; charset=utf-8"
                    "html" "text/html; charset=utf-8"
                    "json" "text/json; charset=utf-8"
                    "svg"  "image/svg+xml"
                    "ico"  "image/x-icon"
                    "png"  "image/png"
                    "jpg"  "image/jpg"
                    "jpeg" "image/jpeg"
                    })

(defn print-request
  [req]
  (println "--- < Display Request > ---")
  (pprint/pprint req)
  (println "---------------------------"))

(defn login-get
  [req]
  (let [title "tames"]
    (html
      [:head
        [:title title ]
        [:link {:rel "shortcut icon" :href "core/favicon.ico"} ]
        [:link {:rel "stylesheet" :type "text/css" :href "/lib/font-awesome-4.6.1/css/font-awesome.css" } ]
        [:link {:rel "stylesheet" :type "text/css" :href "/core/main.css" } ]
        ]
      [:body
        [:div {:style "width:100%; text-align:center;height:50px;"}]
        [:div {:style "width:100px; height:100px; background-image:url(core/logo.svg); background-size:100%;margin:auto;"} ]
        [:h1 {:style "text-align:center;height:50px;"} title]
        [:div {:style "width:100%; text-align:center;height:50px;"}]
        [:form {:method "post" :name "singin"}
          [:div {:style "width:100%; text-align:center;"}
            [:span {:style "display:inline-block;width:100px;"} "Login ID "]
            [:input {:type "text" :name "account_id" :style "width:200px;"}]
            [:br]
            [:div {:style "width:100%;height:10px;"}]
            [:span {:style "display:inline-block;width:100px;"} "Password"]
            [:input {:type "password" :name "password" :style "width:200px;"}]
            [:br]
            [:div {:style "width:100%;height:50px;"}]
            [:input {:type "hidden" :name "__anti-forgery-token" :value *anti-forgery-token*}]
            [:input {:type "submit" :style "display:none;"}]
            [:div {:class "image-button" :style "width:70px;height:70px;margin: auto;" :onclick "document.singin.submit();"}
              [:i {:class "fa fa-sign-in fa-3x"} ]
              "Sign In" ]
            ]]])))

(defn login-post
  [req]
  (print-request req)
  (let [account_id (get-in req [:form-params "account_id"])
        password   (get-in req [:form-params "password"])
        next_url   (get-in req [:query-params "next"] "/tames")
        ;; Draft Implement...
        account    (systems/get-account account_id)
        is-ok      (cond (nil? account) false
                         (= (account "password") password) true
                         :else false)]
    (println "[account_id] :" account_id)
    (println "[next url]   :" next_url)
    (println "----------")
    (pprint/pprint account)
    (println "----------")
    (-> (response/redirect next_url)
        (assoc-in [:session :identity] (if is-ok account_id nil)))))

(defn logout
  [req]
  (-> (response/redirect "/login?next=/tames")
      (assoc :session {})))

(defn unauthorized
  [req meta]
  (let [result (authenticated? req)
        uri    (req :uri)]
    (println (format "*** Unauthenticated: [%s], URI: [%s]" result, uri))
    (cond result
            (response/redirect "/tames")
          (or (= uri "/tames")
              (= uri "/logout"))
            (response/redirect "/login?next=/tames")
          :else
            (systems/create-authorized-result false "/login?next=/tames"))))

;(defn unauthorized
;  [req meta]
;  (let [res (authenticated? req)]
;    (println "[Unauthenticated] :" res)
;    (print-request req)
;    (if res
;        (systems/create-authorized-result true "/index.html")
;        (systems/create-authorized-result false (format "/login?next=%s" (:uri req))))))

(defn copy-file
  [src-path dst-path]
  (with-open [src (io/input-stream src-path)]
    (io/copy src (File. dst-path))))

(defroutes app-routes
  ;; Authentication
  (GET "/login" req
    (login-get req))
  (POST "/login" req
    (login-post req))
  (GET "/logout" req
    (println "*** LOGOUT ***")
    (logout req))

  ;; Portal Top
  (GET "/tames" []
    (println "[GET] /tames")
    (-> (response/file-response "core/tames.html")
        (response/header "Content-Type" (content-types "html"))))
  
  ;; REST API for CRUD
  (GET "/api/:class-id" [class-id]
    (println (str "[GET] /api/:class-id = /api/" class-id))
    (systems/get-data class-id nil))
  (GET "/api/:class-id/:object-id" [class-id object-id]
    (println (format "[GET] /api/:class-id/:object-id = /api/%s/%s" class-id object-id))
    (systems/get-data class-id object-id))
  (POST "/api/:class-id" [class-id & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (println (str "[POST] /api/:class-id = /api/" class-id))
    (let [json-str     (URLDecoder/decode (params :value) "UTF-8")
          data         (json/read-str json-str)
          added-files  (dissoc params :value)]
      (systems/post-data class-id data added-files)))
  (PUT "/api/:class-id/:object-id" [class-id object-id & params]
    (println (str "[PUT] /api/:class-id/:object-id = /api/" class-id "/" object-id))
    (let [json-str     (URLDecoder/decode (params :value) "UTF-8")
          data         (json/read-str json-str)
          added-files  (dissoc params :value)]
      (systems/put-data class-id object-id data added-files)))
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
  ;; Download
  (GET "/download/*" [& params]
    (println (format "[GET] /download/* = /download/%s" (params :*)))
    (let [file        (File. (systems/get-absolute-path (format "data/%s" (params :*))))
          file-name   (. file getName)
          encoded-file-name (. (URLEncoder/encode file-name "UTF-8") replace "+" "%20")
          disposition (format "attachment;filename=\"%s\";filename*=UTF-8''%s" file-name encoded-file-name)
          ]
      (-> (response/file-response (. file getAbsolutePath))
          (response/header "Content-Type" "application/octet-stream")
          (response/header "Content-Disposition" disposition))))
  (GET "/image/:class-id/:object-id/*" [class-id object-id & params]
    (println (format "[GET] /image/:class-id/:object-id/* = /image/%s/%s/%s" class-id object-id (params :*)))
    (let [path (systems/get-absolute-path (format "data/%s/.%s/%s" class-id object-id (params :*)))
          ext  (systems/get-file-extension path)
          mime (content-types ext)]
      (-> (response/file-response path)
          (response/header "Content-Type" mime))))
  
  ;; Other resources
  (GET "/*" [& params]
    (println (format "[GET] /* (path=%s)" (params :*)))
    (let [relative-path (params :*)
          absolute-path (systems/get-absolute-path relative-path)
          offset        (. relative-path lastIndexOf ".")
          extension     (if (= offset -1) "" (. relative-path substring (+ offset 1)))
          content-type  (content-types (. extension toLowerCase))
          exist?        (. (File. absolute-path) exists)
          res           (if exist?
                            (-> (response/file-response absolute-path)
                                (response/header "Content-Type" content-type))
                            (route/not-found "Not Found"))]
      ;(println (format "  offset       = %d" offset))
      ;(println (format "  extension    = %s" extension))
      ;(println (format "  content-type = %s" content-type))
      ;(pprint/pprint res)
      res))
  
  (route/resources "/")
  (route/not-found "Not Found"))

