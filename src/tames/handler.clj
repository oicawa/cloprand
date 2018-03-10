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

(defn login-get
  [req]
  (let [title "tames"]
    (html
      [:head
        [:title title ]
        [:link {:rel "shortcut icon" :href "core/favicon.ico"} ]
        [:link {:rel "stylesheet" :type "text/css" :href "/lib/font-awesome-4.6.1/css/font-awesome.css" } ]
        [:link {:rel "stylesheet" :type "text/css" :href "/lib/w2ui/w2ui-1.5.rc1.css" } ]
        [:link {:rel "stylesheet" :type "text/css" :href "/core/reset-w2ui.css" } ]
        [:link {:rel "stylesheet" :type "text/css" :href "/core/main.css" } ]
        [:script {:data-main "/core/login.js?version=0.0.15" :src "/lib/require.js"} ]
        ]
      [:body
        [:div {:style "width:100%; text-align:center;height:50px;"}]
        [:div {:style "width:100px; height:100px; background-image:url(core/logo.svg); background-size:100%;margin:auto;"} ]
        [:h1 {:style "text-align:center;height:50px;"} title]
        [:div {:style "width:100%; text-align:center;height:50px;"}]
        [:form {:method "post" :name "login"}
          [:div {:style "width:100%; text-align:center;"}
            [:span {:style "display:inline-block;width:100px;"} "Login ID "]
            [:input {:id "login-id" :type "text" :name "login_id" :style "width:200px;" :class "w2field" :tabindex "1"}]
            [:br]
            [:div {:style "width:100%;height:10px;"}]
            [:span {:style "display:inline-block;width:100px;"} "Password"]
            [:input {:id "login-password":type "password" :name "password" :style "width:200px;" :class "w2field" :tabindex "2"}]
            [:br]
            [:div {:style "width:100%;height:50px;"}]
            [:input {:type "hidden" :name "__anti-forgery-token" :value *anti-forgery-token*}]
            [:input {:type "submit" :style "display:none;"}]
            [:div {:id "login-button" :class "div-button" :style "width:70px;height:70px;margin: auto;" :tabindex "3"}
              [:i {:class "fa fa-sign-in" :style "font-size:35pt;"} ]
              [:div {:style "font-size:10pt;"} "Login" ]]
            ]]])))

(defn login-post
  [req]
  (let [login_id (get-in req [:form-params "login_id"])
        password (get-in req [:form-params "password"])
        next_url (get-in req [:query-params "next"] "/tames")
        ;; Draft Implement...
        account  (systems/get-account login_id)
        is-ok    (cond (nil? account) false
                       (= (account "password") password) true
                       :else false)]
    (log/info "login_id=%s" login_id)
    (log/info "next url=%s" next_url)
    (-> (response/redirect next_url)
        (assoc-in [:session :identity] (if is-ok login_id nil)))))

(defn logout
  [req]
  (-> (response/redirect "/login?next=/tames&mode=logout")
      (assoc :session {})))

(defn create-authorized-result
  [authorized? url]
  (-> (response/response (json/write-str { "url" url }))
      (response/status (if authorized? 200 401))
      (response/header "Contents-Type" "text/json; charset=utf-8")))

(defn unauthorized
  [req meta]
  (let [result  (authenticated? req)
        uri     (req :uri)
        referer ((req :headers) "referer")]
    (log/info "*** Unauthenticated: [%s], URI: [%s], referer: [%s]" result uri referer)
    (cond result
            (response/redirect "/tames")
          (= uri "/tames")
            (if (nil? referer)
                (response/redirect "/login?next=/tames")
                (response/redirect "/login?next=/tames&mode=failed"))
          (= uri "/logout")
            (response/redirect "/login?next=/tames&mode=logout")
          (= uri "/session/identity")
            (create-authorized-result false "/login?next=/tames")
          :else
            (create-authorized-result false "/login?next=/tames&mode=timeout"))))

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
  [ext params]
  (let [relative-path     (format "%s.%s" (params :*) ext)
        file              (systems/get-target-file relative-path)
        ext               (fs/ext file)
        content-type      (content-types (. ext toLowerCase))
        last-modified     (time-to-RFC1123 (. file lastModified))]
    (log/debug "Route [/*.%s] -> [%s]" ext (. file getAbsolutePath))
    (cond (not (. file exists)) (route/not-found "Not Found")
          :else                 (-> (response/file-response (. file getAbsolutePath))
                                    (response/header "Content-Type" content-type)
                                    (response/header "Last-Modified" last-modified)))))

(defroutes app-routes
  ;; Authentication
  (GET "/login" req
    (log/info "GET [/login]")
    (login-get req))
  (POST "/login" req
    (log/info "POST [/login]")
    (login-post req))
  (GET "/logout" req
    (log/info "GET [/logout]")
    (logout req))

  ;; Portal Top
  (GET "/tames" []
    (log/info "GET [/tames]")
    (-> (response/file-response "core/tames.html")
        (response/header "Content-Type" (content-types "html"))))
  
  ;; REST API for CRUD
  (GET "/api/:class-id" req
    (log/info "GET [/api/:class-id]")
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
  (GET "/api/:class-id/:object-id" req
    (log/info "GET [/api/:class-id/:object-id]")
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
  (POST "/api/:class-id" [class-id & params]	;;; https://github.com/weavejester/compojure/wiki/Destructuring-Syntax
    (log/info "POST [/api/:class-id]")
    (if (not (systems/exists? systems/CLASS_ID class-id))
        (-> (response/response nil)
            (response/status 410))
        (let [json-str    (URLDecoder/decode (params :value) "UTF-8")
              data        (json/read-str json-str)
              added-files (dissoc params :value)]
          (systems/post-data class-id data added-files))))
  (PUT "/api/:class-id/:object-id" [class-id object-id & params]
    (log/info "PUT [/api/:class-id/:object-id]")
    (if (not (systems/exists? class-id object-id))
        (-> (response/response nil)
            (response/status 410))
        (let [json-str     (URLDecoder/decode (params :value) "UTF-8")
              data         (json/read-str json-str)
              added-files  (dissoc params :value)]
          (systems/put-data class-id object-id data added-files))))
  (DELETE "/api/:class-id/:object-id" [class-id object-id]
    (log/info "DELETE [/api/:class-id/:object-id]")
    (if (not (systems/exists? class-id object-id))
        (-> (response/response nil)
            (response/status 410))
        (systems/delete-data class-id object-id)))
  ;; Session
  (GET "/session/:session-key" req
    (log/info "GET [/session/:session-key]")
    (let [session-key (get-in req [:route-params :session-key] nil)
          user-name   (get-in req [:session :identity] nil)]
      (format "{ \"%s\" : \"%s\"}" session-key user-name)))
  ;; Download
  (GET "/download/*" [& params]
    (log/info "GET [/download/*]")
    (let [file        (File. (fs/get-absolute-path (format "data/%s" (params :*))))
          file-name   (. file getName)
          encoded-file-name (. (URLEncoder/encode file-name "UTF-8") replace "+" "%20")
          disposition (format "attachment;filename=\"%s\";filename*=UTF-8''%s" file-name encoded-file-name)
          ]
      (-> (response/file-response (. file getAbsolutePath))
          (response/header "Content-Type" "application/octet-stream")
          (response/header "Content-Disposition" disposition))))
  (GET "/image/:class-id/:object-id/*" [class-id object-id & params]
    (log/info "GET [/image/:class-id/:object-id/*]")
    (let [path (. (systems/get-attachment-file class-id object-id (params :*)) toString)
          ext  (fs/ext path)
          mime (content-types ext)]
      (-> (response/file-response path)
          (response/header "Content-Type" mime))))
  (POST "/generate/:generator-name" [generator-name & params]
    (log/info "POST [/generate/:generator-name]")
    (println (format "[POST] /generate/%s" generator-name))
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
      (println (. tmp-file getAbsolutePath))
      (-> (response/file-response (. tmp-file getAbsolutePath))
          (response/header "Content-Type" (apply (find-var get-content-type-symbol) []))
          (response/header "Content-Disposition" disposition))))
  (POST "/operation/:operator-name/:operation-name" [operator-name operation-name & params]
    (log/info "POST [/operation/:operator-name/:operation-name]")
    (let [namespace-name          (format "tames.operations.%s" operator-name)
          operation-symbol        (symbol namespace-name operation-name)
          json-str                (URLDecoder/decode (params :value) "UTF-8")
          data                    (json/read-str json-str)
          ]
      (require (symbol namespace-name))
      (apply (find-var operation-symbol) [data])))
  
  ;; Other resources
  (GET "/*.css" [& params]
    (log/info "GET [/*.css]")
    (other-resources "css" params))
  ;(GET "/*.js" [& params]
  ;  (log/info "GET [/*.js]")
  ;  (other-resources "js" params))
  (GET "/*" req
    ;(log/info "GET /* [%s]" (params :*))
    ;(other-resources params))
    (log/info "GET [/*] (%s)" (get-in req [:route-params :*] nil))
    (let [;relative-path     (let [base (get-in req [:route-params :*] nil)]
          ;                    (if (nil? base) nil (format "%s.%s" base ext)))
          relative-path     (get-in req [:route-params :*] nil)
          ;relative-path     (format "%s.%s" (params :*) ext)
          ;relative-path     #?=(params :*)
          ;if-modified-since (get-in req [:headers "if-modified-since"] nil)
          file              (systems/get-target-file relative-path)
          ext               (fs/ext file)
          content-type      (content-types (. ext toLowerCase))
          last-modified     (time-to-RFC1123 (. file lastModified))
          ;not-modified?     (= if-modified-since last-modified)
          ]
      (log/info "Route [/*.%s] -> [%s]" ext relative-path)
      (cond (not (. file exists)) (route/not-found "Not Found")
            ;not-modified?         (-> (response/response nil)
            ;                          (response/status 304))
            :else                 (-> (response/file-response (. file getAbsolutePath))
                                      (response/header "Content-Type" content-type)
                                      (response/header "Last-Modified" last-modified)))))
  ;(GET "/resources/*" req
  ;  (println "GET /resources/*")
  ;  ;(pprint/pprint req);
  ;  (let [relative-path     (get-in req [:route-params :*] nil)
  ;        if-modified-since (get-in req [:headers "if-modified-since"] nil)
  ;        file              (systems/get-target-file relative-path)
  ;        ext               (fs/ext file)
  ;        content-type      (content-types (. ext toLowerCase))
  ;        last-modified     (time-to-RFC1123 (. file lastModified))
  ;        not-modified?     (= if-modified-since last-modified)]
  ;    (cond (not (. file exists)) (route/not-found "Not Found")
  ;          not-modified?         (-> (response/response nil)
  ;                                    (response/status 304))
  ;          :else                 (-> (response/file-response (. file getAbsolutePath))
  ;                                    (response/header "Content-Type" content-type)
  ;                                    (response/header "Last-Modified" last-modified)))))
  ;(route/resources "/")
  (route/not-found "Not Found"))

