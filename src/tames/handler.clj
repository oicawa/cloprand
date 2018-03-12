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
            [tames.log :as log]
            [tames.filesystem :as fs]
            [tames.systems :as systems]
            [tames.debug :as debug])
  (:import (java.io File)
           (java.net URLDecoder URLEncoder)
           (java.text SimpleDateFormat)
           (java.util Calendar TimeZone Locale)))

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
                    "pdf"  "application/pdf"
                    })

(defn login
  [req]
  (let [login_id        (get-in req [:form-params "login_id"])
        password        (get-in req [:form-params "password"])
        login-try-count (get-in req [:session :login-try-count] 0)
        ;; Draft Implement...
        account         (systems/get-account login_id)
        is-ok           (cond (nil? account) false
                              (= (account "password") password) true
                              :else false)]
    (log/info "login_id=%s" login_id)
    (-> (response/redirect "/tames")
        (assoc-in [:session :identity] (if is-ok login_id nil))
        (assoc-in [:session :login-try-count] (if is-ok login-try-count (+ login-try-count 1))))))

(defn logout
  [req]
  (-> (response/redirect "/tames")
      (assoc :session {})))

(defn response-authorized
  [authorized? login-try-count]
  (-> (response/response (if authorized?
                             nil
                             (json/write-str { "anti_forgery_token" (str *anti-forgery-token*)
                                               "login_try_count" login-try-count })))
      (response/status (if authorized? 200 401))
      (response/header "Contents-Type" "text/json; charset=utf-8")))

(defn unauthorized
  [req meta]
  (let [result          (authenticated? req)
        uri             (req :uri)
        referer         ((req :headers) "referer")
        login-try-count (get-in req [:session :login-try-count] 0)]
    (log/debug "*** Unauthenticated: [%s], URI: [%s], referer: [%s], login-try-count=[%d]" result uri referer login-try-count)
    (cond result
            (response/redirect "/tames")
          (= uri "/api/session/identity")
            (response-authorized false login-try-count)
          :else
            (response-authorized false login-try-count))))

(defn time-to-RFC1123
  [time]
  (let [f   "EEE, dd MMM yyyy HH:mm:ss z"
        sdf (doto (SimpleDateFormat. f Locale/ENGLISH)
              (.setTimeZone (TimeZone/getTimeZone "GMT")))]
    (. sdf format time)))

(defn use-cache?
  [class-id]
  (let [class-object (systems/get-object systems/CLASS_ID class-id)]
    (get-in class-object ["options" "cache"] false)))

(defn other-resources
  [req]
  (let [relative-path     (get-in req [:route-params :*] nil)
        not-resource?     (. relative-path startsWith "data/")
        if-modified-since (get-in req [:headers "if-modified-since"] nil)
        file              (systems/get-target-file relative-path)
        ext               (fs/ext file)
        content-type      (content-types (. ext toLowerCase))
        last-modified     (time-to-RFC1123 (. file lastModified))
        not-modified?     (= if-modified-since last-modified)]
    (log/debug "Route [/*.%s] -> [%s]" ext (. file getAbsolutePath))
    (cond not-resource?         (-> (response/response nil)
                                    (response/status 403))
          (not (. file exists)) (route/not-found "Not Found")
          not-modified?         (-> (response/response nil)
                                    (response/status 304))
          :else                 (-> (response/file-response (. file getAbsolutePath))
                                    (response/header "Content-Type" content-type)
                                    (response/header "Last-Modified" last-modified)))))

(defroutes app-routes
  ;; Authentication
  (POST "/login" req
    (log/debug "[POST] /login")
    (login req))
  (GET "/logout" req
    (log/debug "[GET] /logout")
    (logout req))

  ;; Portal Top
  (GET "/tames" []
    (log/debug "[GET] /tames")
    (-> (response/file-response "core/tames.html")
        (response/header "Content-Type" (content-types "html"))))
  
  ;; REST API for CRUD
  (GET "/api/rest/:class-id" req
    (log/debug "[GET] /api/rest/:class-id")
    (let [class-id          (get-in req [:route-params :class-id] nil)
          if-modified-since (get-in req [:headers "if-modified-since"] nil)
          exists?           (systems/exists? systems/CLASS_ID class-id)
          cache?            (use-cache? class-id)
          last-modified     (time-to-RFC1123 (systems/get-last-modified class-id nil))
          not-modified?     (= if-modified-since last-modified)]
      (cond (not exists?)
              (-> (response/response nil) (response/status 410))
            (not cache?)
              (systems/get-data class-id nil)
            not-modified?
              (-> (response/response nil) (response/status 304))
            :else
              (-> (systems/get-data class-id nil)
                  (response/header "Last-Modified" last-modified)))))
  (GET "/api/rest/:class-id/:object-id" req
    (log/debug "[GET] /api/rest/:class-id/:object-id")
    (let [class-id          (get-in req [:route-params :class-id] nil)
          object-id         (get-in req [:route-params :object-id] nil)
          if-modified-since (get-in req [:headers "if-modified-since"] nil)
          exists?           (systems/exists? class-id object-id)
          cache?            (use-cache? class-id)
          last-modified     (time-to-RFC1123 (systems/get-last-modified class-id object-id))
          not-modified?     (= if-modified-since last-modified)]
      (cond (not exists?)
              (-> (response/response nil) (response/status 410))
            (not cache?)
              (systems/get-data class-id object-id)
            not-modified?
              (-> (response/response nil) (response/status 304))
            :else
              (-> (systems/get-data class-id object-id)
                  (response/header "Last-Modified" last-modified)))))
  (POST "/api/rest/:class-id" [class-id & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (log/debug "[POST] /api/rest/:class-id")
    (if (not (systems/exists? systems/CLASS_ID class-id))
        (-> (response/response nil)
            (response/status 410))
        (let [json-str    (URLDecoder/decode (params :value) "UTF-8")
              data        (json/read-str json-str)
              added-files (dissoc params :value)]
          (systems/post-data class-id data added-files))))
  (PUT "/api/rest/:class-id/:object-id" [class-id object-id & params]
    (log/debug "[PUT] /api/rest/:class-id/:object-id")
    (if (not (systems/exists? class-id object-id))
        (-> (response/response nil)
            (response/status 410))
        (let [json-str     (URLDecoder/decode (params :value) "UTF-8")
              data         (json/read-str json-str)
              added-files  (dissoc params :value)]
          (systems/put-data class-id object-id data added-files))))
  (DELETE "/api/rest/:class-id/:object-id" [class-id object-id]
    (log/debug "[DELETE] /api/rest/:class-id/:object-id")
    (if (not (systems/exists? class-id object-id))
        (-> (response/response nil)
            (response/status 410))
        (systems/delete-data class-id object-id)))
  ;; Session
  (GET "/api/session/:session-key" req
    (log/debug "[GET] /session/:session-key")
    (let [session-key (get-in req [:route-params :session-key] nil)
          user-name   (get-in req [:session :identity] nil)]
      (format "{ \"%s\" : \"%s\"}" session-key user-name)))
  ;; Download
  (GET "/api/download/:class-id/:object-id/*" [class-id object-id & params]
    (log/debug "[GET] /api/download/:class-id/:object-id/*")
    (let [;file        (File. (fs/get-absolute-path (format "data/%s" #?=(params :*))))
          file        #?=(systems/get-attachment-file class-id object-id (params :*))
          file-name   (. file getName)
          encoded-file-name (. (URLEncoder/encode file-name "UTF-8") replace "+" "%20")
          disposition (format "attachment;filename=\"%s\";filename*=UTF-8''%s" file-name encoded-file-name)
          ]
      (-> (response/file-response (. file getAbsolutePath))
          (response/header "Content-Type" "application/octet-stream")
          (response/header "Content-Disposition" disposition))))
  (GET "/api/image/:class-id/:object-id/*" [class-id object-id & params]
    (log/debug "[GET] /api/image/:class-id/:object-id/*")
    (let [path (. (systems/get-attachment-file class-id object-id (params :*)) toString)
          ext  (fs/ext path)
          mime (content-types ext)]
      (-> (response/file-response path)
          (response/header "Content-Type" mime))))
  (POST "/api/generate/:generator-name" [generator-name & params]
    (log/debug "[POST] /api/generate/:generator-name")
    (let [namespace-name    (format "tames.generators.%s" generator-name)
          generate-symbol   (symbol namespace-name "generate")
          get-content-type-symbol (symbol namespace-name "get-content-type")
          json-str          (URLDecoder/decode (params :value) "UTF-8")
          data              (json/read-str json-str)
          title             (data "title")
          tmp-file          (File/createTempFile title (format ".%s" generator-name))
          file-name         (format "%s.%s" title generator-name)
          encoded-file-name (. (URLEncoder/encode file-name "UTF-8") replace "+" "%20")
          disposition       (format "attachment;filename=\"%s\";filename*=UTF-8''%s" file-name encoded-file-name)
          ]
      (require (symbol namespace-name))
      (apply (find-var generate-symbol) [tmp-file data])
      (-> (response/file-response (. tmp-file getAbsolutePath))
          (response/header "Content-Type" (apply (find-var get-content-type-symbol) []))
          (response/header "Content-Disposition" disposition))))
  (POST "/api/operation/:operator-name/:operation-name" [operator-name operation-name & params]
    (log/debug "[POST] /api/operation/:operator-name/:operation-name")
    (let [namespace-name   (format "tames.operations.%s" operator-name)
          operation-symbol (symbol namespace-name operation-name)
          json-str         (URLDecoder/decode (params :value) "UTF-8")
          data             (json/read-str json-str)]
      (require (symbol namespace-name))
      (apply (find-var operation-symbol) [data])))
  
  ;; Others (Resources & Public API)
  (GET "/*" req
    (log/debug "[GET] /* (%s)" (get-in req [:route-params :*] nil))
    (other-resources req))
  (POST "/public_api/operation/:operator-name/:operation-name" [operator-name operation-name & params]
    (log/debug "[POST] /public_api/operation/:operator-name/:operation-name")
    (let [namespace-name   (format "tames.operations.%s" operator-name)
          operation-symbol (symbol namespace-name operation-name)
          json-str         (URLDecoder/decode (params :value) "UTF-8")
          data             (json/read-str json-str)]
      (require (symbol namespace-name))
      (apply (find-var operation-symbol) [data])))
  
  ;; Not Found
  (route/not-found "Not Found"))

