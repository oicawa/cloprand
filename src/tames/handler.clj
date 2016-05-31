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
        next_url (get-in req [:query-params "next"] "/tames.html")]
    (println "[username] :" username)
    (println "[next url] :" next_url)
    ;(println "[forgery]  :" 
    (-> (response/redirect next_url)
        ;(assoc-in [:session :identity] (keyword username))
        (assoc-in [:session :identity] username))))

(defn logout
  [req]
  (-> (response/redirect "/tames.html")
      (assoc :session {})))

(defn unauthorized
  [req meta]
  (let [result (authenticated? req)]
    (println "[Unauthenticated] :" result)
    (print-request req)
    (cond result (response/redirect "/tames.html")
          (= (req :uri) "/tames.html") (response/redirect (format "/login?next=%s" (:uri req)))
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

(defn copy-file
  [src-path dst-path]
  (with-open [src (io/input-stream src-path)]
    (io/copy src (File. dst-path))))

(defn remove-attached-files
  [class-id object-id value files_fields]
  (doseq [field files_fields]
    (let [dst-dir-path (systems/get-absolute-path (format "data/%s/.%s/%s" class-id, object-id (field "name")))
          file-names   (keys ((value (field "name")) "remove"))]
      (doseq [file-name file-names]
        (let [file (File. (format "%s/%s" dst-dir-path file-name))]
          (println "[** Remove File **]" (. file getAbsolutePath))
          (if (. file exists)
              (. file delete)))))))

(defn save-attached-files
  [class-id object-id value files_fields added-files]
  (doseq [field files_fields]
    (let [dst-dir-path (format "data/%s/.%s/%s" class-id, object-id (field "name"))
          file-keys    (keys ((value (field "name")) "added"))]
      (systems/ensure-directory dst-dir-path)
      ;(pprint/pprint file-keys)
      (doseq [file-key file-keys]
        ;(println file-key)
        (let [file     (added-files (keyword file-key))
              tmp-file (file :tempfile)
              dst-file (format "%s/%s" dst-dir-path (file :filename))]
          (io/copy tmp-file (File. dst-file)))))))

(defn get-files-fields
  [class-id]
  (let [class_ (systems/get-object systems/CLASS_ID class-id)]
    (filter #(let [primitive ((%1 "datatype") "primitive")]
               (or (= primitive "Files")
                   (= primitive "Images")))
            (class_ "object_fields"))))

(defn update-files-values
  [class-id object-id files_fields raw-value]
  (let [base-dir   (systems/get-absolute-path (format "data/%s/.%s" class-id object-id))
        field_names (map #(%1 "name") files_fields)]
    (loop [names field_names
           value raw-value]
      (if (empty? names)
          value
          (let [name    (first names)
                path    (format "%s/%s" base-dir name)
                current (map (fn [file] { "name" (. file getName) "size" (. file length) })
                             (vec (. (File. path) listFiles)))
                value1  (dissoc value name)
                value2  (assoc value name {"class_id" class-id "object_id" object-id "current" current})]
            (recur (rest names) value2))))))

(defroutes app-routes
  ;; Authentication
  (GET "/login" req
    (login-get req))
  (POST "/login" req
    (login-post req))
  (GET "/logout" req
    (logout req))

  ;; Portal Top
  (GET "/tames" []
    (println "[GET] /tames")
    (-> (response/file-response "data/Core/tames.html")
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
          value        (json/read-str json-str)]
      (systems/post-data class-id value)))
  (PUT "/api/:class-id/:object-id" [class-id object-id & params]
    (println (str "[PUT] /api/:class-id/:object-id = /api/" class-id "/" object-id))
    (let [json-str     (URLDecoder/decode (params :value) "UTF-8")
          value        (json/read-str json-str)
          added-files  (dissoc params :value)
          files_fields (get-files-fields class-id)]
      (remove-attached-files class-id object-id value files_fields)
      (save-attached-files class-id object-id value files_fields added-files)
      (let [clean-value (update-files-values class-id object-id files_fields value)]
        (systems/put-data class-id object-id clean-value))))
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
  (GET "/image/*" [& params]
    (println (format "[GET] /download/* = /download/%s" (params :*)))
    (let [path (systems/get-absolute-path (format "data/%s" (params :*)))
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

